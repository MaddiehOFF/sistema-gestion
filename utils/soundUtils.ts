
// Professional Sound Engine using Web Audio API
// No external assets required.

const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

const playTone = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
};

export const playSound = (type: 'CLICK' | 'SUCCESS' | 'ERROR' | 'LOGIN' | 'HOVER') => {
    try {
        switch (type) {
            case 'CLICK':
                // Subtle click
                playTone(400, 'sine', 0.1, 0.05);
                break;
            case 'HOVER':
                // Very subtle hover
                playTone(200, 'sine', 0.05, 0.01);
                break;
            case 'SUCCESS':
                // Pleasant chime (Two tones)
                playTone(500, 'sine', 0.2, 0.1);
                setTimeout(() => playTone(800, 'sine', 0.3, 0.1), 100);
                break;
            case 'ERROR':
                // Soft thud
                playTone(150, 'triangle', 0.2, 0.1);
                break;
            case 'LOGIN':
                // Startup sound
                playTone(300, 'sine', 0.4, 0.1);
                setTimeout(() => playTone(400, 'sine', 0.4, 0.1), 100);
                setTimeout(() => playTone(600, 'sine', 0.8, 0.1), 200);
                break;
        }
    } catch (e) {
        // Silent fail if audio context not supported
    }
};
