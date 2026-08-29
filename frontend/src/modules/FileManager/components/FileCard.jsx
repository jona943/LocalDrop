import React from 'react';
import { 
  Folder, 
  FileText, 
  Image, 
  Film, 
  Music, 
  Archive, 
  Download, 
  Trash2, 
  File 
} from 'lucide-react';

export default function FileCard({ item, viewMode, onOpenFolder, onMoveToTrash, onPermanentDelete }) {
  const getFileIcon = () => {
    if (item.isDirectory) return <Folder size={32} style={{ color: '#818cf8' }} />;
    const ext = item.name.split('.').pop().toLowerCase();
    
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return <Image size={30} style={{ color: '#34d399' }} />;
    if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) return <Film size={30} style={{ color: '#f43f5e' }} />;
    if (['mp3', 'wav', 'flac'].includes(ext)) return <Music size={30} style={{ color: '#a855f7' }} />;
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return <Archive size={30} style={{ color: '#eab308' }} />;
    if (['txt', 'pdf', 'doc', 'docx', 'md'].includes(ext)) return <FileText size={30} style={{ color: '#38bdf8' }} />;
    
    return <File size={30} style={{ color: '#9ca3af' }} />;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div 
      className={`file-card-grid ${item.isDirectory ? 'is-folder' : ''}`}
      onClick={() => item.isDirectory && onOpenFolder(item.path)}
    >
      <div className="file-icon-box">{getFileIcon()}</div>
      <span className="file-card-name" title={item.name}>{item.name}</span>
      {!item.isDirectory && <span className="file-card-size">{formatBytes(item.size)}</span>}

      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
        {!item.isDirectory && (
          <a 
            href={`/uploads/${item.name}`} 
            download 
            className="btn-copy" 
            title="Descargar"
          >
            <Download size={14} />
          </a>
        )}
        {onMoveToTrash && (
          <button className="btn-copy" onClick={() => onMoveToTrash(item.path)} title="Mover a Papelera">
            <Trash2 size={14} style={{ color: '#fca5a5' }} />
          </button>
        )}
      </div>
    </div>
  );
}
