// Web Audio API 기반 100% 실시간 합성 사운드스케이프 엔진
// 외부 음원 스트리밍 없이 브라우저 자체 오실레이터와 필터로 0원/무한 지속 구현

class SoundscapeEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.masterGain = null;

    // 모듈별 게인 노드
    this.purrGain = null;
    this.windGain = null;
    this.waterGain = null;
    this.chimeGain = null;

    // 활성 노드 참조
    this.purrSource = null;
    this.windSource = null;
    this.waterSource = null;

    // 볼륨 기본값
    this.volumes = {
      purr: 0.7,
      wind: 0.4,
      water: 0.3,
      chime: 0.8,
    };
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 모듈 게인 세팅
    this.purrGain = this.ctx.createGain();
    this.purrGain.gain.setValueAtTime(this.volumes.purr, this.ctx.currentTime);
    this.purrGain.connect(this.masterGain);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(this.volumes.wind, this.ctx.currentTime);
    this.windGain.connect(this.masterGain);

    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.setValueAtTime(this.volumes.water, this.ctx.currentTime);
    this.waterGain.connect(this.masterGain);

    this.chimeGain = this.ctx.createGain();
    this.chimeGain.gain.setValueAtTime(this.volumes.chime, this.ctx.currentTime);
    this.chimeGain.connect(this.masterGain);

    // 배경음 루프 시작
    this._startPurrSynth();
    this._startWindSynth();
    this._startWaterSynth();
  }

  // 1. 고양이 골골송 (저주파 진동 + 호흡 모듈레이션)
  _startPurrSynth() {
    if (!this.ctx) return;

    // 노이즈 버퍼 생성 (2초)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // 로우패스 필터로 깊은 그르릉 소리로 가공
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // 골골송 특유의 초당 약 24~26회 주기적 떨림(LFO)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(25, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    lfo.connect(lfoGain.gain);

    // 2~3초 간격의 부드러운 들숨/날숨 앰프
    const breathLfo = this.ctx.createOscillator();
    breathLfo.type = 'sine';
    breathLfo.frequency.setValueAtTime(0.35, this.ctx.currentTime); // ~3초 주기

    const breathGain = this.ctx.createGain();
    breathGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    breathLfo.connect(breathGain.gain);

    whiteNoise.connect(filter);
    filter.connect(lfoGain);
    lfoGain.connect(breathGain);
    breathGain.connect(this.purrGain);

    whiteNoise.start();
    lfo.start();
    breathLfo.start();
  }

  // 2. 대나무 숲 바람소리
  _startWindSynth() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02; // 브라운 노이즈 (Pink/Brown)
      lastOut = data[i];
    }

    const brownNoise = this.ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // 바람이 살랑거리며 변화하는 주파수 변조
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    const lfoScale = this.ctx.createGain();
    lfoScale.gain.setValueAtTime(200, this.ctx.currentTime);
    lfo.connect(lfoScale);
    lfoScale.connect(filter.frequency);

    brownNoise.connect(filter);
    filter.connect(this.windGain);

    brownNoise.start();
    lfo.start();
  }

  // 3. 졸졸 흐르는 작은 돌샘 물소리
  _startWaterSynth() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.waterGain);
    noise.start();
  }

  // 4. 묘당 풍경(鈴) 소리 트리거 (맑은 청동 벨 사운드)
  ringChime(pitchMultiplier = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // 펜타토닉 배음 주파수 구성
    const freqs = [784, 1174, 1568, 2349, 3136].map((f) => f * pitchMultiplier);

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (Math.random() * 6 - 3), now);

      const initialVol = (0.25 / (idx + 1)) * (0.8 + Math.random() * 0.4);
      gain.gain.setValueAtTime(initialVol, now);
      // 긴 여운을 남기며 부드럽게 감쇄
      const decayTime = 2.5 + Math.random() * 1.5;
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

      osc.connect(gain);
      gain.connect(this.chimeGain);

      osc.start(now);
      osc.stop(now + decayTime + 0.1);
    });
  }

  // 5. 귀여운 야옹 소리 (Meow Synthesizer)
  playMeow() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = 0.55;

    const osc = this.ctx.createOscillator();
    const formantFilter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';

    // 피치 변화: 시작 낮음 -> 살짝 상승 -> 끝에 내려감
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(360, now + duration);

    // 포먼트 필터 (Meeeee-oowwww 발음 모사)
    formantFilter.type = 'bandpass';
    formantFilter.Q.setValueAtTime(4.0, now);
    formantFilter.frequency.setValueAtTime(1100, now);
    formantFilter.frequency.linearRampToValueAtTime(1900, now + 0.18);
    formantFilter.frequency.linearRampToValueAtTime(750, now + duration);

    // 볼륨 엔벨로프
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(formantFilter);
    formantFilter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  // 6. 🐾 경쾌한 폴짝 점프 효과음 (Boing / Bloop Jump Synth)
  playJump() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = 0.22;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // 피치가 240Hz에서 580Hz로 퐁~ 튀어오름
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + duration * 0.7);
    osc.frequency.exponentialRampToValueAtTime(420, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // 7. 사뿐한 착지 효과음 (Soft Landing Thud)
  playLand() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = 0.12;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // 식빵 굽기 모드 진입 시 골골송 부드럽게 강조
  setLoafMode(active) {
    if (!this.ctx || !this.purrGain) return;
    const now = this.ctx.currentTime;
    const target = active ? this.volumes.purr * 1.8 : this.volumes.purr;
    this.purrGain.gain.linearRampToValueAtTime(target, now + 1.0);
  }

  // 사운드 토글
  toggleSound(enable) {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isMuted = !enable;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(enable ? 1.0 : 0.0, now + 0.5);
    }
    return !this.isMuted;
  }
}

export const soundscape = new SoundscapeEngine();
