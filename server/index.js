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

// ─── Session State ───────────────────────────────────────────────────────────
let session = {
  active: false,
  questions: [],
  currentQuestion: -1,
  heartbeatMode: 'normal',
  paused: false
};

// ─── Socket.io events ───────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('[SERVER] Client connected:', socket.id);

  // Send current session state to newly connected client
  socket.emit('session:status', {
    active: session.active,
    questions: session.questions,
    currentQuestion: session.currentQuestion,
    heartbeatMode: session.heartbeatMode
  });

  socket.on('session:start', (data) => {
    if (!data.questions?.length) return;
    console.log('[SERVER] session:start', data.questions?.length);
    session.active = true;
    session.questions = data.questions;
    session.currentQuestion = 0;
    session.paused = false;
    io.emit('session:started', {
      questions: session.questions,
      currentQuestion: session.currentQuestion
    });
  });

  socket.on('session:nextQuestion', () => {
    if (!session.active) return;
    if (session.currentQuestion < session.questions.length - 1) {
      session.currentQuestion++;
      io.emit('session:questionChanged', { index: session.currentQuestion });
    }
  });

  socket.on('session:end', () => {
    if (!session.active) return;
    session.active = false;
    io.emit('session:ended');
    session = { ...session, active: false, questions: [], currentQuestion: -1, heartbeatMode: 'normal', paused: false };
  });

  socket.on('heartbeat:setMode', (data) => {
    if (!session.active) return;
    console.log('[SERVER] heartbeat:setMode → broadcasting heartbeat:modeChanged', data.mode);
    session.heartbeatMode = data.mode;
    io.emit('heartbeat:modeChanged', { mode: data.mode });
  });

  socket.on('answer:adminSubmit', (data) => {
    console.log('[SERVER] answer:adminSubmit → broadcasting answer:adminSubmitted', data.answer);
    io.emit('answer:adminSubmitted', { answer: data.answer });
  });

  socket.on('audio:enable', (data) => {
    console.log('[SERVER] audio:enable → broadcasting audio:enabled', data.enabled);
    io.emit('audio:enabled', { enabled: data.enabled });
  });

  socket.on('timer:expired', () => {
    console.log('[SERVER] timer:expired → broadcasting to all clients');
    io.emit('timer:expired');
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
