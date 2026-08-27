'use client';

import { useEffect } from 'react';

/**
 * Arms the entry motion. Nothing animates until this runs, so the server-
 * rendered document is already the resting, laid-out state.
 *
 * Hard requirement: nothing may stay hidden or displaced. A CSS animation
 * freezes at its start frame in a background tab, so motion is disarmed the
 * moment the document is hidden — and never armed if it is hidden already.
 * Disarming drops every from-state and leaves the resting layout.
 */
export default function EntryMotion() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.visibilityState !== 'visible') return;

    root.setAttribute('data-motion', 'on');

    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-enter="card"]'));
    const release = (el: HTMLElement) => el.setAttribute('data-seen', '');

    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            release(entry.target as HTMLElement);
            observer?.unobserve(entry.target);
          }
        },
        // Equivalent to a 'top 88%' trigger.
        { rootMargin: '0px 0px -12% 0px' },
      );
      for (const card of cards) observer.observe(card);
    } else {
      cards.forEach(release);
    }

    const disarm = () => {
      root.removeAttribute('data-motion');
      observer?.disconnect();
      observer = null;
      cards.forEach(release);
    };

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') disarm();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Safety net: a card must never stay offset because an observer never fired.
    const timer = window.setTimeout(() => cards.forEach(release), 3000);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      disarm();
    };
  }, []);

  return null;
}
