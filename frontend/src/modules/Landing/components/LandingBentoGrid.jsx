import React from 'react';
import { Zap, ShieldCheck, Wifi, Activity, Smartphone, Monitor, Tablet } from 'lucide-react';

export default function LandingBentoGrid() {
  return (
    <section className="bento-section">
      <div className="bento-grid">
        
        {/* Tarjeta 1: Velocidad LAN */}
        <div className="bento-card">
          <div className="bento-card-header">
            <div className="bento-icon-wrapper">
              <Zap size={22} />
            </div>
            <h3>Velocidad LAN Nativa</h3>
            <p>Aprovecha el máximo ancho de banda de tu router local sin limitaciones externas.</p>
          </div>
          
          <div className="bento-visual">
            <div className="speed-metric">
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Rendimiento LAN</span>
              <span className="speed-badge">
                <Activity size={12} /> ~1 Gbps
              </span>
            </div>
            <div className="speed-progress-bg">
              <div className="speed-progress-fill"></div>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Privacidad & Seguridad */}
        <div className="bento-card">
          <div className="bento-card-header">
            <div className="bento-icon-wrapper">
              <ShieldCheck size={22} />
            </div>
            <h3>Privacidad Aislada</h3>
            <p>Tus archivos se procesan 100% dentro de tu hardware local. Ningún dato sale a internet.</p>
          </div>

          <div className="bento-visual">
            <div className="security-demo">
              <span className="node-box">Cliente</span>
              <div className="connection-line"></div>
              <span className="node-box" style={{ color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                TV Box
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta 3: Ecosistema Multidispositivo */}
        <div className="bento-card">
          <div className="bento-card-header">
            <div className="bento-icon-wrapper">
              <Wifi size={22} />
            </div>
            <h3>Multiplataforma</h3>
            <p>Acceso instantáneo desde cualquier navegador móvil, tablet o PC de la red.</p>
          </div>

          <div className="bento-visual">
            <div className="devices-demo">
              <div className="device-item active">
                <Smartphone size={20} />
                <span>Móvil</span>
              </div>
              <div className="device-item active">
                <Monitor size={20} />
                <span>Desktop</span>
              </div>
              <div className="device-item active">
                <Tablet size={20} />
                <span>Tablet</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
