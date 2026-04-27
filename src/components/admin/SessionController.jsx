import { useState, useEffect } from 'react';
import { sounds } from '../../utils/sounds';
import { useSocket } from '../../hooks/useSocket';
import './SessionController.css';

export default function SessionController() {
  const [sessionActive, setSessionActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(-1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [heartbeatMode, setHeartbeatMode] = useState('normal');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [lastAnswer, setLastAnswer] = useState(null);
  const [showAnswerToast, setShowAnswerToast] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('warning');
  const { emit, on, isConnected } = useSocket();

  useEffect(() => {
    const stored = localStorage.getItem('sinoudal_questions');
    if (stored) {
      const q = JSON.parse(stored);
      setQuestions(q);
      setTotalQuestions(q.length);
    }

    on('session:state', (state) => {
      console.log('[SessionController] session:state', state);
      setSessionActive(state.active);
      setCurrentQuestion(state.currentQuestion);
      setHeartbeatMode(state.heartbeatMode);
      if (state.answers) {
        setAnswers(state.answers);
      }
    });

    on('session:started', (data) => {
      console.log('[SessionController] session:started', data);
      sounds.sessionStart();
      setSessionActive(true);
      setQuestions(data.questions);
      setTotalQuestions(data.questions.length);
      setCurrentQuestion(data.currentQuestion);
      setHeartbeatMode('normal');
      setAnswers({});
      setLastAnswer(null);
      setIsPaused(false);
    });

    on('session:questionChanged', (data) => {
      console.log('[SessionController] session:questionChanged', data);
      sounds.questionChange();
      setCurrentQuestion(data.index);
    });

    on('session:ended', (data) => {
      console.log('[SessionController] session:ended', data);
      sounds.sessionEnd();
      setSessionActive(false);
      setCurrentQuestion(-1);
      setIsPaused(false);
      if (data?.answers) {
        setAnswers(data.answers);
      }
    });

    on('session:reset', () => {
      console.log('[SessionController] session:reset');
      setSessionActive(false);
      setCurrentQuestion(-1);
      setHeartbeatMode('normal');
      setAnswers({});
      setLastAnswer(null);
      setIsPaused(false);
    });

    on('session:paused', () => {
      console.log('[SessionController] session:paused');
      setIsPaused(true);
    });

    on('session:resumed', () => {
      console.log('[SessionController] session:resumed');
      setIsPaused(false);
    });

    on('heartbeat:modeChanged', (data) => {
      console.log('[SessionController] heartbeat:modeChanged', data);
      setHeartbeatMode(data.mode);
      if (data.mode === 'boosted') {
        sounds.boost();
      }
    });

    on('answer:received', (data) => {
      console.log('[SessionController] answer:received', data);
      sounds.click();
      setAnswers(prev => ({ ...prev, [data.questionId]: data.answer }));
      setLastAnswer(data);
      setShowAnswerToast(true);
      setTimeout(() => setShowAnswerToast(false), 2000);
    });
  }, [on]);

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('sinoudal_questions');
      if (stored) {
        const q = JSON.parse(stored);
        setQuestions(q);
        setTotalQuestions(q.length);
      }
    };

    window.addEventListener('storage', handleStorage);
    handleStorage();

    const interval = setInterval(handleStorage, 1000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const handleStart = () => {
    console.log('[SessionController] handleStart called, questions:', questions.length, 'connected:', isConnected);
    if (questions.length > 0) {
      emit('session:start');
    }
  };

  const handleNext = () => {
    sounds.click();
    emit('session:next');
  };

  const handlePrev = () => {
    sounds.click();
    emit('session:prev');
  };

  const handleReset = () => {
    sounds.click();
    emit('session:reset');
  };

  const handleBoost = () => {
    sounds.click();
    if (heartbeatMode === 'normal') {
      emit('heartbeat:boost');
    } else {
      emit('heartbeat:normal');
    }
  };

  const handleGlitch = () => {
    sounds.click();
    emit('effect:glitch');
  };

  const handlePause = () => {
    sounds.click();
    if (isPaused) {
      emit('session:resume');
    } else {
      emit('session:pause');
    }
  };

  const handleSendAlert = () => {
    if (alertMessage.trim()) {
      sounds.click();
      emit('alert:show', { message: alertMessage.trim(), type: alertType });
      setAlertMessage('');
    }
  };

  return (
    <div className="session-controller">
      <div className="sc-header">
        <h2>CONTROL DE SESIÓN</h2>
        <div className={`sc-status ${sessionActive ? 'active' : ''}`}>
          <span className={`sc-status-dot ${isConnected ? 'connected' : ''}`}></span>
          {isConnected ? (sessionActive ? (isPaused ? 'PAUSADO' : 'EN VIVO') : 'INACTIVA') : 'OFFLINE'}
        </div>
      </div>

      <div className="sc-info">
        <div className="sc-info-item">
          <span className="sc-info-label">PREGUNTA ACTUAL</span>
          <span className="sc-info-value">
            {sessionActive ? `${currentQuestion + 1} / ${totalQuestions}` : '— / —'}
          </span>
        </div>
        <div className="sc-info-item">
          <span className="sc-info-label">RITMO</span>
          <span className="sc-info-value">{heartbeatMode === 'boosted' ? 'ACELERADO' : 'NORMAL'}</span>
        </div>
        <div className="sc-info-item">
          <span className="sc-info-label">RESPUESTAS</span>
          <span className="sc-info-value">{Object.keys(answers).length} / {totalQuestions}</span>
        </div>
      </div>

      {showAnswerToast && lastAnswer && (
        <div className="sc-answer-toast">
          <span className="sc-toast-icon">📡</span>
          <div className="sc-toast-content">
            <span className="sc-toast-label">RESPUESTA DETECTADA</span>
            <span className={`sc-toast-value sc-answer-${answers[lastAnswer.questionId]}`}>
              {answers[lastAnswer.questionId] === 'true' ? 'VERDADERO' : 'FALSO'}
            </span>
          </div>
        </div>
      )}

      <div className="sc-actions">
        {!sessionActive ? (
          <button
            onClick={handleStart}
            className="sc-btn sc-btn-start"
            disabled={questions.length === 0}
          >
            ▶ INICIAR SESIÓN
          </button>
        ) : (
          <>
            <button
              onClick={handlePrev}
              className="sc-btn sc-btn-prev"
              disabled={currentQuestion === 0 || isPaused}
            >
              ◀ ANTERIOR
            </button>
            <button
              onClick={handleNext}
              className="sc-btn sc-btn-next"
              disabled={currentQuestion >= totalQuestions - 1 || isPaused}
            >
              SIGUIENTE ▶
            </button>
          </>
        )}
      </div>

      <div className="sc-extra-controls">
        <button
          onClick={handleBoost}
          className={`sc-btn sc-btn-boost ${heartbeatMode === 'boosted' ? 'active' : ''}`}
          disabled={!sessionActive}
        >
          ⚡ {heartbeatMode === 'boosted' ? 'REDUCIR RITMO' : 'ACELERAR RITMO'}
        </button>
        <button
          onClick={handleGlitch}
          className="sc-btn sc-btn-glitch"
          disabled={!sessionActive || isPaused}
        >
          🌀 GLITCH
        </button>
        <button
          onClick={handlePause}
          className={`sc-btn sc-btn-pause ${isPaused ? 'active' : ''}`}
          disabled={!sessionActive}
        >
          {isPaused ? '▶ CONTINUAR' : '⏸️ PAUSAR'}
        </button>
      </div>

      <div className="sc-alert-controls">
        <input
          type="text"
          value={alertMessage}
          onChange={(e) => setAlertMessage(e.target.value)}
          placeholder="Mensaje de alerta..."
          className="sc-alert-input"
          disabled={!sessionActive}
        />
        <select
          value={alertType}
          onChange={(e) => setAlertType(e.target.value)}
          className="sc-alert-select"
          disabled={!sessionActive}
        >
          <option value="warning">⚠️ Advertencia</option>
          <option value="error">🔴 Error</option>
          <option value="info">ℹ️ Info</option>
        </select>
        <button
          onClick={handleSendAlert}
          className="sc-btn sc-btn-alert"
          disabled={!sessionActive || !alertMessage.trim()}
        >
          📢 ENVIAR
        </button>
      </div>

      <div className="sc-extras-bottom">
        <button onClick={handleReset} className="sc-btn sc-btn-reset">
          ↺ NUEVA SESIÓN
        </button>
      </div>

      {questions.length === 0 && (
        <div className="sc-warning">
          ⚠ Agrega al menos una pregunta para iniciar
        </div>
      )}
    </div>
  );
}