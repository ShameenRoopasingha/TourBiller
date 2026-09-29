'use client';

import { toast, type ToastContent, type ToastOptions } from 'react-toastify';

type SoundType = 'success' | 'error' | 'info' | 'warning';
type Tone = { frequency: number; waveform: OscillatorType; delay: number };

const notificationTones: Record<SoundType, Tone[]> = {
    success: [
        { frequency: 660, waveform: 'sine', delay: 0 },
        { frequency: 880, waveform: 'sine', delay: 0.11 },
    ],
    error: [
        { frequency: 330, waveform: 'triangle', delay: 0 },
        { frequency: 220, waveform: 'triangle', delay: 0.14 },
    ],
    info: [{ frequency: 587, waveform: 'sine', delay: 0 }],
    warning: [
        { frequency: 440, waveform: 'triangle', delay: 0 },
        { frequency: 440, waveform: 'triangle', delay: 0.18 },
    ],
};

let audioContext: AudioContext | null = null;

function getAudioContext() {
    if (typeof window === 'undefined' || !window.AudioContext) return null;

    audioContext ??= new window.AudioContext();
    return audioContext;
}

export function unlockNotificationSounds() {
    const context = getAudioContext();
    if (context?.state === 'suspended') {
        void context.resume().catch(() => undefined);
    }
}

function playNotificationSound(type: SoundType) {
    try {
        const context = getAudioContext();
        if (!context) return;
        if (context.state === 'suspended') void context.resume().catch(() => undefined);

        const startAt = context.currentTime;
        for (const tone of notificationTones[type]) {
            const start = startAt + tone.delay;
            const oscillator = context.createOscillator();
            const gain = context.createGain();

            oscillator.type = tone.waveform;
            oscillator.frequency.setValueAtTime(tone.frequency, start);
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.035, start + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(start);
            oscillator.stop(start + 0.13);
        }
    } catch {
        // A blocked or unavailable audio device must not prevent the toast.
    }
}

function showToast(type: SoundType, content: ToastContent, options?: ToastOptions) {
    playNotificationSound(type);
    return toast[type === 'warning' ? 'warn' : type](content, options);
}

export const notify = {
    success: (content: ToastContent, options?: ToastOptions) => showToast('success', content, options),
    error: (content: ToastContent, options?: ToastOptions) => showToast('error', content, options),
    info: (content: ToastContent, options?: ToastOptions) => showToast('info', content, options),
    warning: (content: ToastContent, options?: ToastOptions) => showToast('warning', content, options),
};