export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  static readonly instance: SoundEngine = new SoundEngine();

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.35;
        this.master.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.35;
  }

  get isMuted(): boolean { return this.muted; }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol = 1, freqEnd?: number, delay = 0) {
    const ctx = this.ensure();
    if (!ctx || this.muted || !this.master) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.08);
  }

  private noise(dur: number, vol = 1, lp = 2000, delay = 0) {
    const ctx = this.ensure();
    if (!ctx || this.muted || !this.master) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = lp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  letterHit() { this.tone(620 + Math.random() * 90, 0.07, 'square', 0.22, 480); }
  comboRise(combo: number) { this.tone(440 + Math.min(combo, 20) * 45, 0.09, 'triangle', 0.28, 880 + Math.min(combo, 30) * 30); }
  comboMilestone() { [660, 880, 1108].forEach((f, i) => this.tone(f, 0.1, 'square', 0.28, undefined, i * 0.05)); }
  letterWrong() { this.tone(210, 0.13, 'sawtooth', 0.22, 130); }
  letterMiss() { this.tone(170, 0.16, 'triangle', 0.18, 80); }
  crit() { this.noise(0.16, 0.5, 4200); this.tone(1250, 0.22, 'square', 0.38, 700); }
  enemyHurt() { this.noise(0.1, 0.32, 2600); this.tone(300, 0.12, 'square', 0.26, 190); }
  enemyDead() { this.tone(420, 0.28, 'triangle', 0.4, 55); this.noise(0.3, 0.3, 1300, 0.08); }
  specialAttack() { this.tone(180, 0.5, 'sawtooth', 0.5, 1300); this.noise(0.4, 0.5, 3200, 0.06); }
  playerHurt() { this.tone(150, 0.22, 'sawtooth', 0.4, 85); this.noise(0.14, 0.3, 800); }
  furyTrigger() { [880, 1108, 1318, 1760].forEach((f, i) => this.tone(f, 0.12, 'square', 0.3, undefined, i * 0.06)); }
  stagger() { this.noise(0.2, 0.4, 3600); this.tone(620, 0.15, 'square', 0.3, 200); }
  specialReady() { [660, 990].forEach((f, i) => this.tone(f, 0.1, 'square', 0.25, undefined, i * 0.08)); }
  fightBanner() { this.noise(0.25, 0.4, 1400, 0.1); [392, 523, 659].forEach((f, i) => this.tone(f, 0.18, 'square', 0.35, undefined, i * 0.1)); }
  victory() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.28, 'square', 0.35, undefined, i * 0.13)); }
  defeat() { [392, 349, 311, 261].forEach((f, i) => this.tone(f, 0.32, 'triangle', 0.35, undefined, i * 0.16)); }
  uiClick() { this.tone(760, 0.05, 'square', 0.18, 500); }
}