'use client';

import { useEffect, useId, useRef } from 'react';
import { useUnsavedChangesContext } from '@/components/UnsavedChangesProvider';

export interface UseUnsavedChangesOptions {
  title?: string;
  description?: string;
  onSave?: () => Promise<boolean>;
}

/**
 * Registers the current form/task with the global UnsavedChangesProvider.
 * Intercepts internal links, ArcSpinnerNavbar, browser back/forward, and tab close
 * while `isDirty` is true.
 */
export function useUnsavedChanges(
  isDirty: boolean,
  options?: UseUnsavedChangesOptions
) {
  const id = useId();
  const {
    registerGuard,
    unregisterGuard,
    confirmNavigation,
    clearAllGuards,
  } = useUnsavedChangesContext();

  const onSaveRef = useRef(options?.onSave);
  const hasOnSave = Boolean(options?.onSave);

  useEffect(() => {
    onSaveRef.current = options?.onSave;
  }, [options?.onSave]);

  useEffect(() => {
    registerGuard(id, {
      isDirty,
      title: options?.title,
      description: options?.description,
      onSave: hasOnSave ? () => onSaveRef.current!() : undefined,
    });
  }, [id, isDirty, options?.title, options?.description, hasOnSave, registerGuard]);

  useEffect(() => {
    return () => {
      unregisterGuard(id);
    };
  }, [id, unregisterGuard]);

  return {
    confirmNavigation,
    clearUnsavedGuard: () => unregisterGuard(id),
    clearAllGuards,
  };
}
