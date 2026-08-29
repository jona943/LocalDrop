import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const serverDir = path.resolve(__dirname, '..');

// Permite configurar un punto de montaje para el almacenamiento externo desde variable de entorno
// Por defecto guarda en server/data y server/uploads
export const dataDir = process.env.STORAGE_PATH 
  ? path.join(process.env.STORAGE_PATH, 'data') 
  : path.join(serverDir, 'data');

export const uploadsDir = process.env.STORAGE_PATH 
  ? path.join(process.env.STORAGE_PATH, 'uploads') 
  : path.join(serverDir, 'uploads');

export const devicesFilePath = path.join(dataDir, 'devices.json');
export const itemsFilePath = path.join(dataDir, 'items.json');
