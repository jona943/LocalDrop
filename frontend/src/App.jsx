import React, { useState } from 'react';
import Landing from './modules/Landing/Landing';
import Auth from './modules/Auth/Auth';
import Chat from './modules/Chat/Chat';
import './styles/global.css';

export default function App() {
  const [currentModule, setCurrentModule] = useState('landing'); // 'landing', 'login', 'chat'
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentModule('chat');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentModule('landing');
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

      {currentModule === 'chat' && (
        <Chat 
          user={user} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}
