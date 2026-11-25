/**
 * 짧은 효과음. 음성 파일 없이 브라우저에서 바로 만듭니다 (저작권 걱정이 없습니다).
 * 브라우저가 소리를 막으면 조용히 넘어갑니다.
 */
/** 틀렸을 때: 낮고 부드러운 두 음 (야단치는 느낌이 나지 않게 짧고 작게 냅니다). */
export function playWrongTone(): void {
  playTones([392, 311.13], 0.18, 0.12);
}

function playTones(freqs: number[], step: number, volume: number): void {
  try {
    const AudioCtx =
      window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * step;
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
    setTimeout(() => void ctx.close(), 800);
  } catch {
    // 소리를 낼 수 없는 환경이면 아무것도 하지 않습니다.
  }
}

export function playCorrectChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    // 도-미-솔 세 음을 차례로 울립니다.
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.12;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
    setTimeout(() => void ctx.close(), 1000);
  } catch {
    // 소리를 낼 수 없는 환경이면 아무것도 하지 않습니다.
  }
}
