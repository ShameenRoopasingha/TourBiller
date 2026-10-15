'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
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
  Compass,
  PanelLeft,
  X,
  ChevronRight
} from 'lucide-react';

interface ArcItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
}

const ARC_NAV_ITEMS: ArcItem[] = [
  { id: 'dashboard', name: 'Dashboard', href: '/', icon: LayoutDashboard, color: '#38bdf8' },
  { id: 'tracking', name: 'Live Radar', href: '/live-tracking', icon: Radio, color: '#10b981', badge: 'LIVE' },
  { id: 'vehicles', name: 'Fleet Vehicles', href: '/vehicles', icon: Car, color: '#f59e0b' },
  { id: 'bookings', name: 'Tour Bookings', href: '/bookings', icon: CalendarDays, color: '#6366f1' },
  { id: 'calendar', name: 'Calendar View', href: '/calendar', icon: CalendarRange, color: '#ec4899' },
  { id: 'customers', name: 'Customers', href: '/customers', icon: Users, color: '#06b6d4' },
  { id: 'quotations', name: 'Quotations', href: '/quotations', icon: FileCheck, color: '#8b5cf6' },
  { id: 'reports', name: 'Reports', href: '/reports', icon: BarChart3, color: '#14b8a6' },
  { id: 'settings', name: 'Settings', href: '/settings', icon: Settings, color: '#94a3b8' },
];

export function ArcSpinnerNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rotationOffset, setRotationOffset] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Constants for Quarter Circle Geometry
  const CONTAINER_SIZE = 320; // 320px x 320px quarter circle
  const ORIGIN_X = 320; // Top-right corner
  const ORIGIN_Y = 0;   // Top-right corner
  const RADIUS = 210;   // Distance of icons from top-right corner
  const FOCAL_ANGLE = 135; // 135 degrees = 45 degrees down-left (focal thumb zone)
  const ANGLE_STEP = 34; // Angular spacing between items in degrees

  const menuRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startTouchAngleRef = useRef(0);
  const startOffsetRef = useRef(0);
  const lastAngleRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animProxyRef = useRef({ offset: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update active item based on current route when opening
  useEffect(() => {
    if (isOpen) {
      const currentIdx = ARC_NAV_ITEMS.findIndex(item => item.href === pathname);
      if (currentIdx !== -1) {
        const targetOffset = -currentIdx * ANGLE_STEP;
        animProxyRef.current.offset = targetOffset;
        setRotationOffset(targetOffset);
        setActiveIndex(currentIdx);
      }
    }
  }, [isOpen, pathname]);

  // GSAP Open / Close Animation
  useEffect(() => {
    if (!isOpen) return;

    if (backdropRef.current && menuRef.current) {
      // Backdrop fade in
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );

      // Quarter-circle spring reveal from top-right corner
      gsap.fromTo(
        menuRef.current,
        {
          scale: 0,
          opacity: 0,
          rotation: -45,
          transformOrigin: 'top right',
        },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.5,
          ease: 'back.out(1.5)',
        }
      );
    }
  }, [isOpen]);

  const closeMenu = useCallback(() => {
    if (menuRef.current && backdropRef.current) {
      gsap.to(menuRef.current, {
        scale: 0,
        opacity: 0,
        rotation: -30,
        duration: 0.25,
        ease: 'power3.in',
      });
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => setIsOpen(false),
      });
    } else {
      setIsOpen(false);
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
    // atan2 returns radians from -PI to PI
    let deg = Math.atan2(dy, dx) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    return deg;
  };

  // Drag Start (Touch / Mouse)
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    const currentAngle = getAngleFromEvent(clientX, clientY);
    startTouchAngleRef.current = currentAngle;
    startOffsetRef.current = rotationOffset;
    lastAngleRef.current = currentAngle;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
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

    velocityRef.current = delta / dt; // deg per ms
    lastTimeRef.current = now;
    lastAngleRef.current = currentAngle;

    const totalAngleDiff = currentAngle - startTouchAngleRef.current;
    const newOffset = startOffsetRef.current + totalAngleDiff;

    animProxyRef.current.offset = newOffset;
    setRotationOffset(newOffset);

    // Find closest index
    const closestIdx = Math.round(-newOffset / ANGLE_STEP);
    const clampedIdx = Math.max(0, Math.min(ARC_NAV_ITEMS.length - 1, closestIdx));
    if (clampedIdx !== activeIndex) {
      setActiveIndex(clampedIdx);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(8);
      }
    }
  };

  // Drag End (Spin Inertia & Snap to item)
  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Projected target angle with inertia
    const inertiaDistance = velocityRef.current * 160;
    const projectedOffset = animProxyRef.current.offset + inertiaDistance;

    // Snap to nearest item index
    let targetIdx = Math.round(-projectedOffset / ANGLE_STEP);
    targetIdx = Math.max(0, Math.min(ARC_NAV_ITEMS.length - 1, targetIdx));

    const finalTargetOffset = -targetIdx * ANGLE_STEP;
    setActiveIndex(targetIdx);

    gsap.to(animProxyRef.current, {
      offset: finalTargetOffset,
      duration: 0.55,
      ease: 'elastic.out(1, 0.75)',
      onUpdate: () => {
        setRotationOffset(animProxyRef.current.offset);
      },
    });
  };

  // Snap directly to an item when clicked
  const handleItemClick = (idx: number, href: string) => {
    const targetOffset = -idx * ANGLE_STEP;
    setActiveIndex(idx);

    gsap.to(animProxyRef.current, {
      offset: targetOffset,
      duration: 0.4,
      ease: 'power3.out',
      onUpdate: () => setRotationOffset(animProxyRef.current.offset),
      onComplete: () => {
        closeMenu();
        router.push(href);
      },
    });
  };

  return (
    <>
      {/* Mobile Topbar Trigger Button */}
      <div className="md:hidden flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative size-9 rounded-full flex items-center justify-center border border-border bg-card/60 hover:bg-card text-foreground shadow-sm active:scale-90 transition-all shrink-0"
          aria-label="Open Navigation Dial"
        >
          <PanelLeft className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* Spinnable Arc Overlay via Portal */}
      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[100] md:hidden select-none touch-none">
          {/* Frosted Backdrop */}
          <div
            ref={backdropRef}
            onClick={closeMenu}
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
          />

          {/* Interactive Quarter-Circle Arc Container */}
          <div
            ref={menuRef}
            className="absolute top-0 right-0 w-[320px] h-[320px] overflow-visible"
            style={{
              borderBottomLeftRadius: '100%',
              background: 'radial-gradient(circle at top right, rgba(15, 23, 42, 0.98) 0%, rgba(2, 6, 23, 0.96) 75%, rgba(6, 78, 59, 0.25) 100%)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(16, 185, 129, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.05)',
              borderLeft: '1.5px solid rgba(16, 185, 129, 0.3)',
              borderBottom: '1.5px solid rgba(16, 185, 129, 0.3)',
            }}
            onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handlePointerUp}
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
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
                stroke="rgba(255, 255, 255, 0.08)"
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
                <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">VIGIL DIAL</span>
                <span className="text-[9px] text-slate-400 font-semibold">Spin along arc</span>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className="w-10 h-10 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-emerald-400" />
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
                border: '2px solid rgba(16, 185, 129, 0.7)',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
              }}
            />

            {/* Render Spinnable Icons along the Arc */}
            {ARC_NAV_ITEMS.map((item, idx) => {
              // Calculate angle for this item
              const angleDeg = FOCAL_ANGLE + (idx * ANGLE_STEP) + rotationOffset;
              const angleRad = (angleDeg * Math.PI) / 180;

              // Compute X and Y positions on the arc
              const x = ORIGIN_X + RADIUS * Math.cos(angleRad) - 24; // center 48px width
              const y = ORIGIN_Y + RADIUS * Math.sin(angleRad) - 24; // center 48px height

              // Angular distance from focal center (135 deg)
              const distFromCenter = Math.abs(angleDeg - FOCAL_ANGLE);
              const isFocused = idx === activeIndex;

              // Visibility & scale calculations
              const isVisible = angleDeg >= 80 && angleDeg <= 190;
              const scale = isFocused ? 1.25 : Math.max(0.8, 1 - distFromCenter / 120);
              const opacity = isVisible ? Math.max(0.2, 1 - distFromCenter / 70) : 0;

              const Icon = item.icon;
              const isActiveRoute = pathname === item.href;

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
                    pointerEvents: isVisible ? 'auto' : 'none',
                    display: isVisible ? 'flex' : 'none',
                  }}
                >
                  <div
                    className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border transition-all ${
                      isFocused
                        ? 'bg-emerald-500 text-white border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.6)]'
                        : isActiveRoute
                        ? 'bg-slate-800 text-emerald-400 border-emerald-500/50'
                        : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                    }`}
                    style={{
                      // Counter-rotation to keep the icon upright at all times
                      transform: `rotate(${-angleDeg + 90}deg)`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: isFocused ? '#ffffff' : item.color }} />

                    {item.badge && (
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-full shadow-sm">
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
                    closeMenu();
                    router.push(ARC_NAV_ITEMS[activeIndex].href);
                  }}
                  className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3 shadow-2xl flex items-center gap-3 cursor-pointer active:scale-95 transition-transform"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${ARC_NAV_ITEMS[activeIndex].color}20` }}
                  >
                    {React.createElement(ARC_NAV_ITEMS[activeIndex].icon, {
                      className: 'w-5 h-5',
                      style: { color: ARC_NAV_ITEMS[activeIndex].color },
                    })}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-white">
                        {ARC_NAV_ITEMS[activeIndex].name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
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
