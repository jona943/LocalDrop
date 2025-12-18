const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 3000;

// --- Almacenamiento en Memoria Volátil ---
// Guardamos los items en un array en RAM para evitar escrituras en SSD.
let items = [];

// --- Creación del Directorio de Subidas ---
// __dirname en este caso será /home/dev/Desktop/Desarrollos/LocalDrop/js
// Queremos que uploads esté en la raíz del proyecto, no dentro de js/
const uploadsDir = path.join(__dirname, '..', 'uploads'); // Subir un nivel para la carpeta uploads
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Configuración de Multer para Gestión de Archivos ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Usamos un timestamp para evitar colisiones de nombres.
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Límite de 50MB
});

// --- Middleware para servir archivos estáticos ---
app.use('/uploads', express.static(uploadsDir));
app.use('/css', express.static(path.join(__dirname, '..', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Función de Identificación de Dispositivos ---
const getDeviceType = (userAgent) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('linux') && !ua.includes('android')) return 'Laptop Linux';
    if (ua.includes('windows')) return 'PC Windows';
    return 'Dispositivo Desconocido';
};

// --- RUTAS DE LA API ---

// 1. Servir la aplicación principal (Frontend)
app.get('/', (req, res) => {
    // Si la petición viene de la misma máquina, servir el panel de admin.
    if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
        res.sendFile(path.join(__dirname, '..', 'admin.html'));
    } else {
        // Para el resto, servir la página de usuario normal.
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
});

// 2. Obtener todos los items (textos y archivos)
app.get('/items', (req, res) => {
    // Devolvemos los items ordenados del más nuevo al más viejo.
    res.json(items.sort((a, b) => b.timestamp - a.timestamp));
});

// 3. Subir un nuevo item (texto o archivo)
app.post('/item', upload.single('file'), (req, res) => {
    const device = getDeviceType(req.headers['user-agent']);
    const timestamp = Date.now();

    // Si se sube un archivo
    if (req.file) {
        const fileType = req.file.mimetype.split('/')[0]; // 'image', 'application', etc.
        items.push({
            id: timestamp,
            type: 'file',
            device: device,
            timestamp: timestamp,
            content: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype
        });
    }

    // Si se envía texto
    if (req.body && req.body.text) {
        items.push({
            id: timestamp,
            type: 'text',
            device: device,
            timestamp: timestamp,
            content: req.body.text
        });
    }

    res.status(201).send({ message: 'Item añadido correctamente' });
});

// 4. Borrar un item específico (sólo para admin)
app.delete('/item/:id', (req, res) => {
    const itemId = parseInt(req.params.id, 10);
    const itemIndex = items.findIndex(item => item.id === itemId);

    if (itemIndex > -1) {
        items.splice(itemIndex, 1);
        res.status(200).send({ message: 'Elemento borrado correctamente' });
    } else {
        res.status(404).send({ message: 'Elemento no encontrado' });
    }
});

// 5. Borrar todos los items (sólo para admin)
app.delete('/items', (req, res) => {
    items = []; // Vaciar el array
    res.status(200).send({ message: 'Todos los elementos han sido borrados' });
});


// --- Inicio del Servidor ---
app.listen(PORT, '0.0.0.0', () => {
    const networkInterfaces = os.networkInterfaces();
    let localIp = '';
    // Buscamos la IP local en la red Wi-Fi o Ethernet
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
    console.log('-------------------------------------------');
});