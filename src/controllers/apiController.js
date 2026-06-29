import fs from 'fs';
import path from 'path';
import os from 'os';
import { checkDiskSpace } from '../utils/disk.js';
import { uploadsDir } from '../utils/paths.js';
import * as deviceService from '../services/deviceService.js';
import * as itemService from '../services/itemService.js';
import * as sseService from '../services/sseService.js';

export const login = (req, res) => {
    const { user, pass } = req.body;
    if (user === 'admin' && pass === 'admin') {
        res.json({ role: 'admin' });
    } else {
        res.status(401).json({ error: 'Credenciales incorrectas' });
    }
};

export const getItems = (req, res) => {
    const items = itemService.getItems();
    res.json([...items].sort((a, b) => b.timestamp - a.timestamp));
};

export const getDevices = (req, res) => {
    deviceService.getDeviceInfo(req);
    res.json(deviceService.getDevices());
};

export const getFiles = (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'No se pudieron leer los archivos' });

        const fileList = files.map(file => {
            const stats = fs.statSync(path.join(uploadsDir, file));
            return {
                name: file,
                createdAt: stats.birthtime
            };
        }).sort((a, b) => b.createdAt - a.createdAt);

        res.json(fileList);
    });
};

export const getStorageInfo = async (req, res) => {
    try {
        const info = await checkDiskSpace(os.platform() === 'win32' ? 'C:' : '/');
        res.json({
            total: info.total,
            used: info.total - info.available
        });
    } catch (err) {
        res.status(500).json({ error: 'No se pudo obtener info de almacenamiento' });
    }
};

export const createItem = (req, res) => {
    const dev = deviceService.getDeviceInfo(req);
    const deviceId = req.query.deviceId || req.headers['x-device-id'] || 'anon';
    const text = req.body.text;
    const file = req.file;

    const newItem = itemService.addItem(dev, deviceId, file, text);

    if (newItem) {
        res.status(201).json(newItem);
        sseService.broadcast('update_items', { time: newItem.timestamp });
    } else {
        res.status(400).send('No data');
    }
};

export const deleteItem = (req, res) => {
    const id = req.params.id;
    const success = itemService.deleteItem(id);

    if (success) {
        sseService.broadcast('update_items', { id });
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
};

export const clearItems = (req, res) => {
    itemService.clearItems();
    sseService.broadcast('update_items', { action: 'clear' });
    res.sendStatus(200);
};

export const renameDevice = (req, res) => {
    const { userAgent, newName } = req.body;
    const success = deviceService.renameDevice(userAgent, newName);

    if (success) {
        itemService.updateDeviceNameInItems(userAgent, newName);
        sseService.broadcast('update_items', { action: 'rename' });
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
};

export const deleteDevice = (req, res) => {
    const id = req.params.id;
    const success = deviceService.deleteDevice(id);

    if (success) {
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
};

export const handleEvents = (req, res) => {
    const deviceId = req.query.deviceId || 'anon';
    const connectionId = Date.now() + '-' + Math.random().toString(36).substr(2, 5);

    sseService.registerClient(connectionId, res, deviceId);

    req.on('close', () => {
        sseService.unregisterClient(connectionId, deviceId);
    });
};
