'use client';

import { createElement, type ReactNode } from 'react';

import { trackMockbaEvent } from '../lib/analytics-client';

export default function TrackedCheckoutLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return createElement(
    'a',
    {
      href,
      className,
      onClick: () => trackMockbaEvent('checkout_start'),
    },
    children,
  );
}
