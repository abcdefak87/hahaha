/**
 * Authentication Service
 * Handles all authentication-related business logic
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/database');
const tokenManager = require('../utils/tokenManager');
const { createOTP, verifyOTP } = require('../utils/otp');
const whatsappMessenger = require('../utils/whatsappMessenger');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {string|null} Error message or null if valid
   */
  static validatePassword(password) {
    const minLength = parseInt(process.env.MIN_PASSWORD_LENGTH) || 8;
    const requireComplexity = process.env.REQUIRE_PASSWORD_COMPLEXITY === 'true';
    
    if (password.length < minLength) {
      return `Password harus minimal ${minLength} karakter`;
    }
    
    if (requireComplexity) {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        return 'Password harus mengandung minimal satu huruf besar, satu huruf kecil, satu angka, dan satu karakter khusus';
      }
    }
    
    return null;
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user object
   */
  static async register({ email, password, name, role = 'admin' }) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: { email }
      });

      if (existingUser) {
        throw new Error('Pengguna dengan email ini sudah ada');
      }

      // Validate password
      const passwordError = this.validatePassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });

      logger.info(`New user registered: ${email}`);
      return user;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} User object and tokens
   */
  static async login({ username, email, password }) {
    try {
      // Find user by username or email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username || undefined },
            { email: email || username || undefined }
          ]
        }
      });

      if (!user) {
        throw new Error('Username atau password salah');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new Error('Akun Anda tidak aktif. Silakan hubungi administrator.');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Username atau password salah');
      }

      // Generate tokens
      const accessToken = tokenManager.generateAccessToken(user);
      const refreshToken = tokenManager.generateRefreshToken(user);

      // Store refresh token
      await tokenManager.storeRefreshToken(user.id, refreshToken);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          username: user.username
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New access token
   */
  static async refreshToken(refreshToken) {
    try {
      const decoded = tokenManager.verifyRefreshToken(refreshToken);
      const isValid = await tokenManager.validateRefreshToken(decoded.userId, refreshToken);

      if (!isValid) {
        throw new Error('Invalid refresh token');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      const newAccessToken = tokenManager.generateAccessToken(user);
      
      logger.info(`Token refreshed for user: ${user.email}`);
      
      return { accessToken: newAccessToken };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to revoke
   * @returns {Promise<void>}
   */
  static async logout(userId, refreshToken) {
    try {
      await tokenManager.revokeRefreshToken(userId, refreshToken);
      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  static async getProfile(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          username: true,
          createdAt: true,
          lastLogin: true,
          status: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated user profile
   */
  static async updateProfile(userId, updates) {
    try {
      const { name, email, currentPassword, newPassword } = updates;
      const updateData = {};

      // If updating email, check if it's already taken
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            NOT: { id: userId }
          }
        });

        if (existingUser) {
          throw new Error('Email sudah digunakan');
        }
        updateData.email = email;
      }

      // If updating password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          throw new Error('Password saat ini diperlukan untuk mengubah password');
        }

        const user = await prisma.user.findUnique({
          where: { id: userId }
        });

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          throw new Error('Password saat ini salah');
        }

        const passwordError = this.validatePassword(newPassword);
        if (passwordError) {
          throw new Error(passwordError);
        }

        updateData.password = await bcrypt.hash(newPassword, 12);
      }

      if (name) {
        updateData.name = name;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          username: true
        }
      });

      logger.info(`Profile updated for user: ${updatedUser.email}`);
      return updatedUser;
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  static async requestPasswordReset(email) {
    try {
      const user = await prisma.user.findFirst({
        where: { email }
      });

      if (!user) {
        // Don't reveal if user exists or not
        return { message: 'Jika email terdaftar, kode OTP akan dikirim' };
      }

      // Generate OTP
      const otp = await createOTP(user.id, 'password_reset');

      // Send OTP via WhatsApp if phone number exists
      if (user.phone) {
        await whatsappMessenger.sendOTP(user.phone, otp);
      }

      logger.info(`Password reset requested for: ${email}`);
      return { message: 'Jika email terdaftar, kode OTP akan dikirim' };
    } catch (error) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Reset password with OTP
   * @param {Object} data - Reset data
   * @returns {Promise<void>}
   */
  static async resetPassword({ email, otp, newPassword }) {
    try {
      const user = await prisma.user.findFirst({
        where: { email }
      });

      if (!user) {
        throw new Error('Invalid email or OTP');
      }

      // Verify OTP
      const isValidOTP = await verifyOTP(user.id, otp, 'password_reset');
      if (!isValidOTP) {
        throw new Error('Invalid or expired OTP');
      }

      // Validate new password
      const passwordError = this.validatePassword(newPassword);
      if (passwordError) {
        throw new Error(passwordError);
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      logger.info(`Password reset successful for: ${email}`);
      return { message: 'Password berhasil direset' };
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }
}

module.exports = AuthService;
