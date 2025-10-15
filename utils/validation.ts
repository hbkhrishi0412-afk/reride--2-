export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const validatePrice = (price: number): boolean => {
  return typeof price === 'number' && price > 0 && price < 100000000; // 10 crores max
};

export const validateYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return typeof year === 'number' && year >= 1900 && year <= currentYear + 1;
};

export const validateMileage = (mileage: number): boolean => {
  return typeof mileage === 'number' && mileage >= 0 && mileage < 1000000; // 10 lakh km max
};

export const validateRequired = (value: any): boolean => {
  return value !== null && value !== undefined && value !== '';
};

export const validateStringLength = (str: string, min: number, max: number): boolean => {
  return typeof str === 'string' && str.length >= min && str.length <= max;
};

export const validateArray = (arr: any[], minLength: number = 0): boolean => {
  return Array.isArray(arr) && arr.length >= minLength;
};

export const validateObject = (obj: any): boolean => {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
};

