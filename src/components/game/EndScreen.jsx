import { useState, useEffect } from 'react';
import { sounds } from '../../utils/sounds';
import HeartbeatWave from './HeartbeatWave';
import './EndScreen.css';

export default function EndScreen({ answers, questions, elapsedTime }) {
  const [showResults, setShowResults] = useState(false);
  const [finalAnimation, setFinalAnimation] = useState(0);

  useEffect(() => {
    sounds.sessionEnd();

    const timer = setTimeout(() => setShowResults(true), 1500);
    const animationInterval = setInterval(() => {
      setFinalAnimation(prev => prev + 1);
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(animationInterval);
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const trueCount = Object.values(answers).filter(a => a === 'true').length;
  const falseCount = Object.values(answers).filter(a => a === 'false').length;

  return (
    <div className="end-screen">
      <div className="scanlines"></div>

      <div className="end-content">
        <div className="end-header">
          <span className="end-status-icon">✓</span>
          <h1 className="end-title">ANÁLISIS COMPLETADO</h1>
        </div>

        <div className="end-wave">
          <div className="end-wave-header">
            <span className="wave-label">RESULTADO FINAL</span>
            <span className="wave-time">{formatTime(elapsedTime)}</span>
          </div>
          <HeartbeatWave mode="idle" height={80} />
        </div>

        {showResults && (
          <div className="end-results">
            <div className="result-card">
              <div className="result-header">
                <span className="result-icon">V</span>
                <span className="result-label">VERDADERO</span>
              </div>
              <span className="result-value">{trueCount}</span>
            </div>

            <div className="result-card">
              <div className="result-header">
                <span className="result-icon">F</span>
                <span className="result-label">FALSO</span>
              </div>
              <span className="result-value">{falseCount}</span>
            </div>

            <div className="result-card total">
              <div className="result-header">
                <span className="result-icon">◆</span>
                <span className="result-label">TOTAL</span>
              </div>
              <span className="result-value">{questions.length}</span>
            </div>
          </div>
        )}

        <div className="end-summary">
          <div className="summary-header">
            <span className="summary-icon">◉</span>
            <span className="summary-title">RESUMEN DE RESPUESTAS</span>
          </div>

          <div className="summary-list">
            {questions.map((q, i) => (
              <div key={q.id} className="summary-item">
                <span className="summary-number">Q{i + 1}</span>
                <span className="summary-text">{q.text.substring(0, 40)}{q.text.length > 40 ? '...' : ''}</span>
                <span className={`summary-answer ${answers[q.id] === 'true' ? 'true' : 'false'}`}>
                  {answers[q.id] === 'true' ? 'V' : 'F'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="end-footer">
          <div className="footer-scan">
            <span className="scan-label">ESTADO:</span>
            <span className="scan-value">ANÁLISIS FINALIZADO</span>
          </div>
          <div className="footer-code">
            {new Date().toISOString()}
          </div>
        </div>
      </div>
    </div>
  );
}