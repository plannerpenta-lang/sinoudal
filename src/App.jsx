import { useState } from 'react'
import './index.css'
import { SocketProvider } from './hooks/useSocket'
import QuestionManager from './components/admin/QuestionManager'
import SessionController from './components/admin/SessionController'
import LandingPage from './components/game/LandingPage'

function App() {
  const [activeTab, setActiveTab] = useState('landing')

  return (
    <SocketProvider>
      <div className="app-container">
        <nav className="sidebar">
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activeTab === 'landing' ? 'active' : ''}`}
              onClick={() => setActiveTab('landing')}
            >
              Landing
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Admin
            </button>
          </div>
        </nav>

        <main className="main-content">
          <section className={`section ${activeTab === 'landing' ? 'active' : ''}`}>
            <LandingPage />
          </section>

          <section className={`section ${activeTab === 'admin' ? 'active' : ''}`}>
            <QuestionManager />
            <SessionController />
          </section>
        </main>
      </div>
    </SocketProvider>
  )
}

export default App