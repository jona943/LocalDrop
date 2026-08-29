import React from 'react';
import { HardDrive, Radio, Monitor, Smartphone } from 'lucide-react';

export default function ChatSidebar({ storageInfo, formatSize, usedPercentage }) {
  return (
    <aside className="chat-sidebar desktop-only">
      {/* Widget Almacenamiento */}
      <div className="sidebar-card">
        <div className="sidebar-title">
          <HardDrive size={15} />
          <span>Almacenamiento</span>
        </div>
        <div className="storage-value">
          {formatSize(storageInfo.used)} / {formatSize(storageInfo.total)}
        </div>
        <div className="storage-bar-bg">
          <div className="storage-bar-fill" style={{ width: `${usedPercentage}%` }}></div>
        </div>
      </div>

      {/* Dispositivos en Red */}
      <div className="sidebar-card">
        <div className="sidebar-title">
          <Radio size={15} />
          <span>Dispositivos Activos</span>
        </div>
        <ul className="device-list">
          <li className="device-item">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            <Monitor size={15} style={{ color: '#9ca3af' }} />
            <span>Servidor X96Q</span>
          </li>
          <li className="device-item">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }}></span>
            <Smartphone size={15} style={{ color: '#9ca3af' }} />
            <span>Este Dispositivo</span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
