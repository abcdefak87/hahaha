/**
 * WhatsApp OTP Pairing Service
 * Handles OTP-based pairing for WhatsApp connection
 */

// Dynamic import for ESM compatibility with Baileys v7.0.0+
let makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore;

async function loadBaileys() {
  try {
    const baileys = await import('@whiskeysockets/baileys');
    makeWASocket = baileys.default;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    DisconnectReason = baileys.DisconnectReason;
    makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore;
  } catch (error) {
    console.error('Error loading Baileys:', error);
    throw error;
  }
}
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

class WhatsAppOTPService {
  constructor(options = {}) {
    this.options = {
      sessionPath: options.sessionPath || path.join(__dirname, '../../auth_info_baileys'),
      version: options.version || [2, 2413, 1],
      browser: options.browser || ['Chrome (Windows)', 'Chrome', '120.0.0.0'],
      ...options
    };

    // Bot state
    this.sock = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.lastConnectionTime = null;
    this.pairingCode = null;
    this.pairingPhoneNumber = null;

    logger.info('WhatsAppOTPService initialized', {
      sessionPath: this.options.sessionPath,
      version: this.options.version.join('.')
    });
  }

  /**
   * Start WhatsApp connection with OTP pairing support
   */
  async start() {
    if (this.isConnecting || this.isConnected) {
      logger.warn('Bot is already starting or connected');
      return { success: false, message: 'Bot sudah berjalan atau sedang menyambung' };
    }

    try {
      this.isConnecting = true;
      logger.info('Starting WhatsApp bot with OTP pairing support...');

      // Load Baileys ESM module first
      await loadBaileys();
      logger.info('✅ Baileys v7.0.0+ loaded successfully');

      // Create session directory
      await this.ensureSessionDirectory();

      // Load authentication state
      const { state, saveCreds } = await useMultiFileAuthState(this.options.sessionPath);

      // Create WhatsApp socket
      this.sock = makeWASocket({
        version: this.options.version,
        logger: pino({ level: 'silent' }),
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        browser: this.options.browser,
        qrTimeout: 120000,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 120000,
        keepAliveIntervalMs: 30000,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        getMessage: async () => undefined
      });

      // Setup event handlers
      this.setupEventHandlers(saveCreds);

      // Export socket globally for API access
      global.whatsappSocket = this.sock;

      logger.info('WhatsApp bot started successfully with OTP support');
      return { success: true, message: 'Bot berhasil dimulai dengan dukungan OTP' };

    } catch (error) {
      logger.error('Failed to start WhatsApp bot', error);
      this.isConnecting = false;
      return { success: false, message: 'Gagal memulai bot', error: error.message };
    }
  }

  /**
   * Setup WhatsApp socket event handlers
   */
  setupEventHandlers(saveCreds) {
    // Handle credential updates
    this.sock.ev.on('creds.update', saveCreds);

    // Handle connection updates
    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (connection === 'close') {
        this.isConnected = false;
        this.isConnecting = false;
        
        const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        logger.warn('WhatsApp connection closed', {
          shouldReconnect,
          reason: lastDisconnect.error?.output?.statusCode
        });

        if (shouldReconnect && this.connectionAttempts < this.maxConnectionAttempts) {
          this.connectionAttempts++;
          logger.info(`Attempting to reconnect (${this.connectionAttempts}/${this.maxConnectionAttempts})`);
          setTimeout(() => this.start(), 5000);
        } else {
          logger.error('Max reconnection attempts reached or logged out');
        }
      } else if (connection === 'open') {
        this.isConnected = true;
        this.isConnecting = false;
        this.connectionAttempts = 0;
        this.lastConnectionTime = new Date();
        
        logger.info('WhatsApp connected successfully', {
          user: this.sock.user?.id,
          name: this.sock.user?.name
        });

        // Clear pairing info on successful connection
        this.pairingCode = null;
        this.pairingPhoneNumber = null;
      } else if (connection === 'connecting') {
        logger.info('WhatsApp connecting...');
      }
    });

    // Handle QR code generation (for fallback)
    this.sock.ev.on('connection.update', (update) => {
      const { qr } = update;
      if (qr) {
        logger.info('QR code generated for WhatsApp connection (fallback)');
        // QR code is available but we prefer OTP pairing
      }
    });
  }

  /**
   * Generate pairing code for phone number
   */
  async generatePairingCode(phoneNumber) {
    if (!this.sock) {
      throw new Error('WhatsApp socket not initialized');
    }

    if (this.isConnected) {
      throw new Error('WhatsApp already connected');
    }

    try {
      // Normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      logger.info('Generating pairing code', { phoneNumber: normalizedPhone });
      
      // Request pairing code
      const pairingCode = await this.sock.requestPairingCode(normalizedPhone);
      
      this.pairingCode = pairingCode;
      this.pairingPhoneNumber = normalizedPhone;
      
      logger.info('Pairing code generated successfully', { 
        phoneNumber: normalizedPhone,
        code: pairingCode 
      });

      return {
        success: true,
        pairingCode: pairingCode,
        phoneNumber: normalizedPhone,
        message: 'Kode pairing berhasil dibuat. Masukkan kode ini di WhatsApp Anda.'
      };

    } catch (error) {
      logger.error('Failed to generate pairing code', error);
      throw new Error(`Gagal membuat kode pairing: ${error.message}`);
    }
  }

  /**
   * Check connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      user: this.sock?.user || null,
      status: this.isConnected ? 'active' : (this.isConnecting ? 'connecting' : 'offline'),
      lastConnectionTime: this.lastConnectionTime,
      pairingCode: this.pairingCode,
      pairingPhoneNumber: this.pairingPhoneNumber,
      connectionAttempts: this.connectionAttempts
    };
  }

  /**
   * Send message via WhatsApp
   */
  async sendMessage(to, message) {
    if (!this.sock || !this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    try {
      const jid = this.getWhatsAppJid(to);
      await this.sock.sendMessage(jid, { text: message });
      
      logger.info('Message sent successfully', { to: jid });
      return { success: true, message: 'Pesan berhasil dikirim' };

    } catch (error) {
      logger.error('Failed to send message', error);
      throw new Error(`Gagal mengirim pesan: ${error.message}`);
    }
  }

  /**
   * Normalize phone number
   */
  normalizePhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Get WhatsApp JID from phone number
   */
  getWhatsAppJid(phoneNumber) {
    const normalized = this.normalizePhoneNumber(phoneNumber);
    return normalized + '@s.whatsapp.net';
  }

  /**
   * Ensure session directory exists
   */
  async ensureSessionDirectory() {
    if (!fs.existsSync(this.options.sessionPath)) {
      fs.mkdirSync(this.options.sessionPath, { recursive: true });
      logger.info('Created session directory', { path: this.options.sessionPath });
    }
  }

  /**
   * Stop WhatsApp connection
   */
  async stop() {
    if (this.sock) {
      try {
        await this.sock.logout();
        this.sock = null;
        this.isConnected = false;
        this.isConnecting = false;
        logger.info('WhatsApp connection stopped');
      } catch (error) {
        logger.error('Error stopping WhatsApp connection', error);
      }
    }
  }
}

module.exports = WhatsAppOTPService;
