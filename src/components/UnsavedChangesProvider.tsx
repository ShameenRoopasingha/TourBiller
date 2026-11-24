'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Save, Trash2, ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export interface UnsavedGuardConfig {
  isDirty: boolean;
  title?: string;
  description?: string;
  onSave?: () => Promise<boolean>;
}

interface UnsavedChangesContextValue {
  isDirty: boolean;
  registerGuard: (id: string, config: UnsavedGuardConfig) => void;
  unregisterGuard: (id: string) => void;
  confirmNavigation: (action: () => void) => void;
  clearAllGuards: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue>({
  isDirty: false,
  registerGuard: () => {},
  unregisterGuard: () => {},
  confirmNavigation: (action) => action(),
  clearAllGuards: () => {},
});

export function useUnsavedChangesContext() {
  return useContext(UnsavedChangesContext);
}

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const guardsRef = useRef<Map<string, UnsavedGuardConfig>>(new Map());
  const [guardVersion, setGuardVersion] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const hasSentinelRef = useRef(false);
  const bypassPopRef = useRef(false);
  const currentHrefRef = useRef('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      currentHrefRef.current = window.location.href;
    }
    hasSentinelRef.current = false;
    setDialogOpen(false);
    pendingActionRef.current = null;
  }, [pathname]);

  const activeDirtyGuard = useMemo(() => {
    void guardVersion;
    for (const config of guardsRef.current.values()) {
      if (config.isDirty) {
        return config;
      }
    }
    return null;
  }, [guardVersion]);

  const isDirty = Boolean(activeDirtyGuard);

  const registerGuard = useCallback((id: string, config: UnsavedGuardConfig) => {
    const prev = guardsRef.current.get(id);
    if (
      prev &&
      prev.isDirty === config.isDirty &&
      prev.title === config.title &&
      prev.description === config.description &&
      prev.onSave === config.onSave
    ) {
      // Keep latest onSave ref without unnecessary re-render if flags didn't change
      guardsRef.current.set(id, config);
      return;
    }
    guardsRef.current.set(id, config);
    setGuardVersion((v) => v + 1);
  }, []);

  const unregisterGuard = useCallback((id: string) => {
    if (guardsRef.current.has(id)) {
      guardsRef.current.delete(id);
      setGuardVersion((v) => v + 1);
    }
  }, []);

  const clearAllGuards = useCallback(() => {
    guardsRef.current.clear();
    hasSentinelRef.current = false;
    setGuardVersion((v) => v + 1);
  }, []);

  const confirmNavigation = useCallback(
    (action: () => void) => {
      let dirty = false;
      for (const config of guardsRef.current.values()) {
        if (config.isDirty) {
          dirty = true;
          break;
        }
      }

      if (!dirty) {
        action();
        return;
      }

      pendingActionRef.current = action;
      setDialogOpen(true);
    },
    []
  );

  // 1. Browser tab close / page reload protection
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // 2. Push history sentinel when becoming dirty so browser Back/Forward can be intercepted
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isDirty && !hasSentinelRef.current) {
      if (!window.history.state?.__vigilUnsavedGuard) {
        window.history.pushState(
          { ...(window.history.state || {}), __vigilUnsavedGuard: true },
          '',
          window.location.href
        );
      }
      hasSentinelRef.current = true;
    }
  }, [isDirty]);

  // 3. Intercept browser Back / Forward button via popstate
  useEffect(() => {
    const handlePopState = () => {
      if (bypassPopRef.current) {
        bypassPopRef.current = false;
        return;
      }

      let dirty = false;
      for (const config of guardsRef.current.values()) {
        if (config.isDirty) {
          dirty = true;
          break;
        }
      }

      if (!dirty) return;

      // Immediately restore sentinel so user remains on current page while deciding
      window.history.pushState(
        { ...(window.history.state || {}), __vigilUnsavedGuard: true },
        '',
        currentHrefRef.current || window.location.href
      );
      hasSentinelRef.current = true;

      pendingActionRef.current = () => {
        bypassPopRef.current = true;
        hasSentinelRef.current = false;
        clearAllGuards();
        window.history.go(-2);
      };
      setDialogOpen(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [clearAllGuards]);

  // 4. Intercept all internal <a> / Next.js <Link> clicks in capture phase
  useEffect(() => {
    if (!isDirty) return;

    const handleDocumentClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref) return;
      if (
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        rawHref.startsWith('#') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:') ||
        rawHref.startsWith('javascript:')
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      // External origin links open normally or let browser handle
      if (url.origin !== window.location.origin) {
        return;
      }

      const nextPath = `${url.pathname}${url.search}${url.hash}`;
      const currPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextPath === currPath) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      confirmNavigation(() => {
        router.push(`${url.pathname}${url.search}${url.hash}`);
      });
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [isDirty, confirmNavigation, router]);

  const handleKeepEditing = () => {
    if (isSaving) return;
    pendingActionRef.current = null;
    setDialogOpen(false);
  };

  const handleDiscardAndLeave = () => {
    if (isSaving) return;
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    clearAllGuards();
    setDialogOpen(false);
    if (action) {
      action();
    }
  };

  const handleSaveAndContinue = async () => {
    if (!activeDirtyGuard?.onSave || isSaving) return;
    setIsSaving(true);
    try {
      const saved = await activeDirtyGuard.onSave();
      if (saved) {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        clearAllGuards();
        setDialogOpen(false);
        if (action) {
          action();
        }
      } else {
        // Validation or API error: close dialog so user can inspect form errors
        pendingActionRef.current = null;
        setDialogOpen(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const contextValue = useMemo(
    () => ({
      isDirty,
      registerGuard,
      unregisterGuard,
      confirmNavigation,
      clearAllGuards,
    }),
    [isDirty, registerGuard, unregisterGuard, confirmNavigation, clearAllGuards]
  );

  return (
    <UnsavedChangesContext.Provider value={contextValue}>
      {children}

      <AlertDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            handleKeepEditing();
          }
        }}
      >
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-[560px] border border-border bg-card shadow-2xl rounded-2xl p-6">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-lg font-bold text-foreground">
                {activeDirtyGuard?.title || 'Discard Current Task?'}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
              {activeDirtyGuard?.description ||
                'You have unsaved changes on this page. Do you want to discard your current work before leaving?'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2.5 sm:space-x-0 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDiscardAndLeave}
              disabled={isSaving}
              className="w-full sm:w-auto h-10 px-4 whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-1.5 shrink-0" />
              Discard & Leave
            </Button>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleKeepEditing}
                disabled={isSaving}
                className="w-full sm:w-auto h-10 px-4 whitespace-nowrap cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5 shrink-0" />
                Keep Editing
              </Button>

              {activeDirtyGuard?.onSave && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveAndContinue}
                  disabled={isSaving}
                  className="w-full sm:w-auto h-10 px-4 whitespace-nowrap bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1.5 shrink-0 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1.5 shrink-0" />
                  )}
                  {isSaving ? 'Saving...' : 'Save & Continue'}
                </Button>
              )}
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedChangesContext.Provider>
  );
}
