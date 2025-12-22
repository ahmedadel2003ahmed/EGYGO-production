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
import FeaturedCarousel from './components/FeaturedCarousel';

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


      {/* ===== FEATURED CAROUSEL ===== */}
      <FeaturedCarousel />
     {/* ===== STATS SECTION ===== */}
      <StatsSection />


      {/* ===== GALLERY SECTION ===== */}
      <GallerySection />

 
      {/* ===== TOUR GUIDES SECTION ===== */}
      <TourGuides />



      {/* ===== FOOTER ===== */}
      {/* ===== FOOTER ===== */}
      {/* Footer is now handled globally in RootLayout via ConditionalFooter */}
      <div ref={footerRef}></div>
    </>
  );
}
