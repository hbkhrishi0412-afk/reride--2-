// utils/passwordUtils.ts

/**
 * Utility functions for password handling
 */

/**
 * Hash a password using bcryptjs
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    // Import bcryptjs dynamically to avoid SSR issues
    const bcrypt = await import('bcryptjs');
    return await bcrypt.hash(password, 10);
  } catch (error) {
    console.error('Failed to hash password:', error);
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare a password with its hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns Promise<boolean> - Whether passwords match
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    // Import bcryptjs dynamically to avoid SSR issues
    const bcrypt = await import('bcryptjs');
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Failed to compare password:', error);
    return false;
  }
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and errors
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }
  
  // Add more validation rules as needed
  if (!/[A-Za-z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
