import fs from 'fs';
import path from 'path';
import { itemsFilePath, dataDir, uploadsDir } from '../utils/paths.js';

let items = [];

export const loadItems = () => {
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        if (fs.existsSync(itemsFilePath)) {
            items = JSON.parse(fs.readFileSync(itemsFilePath, 'utf8'));
        }
    } catch (e) {
        console.error('Error cargando items:', e);
    }
};

export const saveItems = () => {
    try {
        fs.writeFileSync(itemsFilePath, JSON.stringify(items, null, 2));
    } catch (e) {
        console.error('Error guardando items:', e);
    }
};

export const getItems = () => items;

export const addItem = (dev, deviceId, file, text) => {
    const timestamp = Date.now();
    let newItem = null;

    if (file) {
        newItem = {
            id: timestamp,
            type: 'file',
            deviceName: dev.name,
            color: dev.color,
            timestamp,
            userAgent: deviceId,
            content: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype
        };
    } else if (text) {
        newItem = {
            id: timestamp,
            type: 'text',
            deviceName: dev.name,
            color: dev.color,
            timestamp,
            userAgent: deviceId,
            content: text
        };
    }

    if (newItem) {
        items.push(newItem);
        saveItems();
        return newItem;
    }
    return null;
};

export const deleteItem = (id) => {
    const idx = items.findIndex(i => i.id == id);
    if (idx > -1) {
        const item = items[idx];
        if (item.type === 'file') {
            const p = path.join(uploadsDir, item.content);
            if (fs.existsSync(p)) {
                fs.unlinkSync(p);
            }
        }
        items.splice(idx, 1);
        saveItems();
        return true;
    }
    return false;
};

export const clearItems = () => {
    items.forEach(i => {
        if (i.type === 'file') {
            const p = path.join(uploadsDir, i.content);
            if (fs.existsSync(p)) {
                fs.unlinkSync(p);
            }
        }
    });
    items = [];
    saveItems();
};

export const updateDeviceNameInItems = (userAgent, newName) => {
    let changed = false;
    items.forEach(i => {
        if (i.userAgent === userAgent) {
            i.deviceName = newName;
            changed = true;
        }
    });
    if (changed) {
        saveItems();
    }
    return changed;
};
