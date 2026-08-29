import React from 'react';
import { ShieldCheck, Zap, HardDrive, Lock, ArrowRight, Server } from 'lucide-react';
import './Landing.css';

export default function Landing({ onNavigate }) {
  return (
    <div className="landing-wrapper">
      <header className="landing-nav">
        <div className="landing-logo">
          <span className="landing-logo-icon"><Server size={22} /></span>
          LocalDrop<span>.home</span>
        </div>
        <div className="badge-status">
          <span className="badge-dot"></span>
          Servidor Activo
        </div>
      </header>

      <main className="landing-hero">
        <div className="hero-tag">
          <Lock size={14} />
          Acceso Privado & Autenticado
        </div>
        
        <h1 className="landing-title">
          Tu almacenamiento local, rápido y seguro.
        </h1>
        
        <p className="landing-subtitle">
          Plataforma privada para la transferencia instantánea de archivos y notas dentro de tu red local sin depender de la nube.
        </p>

        <button className="btn-primary-lg" onClick={() => onNavigate('login')}>
          Iniciar Sesión
          <ArrowRight size={18} />
        </button>
      </main>

      <section className="landing-features-grid">
        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <Zap size={20} />
          </div>
          <h3>Velocidad de Red Local</h3>
          <p>Transfiere archivos aprovechando todo el ancho de banda de tu router local.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <ShieldCheck size={20} />
          </div>
          <h3>Privacidad Absoluta</h3>
          <p>Tus datos permanecen 100% dentro de tu servidor. Sin servidores externos.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <HardDrive size={20} />
          </div>
          <h3>Almacenamiento Directo</h3>
          <p>Conecta discos externos y gestiona tu espacio sin saturar el sistema.</p>
        </div>
      </section>

      <footer className="landing-footer">
        LocalDrop &copy; {new Date().getFullYear()} &bull; Servidor de Almacenamiento Local
      </footer>
    </div>
  );
}
