export class AudioManager {
  constructor() {
    this.ctx = null;
    this.gain = null;
    this.ambient = null;
    this.paused = false;
  }

  async init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.5;
    this.gain.connect(this.ctx.destination);

    // Create a soft ambient pad using noise + filter as a placeholder
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.02;
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const ambientGain = this.ctx.createGain();
    ambientGain.gain.value = 0.25;
    noise.connect(filter).connect(ambientGain).connect(this.gain);
    noise.loop = true;
    noise.start();
    this.ambient = ambientGain;
  }

  setPaused(p) {
    this.paused = p;
    if (!this.ctx) return;
    if (p) this.ctx.suspend();
    else this.ctx.resume();
  }

  playAmbient(name) {
    // Placeholder uses same ambient; future: switch based on biome
  }

  playSfxBurst() {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(220, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.25);
    g.gain.value = 0.3;
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);
    o.connect(g).connect(this.gain);
    o.start();
    o.stop(this.ctx.currentTime + 0.26);
  }

  playSfxSeed() {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(440, this.ctx.currentTime);
    o.frequency.linearRampToValueAtTime(660, this.ctx.currentTime + 0.1);
    g.gain.value = 0.2;
    g.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + 0.15);
    o.connect(g).connect(this.gain);
    o.start();
    o.stop(this.ctx.currentTime + 0.16);
  }

  destroy() {
    if (this.ctx) this.ctx.close();
  }
}
