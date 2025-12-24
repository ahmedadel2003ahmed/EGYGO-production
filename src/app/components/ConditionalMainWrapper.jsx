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

  // Ensure standard home page detection
  const isHomePage = pathname === '/' || pathname === '/home';

  // Pages with hero sections that need navbar to float on top
  const hasFloatingNavbar = isHomePage || pathname === '/ExploreDestinations';

  // If navbar is hidden OR it has floating navbar, we want 0 top padding.
  // This allows the Hero float effect on Home and ExploreDestinations.
  const mainStyle = {
    paddingTop: (shouldHideNavbar || hasFloatingNavbar) ? '0' : '0',
    minHeight: '100vh' // Ensure full height
  };

  return (
    <main style={mainStyle}>
      {children}
    </main>
  );
};

export default ConditionalMainWrapper;