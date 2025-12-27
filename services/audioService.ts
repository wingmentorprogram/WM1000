// A robust audio service to synthesize realistic mechanical click sounds.

let audioCtx: AudioContext | null = null;

/**
 * Synthesizes an "ASMR-appealing" mechanical click sound using the Web Audio API.
 * Simulates the complex acoustic profile of a high-end tactile switch:
 * 1. Friction: Short white noise burst for the initial travel.
 * 2. Snap: High-frequency transient for the "click" mechanism.
 * 3. Body: Low-frequency resonance for the switch housing.
 */
const synthesizeASMRClick = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  // Ensure AudioContext is resumed if suspended (browser policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  // 1. Friction/Texture (Noise Burst)
  const bufferSize = audioCtx.sampleRate * 0.01; // 10ms
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  const noiseGain = audioCtx.createGain();
  const noiseFilter = audioCtx.createBiquadFilter();

  noiseFilter.type = 'highpass';
  noiseFilter.frequency.setValueAtTime(2000, now);
  noiseGain.gain.setValueAtTime(0.04, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.005);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);

  // 2. The Snap (Transient transient)
  const snapOsc = audioCtx.createOscillator();
  const snapGain = audioCtx.createGain();
  
  snapOsc.type = 'square';
  snapOsc.frequency.setValueAtTime(2200, now);
  snapOsc.frequency.exponentialRampToValueAtTime(1000, now + 0.008);
  
  snapGain.gain.setValueAtTime(0.08, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
  
  snapOsc.connect(snapGain);
  snapGain.connect(audioCtx.destination);
  
  // 3. The Body "Thump" (Resonance)
  const thumpOsc = audioCtx.createOscillator();
  const thumpGain = audioCtx.createGain();
  
  thumpOsc.type = 'sine';
  thumpOsc.frequency.setValueAtTime(180, now);
  thumpOsc.frequency.exponentialRampToValueAtTime(60, now + 0.03);
  
  thumpGain.gain.setValueAtTime(0.12, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  
  thumpOsc.connect(thumpGain);
  thumpGain.connect(audioCtx.destination);
  
  // Execution
  noiseSource.start(now);
  snapOsc.start(now);
  snapOsc.stop(now + 0.015);
  thumpOsc.start(now);
  thumpOsc.stop(now + 0.05);
};

export const playSound = (sound: 'click') => {
  if (sound === 'click') {
    try {
      synthesizeASMRClick();
    } catch (e) {
      console.warn("Mechanical click synthesis failed", e);
    }
  }
};