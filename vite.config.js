import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { Server } from 'socket.io';

// NOTE: In development, Socket.io is provided by this plugin.
// In production, the standalone server/index.js handles Socket.io + static files.
// Keep this plugin in sync with server/index.js logic.

function socketioPlugin() {
  return {
    name: 'socketio-plugin',
    configureServer(server) {
      const httpServer = server.httpServer;
      const io = new Server(httpServer, { cors: { origin: '*' } });

      let session = {
        active: false,
        questions: [],
        currentQuestion: -1,
        heartbeatMode: 'normal',
        paused: false
      };

      io.on('connection', (socket) => {
        console.log('[Socket.io DEV] Client connected:', socket.id);

        // Send current session state to newly connected client
        socket.emit('session:status', {
          active: session.active,
          questions: session.questions,
          currentQuestion: session.currentQuestion,
          heartbeatMode: session.heartbeatMode
        });

        socket.on('session:start', (data) => {
          if (!data.questions?.length) return;
          console.log('[Socket.io DEV] session:start', data.questions?.length);
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
          session = { active: false, questions: [], currentQuestion: -1, heartbeatMode: 'normal', paused: false };
        });

        socket.on('heartbeat:setMode', (data) => {
          if (!session.active) return;
          session.heartbeatMode = data.mode;
          io.emit('heartbeat:modeChanged', { mode: data.mode });
        });

        socket.on('disconnect', () => {
          console.log('[Socket.io DEV] Client disconnected:', socket.id);
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), socketioPlugin()],
  server: {
    port: 5173
  }
});
