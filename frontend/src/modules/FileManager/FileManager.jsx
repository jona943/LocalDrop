import React, { useState, useEffect } from 'react';
import DiskSelector from './components/DiskSelector';
import FileCard from './components/FileCard';
import Chat from '../Chat/Chat';
import { 
  Folder, 
  Trash2, 
  Settings, 
  MessageSquare, 
  LayoutGrid, 
  List, 
  ArrowLeft, 
  Lock, 
  LogOut,
  X,
  AlertTriangle
} from 'lucide-react';
import './FileManager.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function FileManager({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('files');
  const [disks, setDisks] = useState([]);
  const [selectedDisk, setSelectedDisk] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState(null);
  const [items, setItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchDisks();
  }, []);

  const fetchDisks = async () => {
    try {
      const res = await fetch(`${API_BASE}/disks`);
      const data = await res.json();
      setDisks(data);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedDisk(data[0]);
        explorePath(data[0].mountPoint);
      }
    } catch (err) {
      console.error('Error al cargar unidades:', err);
    }
  };

  const explorePath = async (targetPath) => {
    try {
      const res = await fetch(`${API_BASE}/explore?path=${encodeURIComponent(targetPath)}`);
      const data = await res.json();
      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      setItems(data.items || []);
    } catch (err) {
      console.error('Error al explorar directorio:', err);
    }
  };

  const handleSelectDisk = (disk) => {
    setSelectedDisk(disk);
    explorePath(disk.mountPoint);
  };

  const handleMoveToTrash = async (filePath) => {
    try {
      await fetch(`${API_BASE}/trash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });
      explorePath(currentPath);
    } catch (err) {
      console.error('Error al mover a papelera:', err);
    }
  };

  const handleConfirmPermanentDelete = async (e) => {
    e.preventDefault();
    setDeleteError('');
    try {
      const res = await fetch(`${API_BASE}/delete-permanent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: deleteModalItem.path, password: confirmPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteModalItem(null);
        setConfirmPassword('');
        explorePath(currentPath);
      } else {
        setDeleteError(data.error || 'Error al eliminar.');
      }
    } catch (err) {
      setDeleteError('Error al procesar el borrado.');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="filemanager-layout">
      <header className="fm-header">
        <div className="fm-brand">
          <img src="/localDrop-icon.png" alt="LocalDrop" style={{ width: '26px', height: '26px' }} />
          <span>LocalDrop Drive</span>
        </div>

        <div className="fm-header-actions">
          <button 
            className={`btn-copy ${activeTab === 'settings' ? 'active' : ''}`} 
            onClick={() => setActiveTab('settings')} 
            title="Ajustes del Servidor"
          >
            <Settings size={16} />
            <span className="desktop-only">Ajustes</span>
          </button>
          <button className="btn-logout" onClick={onLogout}>
            <LogOut size={15} />
            <span className="desktop-only">Salir</span>
          </button>
        </div>
      </header>

      <div className="fm-main">
        <aside className="fm-sidebar">
          <nav className="fm-nav-section">
            <button 
              className={`fm-nav-item ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveTab('files')}
            >
              <Folder size={18} />
              <span>Archivos</span>
            </button>
            <button 
              className={`fm-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={18} />
              <span>Notas & Chat</span>
            </button>
            <button 
              className={`fm-nav-item ${activeTab === 'trash' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('trash');
                if (selectedDisk) explorePath(`${selectedDisk.mountPoint}/.trash`);
              }}
            >
              <Trash2 size={18} />
              <span>Papelera</span>
            </button>
            <button 
              className={`fm-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} />
              <span>Ajustes</span>
            </button>
          </nav>

          {activeTab !== 'chat' && activeTab !== 'settings' && (
            <DiskSelector 
              disks={disks} 
              selectedDisk={selectedDisk} 
              onSelectDisk={handleSelectDisk}
              formatSize={formatSize}
            />
          )}
        </aside>

        <main className="fm-content" style={{ padding: activeTab === 'chat' ? '0' : '1rem' }}>
          {activeTab === 'files' || activeTab === 'trash' ? (
            <>
              <div className="fm-toolbar">
                <div className="breadcrumbs">
                  {parentPath && (
                    <button className="btn-copy" onClick={() => explorePath(parentPath)} title="Subir nivel">
                      <ArrowLeft size={16} />
                    </button>
                  )}
                  <span className="crumb-item">{currentPath}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div className="view-mode-btns">
                    <button className={`btn-view ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                      <LayoutGrid size={16} />
                    </button>
                    <button className={`btn-view ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="files-grid">
                {items.length === 0 ? (
                  <div style={{ color: '#6b7280', fontSize: '0.875rem', gridColumn: '1/-1', textAlign: 'center', marginTop: '2rem' }}>
                    {activeTab === 'trash' ? 'La papelera está vacía.' : 'Esta carpeta está vacía.'}
                  </div>
                ) : (
                  items.map((item) => (
                    <FileCard 
                      key={item.path} 
                      item={item} 
                      viewMode={viewMode}
                      onOpenFolder={(path) => explorePath(path)}
                      onMoveToTrash={activeTab === 'files' ? handleMoveToTrash : null}
                    />
                  ))
                )}
              </div>
            </>
          ) : activeTab === 'chat' ? (
            <Chat user={user} onLogout={onLogout} isEmbedded={true} />
          ) : (
            <div style={{ padding: '1.5rem', maxWidth: '600px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ajustes del Servidor</h2>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Configuración del entorno LocalDrop en el servidor local.
              </p>

              <div className="sidebar-card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Información de Sesión</h3>
                <div style={{ fontSize: '0.85rem', color: '#d1d5db' }}>Usuario: <strong>{user ? user.username : 'admin'}</strong></div>
                <div style={{ fontSize: '0.85rem', color: '#d1d5db', marginTop: '0.25rem' }}>Inactividad: <strong>Cierre automático en 5 minutos</strong></div>
              </div>

              <div className="sidebar-card">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Retención de Papelera</h3>
                <div style={{ fontSize: '0.85rem', color: '#d1d5db' }}>Purga automática: <strong>Activa (30 días)</strong></div>
              </div>
            </div>
          )}
        </main>
      </div>

      {deleteModalItem && (
        <div className="pwd-modal-overlay">
          <div className="pwd-modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fca5a5', fontWeight: 700 }}>
                <AlertTriangle size={18} />
                <span>Borrado Definitivo</span>
              </div>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setDeleteModalItem(null)} />
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              ¿Seguro que deseas eliminar permanentemente <strong>{deleteModalItem.name}</strong>? Esta acción no se puede deshacer.
            </p>

            {deleteError && (
              <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>{deleteError}</div>
            )}

            <form onSubmit={handleConfirmPermanentDelete} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input 
                type="password"
                className="input-control"
                placeholder="Contraseña de administrador"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="submit" className="btn-logout" style={{ width: '100%', justifyContent: 'center' }}>
                <Lock size={15} />
                <span>Confirmar Borrado Definitivo</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
