import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000
});

io.engine.on('connection', (socket) => {
  console.log('[SERVER] Socket.io engine connection:', socket.id);
});

// ─── Helpers ────────────────────────────────────────────────────────────────
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Session State ───────────────────────────────────────────────────────────
let session = {
  active: false,
  questions: [],
  currentQuestion: -1,
  heartbeatMode: 'normal',
  paused: false,
  totalQuestions: 3,
  answersReceived: 0
};

// ─── Socket.io events ───────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('[SERVER] Client connected:', socket.id);

  // Send current session state to newly connected client
  socket.emit('session:status', {
    active: session.active,
    questions: session.questions,
    currentQuestion: session.currentQuestion,
    heartbeatMode: session.heartbeatMode,
    totalQuestions: session.totalQuestions
  });

  socket.on('session:start', (data) => {
    if (!data.questions?.length) return;
    console.log('[SERVER] session:start with', data.questions?.length, 'questions');
    console.log('[SERVER] Original questions order:', data.questions.map(q => q.id));

    // Select only 3 random questions
    const shuffled = shuffleArray(data.questions);
    const selectedQuestions = shuffled.slice(0, 3);
    console.log('[SERVER] Selected questions (shuffled):', selectedQuestions.map(q => q.id));

    session.active = true;
    session.questions = selectedQuestions;
    session.currentQuestion = 0;
    session.heartbeatMode = 'normal';
    session.paused = false;
    session.answersReceived = 0;

    console.log('[SERVER] Selected 3 random questions, session starting');
    io.emit('session:started', {
      questions: session.questions,
      currentQuestion: session.currentQuestion,
      totalQuestions: session.totalQuestions
    });
  });

  socket.on('session:nextQuestion', () => {
    if (!session.active) return;
    if (session.currentQuestion < session.totalQuestions - 1) {
      session.currentQuestion++;
      io.emit('session:questionChanged', {
        index: session.currentQuestion,
        totalQuestions: session.totalQuestions
      });
    }
  });

  socket.on('answer:adminSubmit', (data) => {
    console.log('[SERVER] answer:adminSubmit received:', data.answer);
    session.answersReceived++;

    // Check if this was the last question
    if (session.answersReceived >= session.totalQuestions) {
      console.log('[SERVER] All 3 questions answered, ending session automatically');
      io.emit('answer:adminSubmitted', { answer: data.answer });

      // Small delay to let the popup show before ending
      setTimeout(() => {
        session.active = false;
        io.emit('session:ended');
        session = {
          ...session,
          active: false,
          questions: [],
          currentQuestion: -1,
          heartbeatMode: 'normal',
          paused: false,
          answersReceived: 0
        };
      }, 1500);
    } else {
      io.emit('answer:adminSubmitted', { answer: data.answer });
    }
  });

  socket.on('session:end', () => {
    if (!session.active) return;
    session.active = false;
    io.emit('session:ended');
    session = {
      ...session,
      active: false,
      questions: [],
      currentQuestion: -1,
      heartbeatMode: 'normal',
      paused: false,
      answersReceived: 0
    };
  });

  socket.on('heartbeat:setMode', (data) => {
    if (!session.active) return;
    console.log('[SERVER] heartbeat:setMode → broadcasting heartbeat:modeChanged', data.mode);
    session.heartbeatMode = data.mode;
    io.emit('heartbeat:modeChanged', { mode: data.mode });
  });

  socket.on('audio:enable', (data) => {
    console.log('[SERVER] audio:enable → broadcasting audio:enabled', data.enabled);
    io.emit('audio:enabled', { enabled: data.enabled });
  });

  socket.on('disconnect', () => {
    console.log('[SERVER] Client disconnected:', socket.id);
  });
});

// ─── Static files (React build) ─────────────────────────────────────────────
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback — todas las rutas van al index.html
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
  console.log(`[SERVER] Socket.io ready`);
  console.log(`[SERVER] Serving static files from ${distPath}`);
});
