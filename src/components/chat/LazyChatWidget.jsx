"use client";

import dynamic from 'next/dynamic';

const AIChatWidget = dynamic(() => import('./AIChatWidget'), { 
  ssr: false,
  loading: () => null 
});

export default function LazyChatWidget() {
  return <AIChatWidget />;
}
