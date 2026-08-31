import React, { useRef, useState } from 'react';
import { 
  Folder, 
  FileText, 
  Image, 
  Film, 
  Music, 
  Archive, 
  File 
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function FileCard({ item, viewMode, onOpenFolder, onOpenFile, onSelectContextMenu }) {
  const timerRef = useRef(null);
  const [imgError, setImgError] = useState(false);

  const ext = item.name.split('.').pop().toLowerCase();
  const isImage = !item.isDirectory && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext);
  const rawUrl = `${API_BASE}/file-raw?path=${encodeURIComponent(item.path)}`;

  const getFileIcon = (iconSize = 32) => {
    if (item.isDirectory) return <Folder size={iconSize} style={{ color: '#818cf8' }} />;
    
    if (isImage) return <Image size={iconSize} style={{ color: '#34d399' }} />;
    if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return <Film size={iconSize} style={{ color: '#f43f5e' }} />;
    if (['mp3', 'wav', 'flac', 'ogg'].includes(ext)) return <Music size={iconSize} style={{ color: '#a855f7' }} />;
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return <Archive size={iconSize} style={{ color: '#eab308' }} />;
    if (['txt', 'pdf', 'doc', 'docx', 'md', 'json', 'js', 'html', 'css', 'py'].includes(ext)) return <FileText size={iconSize} style={{ color: '#38bdf8' }} />;
    
    return <File size={iconSize} style={{ color: '#9ca3af' }} />;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleTouchStart = (e) => {
    timerRef.current = setTimeout(() => {
      onSelectContextMenu(item, e);
    }, 600);
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
      onOpenFile(item);
    }
  };

  if (viewMode === 'list') {
    return (
      <div 
        className="file-card-list"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
          {isImage && !imgError ? (
            <img 
              src={rawUrl} 
              alt={item.name} 
              className="file-thumbnail-list" 
              onError={() => setImgError(true)} 
              loading="lazy"
            />
          ) : (
            getFileIcon(22)
          )}
          <span className="file-card-name" style={{ fontSize: '0.85rem' }} title={item.name}>{item.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
          {!item.isDirectory && <span className="file-card-size">{formatBytes(item.size)}</span>}
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {new Date(item.updatedAt || Date.now()).toLocaleDateString()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`file-card-grid ${item.isDirectory ? 'is-folder' : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      <div className="file-icon-box">
        {isImage && !imgError ? (
          <img 
            src={rawUrl} 
            alt={item.name} 
            className="file-thumbnail-img" 
            onError={() => setImgError(true)} 
            loading="lazy"
          />
        ) : (
          getFileIcon(34)
        )}
      </div>
      <span className="file-card-name" title={item.name}>{item.name}</span>
      {!item.isDirectory && <span className="file-card-size">{formatBytes(item.size)}</span>}
    </div>
  );
}
