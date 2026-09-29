'use client';

import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { unlockNotificationSounds } from '@/lib/notifications';

export function ToastProvider() {
    useEffect(() => {
        const unlockAudio = () => {
            unlockNotificationSounds();
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };

        window.addEventListener('pointerdown', unlockAudio);
        window.addEventListener('keydown', unlockAudio);

        return () => {
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    return (
        <ToastContainer
            position="top-right"
            autoClose={4000}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            limit={4}
        />
    );
}