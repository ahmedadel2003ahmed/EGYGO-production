"use client";

import { useRouter } from 'next/navigation';
import { useRef, useState, lazy, Suspense } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

// Lazy load non-critical components
const TripModal = lazy(() => import('@/components/trip/TripModal'));
const FloatingTripButton = lazy(() => import('@/components/common/FloatingTripButton'));
const TourGuides = lazy(() => import('./components/TourGuides'));
const StatsSection = lazy(() => import('./components/StatsSection'));
const GallerySection = lazy(() => import('./components/GallerySection'));
const FeaturedCarousel = lazy(() => import('./components/FeaturedCarousel'));

// Keep Hero and CategoryCards eager for LCP
import HeroCarousel from './components/HeroCarousel';
import CategoryCards from './components/CategoryCards';
import RevealOnScroll from './components/RevealOnScroll';

// Simple fallback for lazy components
const SectionLoader = () => <div className="py-10 text-center text-gray-400">Loading section...</div>;

export default function HomeClient() {
    const router = useRouter();
    const storyRef = useRef(null);
    const footerRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const scrollToStory = () => storyRef.current?.scrollIntoView({ behavior: 'smooth' });
    const scrollToFooter = () => footerRef.current?.scrollIntoView({ behavior: 'smooth' });

    const handleTripCreated = () => {
        router.push('/my-trips');
    };

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
                <Suspense fallback={<SectionLoader />}>
                    <FeaturedCarousel />
                </Suspense>
            </RevealOnScroll>

            {/* ===== STATS SECTION ===== */}
            <RevealOnScroll delay={100}>
                <Suspense fallback={<SectionLoader />}>
                    <StatsSection />
                </Suspense>
            </RevealOnScroll>

            {/* ===== GALLERY SECTION ===== */}
            <RevealOnScroll delay={100}>
                <Suspense fallback={<SectionLoader />}>
                    <GallerySection />
                </Suspense>
            </RevealOnScroll>

            {/* ===== TOUR GUIDES SECTION ===== */}
            <RevealOnScroll delay={100}>
                <Suspense fallback={<SectionLoader />}>
                    <TourGuides />
                </Suspense>
            </RevealOnScroll>

            {/* ===== FOOTER ANCHOR ===== */}
            <div ref={footerRef}></div>

            {/* ===== FLOATING ACTION BUTTON & MODAL ===== */}
            <Suspense fallback={null}>
                <TripModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleTripCreated}
                />
                <FloatingTripButton onClick={() => setIsModalOpen(true)} />
            </Suspense>
        </>
    );
}
