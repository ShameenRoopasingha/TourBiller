'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import gsap from 'gsap';
import {
  LayoutDashboard,
  Radio,
  Car,
  CalendarDays,
  CalendarRange,
  Users,
  FileCheck,
  BarChart3,
  Settings,
  PanelLeft,
  X,
  ChevronRight
} from 'lucide-react';

interface ArcItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  lightColor: string;
  darkColor: string;
  badge?: string;
}

const ARC_NAV_ITEMS: ArcItem[] = [
  { id: 'dashboard', name: 'Dashboard', href: '/', icon: LayoutDashboard, lightColor: '#0284c7', darkColor: '#38bdf8' },
  { id: 'tracking', name: 'Live Radar', href: '/live-tracking', icon: Radio, lightColor: '#059669', darkColor: '#10b981', badge: 'LIVE' },
  { id: 'vehicles', name: 'Fleet Vehicles', href: '/vehicles', icon: Car, lightColor: '#d97706', darkColor: '#fbbf24' },
  { id: 'bookings', name: 'Tour Bookings', href: '/bookings', icon: CalendarDays, lightColor: '#4f46e5', darkColor: '#818cf8' },
  { id: 'calendar', name: 'Calendar View', href: '/calendar', icon: CalendarRange, lightColor: '#db2777', darkColor: '#f472b6' },
  { id: 'customers', name: 'Customers', href: '/customers', icon: Users, lightColor: '#0891b2', darkColor: '#22d3ee' },
  { id: 'quotations', name: 'Quotations', href: '/quotations', icon: FileCheck, lightColor: '#7c3aed', darkColor: '#a78bfa' },
  { id: 'reports', name: 'Reports', href: '/reports', icon: BarChart3, lightColor: '#0d9488', darkColor: '#2dd4bf' },
  { id: 'settings', name: 'Settings', href: '/settings', icon: Settings, lightColor: '#475569', darkColor: '#94a3b8' },
];

export function ArcSpinnerNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rotationOffset, setRotationOffset] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const isDark = resolvedTheme === 'dark';

  // Constants for Quarter Circle Geometry & Infinite 360° Loop
  const CONTAINER_SIZE = 320; // 320px x 320px quarter circle
  const ORIGIN_X = 320; // Top-right corner
  const ORIGIN_Y = 0;   // Top-right corner
  const RADIUS = 210;   // Distance of icons from top-right corner
  const FOCAL_ANGLE = 135; // 135 degrees = 45 degrees down-left (focal thumb zone)
  const TOTAL_ITEMS = ARC_NAV_ITEMS.length; // 9 items
  const ANGLE_STEP = 360 / TOTAL_ITEMS; // Exactly 40 degrees per item for seamless 360° wheel

  const menuRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startTouchAngleRef = useRef(0);
  const startOffsetRef = useRef(0);
  const lastAngleRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animProxyRef = useRef({ offset: 0 });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastStepRef = useRef(0);

  // Initialize or resume Web Audio Context on user interaction
  const initAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch {
      // Ignore audio init restrictions
    }
  }, []);

  // Crisp high-pitched mechanical watch ratchet "tiki-tiki" sound
  const playTickSound = useCallback(() => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const now = ctx.currentTime;

      // Primary crisp high-metallic click (~4800Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(4800, now);
      osc1.frequency.exponentialRampToValueAtTime(3200, now + 0.007);

      gain1.gain.setValueAtTime(0.09, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.007);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.008);

      // Secondary micro-click at +3ms (creates the distinct crisp "tiki" gear tooth snap)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(6500, now + 0.003);
      osc2.frequency.exponentialRampToValueAtTime(4400, now + 0.009);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.06, now + 0.003);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.009);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.003);
      osc2.stop(now + 0.010);
    } catch {
      // Silently ignore if audio context is blocked
    }
  }, [initAudio]);

  // Update step, active index, play sound and haptic vibration
  const updateActiveStep = useCallback((offset: number) => {
    const currentStep = Math.round(-offset / ANGLE_STEP);
    if (currentStep !== lastStepRef.current) {
      lastStepRef.current = currentStep;
      const wrappedIdx = ((currentStep % TOTAL_ITEMS) + TOTAL_ITEMS) % TOTAL_ITEMS;
      setActiveIndex(wrappedIdx);
      playTickSound();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(8);
      }
    }
  }, [ANGLE_STEP, TOTAL_ITEMS, playTickSound]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update active item based on current route when opening (shortest rotation)
  useEffect(() => {
    if (isOpen) {
      const currentIdx = ARC_NAV_ITEMS.findIndex(item => item.href === pathname);
      if (currentIdx !== -1) {
        const currentStep = Math.round(-rotationOffset / ANGLE_STEP);
        const currentWrapped = ((currentStep % TOTAL_ITEMS) + TOTAL_ITEMS) % TOTAL_ITEMS;
        let diffSteps = currentIdx - currentWrapped;
        if (diffSteps > TOTAL_ITEMS / 2) diffSteps -= TOTAL_ITEMS;
        if (diffSteps < -TOTAL_ITEMS / 2) diffSteps += TOTAL_ITEMS;

        const targetOffset = -(currentStep + diffSteps) * ANGLE_STEP;
        lastStepRef.current = Math.round(-targetOffset / ANGLE_STEP);
        animProxyRef.current.offset = targetOffset;
        setRotationOffset(targetOffset);
        setActiveIndex(currentIdx);
      }
    }
  }, [isOpen, pathname]);

  // GSAP Open / Close Animation (Zoom In from top right / Zoom Out to top right)
  useEffect(() => {
    if (!isOpen) return;

    if (backdropRef.current && menuRef.current) {
      // Backdrop fade in
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );

      // Clean Zoom In from Top Right
      gsap.fromTo(
        menuRef.current,
        {
          scale: 0,
          opacity: 0,
          transformOrigin: 'top right',
        },
        {
          scale: 1,
          opacity: 1,
          duration: 0.35,
          ease: 'back.out(1.2)',
        }
      );
    }
  }, [isOpen]);

  const closeMenu = useCallback((onFinished?: () => void) => {
    if (menuRef.current && backdropRef.current) {
      // Clean Zoom Out to Top Right
      gsap.to(menuRef.current, {
        scale: 0,
        opacity: 0,
        transformOrigin: 'top right',
        duration: 0.25,
        ease: 'power3.in',
      });
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          setIsOpen(false);
          if (onFinished) onFinished();
        },
      });
    } else {
      setIsOpen(false);
      if (onFinished) onFinished();
    }
  }, []);

  // Helper to compute angle from container's top-right corner
  const getAngleFromEvent = (clientX: number, clientY: number) => {
    if (!menuRef.current) return 0;
    const rect = menuRef.current.getBoundingClientRect();
    const cornerX = rect.right;
    const cornerY = rect.top;

    const dx = clientX - cornerX;
    const dy = clientY - cornerY;
    let deg = Math.atan2(dy, dx) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    return deg;
  };

  // Drag Start (Touch / Mouse)
  const handlePointerDown = (clientX: number, clientY: number) => {
    initAudio();
    isDraggingRef.current = true;
    const currentAngle = getAngleFromEvent(clientX, clientY);
    startTouchAngleRef.current = currentAngle;
    startOffsetRef.current = rotationOffset;
    lastAngleRef.current = currentAngle;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    lastStepRef.current = Math.round(-rotationOffset / ANGLE_STEP);
    gsap.killTweensOf(animProxyRef.current);
  };

  // Drag Move
  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;

    const currentAngle = getAngleFromEvent(clientX, clientY);
    const now = performance.now();
    const dt = Math.max(now - lastTimeRef.current, 1);

    // Delta angle (handling 0/360 wrap)
    let delta = currentAngle - lastAngleRef.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    // Smooth weighted velocity calculation
    const currentVelocity = delta / dt; // deg per ms
    velocityRef.current = velocityRef.current * 0.25 + currentVelocity * 0.75;
    lastTimeRef.current = now;
    lastAngleRef.current = currentAngle;

    const totalAngleDiff = currentAngle - startTouchAngleRef.current;
    const newOffset = startOffsetRef.current + totalAngleDiff;

    animProxyRef.current.offset = newOffset;
    setRotationOffset(newOffset);
    updateActiveStep(newOffset);
  };

  // Drag End (Low Friction Glide & Smooth Snap)
  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Reduced friction: higher inertia multiplier (280)
    const inertiaDistance = velocityRef.current * 280;
    const projectedOffset = animProxyRef.current.offset + inertiaDistance;

    // Snap to nearest discrete step (Infinite loop - no clamping!)
    const currentStep = Math.round(-animProxyRef.current.offset / ANGLE_STEP);
    const targetStep = Math.round(-projectedOffset / ANGLE_STEP);
    const finalTargetOffset = -targetStep * ANGLE_STEP;

    const stepsToTravel = Math.abs(targetStep - currentStep);
    // Smooth dynamic duration for a butter-smooth glide
    const duration = Math.min(1.15, Math.max(0.65, 0.5 + stepsToTravel * 0.12));

    gsap.to(animProxyRef.current, {
      offset: finalTargetOffset,
      duration: duration,
      ease: 'power3.out',
      onUpdate: () => {
        setRotationOffset(animProxyRef.current.offset);
        updateActiveStep(animProxyRef.current.offset);
      },
    });
  };

  // Mouse wheel rotation support
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    initAudio();
    const deltaSteps = e.deltaY > 0 ? 1 : -1;
    const currentStep = Math.round(-rotationOffset / ANGLE_STEP);
    const nextStep = currentStep + deltaSteps;
    const targetOffset = -nextStep * ANGLE_STEP;

    gsap.killTweensOf(animProxyRef.current);
    gsap.to(animProxyRef.current, {
      offset: targetOffset,
      duration: 0.35,
      ease: 'power2.out',
      onUpdate: () => {
        setRotationOffset(animProxyRef.current.offset);
        updateActiveStep(animProxyRef.current.offset);
      },
    });
  };

  // Snap directly to an item along the shortest circular path when clicked
  const handleItemClick = (idx: number, href: string) => {
    initAudio();
    // Compute current angular distance of this item from focal point
    let diff = (idx * ANGLE_STEP + animProxyRef.current.offset) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    const targetOffset = animProxyRef.current.offset - diff;

    gsap.to(animProxyRef.current, {
      offset: targetOffset,
      duration: 0.35,
      ease: 'power3.out',
      onUpdate: () => {
        setRotationOffset(animProxyRef.current.offset);
        updateActiveStep(animProxyRef.current.offset);
      },
      onComplete: () => {
        closeMenu(() => {
          router.push(href);
        });
      },
    });
  };

  return (
    <>
      {/* Mobile Topbar Trigger Button */}
      <div className="md:hidden flex items-center">
        <button
          type="button"
          onClick={() => {
            initAudio();
            setIsOpen(true);
          }}
          className="relative size-9 rounded-full flex items-center justify-center border border-border bg-card/80 hover:bg-card text-foreground shadow-sm active:scale-90 transition-all shrink-0"
          aria-label="Open Navigation Dial"
        >
          <PanelLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>

      {/* Spinnable Arc Overlay via Portal */}
      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[100] md:hidden select-none touch-none">
          {/* Frosted Backdrop */}
          <div
            ref={backdropRef}
            onClick={() => closeMenu()}
            className={`absolute inset-0 transition-opacity ${
              isDark ? 'bg-black/75 backdrop-blur-md' : 'bg-slate-900/40 backdrop-blur-md'
            }`}
          />

          {/* Interactive Quarter-Circle Arc Container */}
          <div
            ref={menuRef}
            className="absolute top-0 right-0 w-[320px] h-[320px] overflow-visible"
            style={{
              transformOrigin: 'top right',
              borderBottomLeftRadius: '100%',
              background: isDark
                ? 'radial-gradient(circle at top right, rgba(15, 23, 42, 0.98) 0%, rgba(2, 6, 23, 0.96) 75%, rgba(6, 78, 59, 0.25) 100%)'
                : 'radial-gradient(circle at top right, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.97) 75%, rgba(209, 250, 229, 0.5) 100%)',
              boxShadow: isDark
                ? '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(16, 185, 129, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.05)'
                : '0 20px 45px rgba(15, 23, 42, 0.18), 0 0 25px rgba(16, 185, 129, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.9)',
              borderLeft: isDark
                ? '1.5px solid rgba(16, 185, 129, 0.3)'
                : '1.5px solid rgba(16, 185, 129, 0.4)',
              borderBottom: isDark
                ? '1.5px solid rgba(16, 185, 129, 0.3)'
                : '1.5px solid rgba(16, 185, 129, 0.4)',
            }}
            onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handlePointerUp}
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* Decorative Arc Guidelines SVG */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
              viewBox="0 0 320 320"
            >
              <circle
                cx="320"
                cy="0"
                r="210"
                fill="none"
                stroke="url(#emeraldGradient)"
                strokeWidth="1.5"
                strokeDasharray="4 6"
              />
              <circle
                cx="320"
                cy="0"
                r="150"
                fill="none"
                stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'}
                strokeWidth="1"
              />
              <defs>
                <linearGradient id="emeraldGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>

            {/* Corner Hub: Close Button & Brand */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
              <div className="flex flex-col items-end mr-1 pointer-events-none">
                <span className={`text-[10px] font-black tracking-widest uppercase ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  VIGIL DIAL
                </span>
                <span className={`text-[9px] font-semibold ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Infinite 360° • Spin
                </span>
              </div>
              <button
                type="button"
                onClick={() => closeMenu()}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform border ${
                  isDark
                    ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-white/95 hover:bg-slate-100 border-slate-200 text-slate-700 shadow-slate-200/50'
                }`}
                aria-label="Close"
              >
                <X className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </button>
            </div>

            {/* Focal Point Indicator (Center of Thumb Arc) */}
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: `${ORIGIN_X + RADIUS * Math.cos((FOCAL_ANGLE * Math.PI) / 180) - 18}px`,
                top: `${ORIGIN_Y + RADIUS * Math.sin((FOCAL_ANGLE * Math.PI) / 180) - 18}px`,
                width: '36px',
                height: '36px',
                borderRadius: '9999px',
                border: isDark ? '2px solid rgba(16, 185, 129, 0.7)' : '2px solid rgba(16, 185, 129, 0.85)',
                boxShadow: isDark ? '0 0 15px rgba(16, 185, 129, 0.4)' : '0 0 15px rgba(16, 185, 129, 0.3)',
              }}
            />

            {/* Render Spinnable Icons along the 360° Infinite Arc */}
            {ARC_NAV_ITEMS.map((item, idx) => {
              // Modulo shortest angular displacement relative to focal angle (135°)
              let diff = (idx * ANGLE_STEP + rotationOffset) % 360;
              if (diff > 180) diff -= 360;
              if (diff < -180) diff += 360;

              // Actual angle in degrees on screen plane
              const angleDeg = FOCAL_ANGLE + diff;
              const angleRad = (angleDeg * Math.PI) / 180;

              // Compute X and Y positions on the arc
              const x = ORIGIN_X + RADIUS * Math.cos(angleRad) - 24; // center 48px width
              const y = ORIGIN_Y + RADIUS * Math.sin(angleRad) - 24; // center 48px height

              const distFromCenter = Math.abs(diff);
              const isFocused = idx === activeIndex;

              // Seamless visibility & smooth opacity fade-out at edges of quarter circle
              const isVisible = angleDeg >= 70 && angleDeg <= 200;
              const scale = isFocused ? 1.25 : Math.max(0.78, 1 - distFromCenter / 140);
              const opacity = isVisible ? Math.max(0, 1 - Math.max(0, distFromCenter - 25) / 50) : 0;

              const Icon = item.icon;
              const isActiveRoute = pathname === item.href;
              const itemColor = isDark ? item.darkColor : item.lightColor;

              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(idx, item.href);
                  }}
                  className="absolute cursor-pointer flex items-center justify-center transition-opacity"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: '48px',
                    height: '48px',
                    opacity: opacity,
                    transform: `scale(${scale})`,
                    zIndex: isFocused ? 25 : 15,
                    pointerEvents: isVisible && opacity > 0.1 ? 'auto' : 'none',
                    display: isVisible ? 'flex' : 'none',
                  }}
                >
                  <div
                    className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border transition-all ${
                      isFocused
                        ? 'bg-emerald-500 text-white border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.6)]'
                        : isActiveRoute
                        ? isDark
                          ? 'bg-slate-800 text-emerald-400 border-emerald-500/50'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-400 shadow-sm'
                        : isDark
                        ? 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                        : 'bg-white text-slate-700 border-slate-200/90 shadow-md hover:bg-slate-50'
                    }`}
                    style={{
                      // Strictly upright, level with screen
                      transform: 'none',
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: isFocused ? '#ffffff' : itemColor }} />

                    {item.badge && (
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-emerald-500 text-white font-black text-[9px] rounded-full shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Active Item Floating Detail Card (Bottom-Left of Arc) */}
            <div
              className="absolute left-6 bottom-6 z-20 pointer-events-auto"
              style={{
                transform: 'translateY(0)',
                animation: 'fadeInUp 0.2s ease-out',
              }}
            >
              {ARC_NAV_ITEMS[activeIndex] && (
                <div
                  onClick={() => {
                    closeMenu(() => {
                      router.push(ARC_NAV_ITEMS[activeIndex].href);
                    });
                  }}
                  className={`backdrop-blur-xl border rounded-2xl p-3 shadow-2xl flex items-center gap-3 cursor-pointer active:scale-95 transition-transform ${
                    isDark
                      ? 'bg-slate-900/95 border-emerald-500/40 text-white'
                      : 'bg-white/95 border-emerald-500/40 text-slate-900 shadow-slate-300/40'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${isDark ? ARC_NAV_ITEMS[activeIndex].darkColor : ARC_NAV_ITEMS[activeIndex].lightColor}20`
                    }}
                  >
                    {React.createElement(ARC_NAV_ITEMS[activeIndex].icon, {
                      className: 'w-5 h-5',
                      style: {
                        color: isDark ? ARC_NAV_ITEMS[activeIndex].darkColor : ARC_NAV_ITEMS[activeIndex].lightColor
                      },
                    })}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {ARC_NAV_ITEMS[activeIndex].name}
                      </span>
                      <ChevronRight className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isDark ? 'text-emerald-400' : 'text-emerald-600'
                    }`}>
                      Tap to open
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
