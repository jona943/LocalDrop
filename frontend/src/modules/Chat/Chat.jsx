import React, { useState } from 'react';
import './Chat.css';

export default function Chat({ user, onLogout }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Sistema', text: 'Bienvenido a LocalDrop Chat & Transfer.', time: '10:00 AM' }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText && !selectedFile) return;

    const newMessage = {
      id: Date.now(),
      sender: user ? user.username : 'Anónimo',
      text: inputText,
      file: selectedFile ? selectedFile.name : null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInputText('');
    setSelectedFile(null);
  };

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
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.2rem' }}>1.2 GB / 64 GB</div>
            <div className="storage-bar-bg">
              <div className="storage-bar-fill"></div>
            </div>
          </div>
          <div>
            <h4>Dispositivos Activos</h4>
            <ul style={{ list-style: 'none', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <li>🟢 Servidor X96Q (Armbian)</li>
              <li>🔵 Este Dispositivo</li>
            </ul>
          </div>
        </aside>

        <div className="chat-feed-container">
          <div className="chat-feed">
            {messages.map((msg) => (
              <div key={msg.id} className="chat-item">
                <div className="chat-item-header">
                  <strong>{msg.sender}</strong>
                  <span>{msg.time}</span>
                </div>
                {msg.text && <p>{msg.text}</p>}
                {msg.file && <div style={{ marginTop: '0.5rem', color: 'var(--primary)' }}>📎 {msg.file}</div>}
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
              📎 {selectedFile ? '1 Archivo' : 'Adjuntar'}
            </label>
            <button type="submit" className="btn-primary">Enviar</button>
          </form>
        </div>
      </div>
    </div>
  );
}
