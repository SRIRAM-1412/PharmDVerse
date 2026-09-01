import { useCallback } from 'react';

let lastMouseX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
let lastMouseY = 100;

if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }, true);
}

export const useInlineNotification = (defaultDuration = 4000) => {
  const showNotification = useCallback(({ type = 'info', message, duration = defaultDuration }) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pharmdverse_global_toast', {
        detail: { type, message, duration, x: lastMouseX, y: lastMouseY }
      }));
    }
  }, [defaultDuration]);

  const clearNotification = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pharmdverse_global_toast', { detail: null }));
    }
  }, []);

  return {
    notification: null, 
    showNotification,
    clearNotification
  };
};