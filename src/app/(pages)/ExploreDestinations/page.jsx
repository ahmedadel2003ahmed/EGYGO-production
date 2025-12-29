// Data source: /public/data/destinations.json — auto-mapped for cards
"use client";

import React from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import axios from 'axios'; // Using axios as requested
import Link from 'next/link';
import Image from 'next/image';
import styles from './ExploreDestinations.module.css';

// --- MOCK DATA ---
// Used as a fallback if the API fetch fails or returns an empty array,
// ensuring the page always renders content matching the screenshot for development.

const MOCK_DESTINATIONS = [
  {
    slug: 'pyramids-of-giza',
    title: 'Pyramids of Giza',
    subtitle: 'Witness the majestic ancient wonders, a testament to pharaonic engineering and history.',
    imageUrl: '/images/destinations/pyramids-of-giza.png', // Assumed image path
  },
  {
    slug: 'khan-el-khalili',
    title: 'Khan el-Khalili Bazaar',
    subtitle: 'Immerse yourself in the vibrant atmosphere of Cairo\'s historic marketplace, rich with crafts and spices.',
    imageUrl: '/images/destinations/khan-el-khalili.png',
  },
  {
    slug: 'aswan-nile-cruise',
    title: 'Aswan Nile Cruise',
    subtitle: 'Experience serene luxury along the Nile, passing ancient temples and picturesque landscapes.',
    imageUrl: '/images/destinations/aswan-nile-cruise.png',
  },
  {
    slug: 'alexandria-library',
    title: 'Alexandria Library & Citadel',
    subtitle: 'Explore the modern marvel of the Bibliotheca Alexandrina and the historic Qaitbay Citadel.',
    imageUrl: '/images/destinations/alexandria-library.png',
  },
  {
    slug: 'luxor-temple',
    title: 'Luxor Temple Complex',
    subtitle: 'Step back in time among grand pylons, statues, and obelisks of one of Egypt\'s most significant sites.',
    imageUrl: '/images/destinations/luxor-temple.png',
  },
  {
    slug: 'dahab-blue-hole',
    title: 'Dahab Blue Hole',
    subtitle: 'Dive into the stunning underwater world of the Red Sea, a paradise for snorkelers and divers.',
    imageUrl: '/images/destinations/dahab-blue-hole.png',
  },
];

// const MOCK_GOVERNORATES = [
//   {
//     name: 'Giza',
//     shortDesc: 'Home of the Great Pyramids and Sphinx.',
//     icon: '⛰️',
//     colorClass: 'tileGiza',
//   },
//   {
//     name: 'Cairo',
//     shortDesc: 'Egypt\'s vibrant capital and largest city.',
//     icon: '🕌',
//     colorClass: 'tileCairo',
//   },
//   {
//     name: 'Alexandria',
//     shortDesc: 'The historic Pearl of the Mediterranean.',
//     icon: '⚓',
//     colorClass: 'tileAlexandria',
//   },
//   {
//     name: 'Luxor',
//     shortDesc: 'Ancient city known as the "World\'s Greatest Open-Air Museum."',
//     icon: '☀️',
//     colorClass: 'tileLuxor',
//   },
//   {
//     name: 'Aswan',
//     shortDesc: 'Scenic southern city on the Nile River, famous for its temples.',
//     icon: '📍',
//     colorClass: 'tileAswan',
//   },
//   {
//     name: 'Sharm El Sheikh',
//     shortDesc: 'Popular Red Sea resort city known for diving and beaches.',
//     icon: '🌴',
//     colorClass: 'tileSharm',
//   },
// ];

// --- API Fetchers ---

/**
 * Data source: /public/data/destinations.json — auto-mapped for cards
 * For production: replace with real backend API endpoints
 */

//
// helper to generate slug
//
const makeSlug = (name = "") =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

//
// helper to normalize image path
//
const normalizeImagePath = (img = "") => {
  if (!img) return "https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=1200&h=800&fit=crop";
  if (img.startsWith("/")) return img;
  return "/" + img.replace(/^\.\.\/+/, "").replace(/^\/+/, "");
};

//
// fetchDestinations implementation
//
const fetchDestinations = async () => {
  console.time("fetchDestinations");
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://egygo-backend-production.up.railway.app';
    const response = await axios.get(`${baseUrl}/api/provinces/giza/places?type=archaeological`);
    console.timeEnd("fetchDestinations");

    if (response.data?.success && Array.isArray(response.data?.data?.places)) {
      // Transform the API data to match the component's expected format
      const formatted = response.data.data.places.map((place) => ({
        destinationId: place._id,
        slug: place.slug,
        title: place.name,
        subtitle: place.shortDescription || "",
        imageUrl: place.images?.[0] || getPlaceholderImage(place.name),
      }));

      return formatted.length > 0 ? formatted : MOCK_DESTINATIONS;
    }

    return MOCK_DESTINATIONS;
  } catch (err) {
    console.timeEnd("fetchDestinations");
    console.warn("Could not load places from API — using fallback MOCK.", err.message || err);
    return MOCK_DESTINATIONS;
  }
};

//TODO: remove this function
// Helper function to get placeholder images based on place name/type
// const getPlaceholderImage = (name = '') => {
//   const nameLower = name.toLowerCase();

//   // Match specific types of places with relevant Unsplash images
//   if (nameLower.includes('pyramid') || nameLower.includes('giza')) {
//     return 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1200&h=800&fit=crop'; // Pyramids
//   }
//   if (nameLower.includes('temple') || nameLower.includes('luxor') || nameLower.includes('karnak')) {
//     return 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200&h=800&fit=crop'; // Ancient temple
//   }
//   if (nameLower.includes('sphinx')) {
//     return 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=1200&h=800&fit=crop'; // Sphinx
//   }
//   if (nameLower.includes('museum')) {
//     return 'https://images.unsplash.com/photo-1566127444979-b3d2b3dba5d3?w=1200&h=800&fit=crop'; // Museum
//   }
//   if (nameLower.includes('nile') || nameLower.includes('cruise') || nameLower.includes('river')) {
//     return 'https://images.unsplash.com/photo-1572252821143-035a024857ac?w=1200&h=800&fit=crop'; // Nile
//   }
//   if (nameLower.includes('beach') || nameLower.includes('red sea') || nameLower.includes('dahab') || nameLower.includes('sharm')) {
//     return 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop'; // Red Sea beach
//   }
//   if (nameLower.includes('market') || nameLower.includes('bazaar') || nameLower.includes('khan')) {
//     return 'https://images.unsplash.com/photo-1578408967898-bfb1f6f41e73?w=1200&h=800&fit=crop'; // Market
//   }
//   if (nameLower.includes('alexandria') || nameLower.includes('library')) {
//     return 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&h=800&fit=crop'; // Library/Alexandria
//   }
//   if (nameLower.includes('desert') || nameLower.includes('safari')) {
//     return 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&h=800&fit=crop'; // Desert
//   }
//   if (nameLower.includes('hotel') || nameLower.includes('resort')) {
//     return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop'; // Hotel
//   }
//   if (nameLower.includes('mosque') || nameLower.includes('masjid')) {
//     return 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1200&h=800&fit=crop'; // Mosque
//   }
//   if (nameLower.includes('park') || nameLower.includes('garden')) {
//     return 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&h=800&fit=crop'; // Park
//   }

//   // Default Egypt tourism image
//   return 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=1200&h=800&fit=crop';
// };

const fetchGovernorates = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://egygo-backend-production.up.railway.app';
  const endpoint = `${baseUrl}/api/provinces`;
  console.time("fetchGovernorates");
  try {
    const response = await axios.get(endpoint);
    console.timeEnd("fetchGovernorates");

    if (response.data?.success && Array.isArray(response.data?.data)) {
      // Transform the API data to match the component's expected format
      const formatted = response.data.data.map((province) => ({
        name: province.name,
        shortDesc: province.description || '',
        icon: getProvinceIcon(province.name),
        colorClass: getProvinceColorClass(province.name),
        slug: province.slug,
        coverImage: province.coverImage || 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&h=600&fit=crop',
      }));

      return formatted.length > 0 ? formatted : MOCK_GOVERNORATES;
    }

    return MOCK_GOVERNORATES;
  } catch (error) {
    console.timeEnd("fetchGovernorates");
    console.warn("API endpoint not available, using mock data:", error.message);
    return MOCK_GOVERNORATES;
  }
};

// Helper function to assign icons based on province name
const getProvinceIcon = (name) => {
  const iconMap = {
    'Giza': '⛰️',
    'Cairo': '🕌',
    'Alexandria': '⚓',
    'Luxor': '☀️',
    'Aswan': '📍',
    'Sharm El Sheikh': '🌴',
    'Asyut': '🏛️',
    'Beheira': '🌾',
  };
  return iconMap[name] || '📍';
};

// Helper function to assign color classes based on province name
const getProvinceColorClass = (name) => {
  const colorMap = {
    'Giza': 'tileGiza',
    'Cairo': 'tileCairo',
    'Alexandria': 'tileAlexandria',
    'Luxor': 'tileLuxor',
    'Aswan': 'tileAswan',
    'Sharm El Sheikh': 'tileSharm',
  };
  return colorMap[name] || 'tileDefault';
};

// --- Helper Components ---

/**
 * Renders a single destination card with skeleton loading.
 * Updated to accept destinationId and link to /place/{id}
 */
const DestinationCard = React.memo(({ title, subtitle, imageUrl, slug, destinationId }) => {
  const [imageLoading, setImageLoading] = React.useState(true);

  return (
    <div className={`card h-100 border-0 ${styles.destinationCard}`}>
      <div className={styles.cardImageWrapper}>
        {/* Skeleton loader */}
        {imageLoading && (
          <div className={styles.imageSkeleton}>
            <div className={styles.skeletonShimmer}></div>
          </div>
        )}

        <Image
          src={imageUrl}
          alt={`View of ${title}`}
          width={400}
          height={250}
          className={`card-img-top ${styles.cardImage} ${imageLoading ? styles.imageHidden : styles.imageVisible}`}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvdsaywAAAABJRU5ErkJggg=="
          onLoad={() => setImageLoading(false)}
        />
        <div className={styles.cardImageOverlay}></div>
      </div>
      <div className={`card-body d-flex flex-column ${styles.cardBody}`}>
        <h5 className={`card-title fw-bold ${styles.cardTitle}`}>{title}</h5>
        <p className={`card-text ${styles.cardText} mb-3`}>{subtitle}</p>
        <Link
          href={`/place/${destinationId || slug}`}
          className={`mt-auto align-self-start ${styles.ctaLink}`}
        >
          More Details
        </Link>
      </div>
    </div>
  );
});
DestinationCard.displayName = 'DestinationCard';

/**
 * Renders a single governorate tile with cover image.
 */
const GovernorateTile = React.memo(({ name, shortDesc, icon, colorClass, slug, coverImage }) => {
  const tileColorClass = styles[colorClass] || styles.tileDefault;

  return (
    <Link href={`/Governorate/${slug}`} className="text-decoration-none">
      <div className={`rounded-3 overflow-hidden h-100 ${styles.governorateTile}`}>
        {/* Background Image */}
        <div
          className={styles.tileImageWrapper}
          style={{
            backgroundImage: `url(${coverImage || 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&h=600&fit=crop'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay Gradient */}
          <div className={styles.tileOverlay}></div>

          {/* Content */}
          <div className={`${styles.tileContent}`}>
            <h5 className={`fw-bold ${styles.tileTitle}`}>{name}</h5>
            <p className={styles.tileDesc}>{shortDesc}</p>
          </div>
        </div>
      </div>
    </Link>
  );
});
GovernorateTile.displayName = 'GovernorateTile';

// --- Page Component ---

/**
 * NOTE: For React Query to work, you must wrap your layout or page
 * in a <QueryClientProvider> in a parent component.
 */
export default function ExploreDestinations() {
  const [showAllGovernorates, setShowAllGovernorates] = React.useState(false);
  const [showAllDestinations, setShowAllDestinations] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [destinationSearchQuery, setDestinationSearchQuery] = React.useState('');

  // Use Suspense Query to ensure loading state triggers 'loading.tsx' in Next.js
  const { data: destinationsData } = useSuspenseQuery({
    queryKey: ['destinations'],
    queryFn: fetchDestinations,
  });

  const { data: governoratesData } = useSuspenseQuery({
    queryKey: ['governorates'],
    queryFn: fetchGovernorates,
  });

  // Since fetch functions now handle fallbacks internally,
  // we can directly use the returned data
  const allDestinations = destinationsData || MOCK_DESTINATIONS;
  const allGovernorates = governoratesData || MOCK_GOVERNORATES;

  // Filter destinations based on search query
  const filteredDestinations = React.useMemo(() => {
    if (!destinationSearchQuery.trim()) return allDestinations;

    const query = destinationSearchQuery.toLowerCase().trim();
    return allDestinations.filter(dest =>
      dest.title.toLowerCase().includes(query) ||
      dest.subtitle.toLowerCase().includes(query)
    );
  }, [allDestinations, destinationSearchQuery]);

  // Show only 6 destinations initially (from filtered results)
  const destinations = showAllDestinations
    ? filteredDestinations
    : filteredDestinations.slice(0, 6);

  // Filter governorates based on search query
  const filteredGovernorates = React.useMemo(() => {
    if (!searchQuery.trim()) return allGovernorates;

    const query = searchQuery.toLowerCase().trim();
    return allGovernorates.filter(gov =>
      gov.name.toLowerCase().includes(query) ||
      gov.shortDesc.toLowerCase().includes(query)
    );
  }, [allGovernorates, searchQuery]);

  // Show only 6 governorates initially (from filtered results)
  const governorates = showAllGovernorates
    ? filteredGovernorates
    : filteredGovernorates.slice(0, 6);

  const hasMoreGovernorates = filteredGovernorates.length > 6;
  const hasMoreDestinations = filteredDestinations.length > 6;

  return (
    <>
      {/* Visual Loader is now handled by Next.js Suspense boundary (loading.tsx) */}

      {/* Page Background Wrapper */}
      <div
        style={{
          backgroundImage: 'url(https://tourism.minya.gov.eg/assets/images/categories-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh'
        }}
      >
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <Image
            src="/images/Govern_Panner.jpeg"
            alt="Explore Egypt's Top Destinations"
            fill
            priority
            quality={90}
            style={{ objectFit: 'cover', zIndex: 0 }}
          />
          <div className="container">
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Explore Egypt&apos;s Top Destinations
              </h1>
              <p className={styles.heroSubtitle}>
                Discover the timeless wonders and hidden gems of Egypt, from ancient monuments to pristine beaches
              </p>
            </div>
          </div>
        </section>

        <div className="container my-4 my-md-5">
          {/* Section 1: Popular Destinations */}
          <section className={`mb-5 ${styles.section}`}>
            <div className={styles.governorateHeader}>
              <h2 className={styles.sectionTitle}>
                Popular Destinations
              </h2>

              {/* Compact Search Bar for Destinations */}
              <div className={styles.searchBarContainer}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search destinations..."
                  value={destinationSearchQuery}
                  onChange={(e) => setDestinationSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {destinationSearchQuery && (
                  <button
                    onClick={() => setDestinationSearchQuery('')}
                    className={styles.clearButton}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {destinationSearchQuery && (
              <p className={styles.searchResults}>
                Found {filteredDestinations.length} {filteredDestinations.length === 1 ? 'result' : 'results'}
              </p>
            )}

            {filteredDestinations.length > 0 ? (
              <>
                <div className="row g-4">
                  {destinations.map((dest) => (
                    <div className="col-lg-4 col-md-6 mb-4" key={dest.slug}>
                      <DestinationCard {...dest} />
                    </div>
                  ))}
                </div>

                {/* Show More Button for Destinations */}
                {hasMoreDestinations && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setShowAllDestinations(!showAllDestinations)}
                      className={`btn btn-lg ${styles.seeMoreBtn}`}
                    >
                      {showAllDestinations ? 'Show Less' : 'See More Destinations'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>🔍</div>
                <h3 className={styles.noResultsTitle}>No destinations found</h3>
                <p className={styles.noResultsText}>
                  Try adjusting your search terms or <button onClick={() => setDestinationSearchQuery('')} className={styles.clearSearchLink}>clear search</button>
                </p>
              </div>
            )}
          </section>

          {/* Section 2: Explore Governorates */}
          <section className={`mt-4 pt-md-3 ${styles.section}`}>
            <div className={styles.governorateHeader}>
              <h2 className={styles.sectionTitle}>
                Explore Egyptian Governorates
              </h2>

              {/* Compact Search Bar */}
              <div className={styles.searchBarContainer}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search governorates..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowAllGovernorates(false);
                  }}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={styles.clearButton}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {searchQuery && (
              <p className={styles.searchResults}>
                Found {filteredGovernorates.length} {filteredGovernorates.length === 1 ? 'result' : 'results'}
              </p>
            )}

            {governorates.length > 0 ? (
              <>
                <div className="row g-4">
                  {governorates.map((gov) => (
                    <div className="col-lg-4 col-md-6 mb-4" key={gov.name}>
                      <GovernorateTile {...gov} />
                    </div>
                  ))}
                </div>

                {/* Show More Button */}
                {hasMoreGovernorates && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setShowAllGovernorates(!showAllGovernorates)}
                      className={`btn btn-lg ${styles.seeMoreBtn}`}
                    >
                      {showAllGovernorates ? 'Show Less' : 'See More Governorates'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>🔍</div>
                <h3 className={styles.noResultsTitle}>No governorates found</h3>
                <p className={styles.noResultsText}>
                  Try adjusting your search terms or <button onClick={() => setSearchQuery('')} className={styles.clearSearchLink}>clear search</button>
                </p>
              </div>
            )}
          </section>
        </div>
      </div> {/* Close background wrapper */}
    </>
  );
}