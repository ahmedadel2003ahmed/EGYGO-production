"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './LocationPicker.module.css';

export default function LocationPicker({ onLocationSelect, selectedLocation }) {
  const [showMap, setShowMap] = useState(false);
  const [tempLocation, setTempLocation] = useState(selectedLocation);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (showMap && mapRef.current && !leafletMapRef.current) {
      // Load Leaflet CSS and JS
      const loadLeaflet = async () => {
        // Add Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        if (!window.L) {
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            document.head.appendChild(script);
          });
        }

        // Initialize map
        const L = window.L;
        const initialCenter = selectedLocation || { lat: 30.0444, lng: 31.2357 }; // Cairo

        leafletMapRef.current = L.map(mapRef.current).setView(
          [initialCenter.lat, initialCenter.lng],
          13
        );

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(leafletMapRef.current);

        // Add marker if location exists
        if (selectedLocation) {
          markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], {
            draggable: true,
          }).addTo(leafletMapRef.current);

          // Update location when marker is dragged
          markerRef.current.on('dragend', (e) => {
            const pos = e.target.getLatLng();
            setTempLocation({ lat: pos.lat, lng: pos.lng });
          });
        }

        // Add click listener to map
        leafletMapRef.current.on('click', (e) => {
          const { lat, lng } = e.latlng;
          setTempLocation({ lat, lng });

          // Remove old marker
          if (markerRef.current) {
            leafletMapRef.current.removeLayer(markerRef.current);
          }

          // Add new marker
          markerRef.current = L.marker([lat, lng], {
            draggable: true,
          }).addTo(leafletMapRef.current);

          // Update location when marker is dragged
          markerRef.current.on('dragend', (e) => {
            const pos = e.target.getLatLng();
            setTempLocation({ lat: pos.lat, lng: pos.lng });
          });
        });
      };

      loadLeaflet();
    }

    // Cleanup
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [showMap]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setTempLocation(location);
        
        // Update map view and marker
        if (leafletMapRef.current && window.L) {
          leafletMapRef.current.setView([location.lat, location.lng], 15);
          
          if (markerRef.current) {
            leafletMapRef.current.removeLayer(markerRef.current);
          }
          
          markerRef.current = window.L.marker([location.lat, location.lng], {
            draggable: true,
          }).addTo(leafletMapRef.current);

          markerRef.current.on('dragend', (e) => {
            const pos = e.target.getLatLng();
            setTempLocation({ lat: pos.lat, lng: pos.lng });
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to retrieve your location. Please click on the map to select a location.');
      }
    );
  };

  const handleClear = () => {
    onLocationSelect(null);
    setTempLocation(null);
  };

  const handleConfirmLocation = () => {
    if (tempLocation) {
      onLocationSelect(tempLocation);
      setShowMap(false);
    } else {
      alert('Please select a location on the map');
    }
  };

  const handleCancelMap = () => {
    setTempLocation(selectedLocation);
    setShowMap(false);
  };

  // Popular Egyptian locations
  const popularLocations = [
    { name: 'Giza Pyramids', lat: 29.9792, lng: 31.1342 },
    { name: 'Cairo Tower', lat: 30.0458, lng: 31.2243 },
    { name: 'Luxor Temple', lat: 25.6995, lng: 32.6397 },
    { name: 'Alexandria Library', lat: 31.2089, lng: 29.9094 },
    { name: 'Hurghada Marina', lat: 27.2579, lng: 33.8116 },
  ];

  const handleQuickSelect = (location) => {
    setTempLocation({ lat: location.lat, lng: location.lng });
    
    // Update map view and marker
    if (leafletMapRef.current && window.L) {
      leafletMapRef.current.setView([location.lat, location.lng], 13);
      
      if (markerRef.current) {
        leafletMapRef.current.removeLayer(markerRef.current);
      }
      
      markerRef.current = window.L.marker([location.lat, location.lng], {
        draggable: true,
      }).addTo(leafletMapRef.current);

      markerRef.current.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        setTempLocation({ lat: pos.lat, lng: pos.lng });
      });
    }
  };

  return (
    <div className={styles.pickerWrapper}>
      {!selectedLocation && !showMap && (
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className={styles.pinLocationBtn}
        >
          <span className={styles.pinIcon}>📍</span>
          <span className={styles.pinText}>Pin Meeting Location on Map</span>
        </button>
      )}

      {selectedLocation && (
        <div className={styles.selectedLocation}>
          <div className={styles.selectedHeader}>
            <div className={styles.selectedIcon}>✅</div>
            <div className={styles.selectedInfo}>
              <div className={styles.selectedTitle}>Location Pinned Successfully</div>
              <div className={styles.selectedCoords}>
                📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </div>
            </div>
          </div>
          <div className={styles.selectedActions}>
            <a
              href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.viewMapBtn}
            >
              🗺️ View on Google Maps
            </a>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className={styles.changeLocationBtn}
            >
              📍 Change Location
            </button>
            <button
              type="button"
              onClick={handleClear}
              className={styles.removeBtn}
            >
              🗑️ Remove
            </button>
          </div>
        </div>
      )}

      {showMap && (
        <div className={styles.mapModalOverlay} onClick={handleCancelMap}>
          <div className={styles.mapModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>📍 Select Meeting Location</h3>
              <button
                type="button"
                onClick={handleCancelMap}
                className={styles.closeBtn}
                aria-label="Close map"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Quick Actions */}
              <div className={styles.quickActions}>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className={styles.quickActionBtn}
                >
                  <span className={styles.quickActionIcon}>🧭</span>
                  <span>Use My Location</span>
                </button>
              </div>

              {/* Quick Select */}
              <div className={styles.quickSelect}>
                <label className={styles.sectionLabel}>Popular Locations</label>
                <div className={styles.locationChips}>
                  {popularLocations.map((loc) => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => handleQuickSelect(loc)}
                      className={styles.locationChip}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Map */}
              <div className={styles.mapContainer}>
                <div ref={mapRef} className={styles.interactiveMap}></div>
                <div className={styles.mapInstructions}>
                  🗺️ Click anywhere on the map to pin your meeting location, or drag the marker to adjust
                </div>
              </div>

              {/* Selected Coordinates Display */}
              {tempLocation && (
                <div className={styles.coordsDisplay}>
                  <span className={styles.coordsLabel}>Selected:</span>
                  <span className={styles.coordsValue}>
                    {tempLocation.lat.toFixed(6)}, {tempLocation.lng.toFixed(6)}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={handleCancelMap}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLocation}
                className={styles.confirmBtn}
                disabled={!tempLocation}
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
