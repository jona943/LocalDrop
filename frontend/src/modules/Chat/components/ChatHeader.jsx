import React, { useState } from 'react';
import { LogOut, User, HardDrive, Menu, X, Radio, Monitor, Smartphone } from 'lucide-react';

export default function ChatHeader({ user, onLogout, storageInfo, formatSize, usedPercentage }) {
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      <header className="chat-header">
        <div className="chat-brand">
          <img 
            src="/localDrop-icon.png" 
            alt="LocalDrop Icon" 
            style={{ width: '26px', height: '26px', objectFit: 'contain' }} 
          />
          <span>LocalDrop<span style={{ color: '#6366f1' }}>.home</span></span>
        </div>

        <div className="chat-user-section">
          {/* Botón rápido de estado de almacenamiento en Header Móvil */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setShowDrawer(!showDrawer)}
            aria-label="Abrir panel de información"
          >
            <HardDrive size={16} />
            <span className="mobile-storage-text">{usedPercentage}%</span>
          </button>

          <div className="user-badge desktop-only">
            <User size={14} style={{ color: '#818cf8' }} />
            <span>{user ? user.username : 'Invitado'}</span>
          </div>

          <button onClick={onLogout} className="btn-logout" title="Cerrar Sesión">
            <LogOut size={15} />
            <span className="desktop-only">Salir</span>
          </button>
        </div>
      </header>

      {/* Drawer / Drawer Flotante deslizable desde arriba para móviles */}
      {showDrawer && (
        <div className="mobile-drawer-overlay" onClick={() => setShowDrawer(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">Estado del Servidor</span>
              <button className="btn-copy" onClick={() => setShowDrawer(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Widget Almacenamiento en Drawer */}
            <div className="sidebar-card" style={{ marginBottom: '1rem' }}>
              <div className="sidebar-title">
                <HardDrive size={15} />
                <span>Almacenamiento en Disco</span>
              </div>
              <div className="storage-value">
                {formatSize(storageInfo.used)} / {formatSize(storageInfo.total)}
              </div>
              <div className="storage-bar-bg">
                <div className="storage-bar-fill" style={{ width: `${usedPercentage}%` }}></div>
              </div>
            </div>

            {/* Dispositivos en Red en Drawer */}
            <div className="sidebar-card">
              <div className="sidebar-title">
                <Radio size={15} />
                <span>Dispositivos Activos</span>
              </div>
              <ul className="device-list" style={{ flexDirection: 'column', gap: '0.6rem' }}>
                <li className="device-item">
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  <Monitor size={15} style={{ color: '#9ca3af' }} />
                  <span>Servidor X96Q (Armbian)</span>
                </li>
                <li className="device-item">
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }}></span>
                  <Smartphone size={15} style={{ color: '#9ca3af' }} />
                  <span>Este Dispositivo</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
