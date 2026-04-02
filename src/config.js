export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
export const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || window.location.origin;


export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'application/pdf'
];
export const FILE_TYPE_LABELS = {
  'image/jpeg': 'JPEG Image',
  'image/png': 'PNG Image',
  'image/gif': 'GIF Image',
  'image/bmp': 'BMP Image',
  'application/pdf': 'PDF Document',
};