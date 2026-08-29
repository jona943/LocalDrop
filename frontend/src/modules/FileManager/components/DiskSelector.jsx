import React from 'react';
import { HardDrive, Server } from 'lucide-react';

export default function DiskSelector({ disks, selectedDisk, onSelectDisk, formatSize }) {
  return (
    <div className="fm-disk-selector">
      <div className="sidebar-title">
        <HardDrive size={15} />
        <span>Unidades de Almacenamiento</span>
      </div>

      {disks.length === 0 ? (
        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Cargando discos...</div>
      ) : (
        disks.map((disk) => {
          const isSelected = selectedDisk && selectedDisk.mountPoint === disk.mountPoint;
          const usedPct = disk.total ? Math.round((disk.used / disk.total) * 100) : 0;

          return (
            <div 
              key={disk.id || disk.mountPoint} 
              className={`disk-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectDisk(disk)}
            >
              <div className="disk-name">
                <Server size={14} style={{ color: isSelected ? '#818cf8' : '#9ca3af' }} />
                <span>{disk.name}</span>
              </div>
              <div style={{ fontSize: '0.725rem', color: '#9ca3af', marginBottom: '0.35rem' }}>
                {formatSize(disk.available)} libres de {formatSize(disk.total)}
              </div>
              <div className="storage-bar-bg">
                <div className="storage-bar-fill" style={{ width: `${usedPct}%` }}></div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
