import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);
const TRASH_RETENTION_DAYS = 30;

/**
 * Detecta dinámicamente solo las unidades de almacenamiento físico persistente
 */
export const listDisks = async () => {
    const isWin = os.platform() === 'win32';
    const disks = [];

    if (isWin) {
        try {
            const { stdout } = await execAsync('wmic logicaldisk get DeviceID, VolumeName, Size, FreeSpace /value');
            const lines = stdout.split('\n');
            let current = {};
            for (const line of lines) {
                const trim = line.trim();
                if (trim.startsWith('DeviceID=')) current.id = trim.split('=')[1];
                else if (trim.startsWith('VolumeName=')) current.name = trim.split('=')[1] || 'Disco Local';
                else if (trim.startsWith('Size=')) current.total = parseInt(trim.split('=')[1], 10) || 0;
                else if (trim.startsWith('FreeSpace=')) {
                    current.available = parseInt(trim.split('=')[1], 10) || 0;
                    if (current.id && current.total > 0) {
                        current.mountPoint = current.id + '\\';
                        current.used = current.total - current.available;
                        disks.push({ ...current });
                        current = {};
                    }
                }
            }
        } catch (err) {
            console.warn('Error al detectar discos en Windows:', err.message);
        }
    } else {
        try {
            const { stdout } = await execAsync('df -B1');
            const lines = stdout.trim().split('\n').slice(1);
            for (const line of lines) {
                const parts = line.replace(/\s+/g, ' ').trim().split(' ');
                if (parts.length >= 6) {
                    const mountPoint = parts[5];
                    const fsType = parts[0];

                    // Filtrar estrictamente particiones virtuales, de sistema, logs, zram y tmpfs
                    const isSystemPartition = 
                        !mountPoint ||
                        mountPoint.startsWith('/boot') || 
                        mountPoint.startsWith('/proc') || 
                        mountPoint.startsWith('/sys') || 
                        mountPoint.startsWith('/dev') || 
                        mountPoint.startsWith('/run') ||
                        mountPoint.startsWith('/var/log') ||
                        mountPoint.startsWith('/tmp') ||
                        fsType.includes('zram') ||
                        fsType.includes('tmpfs') ||
                        fsType.includes('overlay');

                    if (!isSystemPartition) {
                        const total = parseInt(parts[1], 10) || 0;
                        const used = parseInt(parts[2], 10) || 0;
                        const available = parseInt(parts[3], 10) || 0;
                        
                        if (total > 0) {
                            let name = 'Disco Local';
                            if (mountPoint === '/') name = 'Sistema Principal (eMMC)';
                            else name = `Disco Externo (${path.basename(mountPoint) || 'USB'})`;

                            disks.push({
                                id: parts[0],
                                name,
                                mountPoint,
                                total,
                                used,
                                available
                            });
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error al detectar discos con df:', err.message);
        }
    }

    if (disks.length === 0) {
        disks.push({
            id: 'root',
            name: 'Almacenamiento Servidor',
            mountPoint: process.env.STORAGE_PATH || '/',
            total: 500 * 1024 * 1024 * 1024,
            used: 10 * 1024 * 1024 * 1024,
            available: 490 * 1024 * 1024 * 1024
        });
    }

    return disks;
};

/**
 * Explora el contenido de un directorio en el disco sin modificarlo
 */
export const exploreDirectory = async (dirPath) => {
    const resolvedPath = path.resolve(dirPath || '/');
    
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`La ruta ${resolvedPath} no existe.`);
    }

    const items = await fs.promises.readdir(resolvedPath, { withFileTypes: true });
    const result = [];

    for (const item of items) {
        if (item.name === '.trash' || item.name.startsWith('.')) continue;

        const fullPath = path.join(resolvedPath, item.name);
        try {
            const stats = await fs.promises.stat(fullPath);
            result.push({
                name: item.name,
                path: fullPath,
                isDirectory: item.isDirectory(),
                size: stats.size,
                updatedAt: stats.mtime
            });
        } catch (e) {
            // Ignorar archivos sin permiso
        }
    }

    return {
        currentPath: resolvedPath,
        parentPath: path.dirname(resolvedPath) !== resolvedPath ? path.dirname(resolvedPath) : null,
        items: result.sort((a, b) => b.isDirectory - a.isDirectory || a.name.localeCompare(b.name))
    };
};

/**
 * Mueve un archivo a la carpeta .trash/ oculta
 */
export const moveToTrash = async (filePath) => {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
        throw new Error('El archivo a eliminar no existe.');
    }

    const parentDir = path.dirname(resolved);
    const trashDir = path.join(parentDir, '.trash');

    if (!fs.existsSync(trashDir)) {
        await fs.promises.mkdir(trashDir, { recursive: true });
    }

    const fileName = path.basename(resolved);
    const trashPath = path.join(trashDir, `${Date.now()}_${fileName}`);

    await fs.promises.rename(resolved, trashPath);
    return { success: true, trashPath };
};

/**
 * Borrado definitivo inmediato con contraseña
 */
export const deletePermanently = async (filePath, inputPassword) => {
    const adminPass = process.env.ADMIN_PASS || 'LocalDROP2026@';
    
    if (inputPassword !== adminPass) {
        throw new Error('Contraseña incorrecta. Borrado definitivo cancelado.');
    }

    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
        throw new Error('El archivo no existe.');
    }

    await fs.promises.rm(resolved, { recursive: true, force: true });
    return { success: true };
};
