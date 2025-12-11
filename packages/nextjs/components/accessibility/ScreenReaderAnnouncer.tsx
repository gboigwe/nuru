'use client';

import { useEffect, useState } from 'react';

let announceQueue: string[] = [];

export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  announceQueue.push(message);
  window.dispatchEvent(new CustomEvent('announce', { detail: { message, priority } }));
};

export const ScreenReaderAnnouncer = () => {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  useEffect(() => {
    const handleAnnounce = (e: CustomEvent) => {
      setMessage(e.detail.message);
      setPriority(e.detail.priority);

      // Clear after announced
      setTimeout(() => setMessage(''), 100);
    };

    window.addEventListener('announce', handleAnnounce as EventListener);
    return () => window.removeEventListener('announce', handleAnnounce as EventListener);
  }, []);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};