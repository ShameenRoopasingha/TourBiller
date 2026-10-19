'use client';

/**
 * Dispatch Emergency Sound Alert Engine
 * Generates high-impact, realistic acoustic alert signatures using Web Audio API:
 * 
 * 1. 🚨 Breakdown Alarm (High Emergency Siren):
 *    - Real emergency vehicle / control-room fast wail siren (~3.4s duration).
 *    - Dual detuned oscillators (sawtooth + triangle) modulated by a 2.4Hz LFO
 *      sweeping between 600Hz and 1320Hz through a resonant acoustic filter.
 * 
 * 2. ⚠️ Handover Chime (Attention Chime):
 *    - Extended resonant two-phase attention chime (~2.6s duration).
 *    - Harmonic bell-tone arpeggio (C5 -> E5 -> G5 -> C6 followed by high chime resonance).
 */

let audioCtx: AudioContext | null = null;
let currentActiveSources: { stop: () => void }[] = [];

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
        audioCtx = new AudioContextClass();
    }
    return audioCtx;
}

export function isDispatchAudioEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('vigil_dispatch_audio_enabled');
    return stored === null ? true : stored === 'true';
}

export function setDispatchAudioEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('vigil_dispatch_audio_enabled', enabled ? 'true' : 'false');
    if (!enabled) {
        stopDispatchAudio();
    }
}

/**
 * Stop any ongoing siren or chime immediately
 */
export function stopDispatchAudio(): void {
    try {
        currentActiveSources.forEach(src => {
            try { src.stop(); } catch {}
        });
        currentActiveSources = [];
    } catch {}
}

/**
 * Unlock audio context on user gesture (click/tap) to satisfy browser autoplay policies
 */
export async function unlockDispatchAudio(): Promise<void> {
    try {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            await ctx.resume();
        }
    } catch {
        // Ignore gesture errors
    }
}

/**
 * 🚨 Emergency Vehicle Breakdown Siren
 * High-urgency, authentic electronic emergency siren (~3.4 seconds).
 * Continuous pitch-sweep wail (600Hz - 1320Hz) with resonant filtering.
 */
export function playBreakdownAlarm(force = false): void {
    if (!force && !isDispatchAudioEnabled()) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);

        // Stop any previously playing sounds so they don't clash
        stopDispatchAudio();

        const now = ctx.currentTime;
        const totalDuration = 3.4; // Extended playback duration (3.4 seconds)

        // 1. Resonant acoustic filter for piercing electronic emergency horn tone
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, now);
        filter.Q.setValueAtTime(2.2, now);

        // 2. Master Gain Envelope
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.001, now);
        masterGain.gain.linearRampToValueAtTime(0.28, now + 0.08); // Rapid attack
        masterGain.gain.setValueAtTime(0.28, now + totalDuration - 0.4); // Hold high
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + totalDuration); // Clean release

        filter.connect(masterGain);
        masterGain.connect(ctx.destination);

        // 3. LFO (Low-Frequency Oscillator) for rapid emergency pitch modulation
        // 2.4 Hz = ~8 dramatic siren sweeps over 3.4 seconds
        const lfo = ctx.createOscillator();
        lfo.type = 'triangle';
        lfo.frequency.setValueAtTime(2.4, now);

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(360, now); // Sweeps +/- 360 Hz around center 960 Hz (600Hz to 1320Hz)
        lfo.connect(lfoGain);

        // 4. Primary Siren Oscillator (Sawtooth - rich emergency harmonics)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(960, now);
        lfoGain.connect(osc1.frequency);
        osc1.connect(filter);

        // 5. Secondary Siren Oscillator (Triangle - thickens the horn body, slightly detuned)
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(960, now);
        osc2.detune.setValueAtTime(14, now); // +14 cents detune for realistic emergency chorus
        lfoGain.connect(osc2.frequency);
        osc2.connect(filter);

        // 6. Rapid alert beeps at the initial attack (strobe chirp)
        const chirpOsc = ctx.createOscillator();
        const chirpGain = ctx.createGain();
        chirpOsc.type = 'square';
        chirpOsc.frequency.setValueAtTime(1200, now);
        chirpGain.gain.setValueAtTime(0.12, now);
        chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        chirpOsc.connect(chirpGain);
        chirpGain.connect(ctx.destination);

        // Start all sound generators
        lfo.start(now);
        osc1.start(now);
        osc2.start(now);
        chirpOsc.start(now);

        // Stop all sound generators
        const stopTime = now + totalDuration + 0.05;
        lfo.stop(stopTime);
        osc1.stop(stopTime);
        osc2.stop(stopTime);
        chirpOsc.stop(now + 0.16);

        // Register for manual cancellation if muted
        currentActiveSources.push(
            { stop: () => { try { osc1.stop(); } catch {} } },
            { stop: () => { try { osc2.stop(); } catch {} } },
            { stop: () => { try { lfo.stop(); } catch {} } }
        );

        setTimeout(() => {
            currentActiveSources = [];
        }, (totalDuration + 0.2) * 1000);

    } catch (e) {
        console.warn('Unable to play breakdown alarm sound', e);
    }
}

/**
 * ⚠️ Mid-Tour Handover Attention Chime
 * Extended 2-phase melodic bell chime (~2.6 seconds)
 * Phase 1: Ascending 4-tone arpeggio (C5 -> E5 -> G5 -> C6)
 * Phase 2: High confirmation resonance chime with gentle sustained decay.
 */
export function playHandoverChime(force = false): void {
    if (!force && !isDispatchAudioEnabled()) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);

        // Stop any previously playing sounds
        stopDispatchAudio();

        const now = ctx.currentTime;

        // Sequence of notes with timing, frequency, and sustain
        const sequence = [
            // Phase 1: Rising attention arpeggio
            { freq: 523.25, time: 0.00, duration: 0.28, gain: 0.18 }, // C5
            { freq: 659.25, time: 0.22, duration: 0.28, gain: 0.20 }, // E5
            { freq: 783.99, time: 0.44, duration: 0.32, gain: 0.22 }, // G5
            { freq: 1046.50, time: 0.68, duration: 0.45, gain: 0.24 }, // C6

            // Phase 2: Resonant resolution chime with long tail (after 0.25s pause)
            { freq: 659.25, time: 1.15, duration: 0.35, gain: 0.18 }, // E5
            { freq: 880.00, time: 1.35, duration: 0.40, gain: 0.22 }, // A5
            { freq: 1046.50, time: 1.58, duration: 1.05, gain: 0.25 }, // C6 sustained bell decay
        ];

        const totalDuration = 2.65;

        sequence.forEach(({ freq, time, duration, gain }) => {
            const start = now + time;

            // Fundamental bell tone (sine)
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            noteGain.gain.setValueAtTime(0.001, start);
            noteGain.gain.linearRampToValueAtTime(gain, start + 0.025);
            noteGain.gain.exponentialRampToValueAtTime(0.001, start + duration);

            osc.connect(noteGain);
            noteGain.connect(ctx.destination);

            // Subtle harmonic overtone (octave higher at low volume for crystal clarity)
            const overtone = ctx.createOscillator();
            const overtoneGain = ctx.createGain();

            overtone.type = 'sine';
            overtone.frequency.setValueAtTime(freq * 2, start);

            overtoneGain.gain.setValueAtTime(0.001, start);
            overtoneGain.gain.linearRampToValueAtTime(gain * 0.25, start + 0.02);
            overtoneGain.gain.exponentialRampToValueAtTime(0.001, start + duration * 0.6);

            overtone.connect(overtoneGain);
            overtoneGain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + duration + 0.05);

            overtone.start(start);
            overtone.stop(start + duration + 0.05);

            currentActiveSources.push(
                { stop: () => { try { osc.stop(); } catch {} } },
                { stop: () => { try { overtone.stop(); } catch {} } }
            );
        });

        setTimeout(() => {
            currentActiveSources = [];
        }, (totalDuration + 0.2) * 1000);

    } catch (e) {
        console.warn('Unable to play handover chime sound', e);
    }
}
