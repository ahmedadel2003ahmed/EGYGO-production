"use client";

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

export default function HomeClient() {
  const router = useRouter();
  const storyRef = useRef(null);
  const footerRef = useRef(null);

  const scrollToStory = () => storyRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToFooter = () => footerRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
     

      {/* ===== HERO SECTION ===== */}
      <section className={styles.heroSection}>
        <div className={`container ${styles.heroContent}`}>
          <h1>EXPLORE</h1>
          <h1>THE MOUNTAIN</h1>
          <p>Live your dream and explore</p>
          <button
            className={`btn btn-outline-light ${styles.exploreBtn}`}
            onClick={scrollToStory}
          >
            Explore More
          </button>
        </div>
      </section>

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
      <section id='services' className={`${styles.servicesSection} text-center py-5`}>
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
      </section>

      <section className={styles.sectionDivider}></section>

      {/* ===== GUIDE & TRAILS SECTION ===== */}
      <section className={`${styles.guideTrailsSection} py-5`}>
        <div className="container">
          <div className="row gy-4">
            <div className="col-md-6">
              <h3>Trails</h3>
              <ul className={styles.trailsList}>
                <li>Guide 1: Expert in ancient Egyptian history.</li>
                <li>Guide 2: Specialized in desert adventures.</li>
                <li>Guide 3: Fluent in multiple languages.</li>
              </ul>
            </div>

            <div className="col-md-6">
              <h3>Guide</h3>
              <div className={styles.guideCard}>
                <div>
                  <h5>John Doe</h5>
                  <p>One of my favourite places to take pictures</p>
                </div>
                <Image src="/images/gide2.png" alt="Guide" className="rounded-circle mb-3" width={70} height={70} />
              </div>
              <div className={styles.guideCard}>
                <div>
                  <h5>Lina Darja</h5>
                  <p>Expert in mountain trekking.</p>
                </div>
                <Image src="/images/gide1.png" alt="Guide" className="rounded-circle mb-3" width={70} height={70} />
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <button className={`btn ${styles.seeMoreBtn}`} onClick={scrollToFooter}>
              See More
            </button>
          </div>
        </div>
      </section>

      <section className={styles.sectionDivider2}></section>

      {/* ===== FOOTER ===== */}
      <footer ref={footerRef} className={`${styles.footer} py-4`}>
        <div className="container text-center text-md-start">
          <div className="row align-items-center">
            <div className="col-md-6 text-md-end">
              <div className={`d-flex justify-content-center gap-3 mb-3 mb-md-0 ${styles.footerLinks}`}>
                <a href="#">Home</a>
                <a href="#">About</a>
                <a href="#">Services</a>
                <a href="#">Blog</a>
              </div>
            </div>

            <div className="col-md-6 mb-3 mb-md-0">
              <Image src="https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=250&h=100&fit=crop" alt="EgyGo Logo" width={250} height={100} />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
