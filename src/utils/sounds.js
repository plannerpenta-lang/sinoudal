let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

export function initAudio() {
  getAudioContext();
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.1) {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  noise.connect(gainNode);
  gainNode.connect(ctx.destination);
  noise.start(ctx.currentTime);
}

function playAudioFile(url, volume = 0.8) {
  console.log('[SOUNDS] Playing audio file:', url);
  const audio = new Audio(url);
  audio.volume = volume;
  audio.play().catch(e => console.error('[SOUNDS] Audio play error:', e));
}

export const sounds = {
  heartbeat: () => {
    playTone(80, 0.15, 'sine', 0.4);
    setTimeout(() => playTone(60, 0.1, 'sine', 0.2), 100);
  },
  boost: () => {
    playTone(200, 0.3, 'square', 0.2);
    setTimeout(() => playTone(250, 0.2, 'square', 0.15), 150);
  },
  glitch: () => {
    playNoise(0.1, 0.15);
    playTone(150, 0.05, 'sawtooth', 0.1);
  },
  alert: () => {
    playTone(440, 0.2, 'square', 0.2);
    setTimeout(() => playTone(440, 0.2, 'square', 0.2), 250);
  },
  sessionStart: () => {
    playTone(330, 0.3, 'sine', 0.3);
    setTimeout(() => playTone(440, 0.3, 'sine', 0.3), 200);
    setTimeout(() => playTone(550, 0.4, 'sine', 0.3), 400);
  },
  sessionEnd: () => {
    playTone(550, 0.3, 'sine', 0.3);
    setTimeout(() => playTone(440, 0.3, 'sine', 0.3), 200);
    setTimeout(() => playTone(330, 0.5, 'sine', 0.3), 400);
  },
  questionChange: () => {
    playTone(260, 0.15, 'sine', 0.2);
  },
  answerAdmin: () => {
    playTone(520, 0.2, 'sine', 0.25);
  },
  answerFalse: () => {
    console.log('[SOUNDS] answerFalse called');
    playAudioFile('/dw.mp3', 0.9);
  },
  answerTrue: () => {
    playTone(660, 0.15, 'sine', 0.3);
    setTimeout(() => playTone(880, 0.2, 'sine', 0.3), 150);
  }
};
