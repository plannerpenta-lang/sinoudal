import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let sessionState = {
  active: false,
  currentQuestion: -1,
  questions: [],
  heartbeatMode: 'normal',
  answers: {},
  paused: false
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.emit('session:state', sessionState);

  socket.on('questions:update', (questions) => {
    console.log('Server: questions:update received', questions.length);
    sessionState.questions = questions;
    io.emit('questions:updated', questions);
  });

  socket.on('session:start', () => {
    console.log('Server: session:start received');
    sessionState.answers = {};
    sessionState.paused = false;
    if (sessionState.questions.length > 0) {
      sessionState.active = true;
      sessionState.currentQuestion = 0;
      sessionState.heartbeatMode = 'normal';
      console.log('Server: emitting session:started');
      io.emit('session:started', {
        questions: sessionState.questions,
        currentQuestion: 0
      });
    } else {
      console.log('Server: no questions, cannot start');
    }
  });

  socket.on('session:next', () => {
    console.log('Server: session:next received');
    if (sessionState.paused) return;
    if (sessionState.currentQuestion < sessionState.questions.length - 1) {
      sessionState.currentQuestion++;
      io.emit('session:questionChanged', {
        index: sessionState.currentQuestion,
        total: sessionState.questions.length
      });
    } else {
      sessionState.active = false;
      io.emit('session:ended', { answers: sessionState.answers });
    }
  });

  socket.on('session:prev', () => {
    console.log('Server: session:prev received');
    if (sessionState.paused) return;
    if (sessionState.currentQuestion > 0) {
      sessionState.currentQuestion--;
      io.emit('session:questionChanged', {
        index: sessionState.currentQuestion,
        total: sessionState.questions.length
      });
    }
  });

  socket.on('session:reset', () => {
    console.log('Server: session:reset received');
    sessionState.active = false;
    sessionState.currentQuestion = -1;
    sessionState.heartbeatMode = 'normal';
    sessionState.answers = {};
    sessionState.paused = false;
    io.emit('session:reset');
  });

  socket.on('session:pause', () => {
    console.log('Server: session:pause received');
    if (!sessionState.active || sessionState.paused) return;
    sessionState.paused = true;
    io.emit('session:paused', { duration: 3000 });

    setTimeout(() => {
      sessionState.paused = false;
      io.emit('session:resumed');
    }, 3000);
  });

  socket.on('session:resume', () => {
    console.log('Server: session:resume received');
    sessionState.paused = false;
    io.emit('session:resumed');
  });

  socket.on('heartbeat:boost', () => {
    console.log('Server: heartbeat:boost received');
    sessionState.heartbeatMode = 'boosted';
    io.emit('heartbeat:modeChanged', { mode: 'boosted' });
  });

  socket.on('heartbeat:normal', () => {
    console.log('Server: heartbeat:normal received');
    sessionState.heartbeatMode = 'normal';
    io.emit('heartbeat:modeChanged', { mode: 'normal' });
  });

  socket.on('effect:glitch', () => {
    console.log('Server: effect:glitch received');
    io.emit('effect:glitch', { duration: 1500 });
  });

  socket.on('alert:show', (data) => {
    console.log('Server: alert:show received', data);
    io.emit('alert:show', { message: data.message, type: data.type || 'warning' });
  });

  socket.on('answer:submit', (data) => {
    if (sessionState.paused) return;
    console.log('Server: answer:submit received', data);
    const { questionId, answer } = data;
    sessionState.answers[questionId] = answer;
    io.emit('answer:received', {
      questionId,
      answer,
      totalAnswers: Object.keys(sessionState.answers).length
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});