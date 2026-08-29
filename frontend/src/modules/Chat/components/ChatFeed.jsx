import React, { useState } from 'react';
import { Download, FileText, Copy, Check } from 'lucide-react';

export default function ChatFeed({ items, API_BASE, formatSize, currentUser }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="chat-feed">
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '3rem', fontSize: '0.9rem' }}>
          No hay elementos subidos aún. Sé el primero en compartir un mensaje o archivo.
        </div>
      ) : (
        items.map((item) => {
          const isMe = currentUser && item.userName === currentUser.username;
          return (
            <div key={item.id} className={`chat-item ${isMe ? 'is-me' : ''}`}>
              <div className="chat-item-meta">
                <span className="chat-item-user">{item.userName || 'Anónimo'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span>{new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {item.text && (
                    <button 
                      className="btn-copy" 
                      onClick={() => handleCopy(item.text, item.id)}
                      title="Copiar texto"
                    >
                      {copiedId === item.id ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>

              {item.text && <p className="chat-item-text">{item.text}</p>}

              {item.file && (
                <div className="chat-file-card">
                  <div className="file-info">
                    <FileText size={20} style={{ color: '#818cf8', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span className="file-name">{item.file.originalname}</span>
                      <span className="file-size">{formatSize(item.file.size)}</span>
                    </div>
                  </div>
                  <a 
                    href={`${API_BASE}/uploads/${item.file.filename}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-download"
                    download
                  >
                    <Download size={14} />
                    <span>Descargar</span>
                  </a>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
