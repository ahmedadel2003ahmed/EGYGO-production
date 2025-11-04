import styles from '../DestinationDetails.module.css';

// Map section with embedded Google Maps
export default function MapSection({ location, destinationName }) {
  if (!location?.mapUrl) {
    return null;
  }

  // Convert Google Maps share URL to embeddable URL
  const getEmbeddableMapUrl = (url) => {
    try {
      // If it's already an embed URL, return as is
      if (url.includes('google.com/maps/embed')) {
        return url;
      }
      
      // Extract coordinates or place ID from Google Maps URL
      if (url.includes('maps.app.goo.gl') || url.includes('goo.gl')) {
        // For shortened URLs, we'll use a search-based embed
        const searchQuery = encodeURIComponent(`${destinationName}, ${location.city}, ${location.country}`);
        return `https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${searchQuery}`;
      }
      
      // For regular Google Maps URLs, try to extract coordinates
      const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        const [, lat, lng] = coordMatch;
        return `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&center=${lat},${lng}&zoom=15`;
      }
      
      // Fallback to search-based embed
      const searchQuery = encodeURIComponent(`${destinationName}, ${location.city}, ${location.country}`);
      return `https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${searchQuery}`;
    } catch (error) {
      // Fallback for any URL parsing errors
      const searchQuery = encodeURIComponent(`${destinationName}, ${location.city}, ${location.country}`);
      return `https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${searchQuery}`;
    }
  };

  const embedUrl = getEmbeddableMapUrl(location.mapUrl);

  // Create a proper Google Maps link for opening in new tab
  const getGoogleMapsLink = (url) => {
    // If it's already a regular maps URL, return as is
    if (url.includes('maps.google.com') && !url.includes('/embed')) {
      return url;
    }
    
    // If it's an embed URL, convert to regular maps URL
    if (url.includes('google.com/maps/embed')) {
      // Try to extract search query from embed URL
      const searchMatch = url.match(/pb=([^&]+)/);
      if (searchMatch) {
        // Create a search-based Google Maps URL
        const searchQuery = encodeURIComponent(`${destinationName}, ${location.city}, ${location.country}`);
        return `https://www.google.com/maps/search/${searchQuery}`;
      }
    }
    
    // Fallback to search URL
    const searchQuery = encodeURIComponent(`${destinationName}, ${location.city}, ${location.country}`);
    return `https://www.google.com/maps/search/${searchQuery}`;
  };

  const googleMapsLink = getGoogleMapsLink(location.mapUrl);

  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className={styles.sectionTitle}>
          Location & Map
        </h2>
        
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className={styles.mapContainer}>
              {/* Embedded Map */}
              <iframe
                src={embedUrl}
                className={styles.mapFrame}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map of ${destinationName}`}
              ></iframe>
              
              {/* Map Info */}
              <div className={styles.mapInfo}>
                <h3 className={styles.mapTitle}>
                  {destinationName}
                </h3>
                <p className={styles.mapLocation}>
                  📍 {location.city}, {location.country}
                </p>
                <a 
                  href={googleMapsLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary mt-2"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}