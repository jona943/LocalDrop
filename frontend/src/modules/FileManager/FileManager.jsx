import React, { useState, useEffect, useRef } from 'react';
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
  AlertTriangle,
  Download,
  Upload,
  FolderPlus,
  Eye,
  FileText
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

  const [selectedItemMenu, setSelectedItemMenu] = useState(null);
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Estados para vistas previas y operaciones de archivo
  const [previewItem, setPreviewItem] = useState(null);
  const [previewTextContent, setPreviewTextContent] = useState(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderError, setFolderError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

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

  const handleOpenFile = async (item) => {
    setPreviewTextContent(null);
    setPreviewItem(item);

    const ext = item.name.split('.').pop().toLowerCase();
    const isText = ['txt', 'json', 'js', 'html', 'css', 'py', 'md', 'log', 'sh', 'xml', 'yaml', 'yml'].includes(ext);

    if (isText) {
      try {
        const res = await fetch(`${API_BASE}/file-raw?path=${encodeURIComponent(item.path)}`);
        const text = await res.text();
        setPreviewTextContent(text);
      } catch (err) {
        setPreviewTextContent('Error al leer el archivo de texto.');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentPath) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetPath', currentPath);

    try {
      const res = await fetch(`${API_BASE}/upload-to-path`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        explorePath(currentPath);
      } else {
        alert('Error al subir el archivo.');
      }
    } catch (err) {
      console.error('Error subiendo archivo:', err);
      alert('Error de red al subir el archivo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setFolderError('');
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/create-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath: currentPath, folderName: newFolderName.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setShowNewFolderModal(false);
        setNewFolderName('');
        explorePath(currentPath);
      } else {
        setFolderError(data.error || 'No se pudo crear la carpeta.');
      }
    } catch (err) {
      setFolderError('Error al crear la carpeta.');
    }
  };

  const handleMoveToTrash = async (filePath) => {
    setSelectedItemMenu(null);
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

  const renderFilePreviewContent = () => {
    if (!previewItem) return null;
    const ext = previewItem.name.split('.').pop().toLowerCase();
    const rawUrl = `${API_BASE}/file-raw?path=${encodeURIComponent(previewItem.path)}`;

    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      return (
        <div style={{ textAlign: 'center', overflow: 'auto', maxHeight: '70vh' }}>
          <img src={rawUrl} alt={previewItem.name} style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px', objectFit: 'contain' }} />
        </div>
      );
    }

    if (['mp4', 'webm', 'mkv', 'mov'].includes(ext)) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <video src={rawUrl} controls autoPlay style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px' }} />
        </div>
      );
    }

    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
      return (
        <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
          <audio src={rawUrl} controls autoPlay style={{ width: '100%', maxWidth: '400px' }} />
        </div>
      );
    }

    if (ext === 'pdf') {
      return (
        <iframe src={rawUrl} title={previewItem.name} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '8px' }} />
      );
    }

    if (previewTextContent !== null) {
      return (
        <pre style={{ background: '#111827', color: '#e5e7eb', padding: '1rem', borderRadius: '8px', overflow: 'auto', maxHeight: '65vh', fontSize: '0.85rem', fontFamily: 'monospace' }}>
          {previewTextContent}
        </pre>
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
        <FileText size={48} style={{ marginBottom: '1rem', color: '#818cf8' }} />
        <p style={{ marginBottom: '1rem' }}>No hay vista previa directa disponible para este tipo de archivo.</p>
        <a 
          href={`${rawUrl}&download=true`}
          download
          className="btn-logout"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
        >
          <Download size={16} />
          <span>Descargar {previewItem.name}</span>
        </a>
      </div>
    );
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

        <main className="fm-content" style={{ padding: activeTab === 'chat' ? '0' : '1rem 1.5rem' }}>
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
                  {activeTab === 'files' && (
                    <>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileUpload} 
                      />
                      <button 
                        className="btn-copy"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        title="Subir Archivo a esta carpeta"
                        style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                      >
                        <Upload size={16} />
                        <span className="desktop-only">{isUploading ? 'Subiendo...' : 'Subir Archivo'}</span>
                      </button>

                      <button 
                        className="btn-copy"
                        onClick={() => setShowNewFolderModal(true)}
                        title="Crear Nueva Carpeta"
                        style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                      >
                        <FolderPlus size={16} />
                        <span className="desktop-only">Nueva Carpeta</span>
                      </button>
                    </>
                  )}

                  <div className="view-mode-btns">
                    <button 
                      className={`btn-view ${viewMode === 'grid' ? 'active' : ''}`} 
                      onClick={() => setViewMode('grid')}
                      title="Vista en Cuadrícula (Grid)"
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button 
                      className={`btn-view ${viewMode === 'list' ? 'active' : ''}`} 
                      onClick={() => setViewMode('list')}
                      title="Vista en Lista"
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Contenedor dinámico según el modo Grid o Lista */}
              <div className={viewMode === 'grid' ? 'files-grid' : 'files-list'}>
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
                      onOpenFile={handleOpenFile}
                      onSelectContextMenu={(item) => setSelectedItemMenu(item)}
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

      {/* Modal de Vista Previa en la misma página */}
      {previewItem && (
        <div className="pwd-modal-overlay" onClick={() => setPreviewItem(null)}>
          <div className="pwd-modal-content" style={{ maxWidth: '800px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={18} style={{ color: '#818cf8' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f3f4f6' }}>{previewItem.name}</span>
              </div>
              <X size={18} style={{ cursor: 'pointer', color: '#9ca3af' }} onClick={() => setPreviewItem(null)} />
            </div>

            {renderFilePreviewContent()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.6rem' }}>
              <a 
                href={`${API_BASE}/file-raw?path=${encodeURIComponent(previewItem.path)}&download=true`} 
                download 
                className="btn-copy"
                style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', textDecoration: 'none' }}
              >
                <Download size={15} />
                <span>Descargar</span>
              </a>
              <button className="btn-logout" onClick={() => setPreviewItem(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Nueva Carpeta */}
      {showNewFolderModal && (
        <div className="pwd-modal-overlay">
          <div className="pwd-modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontWeight: 700 }}>
                <FolderPlus size={18} />
                <span>Crear Nueva Carpeta</span>
              </div>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowNewFolderModal(false)} />
            </div>

            {folderError && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{folderError}</div>}

            <form onSubmit={handleCreateFolder} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input 
                type="text" 
                className="input-control" 
                placeholder="Nombre de la carpeta" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                required
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-logout" onClick={() => setShowNewFolderModal(false)}>Cancelar</button>
                <button type="submit" className="btn-copy" style={{ background: '#10b981', color: '#fff' }}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Menú de Contexto (Opciones de archivo) */}
      {selectedItemMenu && (
        <div className="pwd-modal-overlay" onClick={() => setSelectedItemMenu(null)}>
          <div className="pwd-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f3f4f6' }}>{selectedItemMenu.name}</span>
              <X size={18} style={{ cursor: 'pointer', color: '#9ca3af' }} onClick={() => setSelectedItemMenu(null)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {!selectedItemMenu.isDirectory && (
                <>
                  <button 
                    className="fm-nav-item"
                    style={{ background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8' }}
                    onClick={() => {
                      const item = selectedItemMenu;
                      setSelectedItemMenu(null);
                      handleOpenFile(item);
                    }}
                  >
                    <Eye size={16} />
                    <span>Ver / Previsualizar</span>
                  </button>

                  <a 
                    href={`${API_BASE}/file-raw?path=${encodeURIComponent(selectedItemMenu.path)}&download=true`} 
                    download 
                    className="fm-nav-item"
                    style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#f3f4f6', textDecoration: 'none' }}
                  >
                    <Download size={16} style={{ color: '#34d399' }} />
                    <span>Descargar Archivo</span>
                  </a>
                </>
              )}

              {activeTab === 'files' ? (
                <button 
                  className="fm-nav-item"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5' }}
                  onClick={() => handleMoveToTrash(selectedItemMenu.path)}
                >
                  <Trash2 size={16} />
                  <span>Mover a Papelera</span>
                </button>
              ) : (
                <button 
                  className="fm-nav-item"
                  style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }}
                  onClick={() => {
                    setDeleteModalItem(selectedItemMenu);
                    setSelectedItemMenu(null);
                  }}
                >
                  <Lock size={16} />
                  <span>Borrado Definitivo (Requiere Clave)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
