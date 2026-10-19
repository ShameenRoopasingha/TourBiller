'use client';

/**
 * Dispatch Emergency Sound Alert Engine
 * Generates distinct acoustic alert signatures using Web Audio API:
 * 1. Breakdown Alarm: High-urgency 3-pulse emergency siren warble (sawtooth + triangle)
 * 2. Handover Chime: Melodic 3-tone rising attention chime (C5 -> E5 -> G5 sine)
 */

let audioCtx: AudioContext | null = null;

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
 * 🚨 Emergency Breakdown Siren Alarm
 * Rapid 3-burst warning siren for vehicle defects and roadside breakdowns.
 */
export function playBreakdownAlarm(force = false): void {
    if (!force && !isDispatchAudioEnabled()) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);

        const now = ctx.currentTime;

        // Pulse 1: 880Hz down to 587Hz (0.0s - 0.22s)
        createSirenPulse(ctx, now, 880, 587, 0.22);

        // Pulse 2: 880Hz down to 587Hz (0.28s - 0.50s)
        createSirenPulse(ctx, now + 0.28, 880, 587, 0.22);

        // Pulse 3: 1046Hz high warning tone (0.56s - 0.90s)
        createHighUrgencyPulse(ctx, now + 0.56, 1046, 0.34);
    } catch (e) {
        console.warn('Unable to play breakdown alarm sound', e);
    }
}

function createSirenPulse(ctx: AudioContext, start: number, freqStart: number, freqEnd: number, duration: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freqStart, start);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, start + duration);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration + 0.05);
}

function createHighUrgencyPulse(ctx: AudioContext, start: number, freq: number, duration: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.22, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration + 0.05);
}

/**
 * ⚠️ Mid-Tour Handover Attention Chime
 * Smooth, distinctive 3-tone rising musical arpeggio (C5 -> E5 -> G5)
 */
export function playHandoverChime(force = false): void {
    if (!force && !isDispatchAudioEnabled()) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);

        const now = ctx.currentTime;
        const notes = [
            { freq: 523.25, time: 0, duration: 0.16 },    // C5
            { freq: 659.25, time: 0.15, duration: 0.16 }, // E5
            { freq: 783.99, time: 0.30, duration: 0.40 }, // G5
        ];

        notes.forEach(({ freq, time, duration }) => {
            const start = now + time;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.001, start);
            gain.gain.linearRampToValueAtTime(0.16, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + duration + 0.05);
        });
    } catch (e) {
        console.warn('Unable to play handover chime sound', e);
    }
}
