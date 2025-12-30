"use client";

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const AIChatWidget = dynamic(() => import('./AIChatWidget'), {
  ssr: false,
  loading: () => null
});

export default function LazyChatWidget() {
  const pathname = usePathname();

  if (pathname !== '/') return null;

  return <AIChatWidget />;
}
