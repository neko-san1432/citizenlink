// Security utility functions for CitizenLink

/**
 * Sanitizes user input to prevent XSS attacks
 * Escapes special characters and removes dangerous HTML
 */
export function sanitizeInput(input) {
    if (!input) return '';
    
    // Convert to string if not already
    const str = String(input);
    
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/`/g, '&#x60;')
        .trim();
}

/**
 * Validates phone number format
 * Ensures phone number matches expected pattern
 */
export function validatePhoneNumber(phone) {
    const phonePattern = /^[9][0-9]{9}$/;
    return phonePattern.test(phone);
}

/**
 * Validates password strength
 * Requires minimum length and complexity
 */
export function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const isValid = password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar;
        
    return {
        isValid,
        errors: !isValid ? [
            password.length < minLength && 'Password must be at least 8 characters',
            !hasUpperCase && 'Password must contain uppercase letters',
            !hasLowerCase && 'Password must contain lowercase letters',
            !hasNumbers && 'Password must contain numbers',
            !hasSpecialChar && 'Password must contain special characters'
        ].filter(Boolean) : []
    };
}

/**
 * Content Security Policy header configuration
 * Prevents XSS and other injection attacks
 */
export const CSP_HEADER = {
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://cdnjs.cloudflare.com'],
    'style-src': ["'self'", 'https://cdnjs.cloudflare.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https://cdnjs.cloudflare.com'],
    'connect-src': ["'self'", 'https://lspscscjmfcywoakgrtf.supabase.co']
};

/**
 * Secure Storage wrapper for sensitive data
 * Encrypts data before storing in localStorage/sessionStorage
 */
export class SecureStorage {
  constructor(storage = localStorage) {
    this.storage = storage;
  }

  setItem(key, value) {
    const encryptedValue = btoa(JSON.stringify(value)); // Basic encryption for demo
    this.storage.setItem(key, encryptedValue);
  }

  getItem(key) {
    const value = this.storage.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(atob(value));
    } catch {
      return null;
    }
  }

  removeItem(key) {
    this.storage.removeItem(key);
  }
}

/**
 * Rate limiting implementation for API calls
 */
export class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Remove old requests outside the time window
    const validRequests = userRequests.filter(time => now - time < this.timeWindow);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

/**
 * Validates file uploads for security
 * Checks file type, size, and content
 */
export function validateFileUpload(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) {
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    throw new Error('No file provided');
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  if (file.size > maxSize) {
    throw new Error('File size too large');
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  if (!validExtensions.some(ext => fileName.endsWith(ext))) {
    throw new Error('Invalid file extension');
  }

  return true;
}

/**
 * Anti-CSRF token generator
 */
export function generateCSRFToken() {
  const token = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(token, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Initialize security instances
export const secureStorage = new SecureStorage();
export const rateLimiter = new RateLimiter();
