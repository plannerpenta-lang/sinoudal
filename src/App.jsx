import { useState, useEffect } from 'react';
import { SocketProvider } from './context/SocketContext.jsx';
import LandingPage from './components/game/LandingPage.jsx';
import SessionController from './components/admin/SessionController.jsx';
import './index.css';

function App() {
  const [view, setView] = useState('participant');

  useEffect(() => {
    const url = new URL(window.location.href);
    const v = url.searchParams.get('view');
    if (v === 'admin') setView('admin');
  }, []);

  return (
    <SocketProvider>
      <div className="app">
        <nav className="app-nav">
          <div className="nav-brand">
            <span className="brand-icon">
              <img src="/logo-small.webp" alt="logo" width="24" height="24" />
            </span>
            <img src="/logo-main.webp" alt="BURUNDANGA" className="brand-logo-text" />
          </div>
          <div className="nav-tabs">
            <button
              onClick={() => setView('participant')}
              className={view === 'participant' ? 'active' : ''}
            >
              <span className="tab-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                </svg>
              </span>
              Participante
            </button>
            <button
              onClick={() => setView('admin')}
              className={view === 'admin' ? 'active' : ''}
            >
              <span className="tab-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="9" y1="9" x2="15" y2="9"/>
                  <line x1="9" y1="13" x2="15" y2="13"/>
                  <line x1="9" y1="17" x2="12" y2="17"/>
                </svg>
              </span>
              Admin
            </button>
          </div>
        </nav>

        {view === 'participant' && <LandingPage />}
        {view === 'admin' && <SessionController />}
      </div>
    </SocketProvider>
  );
}

export default App;
