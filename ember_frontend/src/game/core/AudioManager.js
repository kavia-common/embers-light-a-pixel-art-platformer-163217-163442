//
// AudioManager.js - simple audio manager for music and SFX
//
class AudioManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.buffers = new Map();
    this.music = null;
    this.gainNode = null;
    this.musicGain = 0.4;
    this.sfxGain = 0.7;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 1.0;
      this.gainNode.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      // Fallback: will use HTMLAudioElement for playback
      this.initialized = false;
    }
  }

  // PUBLIC_INTERFACE
  async preload(name, url) {
    /** Preload an audio asset by name. */
    if (!this.enabled) return;
    if (this.buffers.has(name)) return;
    if (this.initialized && this.ctx) {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buf = await this.ctx.decodeAudioData(arr);
      this.buffers.set(name, { type: 'buffer', buffer: buf });
    } else {
      const audio = new Audio(url);
      this.buffers.set(name, { type: 'audio', audio });
    }
  }

  // PUBLIC_INTERFACE
  setEnabled(flag) {
    /** Enable or disable audio globally. */
    this.enabled = flag;
    if (!flag && this.music) {
      try { this.music.stop(0); } catch { /* ignore */ }
    }
  }

  // PUBLIC_INTERFACE
  playMusic(name, loop = true) {
    /** Play a music track by name. */
    if (!this.enabled) return;
    const asset = this.buffers.get(name);
    if (!asset) return;
    if (asset.type === 'buffer' && this.ctx) {
      if (this.music) try { this.music.stop(0); } catch { /* ignore */ }
      const src = this.ctx.createBufferSource();
      src.buffer = asset.buffer;
      const gain = this.ctx.createGain();
      gain.gain.value = this.musicGain;
      src.connect(gain).connect(this.gainNode);
      src.loop = loop;
      src.start(0);
      this.music = src;
    } else {
      const au = asset.audio.cloneNode(true);
      au.loop = loop;
      au.volume = this.musicGain;
      au.play();
      this.music = { stop: () => au.pause() };
    }
  }

  // PUBLIC_INTERFACE
  playSfx(name, options = {}) {
    /** Play a sound effect by name with optional detune/volume. */
    if (!this.enabled) return;
    const asset = this.buffers.get(name);
    if (!asset) return;
    const vol = options.volume ?? this.sfxGain;
    if (asset.type === 'buffer' && this.ctx) {
      const src = this.ctx.createBufferSource();
      src.buffer = asset.buffer;
      const gain = this.ctx.createGain();
      gain.gain.value = vol;
      src.connect(gain).connect(this.gainNode);
      if (options.detune && src.playbackRate) {
        src.playbackRate.value = options.detune;
      }
      src.start(0);
    } else {
      const au = asset.audio.cloneNode(true);
      au.volume = vol;
      au.play();
    }
  }
}

const audio = new AudioManager();
export default audio;
