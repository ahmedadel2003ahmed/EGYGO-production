'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';

const ConditionalNavbar = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before checking pathname
  useEffect(() => {
    setMounted(true);
  }, []);

  // List of paths where navbar should be hidden
  const hideNavbarPaths = [
    '/login',
    '/register',
    '/auth/login',
    '/auth/register',
    '/otp',
    '/auth/otp',
    '/admin'
  ];

  // Check if current path should hide navbar
  const shouldHideNavbar = hideNavbarPaths.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  // Don't render anything until mounted (prevents hydration issues)
  if (!mounted) {
    return null;
  }

  // Don't render navbar on auth pages
  if (shouldHideNavbar) {
    return null;
  }

  return <Navbar />;
};

export default ConditionalNavbar;