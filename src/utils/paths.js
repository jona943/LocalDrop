import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// La carpeta src/utils está a dos niveles de la raíz
export const rootDir = path.resolve(__dirname, '../..');
export const dataDir = path.join(rootDir, 'data');
export const uploadsDir = path.join(rootDir, 'uploads');
export const devicesFilePath = path.join(dataDir, 'devices.json');
export const itemsFilePath = path.join(dataDir, 'items.json');
export const jsDir = path.join(rootDir, 'js');
export const cssDir = path.join(rootDir, 'css');
