import React, { useRef } from 'react';
import { 
  Folder, 
  FileText, 
  Image, 
  Film, 
  Music, 
  Archive, 
  File 
} from 'lucide-react';

export default function FileCard({ item, onOpenFolder, onSelectContextMenu }) {
  const timerRef = useRef(null);

  const getFileIcon = () => {
    if (item.isDirectory) return <Folder size={34} style={{ color: '#818cf8' }} />;
    const ext = item.name.split('.').pop().toLowerCase();
    
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return <Image size={32} style={{ color: '#34d399' }} />;
    if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) return <Film size={32} style={{ color: '#f43f5e' }} />;
    if (['mp3', 'wav', 'flac'].includes(ext)) return <Music size={32} style={{ color: '#a855f7' }} />;
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return <Archive size={32} style={{ color: '#eab308' }} />;
    if (['txt', 'pdf', 'doc', 'docx', 'md'].includes(ext)) return <FileText size={32} style={{ color: '#38bdf8' }} />;
    
    return <File size={32} style={{ color: '#9ca3af' }} />;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Manejadores de toque largo (móvil) y clic secundario / pulsación prolongada (desktop)
  const handleTouchStart = (e) => {
    timerRef.current = setTimeout(() => {
      onSelectContextMenu(item, e);
    }, 600); // 600ms para toque largo
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    onSelectContextMenu(item, e);
  };

  const handleClick = (e) => {
    if (item.isDirectory) {
      onOpenFolder(item.path);
    } else {
      // En escritorio abrir menú con clic izquierdo directo si se desea
      onSelectContextMenu(item, e);
    }
  };

  return (
    <div 
      className={`file-card-grid ${item.isDirectory ? 'is-folder' : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      <div className="file-icon-box">{getFileIcon()}</div>
      <span className="file-card-name" title={item.name}>{item.name}</span>
      {!item.isDirectory && <span className="file-card-size">{formatBytes(item.size)}</span>}
    </div>
  );
}
