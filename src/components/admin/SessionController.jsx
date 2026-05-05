import { useState, useRef, useCallback, useEffect } from 'react';
import { initAudio, sounds } from '../../utils/sounds';
import { useSocket } from '../../context/SocketContext';
import QuestionManager from './QuestionManager';
import './SessionController.css';
import './QuestionManager.css';

// Heartbeat audio context for admin
let heartbeatAudioContext = null;

const playHeartbeatBeep = (volume = 0.2) => {
  try {
    if (!heartbeatAudioContext) {
      heartbeatAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const ctx = heartbeatAudioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = 800;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
    
    console.log('♥ Admin beep');
  } catch (e) {
    console.log('Heartbeat error:', e);
  }
};

export default function SessionController() {
  const [sessionActive, setSessionActive] = useState(false);
  const [heartbeatMode, setHeartbeatMode] = useState('normal');
  const [lastAnswer, setLastAnswer] = useState(null);
  const [activeEffect, setActiveEffect] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const { emit, on, off, isConnected } = useSocket();
  const heartbeatIntervalRef = useRef(null);

  initAudio();

  const startHeartbeat = useCallback(() => {
    if (timerExpired) {
      console.log('[ADMIN] Cannot start heartbeat - timer expired');
      return;
    }
    
    const bpm = heartbeatMode === 'boosted' ? 140 : 72;
    const interval = 60000 / bpm;
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      playHeartbeatBeep();
    }, interval);
    
    console.log(`[ADMIN] Heartbeat started: ${bpm} BPM`);
  }, [heartbeatMode, timerExpired]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
      console.log('[ADMIN] Heartbeat stopped, interval cleared');
    } else {
      console.log('[ADMIN] Heartbeat stop called but no interval running');
    }
  }, []);

  // Update heartbeat speed when mode changes (only if timer hasn't expired)
  useEffect(() => {
    if (sessionActive && !timerExpired) {
      startHeartbeat();
    }
  }, [heartbeatMode, sessionActive, startHeartbeat, timerExpired]);

  // Listen for timer expiration to stop heartbeat
  useEffect(() => {
    const handleTimerExpired = () => {
      console.log('[ADMIN] Timer expired event received, stopping heartbeat');
      setTimerExpired(true);
      stopHeartbeat();
    };
    
    const handleQuestionChanged = () => {
      console.log('[ADMIN] Question changed, resetting timerExpired and restarting heartbeat');
      setTimerExpired(false);
      if (sessionActive) {
        startHeartbeat();
      }
    };
    
    on('timer:expired', handleTimerExpired);
    on('session:questionChanged', handleQuestionChanged);
    
    return () => {
      off('timer:expired', handleTimerExpired);
      off('session:questionChanged', handleQuestionChanged);
    };
  }, [on, off, stopHeartbeat, startHeartbeat, sessionActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  const startSession = (questions) => {
    sounds.sessionStart();
    emit('session:start', { questions });
    emit('audio:enable', { enabled: true });
    setTimerExpired(false);
    setSessionActive(true);
    startHeartbeat();
  };

  const endSession = () => {
    sounds.sessionEnd();
    emit('session:end');
    setSessionActive(false);
    stopHeartbeat();
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
    console.log('[ADMIN] submitAnswer:', answer, '| isConnected:', isConnected);
    setLastAnswer(answer);
    emit('answer:adminSubmit', { answer });
    
    const audio = new Audio(answer === 'true' ? '/true.mp3' : '/dw.mp3');
    audio.volume = 0.9;
    audio.play().catch(e => console.log('[ADMIN] Audio play error:', e));
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
              VERDADERO
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
