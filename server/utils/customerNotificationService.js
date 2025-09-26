const prisma = require('./database');
const { sendCustomerNotification } = require('../services/websocketService');
const logger = require('./logger');
const { normalizePhone, getWhatsAppJid } = require('./phoneUtils');

/**
 * Service untuk mengelola notifikasi pelanggan
 */
class CustomerNotificationService {
  
  /**
   * Normalize phone number untuk WhatsApp
   * @deprecated Use phoneUtils.normalizePhone instead
   */
  static normalizePhone(phone) {
    return normalizePhone(phone);
  }

  /**
   * Kirim notifikasi ke pelanggan via WhatsApp
   */
  static async sendWhatsAppNotification(customerId, message, jobId = null) {
    try {
      logger.info('sendWhatsAppNotification called', { customerId, jobId, messageLength: message.length });

      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer || !customer.phone) {
        logger.warn('Customer not found or no phone number', { 
          customerId, 
          hasCustomer: !!customer, 
          hasPhone: !!customer?.phone 
        });
        return false;
      }

      const normalizedPhone = normalizePhone(customer.phone);
      if (!normalizedPhone) {
        logger.warn('Invalid phone number for customer', { 
          customerId, 
          phone: customer.phone, 
          normalizedPhone 
        });
        return false;
      }

      const jid = getWhatsAppJid(customer.phone);
      logger.info('Creating notification in database', { customerId, jid, jobId });

      // Simpan notifikasi ke database
      const notification = await prisma.notification.create({
        data: {
          type: 'WHATSAPP',
          recipient: jid,
          message,
          status: 'PENDING',
          jobId,
          customerId
        }
      });

      logger.info('Notification created in database', { 
        notificationId: notification.id, 
        customerId, 
        jid, 
        jobId 
      });

      // Kirim via WhatsApp jika tersedia (non-blocking)
      try {
        if (global.whatsappSocket && global.whatsappSocket.user) {
          logger.info('WhatsApp socket available, sending message', { customerId, jid });
          await global.whatsappSocket.sendMessage(jid, { text: message });
          logger.info('WhatsApp notification sent to customer', { customerId, jobId });
          
          // Mark as sent if direct send successful
          await prisma.notification.update({
            where: { id: notification.id },
            data: { 
              status: 'SENT',
              sentAt: new Date()
            }
          });
        } else {
          logger.info('WhatsApp socket not available, notification queued for processing', { 
            customerId, 
            jobId,
            hasSocket: !!global.whatsappSocket,
            hasUser: !!global.whatsappSocket?.user
          });
          // Keep status as PENDING for monitorNotifications to process
        }
      } catch (whatsappError) {
        logger.error('Failed to send WhatsApp notification directly, will be processed by monitor', { 
          customerId, 
          jobId, 
          error: whatsappError.message 
        });
        // Keep status as PENDING for monitorNotifications to retry
        // Don't mark as FAILED here, let monitorNotifications handle it
      }

      return true;
    } catch (error) {
      logger.error('Error sending customer WhatsApp notification', { 
        customerId, 
        jobId, 
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Kirim notifikasi realtime ke pelanggan via WebSocket
   */
  static async sendRealtimeNotification(customerId, notification) {
    try {
      // Kirim via WebSocket jika customer sedang online
      sendCustomerNotification(customerId, {
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        data: notification.data
      });

      logger.info('Realtime notification sent to customer', { customerId });
      return true;
    } catch (error) {
      logger.error('Error sending realtime notification to customer', { 
        customerId, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Kirim notifikasi tiket dibuat
   */
  static async notifyTicketCreated(job) {
    const customer = job.customer;
    if (!customer) return;

    const ticketType = job.category === 'PSB' ? 'Pemasangan WiFi' : 'Perbaikan Gangguan';
    const emoji = job.category === 'PSB' ? '🎫' : '🔧';
    
    const message = (
      `${emoji} *Tiket ${ticketType} Dibuat*\n\n` +
      `📋 Nomor Tiket: ${job.jobNumber}\n` +
      `📝 Kategori: ${ticketType}\n` +
      `📍 Alamat: ${job.address}\n` +
      `⏰ Status: Menunggu penugasan teknisi\n\n` +
      `Terima kasih telah menggunakan layanan kami. ` +
      `Kami akan segera menugaskan teknisi untuk menangani tiket Anda.`
    );

    // Kirim via WhatsApp
    await this.sendWhatsAppNotification(customer.id, message, job.id);

    // Kirim via WebSocket (ke customer ID untuk realtime)
    await this.sendRealtimeNotification(customer.id, {
      title: 'Tiket Dibuat',
      message: `Tiket ${job.jobNumber} berhasil dibuat`,
      type: 'success',
      data: { job }
    });
  }

  /**
   * Kirim notifikasi tiket diterima/diambil teknisi
   */
  static async notifyTicketAssigned(job) {
    const customer = job.customer;
    if (!customer) return;

    const assignedTechs = (job.technicians || [])
      .map(jt => jt.technician?.name)
      .filter(Boolean)
      .join(', ');

    const ticketType = job.category === 'PSB' ? 'Pemasangan WiFi' : 'Perbaikan Gangguan';
    
    const message = (
      `✅ *Tiket ${ticketType} Sedang Diproses*\n\n` +
      `📋 Nomor Tiket: ${job.jobNumber}\n` +
      `👨‍🔧 Teknisi: ${assignedTechs || 'Sedang ditugaskan'}\n` +
      `📍 Alamat: ${job.address}\n` +
      `⏰ Status: Teknisi sedang dalam perjalanan\n\n` +
      `Teknisi akan segera menghubungi Anda untuk konfirmasi jadwal. ` +
      `Mohon siapkan lokasi dan akses yang diperlukan.`
    );

    // Kirim via WhatsApp
    await this.sendWhatsAppNotification(customer.id, message, job.id);

    // Kirim via WebSocket
    await this.sendRealtimeNotification(customer.id, {
      title: 'Tiket Diterima',
      message: `Tiket ${job.jobNumber} telah diterima teknisi`,
      type: 'info',
      data: { job }
    });
  }

  /**
   * Kirim notifikasi tiket dimulai
   */
  static async notifyTicketStarted(job) {
    const customer = job.customer;
    if (!customer) return;

    const assignedTechs = (job.technicians || [])
      .map(jt => jt.technician?.name)
      .filter(Boolean)
      .join(', ');

    const ticketType = job.category === 'PSB' ? 'Pemasangan WiFi' : 'Perbaikan Gangguan';
    
    const message = (
      `🚀 *Pekerjaan ${ticketType} Dimulai*\n\n` +
      `📋 Nomor Tiket: ${job.jobNumber}\n` +
      `👨‍🔧 Teknisi: ${assignedTechs || 'Teknisi'}\n` +
      `📍 Alamat: ${job.address}\n` +
      `⏰ Status: Pekerjaan sedang berlangsung\n\n` +
      `Teknisi telah tiba dan mulai melakukan pekerjaan. ` +
      `Mohon berikan akses dan bantuan yang diperlukan.`
    );

    // Kirim via WhatsApp
    await this.sendWhatsAppNotification(customer.id, message, job.id);

    // Kirim via WebSocket
    await this.sendRealtimeNotification(customer.id, {
      title: 'Pekerjaan Dimulai',
      message: `Pekerjaan tiket ${job.jobNumber} telah dimulai`,
      type: 'info',
      data: { job }
    });
  }

  /**
   * Kirim notifikasi tiket selesai
   */
  static async notifyTicketCompleted(job) {
    const customer = job.customer;
    if (!customer) return;

    const assignedTechs = (job.technicians || [])
      .map(jt => jt.technician?.name)
      .filter(Boolean)
      .join(', ');

    const ticketType = job.category === 'PSB' ? 'Pemasangan WiFi' : 'Perbaikan Gangguan';
    const completionTime = job.completedAt 
      ? new Date(job.completedAt).toLocaleString('id-ID')
      : new Date().toLocaleString('id-ID');
    
    const message = (
      `🎉 *${ticketType} Selesai!*\n\n` +
      `📋 Nomor Tiket: ${job.jobNumber}\n` +
      `👨‍🔧 Teknisi: ${assignedTechs || 'Teknisi'}\n` +
      `📍 Alamat: ${job.address}\n` +
      `✅ Status: Selesai\n` +
      `⏰ Waktu Selesai: ${completionTime}\n\n` +
      `Terima kasih telah menggunakan layanan kami! ` +
      `Jika ada keluhan atau pertanyaan, silakan hubungi customer service.`
    );

    // Kirim via WhatsApp
    await this.sendWhatsAppNotification(customer.id, message, job.id);

    // Kirim via WebSocket
    await this.sendRealtimeNotification(customer.id, {
      title: 'Tiket Selesai',
      message: `Tiket ${job.jobNumber} telah selesai dikerjakan`,
      type: 'success',
      data: { job }
    });
  }

  /**
   * Kirim notifikasi berdasarkan status job
   */
  static async notifyJobStatusChange(job, oldStatus, newStatus) {
    try {
      logger.info('CustomerNotificationService.notifyJobStatusChange called', { 
        jobId: job.id, 
        oldStatus, 
        newStatus 
      });

      // Load job dengan relasi yang diperlukan
      const fullJob = await prisma.job.findUnique({
        where: { id: job.id },
        include: {
          customer: true,
          technicians: {
            include: {
              technician: true
            }
          }
        }
      });

      if (!fullJob || !fullJob.customer) {
        logger.warn('Job or customer not found for notification', { 
          jobId: job.id, 
          hasJob: !!fullJob, 
          hasCustomer: !!fullJob?.customer 
        });
        return;
      }

      logger.info('Job and customer found, proceeding with notification', { 
        jobId: job.id, 
        customerId: fullJob.customer.id, 
        customerPhone: fullJob.customer.phone,
        newStatus 
      });

      // Kirim notifikasi berdasarkan status baru
      switch (newStatus) {
        case 'ASSIGNED':
          logger.info('Sending ASSIGNED notification', { jobId: job.id });
          await this.notifyTicketAssigned(fullJob);
          break;
        case 'IN_PROGRESS':
          logger.info('Sending IN_PROGRESS notification', { jobId: job.id });
          await this.notifyTicketStarted(fullJob);
          break;
        case 'COMPLETED':
          logger.info('Sending COMPLETED notification', { jobId: job.id });
          await this.notifyTicketCompleted(fullJob);
          break;
        default:
          logger.info('No customer notification needed for status', { 
            jobId: job.id, 
            status: newStatus 
          });
      }
    } catch (error) {
      logger.error('Error notifying customer of job status change', { 
        jobId: job.id, 
        oldStatus, 
        newStatus, 
        error: error.message,
        stack: error.stack
      });
    }
  }
}

module.exports = CustomerNotificationService;
