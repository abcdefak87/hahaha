/**
 * Utility functions for phone number handling
 */

/**
 * Normalize phone number to WhatsApp format (62xxx)
 * Supports multiple input formats:
 * - 08123456789 (0 prefix)
 * - 628123456789 (62 prefix)
 * - 8123456789 (no prefix)
 * - +628123456789 (+62 prefix)
 * - 0812-345-6789 (with dashes)
 * - 0812 345 6789 (with spaces)
 */
function normalizePhone(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.toString().replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('0')) {
    // Format: 08123456789 -> 628123456789
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('62')) {
    // Format: 628123456789 -> 628123456789 (already correct)
    // Do nothing
  } else if (cleaned.length >= 9) {
    // Format: 8123456789 -> 628123456789
    cleaned = '62' + cleaned;
  } else {
    // Invalid format
    return null;
  }
  
  // Validate final format (should be 62 + 8-12 digits)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return null;
  }
  
  return cleaned;
}

/**
 * Format phone number for display
 * Converts 628123456789 to 08123456789 for Indonesian display
 */
function formatPhoneForDisplay(phone) {
  if (!phone) return null;
  
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  
  if (normalized.startsWith('62')) {
    return '0' + normalized.substring(2);
  }
  
  return normalized;
}

/**
 * Validate phone number format
 */
function validatePhone(phone) {
  const normalized = normalizePhone(phone);
  return normalized !== null;
}

/**
 * Get WhatsApp JID from phone number
 */
function getWhatsAppJid(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `${normalized}@s.whatsapp.net`;
}

module.exports = {
  normalizePhone,
  formatPhoneForDisplay,
  validatePhone,
  getWhatsAppJid
};
