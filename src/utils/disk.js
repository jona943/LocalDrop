import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Obtiene el espacio total y disponible en disco en bytes.
 * @param {string} pathToCheck Ruta a validar.
 * @returns {Promise<{total: number, available: number}>} Espacio en disco.
 */
export const checkDiskSpace = async (pathToCheck) => {
    const isWin = os.platform() === 'win32';

    if (isWin) {
        try {
            // En Windows, listamos discos usando wmic logicaldisk
            // O un PowerShell rápido. Wmic es rápido y directo.
            const drive = pathToCheck.substring(0, 2).toUpperCase(); // ej: "C:"
            const { stdout } = await execAsync(`wmic logicaldisk where "DeviceID='${drive}'" get Size,FreeSpace /value`);
            
            const lines = stdout.split('\n');
            let total = 0;
            let available = 0;

            lines.forEach(line => {
                const trimLine = line.trim();
                if (trimLine.startsWith('Size=')) {
                    total = parseInt(trimLine.split('=')[1], 10);
                } else if (trimLine.startsWith('FreeSpace=')) {
                    available = parseInt(trimLine.split('=')[1], 10);
                }
            });

            if (total > 0) {
                return { total, available };
            }
        } catch (e) {
            console.warn('Advertencia usando wmic (Windows), usando fallback:', e.message);
        }

        // Fallback para Windows (100GB total, 50GB libre)
        return { total: 107374182400, available: 53687091200 };
    } else {
        // En Linux/macOS, usamos df con tamaño en bloques de 1 byte
        try {
            const { stdout } = await execAsync(`df -B1 "${pathToCheck}"`);
            const lines = stdout.trim().split('\n');
            if (lines.length > 1) {
                // La salida suele ser:
                // Filesystem      1B-blocks      Used  Available Use% Mounted on
                // /dev/sda1      10558369792 5239103488 4780511232  53% /
                // Nos interesa la segunda línea.
                const parts = lines[1].replace(/\s+/g, ' ').trim().split(' ');
                
                // Si la línea tiene un salto por un nombre de dispositivo muy largo,
                // df puede separar el filesystem de los datos. En ese caso, la línea 1 tiene el filesystem
                // y la línea 2 tiene los datos, o parts tiene menos columnas de las esperadas.
                // En general, parts[1] es total, parts[2] es usado, parts[3] es disponible.
                if (parts.length >= 4) {
                    const total = parseInt(parts[1], 10);
                    const available = parseInt(parts[3], 10);
                    if (!isNaN(total) && !isNaN(available)) {
                        return { total, available };
                    }
                }
            }
        } catch (e) {
            console.warn('Advertencia usando df (Linux/macOS), usando fallback:', e.message);
        }

        // Fallback genérico para Linux/macOS (100GB total, 50GB libre)
        return { total: 107374182400, available: 53687091200 };
    }
};
