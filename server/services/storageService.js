import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);
const TRASH_RETENTION_DAYS = 30;

/**
 * Detecta dinámicamente las unidades y discos montados en el sistema Linux/Unix o Windows
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
            // Usar lsblk en Linux para encontrar puntos de montaje y particiones reales
            const { stdout } = await execAsync('lsblk -J -b -o NAME,MOUNTPOINT,SIZE,FSAVAIL,FSUSED,TYPE,LABEL');
            const parsed = JSON.parse(stdout);

            const findMounted = (nodes) => {
                for (const node of nodes) {
                    if (node.mountpoint && !node.mountpoint.startsWith('/boot') && !node.mountpoint.startsWith('/var/log')) {
                        const total = parseInt(node.size, 10) || 0;
                        const used = parseInt(node.fsused, 10) || 0;
                        const available = parseInt(node.fsavail, 10) || (total - used);

                        disks.push({
                            id: node.name,
                            name: node.label || (node.mountpoint === '/' ? 'Sistema Principal' : node.name),
                            mountPoint: node.mountpoint,
                            total,
                            used,
                            available,
                            type: node.type
                        });
                    }
                    if (node.children) findMounted(node.children);
                }
            };

            if (parsed.blockdevices) findMounted(parsed.blockdevices);
        } catch (err) {
            console.warn('Error al ejecutar lsblk, usando df fallback:', err.message);
            // Fallback con df
            try {
                const { stdout } = await execAsync('df -B1 -x tmpfs -x devtmpfs -x squashfs');
                const lines = stdout.trim().split('\n').slice(1);
                for (const line of lines) {
                    const parts = line.replace(/\s+/g, ' ').trim().split(' ');
                    if (parts.length >= 6) {
                        const mount = parts[5];
                        if (mount && !mount.startsWith('/boot')) {
                            const total = parseInt(parts[1], 10) || 0;
                            const used = parseInt(parts[2], 10) || 0;
                            const available = parseInt(parts[3], 10) || 0;
                            disks.push({
                                id: parts[0],
                                name: mount === '/' ? 'Sistema Principal' : path.basename(mount),
                                mountPoint: mount,
                                total,
                                used,
                                available
                            });
                        }
                    }
                }
            } catch (e) {
                console.error('Fallo total al detectar discos:', e.message);
            }
        }
    }

    return disks;
};

/**
 * Explora el contenido de un directorio en el disco sin modificarlo
 */
export const exploreDirectory = async (dirPath) => {
    const resolvedPath = path.resolve(dirPath);
    
    if (!fs.existsSync(resolvedPath)) {
        throw new Error('La ruta especificada no existe en el servidor.');
    }

    const items = await fs.promises.readdir(resolvedPath, { withFileTypes: true });
    const result = [];

    for (const item of items) {
        // Ignorar carpeta oculta de papelera .trash
        if (item.name === '.trash') continue;

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
            // Archivos sin permiso de lectura se omiten de forma segura
        }
    }

    return {
        currentPath: resolvedPath,
        parentPath: path.dirname(resolvedPath) !== resolvedPath ? path.dirname(resolvedPath) : null,
        items: result.sort((a, b) => b.isDirectory - a.isDirectory || a.name.localeCompare(b.name))
    };
};

/**
 * Mueve un archivo a la carpeta .trash/ oculta de la unidad correspondiente
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
 * Purga de la papelera archivos mayores a 30 días
 */
export const autoCleanTrash = async (baseDir) => {
    const trashDir = path.join(baseDir, '.trash');
    if (!fs.existsSync(trashDir)) return;

    const files = await fs.promises.readdir(trashDir);
    const now = Date.now();
    const maxAgeMs = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    for (const file of files) {
        const filePath = path.join(trashDir, file);
        try {
            const stats = await fs.promises.stat(filePath);
            if (now - stats.mtimeMs > maxAgeMs) {
                await fs.promises.rm(filePath, { recursive: true, force: true });
                console.log(`🗑️ Papelera: Archivo ${file} purgado automáticamente (+30 días).`);
            }
        } catch (e) {
            console.error('Error al purgar archivo en papelera:', e.message);
        }
    }
};

/**
 * Borrado definitivo inmediato mediante validación de contraseña
 */
export const deletePermanently = async (filePath, inputPassword) => {
    const adminPass = process.env.ADMIN_PASS || 'LocalDROP2026@';
    
    if (inputPassword !== adminPass) {
        throw new Error('Contraseña incorrecta. Borrado definitivo cancelado por seguridad.');
    }

    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
        throw new Error('El archivo a eliminar no existe.');
    }

    await fs.promises.rm(resolved, { recursive: true, force: true });
    return { success: true };
};
