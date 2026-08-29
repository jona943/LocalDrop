import React from 'react';
import { Server } from 'lucide-react';

export default function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="landing-brand">
        <img 
          src="/localDrop-icon.png" 
          alt="LocalDrop Icon" 
          style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} 
        />
        <span>LocalDrop<span className="brand-dot">.home</span></span>
      </div>
      <div className="status-badge">
        <span className="pulse-dot"></span>
        Servidor Activo
      </div>
    </header>
  );
}
