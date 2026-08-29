import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';

export default function LandingHero({ onNavigate }) {
  return (
    <main className="hero-section">
      <div className="auth-badge">
        <Lock size={13} />
        Acceso Privado & Autenticado
      </div>
      
      <h1 className="hero-title">
        Tu almacenamiento local, <br />
        <span className="text-gradient">ultrarrápido y privado.</span>
      </h1>
      
      <p className="hero-subtitle">
        Plataforma de alta velocidad para la transferencia instantánea de archivos y notas en tu red local. Sin intermediarios ni dependencias en la nube.
      </p>

      <button 
        className="cta-button" 
        onClick={() => onNavigate('login')}
        aria-label="Iniciar Sesión en LocalDrop"
      >
        <span>Iniciar Sesión</span>
        <ArrowRight size={18} />
      </button>
    </main>
  );
}
