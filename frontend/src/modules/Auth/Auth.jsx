import React from 'react';
import AuthCardHeader from './components/AuthCardHeader';
import AuthForm from './components/AuthForm';
import AuthFooter from './components/AuthFooter';
import './Auth.css';

export default function Auth({ onLoginSuccess, onNavigate }) {
  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <AuthCardHeader />
        <AuthForm onLoginSuccess={onLoginSuccess} />
        <AuthFooter onNavigate={onNavigate} />
      </div>
    </div>
  );
}
