import React, { useState } from 'react';
import './Auth.css';

export default function Auth({ onLoginSuccess, onNavigate }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const adminUser = import.meta.env.VITE_ADMIN_USER || 'admin';
  const adminPass = import.meta.env.VITE_ADMIN_PASS || 'admin';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === adminUser && password === adminPass) {
      setError('');
      onLoginSuccess({ username, role: 'admin' });
    } else {
      setError('Credenciales incorrectas. Verifica el usuario y la contraseña.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Panel de Control</h2>
        <p>Introduce las credenciales de administrador.</p>
        
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input 
              type="text" 
              placeholder="Usuario" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Acceder como Admin
          </button>
        </form>

        <div className="auth-footer">
          ¿Usuario normal? 
          <span className="auth-link" onClick={() => onNavigate('landing')}>
            Volver al inicio
          </span>
        </div>
      </div>
    </div>
  );
}
