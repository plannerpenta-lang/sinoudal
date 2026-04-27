import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import './QuestionManager.css';

export default function QuestionManager() {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const { emit, isConnected } = useSocket();

  useEffect(() => {
    const stored = localStorage.getItem('sinoudal_questions');
    if (stored) {
      setQuestions(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  useEffect(() => {
    localStorage.setItem('sinoudal_questions', JSON.stringify(questions));
    if (questions.length > 0) {
      emit('questions:update', questions);
    }
  }, [questions, emit]);

  const handleAddQuestion = useCallback(() => {
    if (newQuestion.trim()) {
      const question = {
        id: Date.now(),
        text: newQuestion.trim(),
        createdAt: new Date().toISOString()
      };
      setQuestions(prev => {
        const updated = [...prev, question];
        return updated;
      });
      setNewQuestion('');
    }
  }, [newQuestion]);

  const handleDeleteQuestion = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleStartEdit = (question) => {
    setEditingId(question.id);
    setEditingText(question.text);
  };

  const handleSaveEdit = (id) => {
    if (editingText.trim()) {
      setQuestions(prev => prev.map(q =>
        q.id === id ? { ...q, text: editingText.trim() } : q
      ));
    }
    setEditingId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (editingId) {
        handleSaveEdit(editingId);
      } else {
        handleAddQuestion();
      }
    }
  };

  return (
    <div className="question-manager">
      <div className="qm-header">
        <h2>GESTIÓN DE PREGUNTAS</h2>
        <div className="qm-header-right">
          <span className={`qm-status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? '●' : '○'}
          </span>
          <span className="qm-count">{questions.length} preguntas</span>
        </div>
      </div>

      <div className="qm-add">
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Escribe una nueva pregunta..."
          className="qm-input"
        />
        <button onClick={handleAddQuestion} className="qm-btn qm-btn-add">
          + AGREGAR
        </button>
      </div>

      <div className="qm-list">
        {questions.length === 0 ? (
          <div className="qm-empty">
            <p>No hay preguntas configuradas</p>
            <p className="qm-empty-hint">Agrega preguntas para iniciar una sesión</p>
          </div>
        ) : (
          questions.map((question, index) => (
            <div key={question.id} className="qm-item">
              <span className="qm-number">{index + 1}</span>

              {editingId === question.id ? (
                <div className="qm-edit">
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="qm-input qm-input-edit"
                    autoFocus
                  />
                  <button onClick={() => handleSaveEdit(question.id)} className="qm-btn qm-btn-save">
                    GUARDAR
                  </button>
                  <button onClick={handleCancelEdit} className="qm-btn qm-btn-cancel">
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <span className="qm-text">{question.text}</span>
                  <div className="qm-actions">
                    <button onClick={() => handleStartEdit(question)} className="qm-btn qm-btn-edit">
                      EDITAR
                    </button>
                    <button onClick={() => handleDeleteQuestion(question.id)} className="qm-btn qm-btn-delete">
                      ✕
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}