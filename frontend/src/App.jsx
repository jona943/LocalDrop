import React, { useState, useEffect, useRef } from 'react';
import Landing from './modules/Landing/Landing';
import Auth from './modules/Auth/Auth';
import Chat from './modules/Chat/Chat';
import FileManager from './modules/FileManager/FileManager';
import './styles/global.css';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos en milisegundos

export default function App() {
  const [currentModule, setCurrentModule] = useState('landing'); // 'landing', 'login', 'drive', 'chat'
  const [user, setUser] = useState(null);
  const timerRef = useRef(null);

  // 1. Restaurar sesión persistente al cargar la app
  useEffect(() => {
    const savedUser = localStorage.getItem('localdrop_user');
    const loginTime = localStorage.getItem('localdrop_login_time');

    if (savedUser && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime, 10);
      if (elapsed < INACTIVITY_TIMEOUT) {
        setUser(JSON.parse(savedUser));
        setCurrentModule('drive');
      } else {
        clearSession();
      }
    }
  }, []);

  // 2. Temporizador de inactividad de 5 minutos
  const resetInactivityTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    if (user || localStorage.getItem('localdrop_user')) {
      localStorage.setItem('localdrop_login_time', Date.now().toString());

      timerRef.current = setTimeout(() => {
        handleLogout();
        alert('Sesión cerrada automáticamente por 5 minutos de inactividad.');
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Escuchar eventos de actividad del usuario (mouse, teclado, touch)
  useEffect(() => {
    if (user && (currentModule === 'drive' || currentModule === 'chat')) {
      const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
      
      const handleUserActivity = () => {
        resetInactivityTimer();
      };

      events.forEach((event) => window.addEventListener(event, handleUserActivity));
      resetInactivityTimer();

      return () => {
        events.forEach((event) => window.removeEventListener(event, handleUserActivity));
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [user, currentModule]);

  const clearSession = () => {
    localStorage.removeItem('localdrop_user');
    localStorage.removeItem('localdrop_login_time');
    setUser(null);
    setCurrentModule('landing');
  };

  const handleLoginSuccess = (userData) => {
    const now = Date.now().toString();
    localStorage.setItem('localdrop_user', JSON.stringify(userData));
    localStorage.setItem('localdrop_login_time', now);
    setUser(userData);
    setCurrentModule('drive');
  };

  const handleLogout = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearSession();
  };

  return (
    <div className="app-container">
      {currentModule === 'landing' && (
        <Landing onNavigate={(module) => setCurrentModule(module)} />
      )}

      {currentModule === 'login' && (
        <Auth 
          onLoginSuccess={handleLoginSuccess} 
          onNavigate={(module) => setCurrentModule(module)} 
        />
      )}

      {currentModule === 'drive' && (
        <FileManager 
          user={user} 
          onLogout={handleLogout}
          onNavigateToChat={() => setCurrentModule('chat')}
        />
      )}

      {currentModule === 'chat' && (
        <Chat 
          user={user} 
          onLogout={handleLogout} 
          onNavigateToDrive={() => setCurrentModule('drive')}
        />
      )}
    </div>
  );
}
