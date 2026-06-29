const clients = new Map();
const activeUserAgents = new Set();

export const broadcast = (event, data) => {
    clients.forEach(c => c.res.sse(event, data));
};

export const registerClient = (connectionId, res, deviceId) => {
    clients.set(connectionId, { res, deviceId });
    activeUserAgents.add(deviceId);

    broadcast('connections_update', clients.size);
    broadcast('device_statuses_update', Array.from(activeUserAgents));
};

export const unregisterClient = (connectionId, deviceId) => {
    clients.delete(connectionId);
    
    const stillConnected = Array.from(clients.values()).some(c => c.deviceId === deviceId);
    if (!stillConnected) {
        activeUserAgents.delete(deviceId);
    }

    broadcast('connections_update', clients.size);
    broadcast('device_statuses_update', Array.from(activeUserAgents));
};

export const getClientsCount = () => clients.size;
export const getActiveUserAgentsList = () => Array.from(activeUserAgents);
