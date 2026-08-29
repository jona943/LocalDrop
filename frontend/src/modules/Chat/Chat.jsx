import React, { useState, useEffect } from 'react';
import './Chat.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Chat({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [storageInfo, setStorageInfo] = useState({ free: 0, total: 0, used: 0 });

  useEffect(() => {
    fetchItems();
    fetchDiskInfo();

    // SSE para actualización en tiempo real
    const eventSource = new EventSource(`${API_BASE}/events`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'item_added' || data.type === 'item_deleted') {
        fetchItems();
        fetchDiskInfo();
      }
    };

    return () => eventSource.close();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/items`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error('Error al obtener ítems:', err);
    }
  };

  const fetchDiskInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/disk-info`);
      const data = await res.json();
      setStorageInfo(data);
    } catch (err) {
      console.error('Error al obtener info de disco:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText && !selectedFile) return;

    const formData = new FormData();
    if (inputText) formData.append('text', inputText);
    if (selectedFile) formData.append('file', selectedFile);
    formData.append('username', user ? user.username : 'Anónimo');

    try {
      await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      setInputText('');
      setSelectedFile(null);
      fetchItems();
      fetchDiskInfo();
    } catch (err) {
      console.error('Error al enviar:', err);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const usedPercentage = storageInfo.total 
    ? Math.min(100, Math.round((storageInfo.used / storageInfo.total) * 100)) 
    : 0;

  return (
    <div className="chat-layout">
      <header className="chat-header">
        <div className="chat-brand">LocalDrop<span>.home</span></div>
        <div>
          <span>Hola, <strong>{user ? user.username : 'Invitado'}</strong></span>
          <button onClick={onLogout} className="btn-secondary" style={{ marginLeft: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            Salir
          </button>
        </div>
      </header>

      <div className="chat-main">
        <aside className="chat-sidebar">
          <h3>Menú</h3>
          <div className="storage-widget">
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Almacenamiento Ocupado</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.2rem' }}>
              {formatSize(storageInfo.used)} / {formatSize(storageInfo.total)}
            </div>
            <div className="storage-bar-bg">
              <div className="storage-bar-fill" style={{ width: `${usedPercentage}%` }}></div>
            </div>
          </div>
          <div>
            <h4>Dispositivos Activos</h4>
            <ul style={{ listStyle: 'none', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <li>🟢 Servidor LocalDrop</li>
              <li>🔵 Dispositivo Conectado</li>
            </ul>
          </div>
        </aside>

        <div className="chat-feed-container">
          <div className="chat-feed">
            {items.map((item) => (
              <div key={item.id} className="chat-item">
                <div className="chat-item-header">
                  <strong>{item.userName || 'Anónimo'}</strong>
                  <span>{new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {item.text && <p>{item.text}</p>}
                {item.file && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a 
                      href={`${API_BASE}/uploads/${item.file.filename}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
                    >
                      📎 {item.file.originalname} ({formatSize(item.file.size)})
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="chat-input-box">
            <textarea 
              placeholder="Escribe un mensaje o nota..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <input 
              type="file" 
              id="file-upload" 
              style={{ display: 'none' }}
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <label htmlFor="file-upload" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              📎 {selectedFile ? selectedFile.name.substring(0, 12) + '...' : 'Adjuntar'}
            </label>
            <button type="submit" className="btn-primary">Enviar</button>
          </form>
        </div>
      </div>
    </div>
  );
}
