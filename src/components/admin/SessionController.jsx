import { useState } from 'react';
import { initAudio, sounds } from '../../utils/sounds';
import { useSocket } from '../../context/SocketContext';
import QuestionManager from './QuestionManager';
import './SessionController.css';
import './QuestionManager.css';

export default function SessionController() {
  const [sessionActive, setSessionActive] = useState(false);
  const [heartbeatMode, setHeartbeatMode] = useState('normal');
  const [lastAnswer, setLastAnswer] = useState(null);
  const [activeEffect, setActiveEffect] = useState(null);
  const { emit, isConnected } = useSocket();

  initAudio();

  const startSession = (questions) => {
    sounds.sessionStart();
    emit('session:start', { questions });
    setSessionActive(true);
  };

  const endSession = () => {
    sounds.sessionEnd();
    emit('session:end');
    setSessionActive(false);
  };

  const nextQuestion = () => {
    emit('session:nextQuestion');
  };

  const setBoosted = () => {
    sounds.boost();
    emit('heartbeat:setMode', { mode: 'boosted' });
    setHeartbeatMode('boosted');
  };

  const setNormal = () => {
    emit('heartbeat:setMode', { mode: 'normal' });
    setHeartbeatMode('normal');
  };

  const triggerGlitch = (duration = 1000) => {
    sounds.glitch();
    emit('effect:glitch', { duration });
    setActiveEffect('glitch');
    setTimeout(() => setActiveEffect(null), duration);
  };

  const submitAnswer = (answer) => {
    sounds.answerAdmin();
    setLastAnswer(answer);
    emit('answer:adminSubmit', { answer });
  };

  return (
    <div className="session-controller">
      <div className="controller-header">
        <div className="header-badge">
          <span className="badge-dot"></span>
          <span className="badge-text">PANEL DE CONTROL</span>
        </div>
        <div className="header-status-row">
          <span className="header-subtitle">Sistema de Evaluación — Burundanga</span>
          <div className={`conn-indicator ${isConnected ? 'conn-online' : 'conn-offline'}`}>
            <span className="conn-dot"></span>
            <span className="conn-label">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      <QuestionManager
        sessionActive={sessionActive}
        onStart={startSession}
        onEnd={endSession}
        onNext={nextQuestion}
      />

      <div className="control-sections">
        {/* ── HEARTBEAT SECTION ── */}
        <div className="control-section">
          <div className="section-header">
            <span className="section-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </span>
            <h3 className="section-title">Cardiac Monitor</h3>
          </div>
          <div className="heartbeat-controls">
            <button
              onClick={setNormal}
              className={`ctrl-btn ctrl-btn-teal ${heartbeatMode === 'normal' ? 'active' : ''}`}
            >
              <span className="btn-indicator"></span>
              NORMAL
            </button>
            <button
              onClick={setBoosted}
              className={`ctrl-btn ctrl-btn-red ${heartbeatMode === 'boosted' ? 'active' : ''}`}
            >
              <span className="btn-indicator"></span>
              BOOST
            </button>
          </div>
        </div>

        {/* ── EFFECTS SECTION ── */}
        <div className="control-section">
          <div className="section-header">
            <span className="section-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </span>
            <h3 className="section-title">Efectos</h3>
          </div>
          <div className="effects-controls">
            <button
              onClick={() => triggerGlitch(1000)}
              className={`ctrl-btn ctrl-btn-outline ${activeEffect === 'glitch' ? 'active-glitch' : ''}`}
            >
              <span className="btn-indicator"></span>
              GLITCH
            </button>
          </div>
        </div>

        {/* ── ANSWER SECTION ── */}
        <div className="control-section section-answer">
          <div className="section-header">
            <span className="section-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </span>
            <h3 className="section-title">Respuesta</h3>
          </div>
          <div className="answer-controls">
            <button
              onClick={() => submitAnswer('true')}
              className="ctrl-btn ctrl-btn-true"
            >
              <span className="btn-letter">V</span>
              VERDAD
            </button>
            <button
              onClick={() => submitAnswer('false')}
              className="ctrl-btn ctrl-btn-false"
            >
              <span className="btn-letter">F</span>
              FALSO
            </button>
          </div>
          {lastAnswer && (
            <div className={`last-answer answer-${lastAnswer}`}>
              <span className="answer-indicator"></span>
              <span className="answer-label">
                {lastAnswer === 'true' ? 'VERDADERO' : 'FALSO'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
