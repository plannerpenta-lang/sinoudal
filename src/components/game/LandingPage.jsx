import { useState, useEffect, useRef } from 'react';
import { initAudio, sounds } from '../../utils/sounds';
import { useSocket } from '../../hooks/useSocket';
import HeartbeatWave from './HeartbeatWave';
import './LandingPage.css';

export default function LandingPage() {
  const [phase, setPhase] = useState('idle');
  const [currentQuestion, setCurrentQuestion] = useState(-1);
  const [questions, setQuestions] = useState([]);
  const [heartbeatMode, setHeartbeatMode] = useState('normal');
  const [questionText, setQuestionText] = useState('');
  const [answers, setAnswers] = useState({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [signalStrength, setSignalStrength] = useState(100);
  const [hrvValue, setHrvValue] = useState(65);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);
  const [pauseCountdown, setPauseCountdown] = useState(3);
  const [alert, setAlert] = useState(null);
  const [glitchActive, setGlitchActive] = useState(false);
  const { emit, on } = useSocket();
  const questionsRef = useRef([]);
  const heartbeatIntervalRef = useRef(null);
  const timerRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const [serialNumber] = useState(() => Math.floor(1000 + Math.random() * 9000));

  useEffect(() => {
    initAudio();
  }, []);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        setCurrentTime(new Date());
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === 'active' && !isPaused) {
      if (Math.random() > 0.6) {
        setSignalStrength(Math.floor(88 + Math.random() * 12));
      }
      setHrvValue(Math.floor(55 + Math.random() * 35));
    }
  }, [phase, elapsedTime, isPaused]);

  useEffect(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    if (phase === 'active' && !isPaused) {
      const playHeartbeat = () => {
        if (heartbeatMode === 'boosted') {
          sounds.heartbeatBoost();
        } else {
          sounds.heartbeat();
        }
      };

      playHeartbeat();
      const interval = heartbeatMode === 'boosted' ? 350 : 850;
      heartbeatIntervalRef.current = setInterval(playHeartbeat, interval);
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [heartbeatMode, phase, isPaused]);

  useEffect(() => {
    const handleStarted = (data) => {
      sounds.sessionStart();
      setPhase('active');
      setQuestions(data.questions);
      questionsRef.current = data.questions;
      setCurrentQuestion(data.currentQuestion);
      setQuestionText(data.questions[data.currentQuestion]?.text || '');
      setHeartbeatMode('normal');
      setAnswers({});
      setElapsedTime(0);
      setIsPaused(false);
    };

    const handleQuestionChanged = (data) => {
      if (isPaused) return;
      sounds.questionChange();
      sounds.glitch();
      setCurrentQuestion(data.index);
      setSignalStrength(100);
      const q = questionsRef.current[data.index];
      if (q) {
        setQuestionText(q.text);
      }
    };

    const handleEnded = () => {
      sounds.sessionEnd();
      setPhase('ended');
    };

    const handleReset = () => {
      setPhase('idle');
      setCurrentQuestion(-1);
      setQuestionText('');
      setAnswers({});
      setIsPaused(false);
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
    };

    const handleHeartbeatMode = (data) => {
      setHeartbeatMode(data.mode);
      if (data.mode === 'boosted') {
        sounds.boost();
      }
    };

    const handlePaused = (data) => {
      setIsPaused(true);
      setPauseCountdown(Math.ceil(data.duration / 1000));
      pauseTimerRef.current = setInterval(() => {
        setPauseCountdown(prev => {
          if (prev <= 1) {
            clearInterval(pauseTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleResumed = () => {
      setIsPaused(false);
      setPauseCountdown(3);
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
    };

    const handleGlitch = (data) => {
      setGlitchActive(true);
      sounds.glitch();
      setTimeout(() => setGlitchActive(false), data.duration);
    };

    const handleAlert = (data) => {
      sounds.alert();
      setAlert({ message: data.message, type: data.type });
      setTimeout(() => setAlert(null), 3000);
    };

    on('session:started', handleStarted);
    on('session:questionChanged', handleQuestionChanged);
    on('session:ended', handleEnded);
    on('session:reset', handleReset);
    on('session:paused', handlePaused);
    on('session:resumed', handleResumed);
    on('heartbeat:modeChanged', handleHeartbeatMode);
    on('effect:glitch', handleGlitch);
    on('alert:show', handleAlert);
  }, [on, isPaused]);

  const handleAnswer = (answer) => {
    if (isPaused) return;
    const questionId = questions[currentQuestion]?.id;
    if (questionId) {
      setAnswers(prev => ({ ...prev, [questionId]: answer }));
      emit('answer:submit', { questionId, answer });
      if (answer === 'true') {
        sounds.answerTrue();
      } else {
        sounds.answerFalse();
      }
    }
  };

  const formatCurrentTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (phase === 'ended') {
    return (
      <div className="landing-page full-layout">
        <div className="scanlines"></div>
        <div className="end-screen-full">
          <div className="end-monitor">
            <h1 className="end-title">ANÁLISIS COMPLETADO</h1>
            <div className="end-results">
              <div className="results-summary">
                <span className="summary-label">PREGUNTAS:</span>
                <span className="summary-value">{questions.length}</span>
              </div>
              <div className="results-summary">
                <span className="summary-label">VERDADERAS:</span>
                <span className="summary-value true">
                  {Object.values(answers).filter(a => a === 'true').length}
                </span>
              </div>
              <div className="results-summary">
                <span className="summary-label">FALSAS:</span>
                <span className="summary-value false">
                  {Object.values(answers).filter(a => a === 'false').length}
                </span>
              </div>
              <div className="results-summary">
                <span className="summary-label">TIEMPO:</span>
                <span className="summary-value">
                  {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const effectiveMode = glitchActive ? 'glitch' : heartbeatMode;
  const isDisabled = phase !== 'active' || isPaused;
  const currentAnswer = answers[questions[currentQuestion]?.id];

  return (
    <div className="landing-page full-layout">
      <div className="scanlines"></div>

      {alert && (
        <div className={`alert-banner ${alert.type}`}>
          <span className="alert-icon">
            {alert.type === 'warning' ? '⚠️' : alert.type === 'error' ? '🔴' : 'ℹ️'}
          </span>
          <span className="alert-message">{alert.message}</span>
        </div>
      )}

      {isPaused && (
        <div className="pause-overlay">
          <div className="pause-content">
            <span className="pause-icon">⏸️</span>
            <h2 className="pause-title">PAUSA ADMINISTRATIVA</h2>
            <span className="pause-countdown">{pauseCountdown}</span>
          </div>
        </div>
      )}

      <div className="main-columns">
        <div className="left-column">
          <div className="monitor-panel">
            <div className="monitor-header">
              <div className="monitor-leds">
                <span className="led power"></span>
                <span className="led-label">PWR</span>
              </div>
              <div className="monitor-title-group">
                <span className="monitor-icon">♥</span>
                <span className="monitor-title">
                  {phase === 'idle' ? 'SISTEMA DE ANÁLISIS BIOMÉTRICO' : 'MONITOR CARDÍACO EN VIVO'}
                </span>
              </div>
              <div className="monitor-buttons">
                <span className="phys-btn">MENU</span>
                <span className="phys-btn">ESC</span>
                <span className="led status"></span>
              </div>
            </div>

            <div className="monitor-subheader">
              <span className="subheader-lead">LEAD II</span>
              <span className={`subheader-status ${heartbeatMode === 'boosted' ? 'boosted' : ''}`}>
                {phase === 'idle' ? 'STANDBY' : (heartbeatMode === 'boosted' ? 'ALERTA' : 'MONITOREO')}
              </span>
            </div>

            <div className="ecg-container">
              <HeartbeatWave mode={effectiveMode} />
            </div>

            <div className="readings-bar">
              <div className="reading-item">
                <span className="reading-label">ESTADO</span>
                <span className="reading-value green">
                  {phase === 'idle' ? 'STANDBY' : (isPaused ? 'PAUSA' : 'ACTIVO')}
                </span>
              </div>
              <div className="reading-item">
                <span className="reading-label">HR</span>
                <span className={`reading-value ${heartbeatMode === 'boosted' ? 'boosted' : ''}`}>
                  {phase === 'idle' ? '--' : (heartbeatMode === 'boosted' ? '140' : '72')} BPM
                </span>
              </div>
              <div className="reading-item hrv">
                <span className="reading-label">HRV</span>
                <div className="hrv-bar">
                  <div className="hrv-fill" style={{ width: phase === 'idle' ? '50%' : `${hrvValue}%` }}></div>
                </div>
              </div>
              <div className="reading-item">
                <span className="reading-label">SEÑAL</span>
                <span className="reading-value">{phase === 'idle' ? '--%' : `${signalStrength}%`}</span>
              </div>
            </div>
          </div>

          <div className="question-area">
            <div className="question-label">
              <span className="label-icon">◆</span>
              <span className="label-text">PREGUNTA {currentQuestion + 1} / {questions.length}</span>
            </div>
            <p className="question-text">
              {phase === 'idle' ? 'Esperando inicio de sesión...' : questionText}
            </p>
          </div>
        </div>

        <div className="right-column">
          <button
            className={`big-button true-btn ${currentAnswer === 'true' ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
            onClick={() => handleAnswer('true')}
            disabled={isDisabled}
          >
            <span className="button-letter">V</span>
            <span className="button-text">VERDADERO</span>
          </button>

          <button
            className={`big-button false-btn ${currentAnswer === 'false' ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
            onClick={() => handleAnswer('false')}
            disabled={isDisabled}
          >
            <span className="button-letter">F</span>
            <span className="button-text">FALSO</span>
          </button>
        </div>
      </div>
    </div>
  );
}