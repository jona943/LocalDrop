import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthForm({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const adminUser = import.meta.env.VITE_ADMIN_USER || 'admin';
  const adminPass = import.meta.env.VITE_ADMIN_PASS || 'admin';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (username === adminUser && password === adminPass) {
        setLoading(false);
        onLoginSuccess({ username, role: 'admin' });
      } else {
        setLoading(false);
        setError('Credenciales incorrectas. Verifica el usuario y la contraseña.');
      }
    }, 400); // Simulamos verificación fluida de 400ms
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && (
        <div className="auth-alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <div className="input-field-group">
        <label className="input-label" htmlFor="username">Usuario</label>
        <div className="input-wrapper">
          <span className="input-icon-left">
            <User size={18} />
          </span>
          <input
            id="username"
            type="text"
            className="input-control"
            placeholder="jona_dev"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
      </div>

      <div className="input-field-group">
        <label className="input-label" htmlFor="password">Contraseña</label>
        <div className="input-wrapper">
          <span className="input-icon-left">
            <Lock size={18} />
          </span>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className="input-control"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className="toggle-password-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button type="submit" className="auth-submit-btn" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner"></span>
            <span>Verificando...</span>
          </>
        ) : (
          <>
            <span>Acceder</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
}
