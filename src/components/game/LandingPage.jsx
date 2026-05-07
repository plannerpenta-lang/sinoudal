import { useState, useEffect, useRef } from 'react';
import { initAudio, sounds } from '../../utils/sounds';
import { useSocket } from '../../context/SocketContext';
import HeartbeatDisplay from './HeartbeatDisplay';
import './LandingPage.css';

export default function LandingPage() {
  const [phase, setPhase] = useState('idle');
  const [currentQuestion, setCurrentQuestion] = useState(-1);
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [questions, setQuestions] = useState([]);
  const [heartbeatMode, setHeartbeatMode] = useState('normal');
  const [questionText, setQuestionText] = useState('');
  const [timeLeft, setTimeLeft] = useState(8);
  const [timerExpired, setTimerExpired] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupAnswer, setPopupAnswer] = useState(null);
  const [alert, setAlert] = useState(null);
  const questionTimerRef = useRef(null);
  const { emit, on, off, isConnected } = useSocket();
  const questionsRef = useRef([]);
  const heartbeatModeRef = useRef('normal');

  useEffect(() => {
    initAudio();
  }, []);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    heartbeatModeRef.current = heartbeatMode;
  }, [heartbeatMode]);

  // ── Question Timer ──
  const startQuestionTimer = () => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    setTimeLeft(8);
    setTimerExpired(false);
    questionTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(questionTimerRef.current);
          setTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopQuestionTimer = () => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
  };

  useEffect(() => {
    const handleStatus = (data) => {
      if (!data.active) return;
      setPhase('active');
      setQuestions(data.questions);
      questionsRef.current = data.questions;
      setCurrentQuestion(data.currentQuestion);
      setTotalQuestions(data.totalQuestions || 3);
      setQuestionText(data.questions[data.currentQuestion]?.text || '');
      setHeartbeatMode(data.heartbeatMode || 'normal');
      heartbeatModeRef.current = data.heartbeatMode || 'normal';
      setTimerExpired(false);
      startQuestionTimer();
    };

    const handleStarted = (data) => {
      sounds.sessionStart();
      setPhase('active');
      setQuestions(data.questions);
      questionsRef.current = data.questions;
      setCurrentQuestion(data.currentQuestion);
      setTotalQuestions(data.totalQuestions || 3);
      setQuestionText(data.questions[data.currentQuestion]?.text || '');
      setHeartbeatMode('normal');
      heartbeatModeRef.current = 'normal';
      setShowPopup(false);
      setTimerExpired(false);
      startQuestionTimer();
    };

    const handleQuestionChanged = (data) => {
      sounds.questionChange();
      setCurrentQuestion(data.index);
      if (data.totalQuestions) setTotalQuestions(data.totalQuestions);
      const q = questionsRef.current[data.index];
      if (q) setQuestionText(q.text);
      setTimerExpired(false);
      startQuestionTimer();
    };

    const handleEnded = () => {
      sounds.sessionEnd();
      setPhase('ended');
      stopQuestionTimer();
    };

    const handleHeartbeatMode = (data) => {
      console.log('[LANDING] heartbeat:modeChanged received:', data.mode);
      setHeartbeatMode(data.mode);
      heartbeatModeRef.current = data.mode;
    };

    const handleAlert = (data) => {
      sounds.alert();
      setAlert({ message: data.message, type: data.type });
      setTimeout(() => setAlert(null), 3000);
    };

    const handleAdminSubmitted = (data) => {
      console.log('[LANDING] answer:adminSubmitted received:', data);
      setPopupAnswer(data.answer);
      setShowPopup(true);
      sounds.answerAdmin();
      setTimeout(() => setShowPopup(false), 3000);
    };

    on('session:status', handleStatus);
    on('session:started', handleStarted);
    on('session:questionChanged', handleQuestionChanged);
    on('session:ended', handleEnded);
    on('heartbeat:modeChanged', handleHeartbeatMode);
    on('alert:show', handleAlert);
    on('answer:adminSubmitted', handleAdminSubmitted);

    return () => {
      off('session:status', handleStatus);
      off('session:started', handleStarted);
      off('session:questionChanged', handleQuestionChanged);
      off('session:ended', handleEnded);
      off('heartbeat:modeChanged', handleHeartbeatMode);
      off('alert:show', handleAlert);
      off('answer:adminSubmitted', handleAdminSubmitted);
    };
  }, [on, off]);

  const effectiveMode = timerExpired ? 'timeout' : heartbeatMode;
  const statusClass = phase === 'idle' ? 'idle' : 'active';
  const statusText = phase === 'idle' ? 'STANDBY' : 'EN VIVO';

  if (phase === 'ended') {
    return (
      <div className="landing-page">
        <div className="end-screen">
          <div className="end-content">
            <span className="end-eyebrow">— FIN DEL INTERROGATORIO —</span>
            <h1 className="end-title">GRACIAS</h1>
            <span className="end-sub">El sujeto ha sido evaluado</span>
          </div>
          <div className="end-decoration"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {alert && (
        <div className={`alert-banner alert-${alert.type}`}>
          <span className="alert-icon">⚠</span>
          {alert.message}
        </div>
      )}

      {showPopup && popupAnswer && (
        <div className={`popup-overlay popup-${popupAnswer}`}>
          <div className="popup-ring">
            <div className="popup-inner">
              <span>{popupAnswer === 'true' ? 'V' : 'F'}</span>
            </div>
          </div>
          <div className="popup-label">
            {popupAnswer === 'true' ? 'VERDADERO' : 'FALSO'}
          </div>
        </div>
      )}

      <div className="split-layout">
        {/* ── LEFT: Heart Monitor ── */}
        <div className="left-panel">
          <div className="monitor-frame">
            <div className="monitor-header">
              <span className="monitor-title">CARDIAC MONITOR</span>
              <span className={`monitor-status ${statusClass}`}>
                <span className="status-led"></span>
                {statusText}
              </span>
            </div>
            <div className="heart-box">
              <HeartbeatDisplay mode={effectiveMode} timeLeft={timeLeft} />
            </div>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="center-divider">
          <div className="divider-line"></div>
          <div className="divider-dot"></div>
          <div className="divider-line"></div>
        </div>

        {/* ── RIGHT: Question ── */}
        <div className="right-panel">
          <div className="question-container">
            <div className="question-main">
              <div className="question-meta">
                <span className="question-num">
                  {phase === 'idle' ? '--' : String(currentQuestion + 1).padStart(2, '0')}
                </span>
                <span className="question-total">
                  / {phase === 'idle' ? '--' : String(totalQuestions).padStart(2, '0')}
                </span>
              </div>

              <div className="question-card">
                <div className="card-corner card-corner-tl"></div>
                <div className="card-corner card-corner-tr"></div>
                <div className="card-corner card-corner-bl"></div>
                <div className="card-corner card-corner-br"></div>

                <p className="question-text">
                  {phase === 'idle' ? 'Esperando instrucciones del operador...' : questionText}
                </p>
              </div>

              <div className="status-row">
                <div className={`signal-bar ${statusClass}`}>
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
                <span className="status-text">{statusText}</span>
              </div>
            </div>

            <div className="question-timer">
              <div className={`timer-display ${timeLeft <= 3 ? 'timer-urgent' : ''}`}>
                <span className="timer-value">{timeLeft}</span>
                <span className="timer-label">SEG</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
