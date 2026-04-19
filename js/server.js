const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const sseExpress = require('sse-express');
const disk = require('diskusage');

const app = express();
const PORT = 3000;

// --- Paths de Datos ---
const dataDir = path.join(__dirname, '..', 'data');
const devicesFilePath = path.join(dataDir, 'devices.json');
const itemsFilePath = path.join(dataDir, 'items.json');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// --- Almacenamiento y Estado ---
let items = []; // Cargado desde disco
let clients = new Map(); // Mapa de clientes conectados para SSE: [connectionId, {res, userAgent}]
let activeUserAgents = new Set(); // User-Agents actualmente conectados
let devices = {}; // Dispositivos conocidos
let sessionLogStream; // Stream de escritura para el log de la sesión

// --- Carga y Setup Inicial ---
// Cargar dispositivos conocidos
try {
    if (fs.existsSync(devicesFilePath)) {
        devices = JSON.parse(fs.readFileSync(devicesFilePath));
    }
} catch (error) {
    console.error('Error al cargar devices.json:', error);
}

// Cargar items persistidos
try {
    if (fs.existsSync(itemsFilePath)) {
        items = JSON.parse(fs.readFileSync(itemsFilePath));
    }
} catch (error) {
    console.error('Error al cargar items.json:', error);
}

// Crear log de la sesión
const now = new Date();
const pad = (num) => num.toString().padStart(2, '0');
const logFileName = `${pad(now.getFullYear()-2000)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.log`;
sessionLogStream = fs.createWriteStream(path.join(dataDir, logFileName), { flags: 'a' });
sessionLogStream.write(`--- Log de sesión iniciado: ${now.toISOString()} ---\n`);


// --- Funciones de Utilidad ---
const saveDevices = () => {
    try {
        fs.writeFileSync(devicesFilePath, JSON.stringify(devices, null, 2));
    } catch (error) {
        console.error('Error al guardar devices.json:', error);
    }
};

const generateColor = () => {
    const colors = ['#38bdf8', '#fb923c', '#f472b6', '#a78bfa', '#2dd4bf', '#facc15', '#4ade80'];
    const usedColors = Object.values(devices).map(d => d.color);
    const availableColors = colors.filter(c => !usedColors.includes(c));
    if (availableColors.length > 0) return availableColors[0];
    // Si se acaban los colores, genera uno aleatorio simple
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
};

const logInteraction = (message) => {
    sessionLogStream.write(`[${new Date().toISOString()}] ${message}\n`);
};

// --- Configuración de Multer y Middleware ---
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB Límite

app.use('/uploads', express.static(uploadsDir));
app.use('/css', express.static(path.join(__dirname, '..', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));
app.use(express.static(path.join(__dirname, '..'))); // Servir archivos estáticos del directorio raíz
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- Lógica de SSE (Server-Sent Events) ---
const broadcastUpdate = () => {
    console.log(`Notificando a ${clients.size} cliente(s)`);
    clients.forEach(client => client.res.sse('message', { event: 'update' }));
};

const broadcastConnectionCount = () => {
    const count = clients.size;
    console.log(`Actualizando contador de conexiones: ${count}`);
    clients.forEach(client => client.res.sse('connections_update', count));
};

const broadcastDeviceStatuses = () => {
    const activeUAs = Array.from(activeUserAgents);
    console.log(`Actualizando estado de dispositivos activos: ${activeUAs.length} UAs`);
    clients.forEach(client => client.res.sse('device_statuses_update', activeUAs));
};

app.get('/events', sseExpress, (req, res) => {
    const connectionId = Date.now() + Math.random().toString(36).substring(2, 15); // ID único para esta conexión
    const userAgent = req.headers['user-agent'];
    
    clients.set(connectionId, { res, userAgent });
    activeUserAgents.add(userAgent);

    console.log(`Cliente conectado (${userAgent}). Total conexiones: ${clients.size}. UAs activos: ${activeUserAgents.size}`);
    
    // Enviar el estado actual solo a este nuevo cliente
    res.sse('connections_update', clients.size);
    res.sse('device_statuses_update', Array.from(activeUserAgents));

    // Notificar a todos sobre el cambio
    broadcastConnectionCount();
    broadcastDeviceStatuses();

    req.on('close', () => {
        const disconnectedClient = clients.get(connectionId);
        if (disconnectedClient) {
            clients.delete(connectionId);
            const remainingConnectionsForUA = Array.from(clients.values()).filter(c => c.userAgent === disconnectedClient.userAgent);
            if (remainingConnectionsForUA.length === 0) {
                activeUserAgents.delete(disconnectedClient.userAgent);
            }
        }
        console.log(`Cliente desconectado (${userAgent}). Total conexiones: ${clients.size}. UAs activos: ${activeUserAgents.size}`);
        
        // Notificar a los restantes
        broadcastConnectionCount();
        broadcastDeviceStatuses();
    });
});


// --- Lógica de Dispositivos ---
const getDeviceData = (userAgent) => {
    let deviceData = devices[userAgent];
    if (!deviceData) {
        deviceData = {
            name: getDeviceType(userAgent),
            color: generateColor(),
            firstSeen: new Date().toISOString()
        };
        devices[userAgent] = deviceData;
        saveDevices(); // Guardar el nuevo dispositivo
        logInteraction(`Nuevo dispositivo detectado: ${deviceData.name} (${userAgent})`);
    }
    return deviceData;
};

const getDeviceType = (userAgent) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('linux') && !ua.includes('android')) return 'Laptop Linux';
    if (ua.includes('windows')) return 'PC Windows';
    return 'Dispositivo Desconocido';
};


// --- RUTAS DE LA API ---
app.get('/', (req, res) => {
    getDeviceData(req.headers['user-agent']); // Registrar dispositivo al visitar la página
    if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
        res.sendFile(path.join(__dirname, '..', 'admin.html'));
    } else {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
});

app.get('/file.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'file.html'));
});

app.get('/items', (req, res) => res.json(items.sort((a, b) => b.timestamp - a.timestamp)));

app.get('/devices', (req, res) => res.json(devices));

app.get('/api/files', (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error('Error al leer el directorio de subidas:', err);
            return res.status(500).send('Error al obtener la lista de archivos.');
        }
        const fileData = files.map(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            return { name: file, createdAt: stats.ctime };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Ordenar por fecha descendente
        res.json(fileData);
    });
});

app.get('/api/storage', async (req, res) => {
    try {
        const { total, free } = await disk.check('/');
        const used = total - free;
        res.json({ total, used });
    } catch (err) {
        console.error('Error al obtener el uso del disco:', err);
        res.status(500).send({ message: 'Error al obtener información de almacenamiento.' });
    }
});

app.delete('/device/:userAgent', (req, res) => {
    const { userAgent } = req.params;
    if (devices[userAgent]) {
        const deviceName = devices[userAgent].name;
        delete devices[userAgent];
        saveDevices();
        logInteraction(`Dispositivo eliminado: "${deviceName}" (${userAgent})`);
        res.status(200).send({ message: 'Dispositivo eliminado' });
        broadcastUpdate();
    } else {
        res.status(404).send({ message: 'Dispositivo no encontrado' });
    }
});

app.post('/device/rename', (req, res) => {
    const { userAgent, newName } = req.body;
    if (devices[userAgent] && newName) {
        const oldName = devices[userAgent].name;
        devices[userAgent].name = newName;
        saveDevices();

        // Actualizar el nombre en los items de la sesión actual
        items.forEach(item => {
            if (item.userAgent === userAgent) {
                item.deviceName = newName;
            }
        });

        logInteraction(`Dispositivo renombrado: de "${oldName}" a "${newName}" (${userAgent})`);
        res.status(200).send({ message: 'Dispositivo renombrado' });
        broadcastUpdate(); // Notificar a todos para que refresquen y vean el nuevo nombre
    } else {
        res.status(400).send({ message: 'Faltan datos para renombrar' });
    }
});

app.post('/item', upload.single('file'), (req, res) => {
    const userAgent = req.headers['user-agent'];
    const deviceData = getDeviceData(userAgent);
    const timestamp = Date.now();
    let newItem;

    if (req.file) {
        newItem = {
            id: timestamp, type: 'file', deviceName: deviceData.name, color: deviceData.color, timestamp, userAgent,
            content: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype
        };
        logInteraction(`Archivo subido: "${req.file.originalname}" por ${deviceData.name}`);
    }
    if (req.body && req.body.text) {
        newItem = { id: timestamp, type: 'text', deviceName: deviceData.name, color: deviceData.color, timestamp, userAgent, content: req.body.text };
        logInteraction(`Texto subido: "${req.body.text}" por ${deviceData.name}`);
    }

    if (newItem) {
        items.push(newItem);
        res.status(201).send({ message: 'Item añadido' });
        broadcastUpdate();
    } else {
        res.status(400).send({ message: 'No se envió contenido válido' });
    }
});

app.delete('/item/:id', (req, res) => {
    const itemId = parseInt(req.params.id, 10);
    const itemIndex = items.findIndex(item => item.id === itemId);

    if (itemIndex > -1) {
        const item = items[itemIndex];
        items.splice(itemIndex, 1);
        logInteraction(`Elemento borrado: ID ${itemId} ("${item.content || item.originalName}")`);
        res.status(200).send({ message: 'Elemento borrado' });
        broadcastUpdate();
    } else {
        res.status(404).send({ message: 'Elemento no encontrado' });
    }
});

app.delete('/items', (req, res) => {
    // Borrar todos los archivos físicos en uploads
    items.forEach(item => {
        if (item.type === 'file') {
            const filePath = path.join(uploadsDir, item.content);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    });

    items = [];
    saveItems(); // Limpiar el archivo JSON
    logInteraction('Todos los elementos han sido borrados');
    res.status(200).send({ message: 'Todos los elementos borrados' });
    broadcastUpdate();
});


// --- Inicio del Servidor ---
app.listen(PORT, '0.0.0.0', () => {
    const networkInterfaces = os.networkInterfaces();
    let localIp = '';
    for (const name of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                localIp = net.address;
                break;
            }
        }
        if (localIp) break;
    }
    console.log('-------------------------------------------');
    console.log('🚀 LocalDrop iniciado');
    console.log(`     URL MODO USUARIO http://${localIp}:${PORT}`);
    console.log(`     URL MODO ADMIN   http://localhost:${PORT}`);
    console.log(`     Log de sesión:    ${path.join(dataDir, logFileName)}`);
    console.log('-------------------------------------------');
});