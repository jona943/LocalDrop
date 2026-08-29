import React from 'react';
import './Landing.css';

export default function Landing({ onNavigate }) {
  return (
    <div className="landing-container">
      <h1 className="landing-title">LocalDrop<span>.home</span></h1>
      <p className="landing-subtitle">
        Comparte archivos y texto en tu red local de forma segura y ultrarrápida.
      </p>
      <div className="landing-features">
        <span>⚡ 0 configuración</span>
        <span>🔒 Encriptación local</span>
        <span>🚀 Máxima velocidad</span>
      </div>
      <div className="landing-actions">
        <button className="btn-primary" onClick={() => onNavigate('chat')}>Acceso Público</button>
        <button className="btn-secondary" onClick={() => onNavigate('login')}>Acceso Administrador</button>
      </div>
    </div>
  );
}
