import { useState } from 'react';

const defaultQuestions = [
  { id: 1, text: '¿Te gusta el teatro?' },
  { id: 2, text: '¿Alguna vez mentiste en el escenario?' },
  { id: 3, text: '¿Confías en tus compañeros actores?' },
  { id: 4, text: '¿Alguna vez olvidaste tus líneas?' },
  { id: 5, text: '¿Te consideras una persona honesta?' },
];

export default function QuestionManager({
  sessionActive,
  onStart,
  onEnd,
  onNext
}) {
  const [questions, setQuestions] = useState(defaultQuestions);
  const [newQuestion, setNewQuestion] = useState('');

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    const q = { id: Date.now(), text: newQuestion.trim() };
    setQuestions([...questions, q]);
    setNewQuestion('');
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  return (
    <div className="question-manager">
      <div className="qm-header">
        <div className="qm-title-row">
          <span className="qm-label">Lista de Preguntas</span>
          <span className="qm-count">{questions.length}</span>
        </div>
      </div>

      <div className="qm-list">
        {questions.map((q, i) => (
          <div key={q.id} className="qm-item">
            <span className="qm-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="qm-text">{q.text}</span>
            <button
              onClick={() => removeQuestion(q.id)}
              className="qm-remove"
              disabled={sessionActive}
              aria-label="Eliminar pregunta"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}

        {!sessionActive && (
          <div className="qm-add">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Escribe una nueva pregunta..."
              className="qm-input"
              onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
              maxLength={200}
            />
            <button onClick={addQuestion} className="qm-add-btn" disabled={!newQuestion.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="qm-actions">
        {!sessionActive ? (
          <button
            onClick={() => onStart(questions)}
            className="qm-action-btn btn-start"
            disabled={questions.length === 0}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Iniciar Interrogatorio
          </button>
        ) : (
          <div className="qm-active-actions">
            <button onClick={onNext} className="qm-action-btn btn-next">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              Siguiente
            </button>

            <button onClick={onEnd} className="qm-action-btn btn-end">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
              Terminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
