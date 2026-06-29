import fs from 'fs';
import { devicesFilePath, dataDir } from '../utils/paths.js';

let devices = {};

export const loadDevices = () => {
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        if (fs.existsSync(devicesFilePath)) {
            devices = JSON.parse(fs.readFileSync(devicesFilePath, 'utf8'));
        }
    } catch (e) {
        console.error('Error cargando dispositivos:', e);
    }
};

export const saveDevices = () => {
    try {
        fs.writeFileSync(devicesFilePath, JSON.stringify(devices, null, 2));
    } catch (e) {
        console.error('Error guardando dispositivos:', e);
    }
};

export const getDevices = () => devices;

const generateColor = () => {
    const colors = ['#38bdf8', '#fb923c', '#f472b6', '#a78bfa', '#2dd4bf', '#facc15', '#4ade80'];
    return colors[Math.floor(Math.random() * colors.length)];
};

export const getDeviceInfo = (req) => {
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const deviceId = req.query.deviceId || req.headers['x-device-id'] || 'anon';
    const customName = req.query.userName || req.headers['x-user-name'];
    let ip = req.ip || req.connection.remoteAddress;
    if (ip.includes('::ffff:')) ip = ip.split(':').pop();

    if (!devices[deviceId]) {
        let osName = 'Disp.';
        let browser = 'Web';

        if (ua.includes('windows')) osName = 'PC Windows';
        else if (ua.includes('android')) osName = 'Android';
        else if (ua.includes('iphone') || ua.includes('ipad')) osName = 'Apple';
        else if (ua.includes('linux')) osName = 'Linux';
        else if (ua.includes('macintosh')) osName = 'Mac';

        if (ua.includes('chrome')) browser = 'Chrome';
        else if (ua.includes('firefox')) browser = 'Firefox';
        else if (ua.includes('safari')) browser = 'Safari';

        devices[deviceId] = {
            os: osName,
            userName: customName || '',
            name: customName ? `${osName} - ${customName}` : osName,
            color: generateColor(),
            firstSeen: new Date().toISOString(),
            metadata: { browser, os: osName, fullUA: req.headers['user-agent'] }
        };
    } else if (customName && devices[deviceId].userName !== customName) {
        devices[deviceId].userName = customName;
        devices[deviceId].name = `${devices[deviceId].os} - ${customName}`;
    }

    devices[deviceId].lastIp = ip;
    devices[deviceId].lastSeen = new Date().toISOString();
    saveDevices();
    return devices[deviceId];
};

export const renameDevice = (userAgent, newName) => {
    if (devices[userAgent]) {
        devices[userAgent].name = newName;
        saveDevices();
        return true;
    }
    return false;
};

export const deleteDevice = (id) => {
    if (devices[id]) {
        delete devices[id];
        saveDevices();
        return true;
    }
    return false;
};
