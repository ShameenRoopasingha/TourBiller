'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function UploadAvatarContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setErrorMessage('Please select a valid image file (JPEG, PNG, WEBP).');
            return;
        }

        setErrorMessage(null);
        setUploadSuccess(false);

        // Resize and convert to square 1:1 Base64 via Canvas
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const SIZE = 400; // Optimal 400x400 avatar resolution
                canvas.width = SIZE;
                canvas.height = SIZE;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Center crop to 1:1 aspect ratio
                const minSide = Math.min(img.width, img.height);
                const startX = (img.width - minSide) / 2;
                const startY = (img.height - minSide) / 2;

                ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, SIZE, SIZE);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                setSelectedImage(dataUrl);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedImage) {
            setErrorMessage('Please choose a photo first.');
            return;
        }

        if (!token) {
            setErrorMessage('Driver authentication session is missing. Please reopen from the Vigil Driver App.');
            return;
        }

        setIsUploading(true);
        setErrorMessage(null);

        try {
            const response = await fetch('/api/driver/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    avatarUrl: selectedImage,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setUploadSuccess(true);
            } else {
                setErrorMessage(data.error || 'Failed to save profile picture.');
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Network error occurred while saving photo.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mb-3 text-2xl">
                        👤
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Chauffeur Profile Picture</h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Select a photo from your phone files or take a selfie to display on your passenger itineraries.
                    </p>
                </div>

                {/* Photo Preview / Picker Area */}
                <div className="flex flex-col items-center mb-6">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-36 h-36 rounded-full border-4 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-slate-800/80 flex items-center justify-center cursor-pointer overflow-hidden transition-all group shadow-lg"
                    >
                        {selectedImage ? (
                            <img 
                                src={selectedImage} 
                                alt="Driver Preview" 
                                className="w-full h-full object-cover" 
                            />
                        ) : (
                            <div className="text-center p-2">
                                <span className="text-3xl block mb-1">📁</span>
                                <span className="text-[11px] font-semibold text-emerald-400 block">Tap to Browse</span>
                                <span className="text-[9px] text-slate-400">Photos & Files</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold">
                            Change Photo
                        </div>
                    </div>

                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="hidden" 
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
                    >
                        {selectedImage ? 'Choose a different photo' : 'Select from Mobile Gallery / Camera'}
                    </button>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-xs text-red-400 text-center">
                        ⚠️ {errorMessage}
                    </div>
                )}

                {/* Success Banner */}
                {uploadSuccess ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
                        <div className="text-2xl mb-1">🎉</div>
                        <h3 className="text-sm font-bold text-emerald-400">Profile Photo Updated!</h3>
                        <p className="text-xs text-slate-300 mt-1 mb-3">
                            Your photo has been saved to the fleet database. Please return to the Vigil Driver App now.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.close()}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                        >
                            Done (Close this window)
                        </button>
                    </div>
                ) : (
                    /* Save Action Button */
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={isUploading || !selectedImage}
                        className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                            !selectedImage
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                : isUploading
                                ? 'bg-emerald-700 text-white cursor-wait'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 active:scale-[0.98]'
                        }`}
                    >
                        {isUploading ? (
                            <>
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                Saving Profile Photo...
                            </>
                        ) : (
                            <>
                                <span>💾</span> Save as Profile Picture
                            </>
                        )}
                    </button>
                )}

                <div className="mt-5 text-center">
                    <span className="text-[11px] text-slate-500">
                        Vigil Fleet Portal • End-to-End Encrypted
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function DriverUploadAvatarPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">Loading uploader...</div>}>
            <UploadAvatarContent />
        </Suspense>
    );
}
