import { useState, useEffect } from 'react';
import './QuestionScreen.css';

export default function QuestionScreen({ question, questionNumber, totalQuestions, onAnswer, answered, disabled = false }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (!disabled) {
      setSelectedAnswer(null);
      setAnimationPhase(1);
      const timeout = setTimeout(() => setAnimationPhase(2), 300);
      return () => clearTimeout(timeout);
    }
  }, [questionNumber, disabled]);

  const handleAnswer = (answer) => {
    if (answered || selectedAnswer || disabled) return;
    setSelectedAnswer(answer);
    if (onAnswer) {
      onAnswer(answer);
    }
  };

  const isTrueAnswer = (ans) => ans === 'true';
  const isAnswered = answered || selectedAnswer;
  const isDisabled = disabled || isAnswered;

  return (
    <div className={`question-screen phase-${animationPhase}`}>
      <div className="qs-header">
        <div className="qs-progress">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <div
              key={i}
              className={`qs-progress-dot ${i < questionNumber ? 'completed' : ''} ${i === questionNumber ? 'current' : ''}`}
            />
          ))}
        </div>
        <div className="qs-question-counter">
          <span className="counter-label">PREGUNTA</span>
          <span className="counter-value">{questionNumber}<span className="counter-total">/{totalQuestions}</span></span>
        </div>
      </div>

      <div className="qs-container">
        <div className="qs-monitor">
          <div className="monitor-corner top-left"></div>
          <div className="monitor-corner top-right"></div>
          <div className="monitor-corner bottom-left"></div>
          <div className="monitor-corner bottom-right"></div>

          <div className="qs-question-box">
            <div className="question-label">
              <span className="label-icon">◆</span>
              <span className="label-text">EN CONSULTA</span>
            </div>
            <p className="qs-text">{question}</p>
          </div>

          <div className="monitor-footer-line">
            <span className="footer-marker">Q{questionNumber}</span>
            <span className="footer-status">{isAnswered ? 'RESPONDIDO' : 'ESPERANDO'}</span>
            <span className="footer-marker">{totalQuestions - questionNumber} RESTANTES</span>
          </div>
        </div>
      </div>

      <div className="qs-options">
        <button
          className={`qs-option qs-option-true ${isAnswered && isTrueAnswer(selectedAnswer) ? 'selected' : ''} ${isDisabled ? 'disabled-btn' : ''}`}
          onClick={() => handleAnswer('true')}
          disabled={isDisabled}
        >
          <div className="option-glow"></div>
          <span className="option-icon">V</span>
          <span className="option-text">VERDADERO</span>
          <div className="option-highlight"></div>
        </button>

        <div className="option-divider">
          <span className="divider-text">●</span>
        </div>

        <button
          className={`qs-option qs-option-false ${isAnswered && !isTrueAnswer(selectedAnswer) ? 'selected' : ''} ${isDisabled ? 'disabled-btn' : ''}`}
          onClick={() => handleAnswer('false')}
          disabled={isDisabled}
        >
          <div className="option-glow"></div>
          <span className="option-icon">F</span>
          <span className="option-text">FALSO</span>
          <div className="option-highlight"></div>
        </button>
      </div>

      {isAnswered && (
        <div className={`qs-confirmation ${isTrueAnswer(selectedAnswer) ? 'true' : 'false'}`}>
          <span className="conf-icon">{isTrueAnswer(selectedAnswer) ? '◉' : '◇'}</span>
          <div className="conf-content">
            <span className="conf-label">RESPUESTA REGISTRADA</span>
            <span className="conf-value">{isTrueAnswer(selectedAnswer) ? 'VERDADERO' : 'FALSO'}</span>
          </div>
        </div>
      )}

      {!isAnswered && (
        <div className="qs-instruction">
          <span className="instruction-ring"></span>
          <span className="instruction-text">{disabled ? 'Esperando al administrador...' : 'Selecciona tu respuesta'}</span>
        </div>
      )}
    </div>
  );
}