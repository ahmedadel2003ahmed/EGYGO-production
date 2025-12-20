"use client";

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import TourGuides from './components/TourGuides';
import StatsSection from './components/StatsSection';
import GallerySection from './components/GallerySection';
import HeroCarousel from './components/HeroCarousel';
import CategoryCards from './components/CategoryCards';

export default function HomeClient() {
  const router = useRouter();
  const storyRef = useRef(null);
  const footerRef = useRef(null);

  const scrollToStory = () => storyRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToFooter = () => footerRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>


      {/* ===== HERO SECTION ===== */}
      {/* ===== HERO SECTION ===== */}
      <HeroCarousel onExploreClick={scrollToStory} />

      {/* ===== CATEGORY CARDS ===== */}
      <CategoryCards />

      {/* ===== STORY SECTION ===== */}
      <section id='story' ref={storyRef} className={`${styles.storySection} py-5`}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center"></div>
            <div className="col-md-6 mb-4 mb-md-0">
              <div className={styles.storyText}>
                <h2>Hiking the Ancient Pine Forest</h2>
                <div className={styles.metaInfo}>
                  <span>📅 Date</span>
                  <span>🕒 Time</span>
                </div>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam turpis odio integer vitae porta mattis...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      {/* <section id='services' className={`${styles.servicesSection} text-center py-5`}>
        <div className="container">
          <h2 className="mb-4">Our Services</h2>
          <div className="row gy-4">
            <div className="col-md-4">
              <div className={styles.serviceCard}>
                <Image
                  src="/images/CustomGuided.jpeg"
                  alt="Guided Tours"
                  className="rounded-circle mb-3"
                  width={150}
                  height={150}
                />
                <h4>Guided Tours</h4>
                <p>Explore Egypt’s iconic landmarks with expert local guides.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className={styles.serviceCard}>
                <Image
                  src="/images/AdventureActivities.jpeg"
                  alt="Adventure Activities"
                  className="rounded-circle mb-3"
                  width={150}
                  height={150}
                />
                <h4>Cultural & Adventure Activities</h4>
                <p>Experience desert safaris, Nile cruises, and authentic Egyptian traditions.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className={styles.serviceCard}>
                <Image
                  src="/images/Transportation.jpeg"
                  alt="Travel & Transport"
                  className="rounded-circle mb-3"
                  width={150}
                  height={150}
                />
                <h4>Travel & Transport</h4>
                <p>Seamless travel support from hotel bookings to private transport across Egypt.</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.waveDivider}></div>
      </section> */}

      {/* ===== GALLERY SECTION ===== */}
      <GallerySection />

      {/* ===== STATS SECTION ===== */}
      <StatsSection />

      {/* ===== TOUR GUIDES SECTION ===== */}
      <TourGuides />



      {/* ===== FOOTER ===== */}
      {/* ===== FOOTER ===== */}
      {/* Footer is now handled globally in RootLayout via ConditionalFooter */}
      <div ref={footerRef}></div>
    </>
  );
}
