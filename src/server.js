import os from 'os';
import app from './app.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
    let localIP = '127.0.0.1';
    try {
        const netInterfaces = os.networkInterfaces();
        const found = Object.values(netInterfaces)
            .flat()
            .find(i => i && i.family === 'IPv4' && !i.internal);
        if (found) {
            localIP = found.address;
        }
    } catch (e) {
        console.error('Error detectando IP local:', e);
    }

    console.log(`\n🚀 LocalDrop en marcha (Modular ES Modules)`);
    console.log(`   Acceso por Dominio:  http://localdrop.home:${PORT}`);
    console.log(`   Acceso por IP:       http://${localIP}:${PORT}\n`);
});

// Timeout de 1 hora para cargas grandes
server.timeout = 3600000;
