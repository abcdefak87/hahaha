/**
 * Inventory Service
 * Handles all inventory-related business logic
 */

const prisma = require('../utils/database');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class InventoryService {
  /**
   * Create inventory item
   * @param {Object} itemData - Item data
   * @returns {Promise<Object>} Created item
   */
  static async createItem(itemData) {
    try {
      const {
        name,
        category,
        quantity = 0,
        minStock = 0,
        unit = 'pcs',
        serialNumber,
        supplier,
        purchasePrice,
        sellingPrice,
        location,
        description
      } = itemData;

      // Check if serial number already exists
      if (serialNumber) {
        const existing = await prisma.inventoryItem.findFirst({
          where: { serialNumber }
        });

        if (existing) {
          throw new AppError('Item with this serial number already exists', 409);
        }
      }

      const item = await prisma.inventoryItem.create({
        data: {
          name,
          category,
          quantity,
          minStock,
          unit,
          serialNumber,
          supplier,
          purchasePrice,
          sellingPrice,
          location,
          description
        }
      });

      // Log initial stock
      await this.logTransaction({
        itemId: item.id,
        type: 'in',
        quantity,
        reason: 'Initial stock',
        performedBy: 'system'
      });

      logger.info(`Inventory item created: ${item.id}`);
      return item;
    } catch (error) {
      logger.error('Create inventory item error:', error);
      throw error;
    }
  }

  /**
   * Get all inventory items with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Items and pagination
   */
  static async getAllItems(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        search,
        lowStock = false,
        sortBy = 'name',
        sortOrder = 'asc'
      } = filters;

      const skip = (page - 1) * limit;
      const where = {};

      if (category) where.category = category;
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { serialNumber: { contains: search } },
          { supplier: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (lowStock) {
        where.quantity = { lte: prisma.inventoryItem.fields.minStock };
      }

      const [total, items] = await Promise.all([
        prisma.inventoryItem.count({ where }),
        prisma.inventoryItem.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        })
      ]);

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get inventory items error:', error);
      throw error;
    }
  }

  /**
   * Get item by ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Item details
   */
  static async getItemById(itemId) {
    try {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: itemId },
        include: {
          transactions: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      return item;
    } catch (error) {
      logger.error('Get inventory item error:', error);
      throw error;
    }
  }

  /**
   * Update inventory item
   * @param {string} itemId - Item ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated item
   */
  static async updateItem(itemId, updates) {
    try {
      const existingItem = await prisma.inventoryItem.findUnique({
        where: { id: itemId }
      });

      if (!existingItem) {
        throw new AppError('Inventory item not found', 404);
      }

      // Check serial number uniqueness if updating
      if (updates.serialNumber && updates.serialNumber !== existingItem.serialNumber) {
        const duplicate = await prisma.inventoryItem.findFirst({
          where: {
            serialNumber: updates.serialNumber,
            NOT: { id: itemId }
          }
        });

        if (duplicate) {
          throw new AppError('Serial number already exists', 409);
        }
      }

      const item = await prisma.inventoryItem.update({
        where: { id: itemId },
        data: updates
      });

      logger.info(`Inventory item updated: ${itemId}`);
      return item;
    } catch (error) {
      logger.error('Update inventory item error:', error);
      throw error;
    }
  }

  /**
   * Delete inventory item
   * @param {string} itemId - Item ID
   * @returns {Promise<void>}
   */
  static async deleteItem(itemId) {
    try {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: itemId }
      });

      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      // Check if item has stock
      if (item.quantity > 0) {
        throw new AppError('Cannot delete item with remaining stock', 400);
      }

      // Delete related transactions first
      await prisma.inventoryTransaction.deleteMany({
        where: { itemId }
      });

      await prisma.inventoryItem.delete({
        where: { id: itemId }
      });

      logger.info(`Inventory item deleted: ${itemId}`);
    } catch (error) {
      logger.error('Delete inventory item error:', error);
      throw error;
    }
  }

  /**
   * Stock in (add stock)
   * @param {string} itemId - Item ID
   * @param {Object} data - Stock in data
   * @returns {Promise<Object>} Updated item
   */
  static async stockIn(itemId, data) {
    try {
      const { quantity, reason, reference, performedBy } = data;

      if (quantity <= 0) {
        throw new AppError('Quantity must be positive', 400);
      }

      const item = await prisma.inventoryItem.findUnique({
        where: { id: itemId }
      });

      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      const previousQuantity = item.quantity;
      const newQuantity = previousQuantity + quantity;

      // Update item quantity
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity }
      });

      // Log transaction
      await this.logTransaction({
        itemId,
        type: 'in',
        quantity,
        previousQuantity,
        newQuantity,
        reason,
        reference,
        performedBy
      });

      logger.info(`Stock in: ${itemId}, quantity: ${quantity}`);
      return updatedItem;
    } catch (error) {
      logger.error('Stock in error:', error);
      throw error;
    }
  }

  /**
   * Stock out (remove stock)
   * @param {string} itemId - Item ID
   * @param {Object} data - Stock out data
   * @returns {Promise<Object>} Updated item
   */
  static async stockOut(itemId, data) {
    try {
      const { quantity, reason, reference, performedBy } = data;

      if (quantity <= 0) {
        throw new AppError('Quantity must be positive', 400);
      }

      const item = await prisma.inventoryItem.findUnique({
        where: { id: itemId }
      });

      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      if (item.quantity < quantity) {
        throw new AppError('Insufficient stock', 400);
      }

      const previousQuantity = item.quantity;
      const newQuantity = previousQuantity - quantity;

      // Update item quantity
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity }
      });

      // Log transaction
      await this.logTransaction({
        itemId,
        type: 'out',
        quantity,
        previousQuantity,
        newQuantity,
        reason,
        reference,
        performedBy
      });

      // Check if low stock alert needed
      if (newQuantity <= item.minStock) {
        await this.sendLowStockAlert(item, newQuantity);
      }

      logger.info(`Stock out: ${itemId}, quantity: ${quantity}`);
      return updatedItem;
    } catch (error) {
      logger.error('Stock out error:', error);
      throw error;
    }
  }

  /**
   * Stock adjustment
   * @param {string} itemId - Item ID
   * @param {Object} data - Adjustment data
   * @returns {Promise<Object>} Updated item
   */
  static async adjustStock(itemId, data) {
    try {
      const { newQuantity, reason, performedBy } = data;

      if (newQuantity < 0) {
        throw new AppError('Quantity cannot be negative', 400);
      }

      const item = await prisma.inventoryItem.findUnique({
        where: { id: itemId }
      });

      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      const previousQuantity = item.quantity;
      const difference = newQuantity - previousQuantity;

      // Update item quantity
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity }
      });

      // Log transaction
      await this.logTransaction({
        itemId,
        type: 'adjustment',
        quantity: Math.abs(difference),
        previousQuantity,
        newQuantity,
        reason: reason || `Stock adjustment: ${difference > 0 ? 'increase' : 'decrease'}`,
        performedBy
      });

      logger.info(`Stock adjustment: ${itemId}, new quantity: ${newQuantity}`);
      return updatedItem;
    } catch (error) {
      logger.error('Stock adjustment error:', error);
      throw error;
    }
  }

  /**
   * Get inventory statistics
   * @returns {Promise<Object>} Statistics
   */
  static async getStatistics() {
    try {
      const [
        totalItems,
        totalValue,
        lowStockItems,
        outOfStockItems,
        byCategory,
        recentTransactions
      ] = await Promise.all([
        prisma.inventoryItem.count(),
        this.calculateTotalValue(),
        prisma.inventoryItem.count({
          where: {
            quantity: { lte: prisma.inventoryItem.fields.minStock }
          }
        }),
        prisma.inventoryItem.count({
          where: { quantity: 0 }
        }),
        prisma.inventoryItem.groupBy({
          by: ['category'],
          _count: true,
          _sum: {
            quantity: true
          }
        }),
        prisma.inventoryTransaction.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            item: true,
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      ]);

      return {
        totalItems,
        totalValue,
        lowStockItems,
        outOfStockItems,
        byCategory: byCategory.map(c => ({
          category: c.category,
          count: c._count,
          totalQuantity: c._sum.quantity || 0
        })),
        recentTransactions
      };
    } catch (error) {
      logger.error('Get inventory statistics error:', error);
      throw error;
    }
  }

  /**
   * Get low stock items
   * @returns {Promise<Array>} Low stock items
   */
  static async getLowStockItems() {
    try {
      const items = await prisma.$queryRaw`
        SELECT * FROM InventoryItem 
        WHERE quantity <= minStock 
        ORDER BY (quantity::float / NULLIF(minStock, 0)) ASC
      `;

      return items;
    } catch (error) {
      logger.error('Get low stock items error:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Transactions and pagination
   */
  static async getTransactionHistory(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        itemId,
        type,
        dateFrom,
        dateTo,
        performedBy
      } = filters;

      const skip = (page - 1) * limit;
      const where = {};

      if (itemId) where.itemId = itemId;
      if (type) where.type = type;
      if (performedBy) where.performedBy = performedBy;

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [total, transactions] = await Promise.all([
        prisma.inventoryTransaction.count({ where }),
        prisma.inventoryTransaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            item: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      ]);

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get transaction history error:', error);
      throw error;
    }
  }

  // Helper methods

  static async logTransaction(data) {
    await prisma.inventoryTransaction.create({
      data: {
        itemId: data.itemId,
        type: data.type,
        quantity: data.quantity,
        previousQuantity: data.previousQuantity || 0,
        newQuantity: data.newQuantity || 0,
        reason: data.reason,
        reference: data.reference,
        performedBy: data.performedBy
      }
    });
  }

  static async calculateTotalValue() {
    const result = await prisma.inventoryItem.aggregate({
      _sum: {
        quantity: true
      }
    });

    // This is simplified - in real app, would multiply by purchase/selling price
    return result._sum.quantity || 0;
  }

  static async sendLowStockAlert(item, currentQuantity) {
    // In real implementation, would send notification via WhatsApp/email
    logger.warn(`Low stock alert: ${item.name} - Current: ${currentQuantity}, Min: ${item.minStock}`);
  }
}

module.exports = InventoryService;
