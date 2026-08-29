import React from 'react';

export default function AuthCardHeader() {
  return (
    <div className="auth-header">
      <div className="auth-icon-badge">
        <img 
          src="/localDrop-icon.png" 
          alt="LocalDrop Icon" 
          style={{ width: '28px', height: '28px', objectFit: 'contain' }} 
        />
      </div>
      <h2>Panel de Autenticación</h2>
      <p>Introduce tus credenciales para acceder al almacenamiento local.</p>
    </div>
  );
}
