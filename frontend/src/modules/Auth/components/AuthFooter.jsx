import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function AuthFooter({ onNavigate }) {
  return (
    <div style={{ textDisplay: 'flex', justifyContent: 'center', textAlign: 'center' }}>
      <button className="auth-back-link" onClick={() => onNavigate('landing')}>
        <ArrowLeft size={16} />
        <span>Volver a la portada</span>
      </button>
    </div>
  );
}
