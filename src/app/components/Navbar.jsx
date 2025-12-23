'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaUser } from 'react-icons/fa';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  // Scroll behavior logic
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;

        // Add background after scrolling
        setIsScrolled(currentScrollY > 20);

        // Show navbar when at top or scrolling up
        if (currentScrollY < lastScrollY || currentScrollY < 10) {
          setIsVisible(true);
        } else {
          // Hide navbar when scrolling down and past threshold
          setIsVisible(false);
          // Close mobile menu when scrolling down
          setIsMenuOpen(false);
        }

        setLastScrollY(currentScrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar, { passive: true });

      // Cleanup function
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [lastScrollY]);

  // Helper function to check if a link is active
  const isActiveLink = (path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Navigation links configuration
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/ExploreDestinations', label: 'Destinations' },
    { href: '/Governorate', label: 'Guides' },
    { href: '/my-trips', label: 'My Trips' },
    { href: '/AboutUs', label: 'About' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav
      className={`${styles.navbar} ${!isVisible ? styles.navbarHidden : ''} ${isScrolled ? styles.navbarScrolled : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className={styles.navContainer}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="EgyGo - Go to homepage">
          <span className={styles.logoText}>EgyGo</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className={styles.navLinks}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${isActiveLink(link.href) ? styles.activeLink : ''
                }`}
              aria-current={isActiveLink(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className={styles.authButtons}>
          {!isAuthenticated ? (
            <>
              <Link href="/login" className={styles.loginBtn} aria-label="Login to your account">
                Login
              </Link>
              <Link href="/register" className={styles.registerBtn} aria-label="Create new account">
                Get Started
              </Link>
            </>
          ) : (
            <Link href="/profile" className={styles.profileBtn} aria-label="User profile">
              <FaUser size={20} />
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className={styles.menuToggle}
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle navigation menu"
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}
        aria-hidden={!isMenuOpen}
      >
        <div className={styles.mobileNavLinks}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavLink} ${isActiveLink(link.href) ? styles.activeMobileLink : ''
                }`}
              onClick={() => setIsMenuOpen(false)}
              aria-current={isActiveLink(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          <div className={styles.mobileAuthButtons}>
            <Link
              href="/login"
              className={styles.mobileLoginBtn}
              onClick={() => setIsMenuOpen(false)}
              aria-label="Login to your account"
            >
              Login
            </Link>
            <Link
              href="/register"
              className={styles.mobileRegisterBtn}
              onClick={() => setIsMenuOpen(false)}
              aria-label="Create new account"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;