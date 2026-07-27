'use client';

import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '@/lib/constants';

export function GoogleOAuthProviderWrapper({ children }: { children: React.ReactNode }) {
  // Check if we're on the client side and if GOOGLE_CLIENT_ID exists
  const clientId = typeof window !== 'undefined' ? GOOGLE_CLIENT_ID : '';
  
  if (!clientId || !GOOGLE_CLIENT_ID) {
    return <>{children}</>;
  }
  
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}

