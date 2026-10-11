// Original synthesized dusk ambience and engine; no recordings or sampled music.
export class Sound {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private engine: OscillatorNode | null = null;
  private motor: GainNode | null = null;
  start() {
    if (this.context) {
      void this.context.resume();
      return;
    }
    try {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.07;
      this.master.connect(this.context.destination);
      for (const f of [130.81, 155.56, 196]) {
        const o = this.context.createOscillator(),
          g = this.context.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.value = 0.1;
        o.connect(g).connect(this.master);
        o.start();
      }
      this.engine = this.context.createOscillator();
      this.engine.type = "triangle";
      this.engine.frequency.value = 40;
      this.motor = this.context.createGain();
      this.motor.gain.value = 0;
      this.engine.connect(this.motor).connect(this.master);
      this.engine.start();
    } catch {
      /* Audio is optional. */
    }
  }
  update(speed: number, driving: boolean, muted: boolean, paused: boolean) {
    if (!this.context || !this.master || !this.engine || !this.motor) return;
    const t = this.context.currentTime;
    this.master.gain.setTargetAtTime(muted || paused ? 0 : 0.11, t, 0.12);
    this.engine.frequency.setTargetAtTime(35 + Math.abs(speed) * 0.45, t, 0.1);
    this.motor.gain.setTargetAtTime(driving ? 0.3 : 0, t, 0.1);
  }
}
