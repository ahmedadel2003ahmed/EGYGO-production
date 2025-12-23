'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaGlobe,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaPaperPlane
} from 'react-icons/fa';
import { FiSmartphone } from 'react-icons/fi';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>

        {/* Top Section */}
        <div className={styles.topSection}>

          {/* Brand Column */}
          <div className={styles.brandColumn}>
            <div className={styles.brandLogo}>
              <div className={styles.logoIconWrapper}>
                {/* Visual placeholder for the Queen Nefertiti logo */}
                <Image
                  src="/images/logo.ico"
                  alt="Meniastic"
                  width={30}
                  height={30}
                  style={{ objectFit: 'contain' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <span>EGYGO </span>
            </div>
            <p className={styles.brandDescription}>
              Discover the hidden treasures of Egypt, Egypt.
              Explore ancient attractions, rich culture, and
              unforgettable experiences along the Nile River.
            </p>
            <div className={styles.socialIcons}>
              <a href="#" className={styles.socialIcon} aria-label="Facebook"><FaFacebookF /></a>
              <a href="#" className={styles.socialIcon} aria-label="Instagram"><FaInstagram /></a>
              <a href="#" className={styles.socialIcon} aria-label="YouTube"><FaYoutube /></a>
              <a href="#" className={styles.socialIcon} aria-label="Website"><FaGlobe /></a>
            </div>
          </div>

          {/* Explore Column */}
          <div className={styles.linkColumn}>
            <h3>Explore</h3>
            <ul className={styles.linkList}>
              <li><Link href="/attractions">Attractions</Link></li>
              <li><Link href="/hotels">Hotels</Link></li>
              <li><Link href="/restaurants">Restaurants</Link></li>
              <li><Link href="/events">Events</Link></li>
              <li><Link href="/itineraries">Itineraries</Link></li>
            </ul>
          </div>

          {/* Information Column */}
          <div className={styles.linkColumn}>
            <h3>Information</h3>
            <ul className={styles.linkList}>
              <li><Link href="/visitor-info">Visitor Info</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/map">Map</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/about">About Us</Link></li>
            </ul>
          </div>

          {/* Contact Info Column */}
          <div className={styles.linkColumn}>
            <h3>Contact Info</h3>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <FaMapMarkerAlt className={styles.contactIcon} />
                <span>Egypt, Egypt</span>
              </li>
              <li className={styles.contactItem}>
                <FaPhoneAlt className={styles.contactIcon} />
                <span>+20 86 234 5555</span>
              </li>
              <li className={styles.contactItem}>
                <FaEnvelope className={styles.contactIcon} />
                <span>info@Egypttourism.com</span>
              </li>
            </ul>

            <div className={styles.downloadSection}>
              <div className={styles.downloadTitle}>Download Our App</div>
              <button className={styles.appButton}>
                <FiSmartphone className={styles.appIcon} />
                <div className={styles.appText}>
                  <small>Download for</small>
                  <span>Android & iOS</span>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Newsletter Section */}
        <div className={styles.newsletterCard}>
          <div className={styles.newsletterContent}>
            <h3>Stay Updated</h3>
            <p>Subscribe to our newsletter for the latest travel tips and updates about Egypt.</p>
          </div>
          <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.inputWrapper}>
              <input
                type="email"
                placeholder="Enter your email address"
                className={styles.emailInput}
                required
              />
            </div>
            <button type="submit" className={styles.subscribeButton}>
              <FaPaperPlane /> Subscribe
            </button>
          </form>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div>&copy; 2024 Egypt Tourism. All rights reserved.</div>
          <div className={styles.bottomLinks}>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/sitemap">Sitemap</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
