'use client';

import Image from 'next/image';
import { FaPhoneAlt, FaEnvelope, FaFacebookF, FaInstagram } from 'react-icons/fa';
import styles from './TourGuides.module.css';

const guides = [
    {
        id: 1,
        name: 'Marwa Mosa',
        role: 'Tour guide',
        description: '',
        languages: ['English', 'Arabic'],
        image: '/images/gide3.jpg', // Using existing local image
        socials: { facebook: '#', instagram: '#' }
    },
    {
        id: 2,
        name: 'Neveen Nagy',
        role: 'Tour gide1.png',
        description: 'Tour guide and cultural interpreter based in Minya.',
        languages: ['English', 'Arabic'],
        image: '/images/gide1.png', // External placeholder
        socials: { facebook: '#', instagram: '#' }
    },
    {
        id: 3,
        name: 'Dr. Mohammed Farghal El Far',
        role: 'Tour Guide',
        description: 'Tour Guide (personal tour guide) — contact for custom tours in Minya.',
        languages: ['English', 'Arabic'],
        image: '/images/gide2.png', // Using existing local image
        socials: { facebook: '#' }
    }
];

const TourGuides = () => {
    return (
        <section className={styles.section}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <div className={styles.heroOverlay}></div>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Tourguide</h1>
                    <p className={styles.heroSubtitle}>
                        Find licensed local guides, interpreters, and experts to lead your Minya experience.
                    </p>
                </div>
            </div>

            {/* Cards Section */}
            <div className={styles.contentContainer}>
                <div className={styles.sectionHeader}>
                </div>

                <div className={styles.cardsGrid}>
                    {guides.map((guide) => (
                        <div key={guide.id} className={styles.card}>
                            <div className={styles.imageWrapper}>
                                {/* Using a generic placeholder if image fails to load */}
                                <Image
                                    src={guide.image}
                                    alt={guide.name}
                                    width={120}
                                    height={120}
                                    style={{ objectFit: 'cover' }}
                                    onError={(e) => {
                                        // Fallback to a UI avatar if local image is missing
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(guide.name)}&background=random&color=fff&size=200`;
                                    }}
                                />
                            </div>

                            <h3 className={styles.name}>{guide.name}</h3>
                            <p className={styles.description}>
                                {guide.description || guide.role}
                            </p>

                            <div className={styles.languages}>
                                {guide.languages.map(lang => (
                                    <span key={lang} className={styles.langBadge}>{lang}</span>
                                ))}
                            </div>

                            <div className={styles.actions}>
                                <button className={styles.btnCall}>
                                    <FaPhoneAlt /> Call
                                </button>
                                <button className={styles.btnEmail}>
                                    <FaEnvelope /> Email
                                </button>
                            </div>

                            <div className={styles.socials}>
                                {guide.socials.facebook && (
                                    <a href={guide.socials.facebook} className={styles.socialIcon}>
                                        <FaFacebookF />
                                    </a>
                                )}
                                {guide.socials.instagram && (
                                    <a href={guide.socials.instagram} className={`${styles.socialIcon} ${styles.instagram}`}>
                                        <FaInstagram />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TourGuides;
