import React, { useState, useEffect } from 'react';
import ChatHeader from './components/ChatHeader';
import ChatSidebar from './components/ChatSidebar';
import ChatFeed from './components/ChatFeed';
import ChatInput from './components/ChatInput';
import './Chat.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Chat({ user, onLogout, isEmbedded = false }) {
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
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'item_added' || data.type === 'item_deleted') {
          fetchItems();
          fetchDiskInfo();
        }
      } catch (err) {
        console.error('Error al procesar SSE:', err);
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
    if (e && e.preventDefault) e.preventDefault();
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
    <div className="chat-layout" style={{ minHeight: isEmbedded ? 'auto' : '100vh', flex: 1 }}>
      {!isEmbedded && (
        <ChatHeader 
          user={user} 
          onLogout={onLogout} 
          storageInfo={storageInfo}
          formatSize={formatSize}
          usedPercentage={usedPercentage}
        />
      )}

      <div className="chat-main" style={{ height: isEmbedded ? '100%' : 'auto' }}>
        {!isEmbedded && (
          <ChatSidebar 
            storageInfo={storageInfo} 
            formatSize={formatSize} 
            usedPercentage={usedPercentage} 
          />
        )}

        <div className="chat-content-area" style={{ height: isEmbedded ? 'calc(100vh - 70px)' : 'calc(100vh - 140px)' }}>
          <ChatFeed 
            items={items} 
            API_BASE={API_BASE} 
            formatSize={formatSize} 
            currentUser={user} 
          />

          <ChatInput 
            inputText={inputText} 
            setInputText={setInputText} 
            selectedFile={selectedFile} 
            setSelectedFile={setSelectedFile} 
            handleSend={handleSend} 
          />
        </div>
      </div>
    </div>
  );
}
