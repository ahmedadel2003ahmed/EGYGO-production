'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Footer from './Footer';

const ConditionalFooter = () => {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    // Ensure component is mounted before checking pathname
    useEffect(() => {
        setMounted(true);
    }, []);

    // List of paths where footer should be hidden
    // Typically auth pages, maybe dashboard/admin routes if they have their own layout
    const hideFooterPaths = [
        '/login',
        '/register',
        '/auth/login',
        '/auth/register',
        '/otp',
        '/auth/otp',
        '/admin'
    ];

    // Check if current path should hide footer
    const shouldHideFooter = hideFooterPaths.some(path =>
        pathname === path || pathname.startsWith(path + '/')
    );

    // Don't render anything until mounted (prevents hydration issues)
    if (!mounted) {
        return null;
    }

    // Don't render footer on auth pages
    if (shouldHideFooter) {
        return null;
    }

    return <Footer />;
};

export default ConditionalFooter;
