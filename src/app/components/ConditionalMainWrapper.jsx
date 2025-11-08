'use client';

import { usePathname } from 'next/navigation';

const ConditionalMainWrapper = ({ children }) => {
  const pathname = usePathname();
  
  // List of paths where navbar should be hidden
  const hideNavbarPaths = [
    '/login',
    '/register',
    '/auth/login',
    '/auth/register',
    '/otp',
    '/auth/otp'
  ];
  
  // Check if current path should hide navbar
  const shouldHideNavbar = hideNavbarPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );
  
  // Adjust padding based on whether navbar is present
  const mainStyle = {
    paddingTop: shouldHideNavbar ? '0' : '80px'
  };
  
  return (
    <main style={mainStyle}>
      {children}
    </main>
  );
};

export default ConditionalMainWrapper;