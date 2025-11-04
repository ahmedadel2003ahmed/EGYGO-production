import { notFound } from 'next/navigation';
import HeroSection from './components/HeroSection';
import OverviewSection from './components/OverviewSection';
import HighlightsSection from './components/HighlightsSection';
import GallerySection from './components/GallerySection';
import MapSection from './components/MapSection';

// Helper function to generate slug from name
const makeSlug = (name = "") =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

// Helper function to normalize image paths
const normalizeImagePath = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's an Unsplash URL or any external URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's already a proper path starting with /, return as is
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  
  // Handle relative paths like "../images/destination/dahab.jpeg"
  if (imagePath.includes('../')) {
    let normalized = imagePath.replace(/^\.\.\//, '/');
    
    // Handle common case mismatches for destination images
    if (normalized.includes('/images/destination/')) {
      const filename = normalized.split('/').pop();
      const lowercaseFilename = filename.toLowerCase();
      
      // Map known files (based on what we found in the directory)
      const imageMap = {
        'dahab.jpeg': 'Dahab.jpeg',
        'giza.jpeg': 'Giza.jpeg',
        'alex.jpeg': 'alex.jpeg',
        'aswan.jpeg': 'aswan.jpeg',
        'cairo.jpeg': 'cairo.jpeg',
        'citadelofsaladin.jpeg': 'CitadelofSaladin.jpeg',
        'khanelkhalilibazaar.jpeg': 'KhanelKhaliliBazaar.jpeg',
        'luxor.jpeg': 'luxor.jpeg',
        'sharm.jpeg': 'sharm.jpeg',
        'siwa.jpeg': 'siwa.jpeg'
      };
      
      const correctFilename = imageMap[lowercaseFilename] || filename;
      normalized = `/images/destination/${correctFilename}`;
    }
    
    return normalized;
  }
  
  // If it doesn't start with /, add it
  if (!imagePath.startsWith('/')) {
    return `/${imagePath}`;
  }
  
  return imagePath;
};

// Helper function to get the best available hero image
const getHeroImage = (destination) => {
  // Always prioritize the card image since we know it exists and displays correctly on the main page
  if (destination.card?.image) {
    const cardImagePath = normalizeImagePath(destination.card.image);
    if (cardImagePath) return cardImagePath;
  }
  
  // Try to use the designated hero image as secondary option
  if (destination.details?.images?.heroImage) {
    const heroPath = normalizeImagePath(destination.details.images.heroImage);
    if (heroPath) return heroPath;
  }
  
  // Final fallback to a default image
  return '/images/default-destination.svg';
};

// Generate static params for SSG
export async function generateStaticParams() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/data/Destinations.json`);
    if (!response.ok) {
      console.warn('Failed to fetch destinations for static generation');
      return [];
    }
    
    const destinations = await response.json();
    
    return destinations.map((destination) => ({
      slug: makeSlug(destination.name),
    }));
  } catch (error) {
    console.warn('Error generating static params:', error);
    return [];
  }
}


// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/data/Destinations.json`);
    if (!response.ok) {
      return {
        title: 'Destination Not Found',
        description: 'The requested destination could not be found.',
      };
    }
    
    const destinations = await response.json();
    const destination = destinations.find(dest => makeSlug(dest.name) === slug);
    
    if (!destination) {
      return {
        title: 'Destination Not Found',
        description: 'The requested destination could not be found.',
      };
    }
    
    return {
      title: `${destination.name} - EGYGO Travel`,
      description: destination.card.shortDescription,
      openGraph: {
        title: destination.name,
        description: destination.card.shortDescription,
        images: [getHeroImage(destination)],
      },  
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Destination Details - EGYGO Travel',
      description: 'Explore amazing destinations in Egypt',
    };
  }
}

// Main page component
export default async function DestinationDetailsPage({ params }) {
  const { slug } = await params;
  
  let destination;
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/data/Destinations.json`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch destinations');
    }
    
    const destinations = await response.json();
    destination = destinations.find(dest => makeSlug(dest.name) === slug);
    
    if (!destination) {
      notFound();
    }
  } catch (error) {
    console.error('Error fetching destination:', error);
    notFound();
  }
  
  const { details } = destination;
  
  // Get the best available hero image
  const heroImage = getHeroImage(destination);
  
  // Process gallery images safely
  const galleryImages = details.images?.gallery 
    ? details.images.gallery.map(normalizeImagePath).filter(Boolean)
    : [];
  
  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('Gallery images processed:', galleryImages);
  }
  
  return (
    <div className="destination-details">
      {/* Hero Section */}
      <HeroSection 
        title={details.title}
        heroDescription={details.heroDescription}
        heroImage={heroImage}
        cta={details.cta}
        destinationName={destination.name}
      />
      
      {/* Overview Section */}
      <OverviewSection 
        overview={details.overview}
        quickFacts={details.quickFacts}
        location={details.location}
      />
      
      {/* Highlights Section */}
      <HighlightsSection 
        highlights={details.highlights}
      />
      
      {/* Gallery Section */}
      <GallerySection 
        gallery={galleryImages}
        destinationName={destination.name}
      />
      
      {/* Map Section */}
      <MapSection 
        location={details.location}
        destinationName={destination.name}
      />
    </div>
  );
}