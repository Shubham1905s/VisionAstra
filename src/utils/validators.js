export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isCollegeEmail(email) {
  return EMAIL_REGEX.test(email) && email.toLowerCase().includes("edu");
}

export function validatePassword(password) {
  return password.length >= 8;
}

export function generateOtp() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

export function createCaptcha(length = 6) {
  const pool = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%&*';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += pool[Math.floor(Math.random() * pool.length)];
  }
  return { text };
}

export function generateTeamId(prefix) {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${random}`;
}

export function calculateTotalMarks(round1 = 0, round2 = 0) {
  return Number(round1 || 0) + Number(round2 || 0);
}
