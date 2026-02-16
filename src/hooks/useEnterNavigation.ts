import { useCallback } from 'react';

/**
 * Hook to handle "Enter key = Next Input" navigation for forms.
 * 
 * Usage:
 * const handleKeyDown = useEnterNavigation();
 * 
 * <form onKeyDown={handleKeyDown} ... >
 */
export function useEnterNavigation() {
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === 'Enter') {
            const target = e.target as HTMLElement;

            // Only handle if it's an input and not a button/textarea
            // We might want to include SELECT in the future, but standard behavior usually selects item on Enter
            if (target.tagName === 'INPUT') {
                const form = e.currentTarget;
                // Find all focusable inputs that are not hidden or disabled
                const inputs = Array.from(
                    form.querySelectorAll('input:not([type="hidden"]):not([disabled])')
                ) as HTMLElement[];

                const index = inputs.indexOf(target as HTMLInputElement);

                // If current input is found and is not the last one
                if (index > -1 && index < inputs.length - 1) {
                    e.preventDefault(); // Prevent form submission
                    inputs[index + 1].focus(); // Move focus to next input
                }
                // If it's the last input, we do nothing, allowing the default Enter behavior (submit)
            }
        }
    }, []);

    return handleKeyDown;
}
