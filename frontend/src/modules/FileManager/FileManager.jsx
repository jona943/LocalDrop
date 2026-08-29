import React, { useState, useEffect } from 'react';
import DiskSelector from './components/DiskSelector';
import FileCard from './components/FileCard';
import { 
  Folder, 
  Trash2, 
  Settings, 
  MessageSquare, 
  Upload, 
  LayoutGrid, 
  List, 
  ArrowLeft, 
  Lock, 
  LogOut,
  X,
  AlertTriangle
} from 'lucide-react';
import './FileManager.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function FileManager({ user, onLogout, onNavigateToChat }) {
  const [activeTab, setActiveTab] = useState('files'); // 'files', 'trash'
  const [disks, setDisks] = useState([]);
  const [selectedDisk, setSelectedDisk] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState(null);
  const [items, setItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  
  // Modal de contraseña para borrado definitivo
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchDisks();
  }, []);

  const fetchDisks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/disks`);
      const data = await res.json();
      setDisks(data);
      if (data.length > 0 && !selectedDisk) {
        setSelectedDisk(data[0]);
        explorePath(data[0].mountPoint);
      }
    } catch (err) {
      console.error('Error al cargar unidades:', err);
    }
  };

  const explorePath = async (targetPath) => {
    try {
      const res = await fetch(`${API_BASE}/api/explore?path=${encodeURIComponent(targetPath)}`);
      const data = await res.json();
      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      setItems(data.items);
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
      await fetch(`${API_BASE}/api/trash`, {
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
      const res = await fetch(`${API_BASE}/api/delete-permanent`, {
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
      {/* Header tipo Google Drive */}
      <header className="fm-header">
        <div className="fm-brand">
          <img src="/localDrop-icon.png" alt="LocalDrop" style={{ width: '26px', height: '26px' }} />
          <span>LocalDrop Drive</span>
        </div>

        <div className="fm-header-actions">
          <button className="btn-copy" onClick={onNavigateToChat} title="Ir a Notas y Chat">
            <MessageSquare size={16} />
            <span>Notas & Chat</span>
          </button>
          <button className="btn-logout" onClick={onLogout}>
            <LogOut size={15} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      <div className="fm-main">
        {/* Sidebar */}
        <aside className="fm-sidebar">
          <nav className="fm-nav-section">
            <button 
              className={`fm-nav-item ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveTab('files')}
            >
              <Folder size={18} />
              <span>Mis Archivos</span>
            </button>
            <button 
              className={`fm-nav-item ${activeTab === 'trash' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('trash');
                if (selectedDisk) explorePath(`${selectedDisk.mountPoint}/.trash`);
              }}
            >
              <Trash2 size={18} />
              <span>Papelera (30 días)</span>
            </button>
          </nav>

          <DiskSelector 
            disks={disks} 
            selectedDisk={selectedDisk} 
            onSelectDisk={handleSelectDisk}
            formatSize={formatSize}
          />
        </aside>

        {/* Content Area */}
        <main className="fm-content">
          {/* Toolbar */}
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

          {/* Files Grid */}
          <div className="files-grid">
            {items.map((item) => (
              <FileCard 
                key={item.path} 
                item={item} 
                viewMode={viewMode}
                onOpenFolder={(path) => explorePath(path)}
                onMoveToTrash={activeTab === 'files' ? handleMoveToTrash : null}
              />
            ))}
          </div>
        </main>
      </div>

      {/* Modal Confirmación Borrado Definitivo con Contraseña */}
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
