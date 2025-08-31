import validator from 'validator';

export function isValidEmail(email: string) {
  return validator.isEmail(String(email || ''));
}

export function isValidOTP(otp: string) {
  return /^[0-9]{6}$/.test(String(otp || ''));
}
