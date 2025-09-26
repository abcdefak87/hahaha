/**
 * Job Service
 * Handles all job-related business logic
 */

const prisma = require('../utils/database');
const logger = require('../utils/logger');
const whatsappMessenger = require('../utils/whatsappMessenger');
const { AppError } = require('../middleware/errorHandler');

class JobService {
  /**
   * Create a new job
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} Created job
   */
  static async create(jobData) {
    try {
      const {
        type,
        customerId,
        technicianId,
        scheduledDate,
        priority = 'medium',
        description,
        notes
      } = jobData;

      // Validate customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        throw new AppError('Customer not found', 404);
      }

      // Validate technician if assigned
      if (technicianId) {
        const technician = await prisma.user.findFirst({
          where: {
            id: technicianId,
            role: 'technician'
          }
        });

        if (!technician) {
          throw new AppError('Technician not found', 404);
        }
      }

      // Create job
      const job = await prisma.job.create({
        data: {
          type,
          customerId,
          technicianId,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          priority,
          description,
          notes,
          status: technicianId ? 'assigned' : 'pending'
        },
        include: {
          customer: true,
          technician: true
        }
      });

      // Send notification to technician if assigned
      if (technicianId && job.technician?.phone) {
        await this.notifyTechnician(job);
      }

      // Send notification to customer
      if (customer.phone) {
        await this.notifyCustomer(job, customer);
      }

      logger.info(`Job created: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('Create job error:', error);
      throw error;
    }
  }

  /**
   * Get all jobs with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Jobs and pagination
   */
  static async getAll(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        type,
        priority,
        technicianId,
        customerId,
        dateFrom,
        dateTo,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const skip = (page - 1) * limit;
      const where = {};

      // Build where clause
      if (status) where.status = status;
      if (type) where.type = type;
      if (priority) where.priority = priority;
      if (technicianId) where.technicianId = technicianId;
      if (customerId) where.customerId = customerId;

      if (dateFrom || dateTo) {
        where.scheduledDate = {};
        if (dateFrom) where.scheduledDate.gte = new Date(dateFrom);
        if (dateTo) where.scheduledDate.lte = new Date(dateTo);
      }

      if (search) {
        where.OR = [
          { description: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { phone: { contains: search } } }
        ];
      }

      // Get total count
      const total = await prisma.job.count({ where });

      // Get jobs
      const jobs = await prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: true,
          technician: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return {
        jobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get jobs error:', error);
      throw error;
    }
  }

  /**
   * Get job by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job details
   */
  static async getById(jobId) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          customer: true,
          technician: true,
          materials: true,
          activities: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!job) {
        throw new AppError('Job not found', 404);
      }

      return job;
    } catch (error) {
      logger.error('Get job by ID error:', error);
      throw error;
    }
  }

  /**
   * Update job
   * @param {string} jobId - Job ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated job
   */
  static async update(jobId, updates) {
    try {
      // Check if job exists
      const existingJob = await prisma.job.findUnique({
        where: { id: jobId },
        include: { customer: true, technician: true }
      });

      if (!existingJob) {
        throw new AppError('Job not found', 404);
      }

      // Validate technician if being assigned
      if (updates.technicianId && updates.technicianId !== existingJob.technicianId) {
        const technician = await prisma.user.findFirst({
          where: {
            id: updates.technicianId,
            role: 'technician'
          }
        });

        if (!technician) {
          throw new AppError('Technician not found', 404);
        }

        // Update status to assigned if previously pending
        if (existingJob.status === 'pending') {
          updates.status = 'assigned';
        }
      }

      // Update job
      const job = await prisma.job.update({
        where: { id: jobId },
        data: updates,
        include: {
          customer: true,
          technician: true
        }
      });

      // Log activity
      await this.logActivity(jobId, 'updated', `Job updated: ${JSON.stringify(updates)}`);

      // Send notifications if status changed
      if (updates.status && updates.status !== existingJob.status) {
        await this.handleStatusChange(job, existingJob.status, updates.status);
      }

      logger.info(`Job updated: ${jobId}`);
      return job;
    } catch (error) {
      logger.error('Update job error:', error);
      throw error;
    }
  }

  /**
   * Delete job
   * @param {string} jobId - Job ID
   * @returns {Promise<void>}
   */
  static async delete(jobId) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        throw new AppError('Job not found', 404);
      }

      // Only allow deletion of pending or cancelled jobs
      if (!['pending', 'cancelled'].includes(job.status)) {
        throw new AppError('Cannot delete active or completed jobs', 400);
      }

      await prisma.job.delete({
        where: { id: jobId }
      });

      logger.info(`Job deleted: ${jobId}`);
    } catch (error) {
      logger.error('Delete job error:', error);
      throw error;
    }
  }

  /**
   * Assign technician to job
   * @param {string} jobId - Job ID
   * @param {string} technicianId - Technician ID
   * @returns {Promise<Object>} Updated job
   */
  static async assignTechnician(jobId, technicianId) {
    try {
      const job = await this.update(jobId, {
        technicianId,
        status: 'assigned',
        assignedAt: new Date()
      });

      // Notify technician
      if (job.technician?.phone) {
        await this.notifyTechnician(job);
      }

      return job;
    } catch (error) {
      logger.error('Assign technician error:', error);
      throw error;
    }
  }

  /**
   * Start job
   * @param {string} jobId - Job ID
   * @param {Object} data - Start data
   * @returns {Promise<Object>} Updated job
   */
  static async start(jobId, data = {}) {
    try {
      const job = await this.update(jobId, {
        status: 'in_progress',
        startedAt: new Date(),
        ...data
      });

      // Log activity
      await this.logActivity(jobId, 'started', 'Job started');

      // Notify customer
      if (job.customer?.phone) {
        await whatsappMessenger.sendMessage(
          job.customer.phone,
          `Teknisi sedang dalam perjalanan untuk ${job.type} di lokasi Anda.`
        );
      }

      return job;
    } catch (error) {
      logger.error('Start job error:', error);
      throw error;
    }
  }

  /**
   * Complete job
   * @param {string} jobId - Job ID
   * @param {Object} completionData - Completion data
   * @returns {Promise<Object>} Updated job
   */
  static async complete(jobId, completionData) {
    try {
      const {
        materials = [],
        photos = [],
        signature,
        notes,
        rating,
        feedback
      } = completionData;

      // Update job
      const job = await this.update(jobId, {
        status: 'completed',
        completedAt: new Date(),
        notes,
        rating,
        feedback,
        signature
      });

      // Add materials if provided
      if (materials.length > 0) {
        await prisma.jobMaterial.createMany({
          data: materials.map(m => ({
            jobId,
            ...m
          }))
        });
      }

      // Log activity
      await this.logActivity(jobId, 'completed', 'Job completed successfully');

      // Notify customer
      if (job.customer?.phone) {
        await whatsappMessenger.sendMessage(
          job.customer.phone,
          `Pekerjaan ${job.type} telah selesai. Terima kasih atas kepercayaan Anda.`
        );
      }

      return job;
    } catch (error) {
      logger.error('Complete job error:', error);
      throw error;
    }
  }

  /**
   * Cancel job
   * @param {string} jobId - Job ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Updated job
   */
  static async cancel(jobId, reason) {
    try {
      const job = await this.update(jobId, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason
      });

      // Log activity
      await this.logActivity(jobId, 'cancelled', `Job cancelled: ${reason}`);

      // Notify customer and technician
      if (job.customer?.phone) {
        await whatsappMessenger.sendMessage(
          job.customer.phone,
          `Pekerjaan ${job.type} telah dibatalkan. Alasan: ${reason}`
        );
      }

      if (job.technician?.phone) {
        await whatsappMessenger.sendMessage(
          job.technician.phone,
          `Pekerjaan untuk ${job.customer.name} telah dibatalkan.`
        );
      }

      return job;
    } catch (error) {
      logger.error('Cancel job error:', error);
      throw error;
    }
  }

  /**
   * Get job statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Statistics
   */
  static async getStatistics(filters = {}) {
    try {
      const { dateFrom, dateTo, technicianId } = filters;
      const where = {};

      if (technicianId) where.technicianId = technicianId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [
        total,
        pending,
        assigned,
        inProgress,
        completed,
        cancelled,
        byType,
        byPriority,
        avgCompletionTime
      ] = await Promise.all([
        prisma.job.count({ where }),
        prisma.job.count({ where: { ...where, status: 'pending' } }),
        prisma.job.count({ where: { ...where, status: 'assigned' } }),
        prisma.job.count({ where: { ...where, status: 'in_progress' } }),
        prisma.job.count({ where: { ...where, status: 'completed' } }),
        prisma.job.count({ where: { ...where, status: 'cancelled' } }),
        prisma.job.groupBy({
          by: ['type'],
          where,
          _count: true
        }),
        prisma.job.groupBy({
          by: ['priority'],
          where,
          _count: true
        }),
        this.calculateAvgCompletionTime(where)
      ]);

      return {
        total,
        byStatus: {
          pending,
          assigned,
          inProgress,
          completed,
          cancelled
        },
        byType: byType.map(t => ({ type: t.type, count: t._count })),
        byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count })),
        avgCompletionTime
      };
    } catch (error) {
      logger.error('Get job statistics error:', error);
      throw error;
    }
  }

  // Helper methods

  static async notifyTechnician(job) {
    const message = `
🔧 *Pekerjaan Baru*
Tipe: ${job.type}
Customer: ${job.customer.name}
Alamat: ${job.customer.address}
Prioritas: ${job.priority}
${job.scheduledDate ? `Jadwal: ${job.scheduledDate.toLocaleDateString()}` : ''}
    `;
    await whatsappMessenger.sendMessage(job.technician.phone, message);
  }

  static async notifyCustomer(job, customer) {
    const message = `
📋 *Pekerjaan Terdaftar*
Tipe: ${job.type}
Status: ${job.status}
${job.scheduledDate ? `Jadwal: ${job.scheduledDate.toLocaleDateString()}` : ''}
Kami akan segera menghubungi Anda.
    `;
    await whatsappMessenger.sendMessage(customer.phone, message);
  }

  static async handleStatusChange(job, oldStatus, newStatus) {
    const statusMessages = {
      assigned: 'telah ditugaskan ke teknisi',
      in_progress: 'sedang dikerjakan',
      completed: 'telah selesai',
      cancelled: 'telah dibatalkan'
    };

    if (job.customer?.phone && statusMessages[newStatus]) {
      await whatsappMessenger.sendMessage(
        job.customer.phone,
        `Update: Pekerjaan ${job.type} Anda ${statusMessages[newStatus]}.`
      );
    }
  }

  static async logActivity(jobId, action, description) {
    await prisma.jobActivity.create({
      data: {
        jobId,
        action,
        description
      }
    });
  }

  static async calculateAvgCompletionTime(where) {
    const completedJobs = await prisma.job.findMany({
      where: {
        ...where,
        status: 'completed',
        startedAt: { not: null },
        completedAt: { not: null }
      },
      select: {
        startedAt: true,
        completedAt: true
      }
    });

    if (completedJobs.length === 0) return 0;

    const totalTime = completedJobs.reduce((sum, job) => {
      const duration = job.completedAt.getTime() - job.startedAt.getTime();
      return sum + duration;
    }, 0);

    return Math.round(totalTime / completedJobs.length / (1000 * 60)); // in minutes
  }
}

module.exports = JobService;
