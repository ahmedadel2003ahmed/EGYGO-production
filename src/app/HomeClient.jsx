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
import RevealOnScroll from './components/RevealOnScroll';

export default function HomeClient() {
    const router = useRouter();
    const storyRef = useRef(null);
    const footerRef = useRef(null);

    const scrollToStory = () => storyRef.current?.scrollIntoView({ behavior: 'smooth' });
    const scrollToFooter = () => footerRef.current?.scrollIntoView({ behavior: 'smooth' });

    return (
        <>
            {/* ===== HERO SECTION ===== */}
            <HeroCarousel onExploreClick={scrollToStory} />

            {/* ===== CATEGORY CARDS ===== */}
            {/* zIndex: 20 prevents it from being hidden behind other relative elements if they overlap */}
            <RevealOnScroll style={{ position: 'relative', zIndex: 20 }}>
                <CategoryCards />
            </RevealOnScroll>

            {/* ===== FEATURED CAROUSEL ===== */}
            <RevealOnScroll delay={100}>
                <FeaturedCarousel />
            </RevealOnScroll>

            {/* ===== STATS SECTION ===== */}
            <RevealOnScroll delay={100}>
                <StatsSection />
            </RevealOnScroll>

            {/* ===== GALLERY SECTION ===== */}
            <RevealOnScroll delay={100}>
                <GallerySection />
            </RevealOnScroll>

            {/* ===== TOUR GUIDES SECTION ===== */}
            <RevealOnScroll delay={100}>
                <TourGuides />
            </RevealOnScroll>

            {/* ===== FOOTER ANCHOR ===== */}
            <div ref={footerRef}></div>
        </>
    );
}
