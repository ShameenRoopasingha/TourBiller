'use client';

import { ToastContainer } from 'react-toastify';

export function ToastProvider() {
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