"use client";

import React, { useState, useCallback } from 'react';
import styles from './LocationPicker.module.css';

export default function LocationPicker({ onLocationSelect, selectedLocation }) {
  const [showMap, setShowMap] = useState(false);
  const [manualCoords, setManualCoords] = useState({
    lat: selectedLocation?.lat || '',
    lng: selectedLocation?.lng || '',
  });

  const handleManualSubmit = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);

    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onLocationSelect({ lat, lng });
      setShowMap(false);
    } else {
      alert('Please enter valid coordinates.\nLatitude: -90 to 90\nLongitude: -180 to 180');
    }
  };

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
        onLocationSelect(location);
        setManualCoords({
          lat: location.lat.toFixed(6),
          lng: location.lng.toFixed(6),
        });
        setShowMap(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to retrieve your location. Please enter coordinates manually.');
      }
    );
  };

  const handleClear = () => {
    onLocationSelect(null);
    setManualCoords({ lat: '', lng: '' });
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
    onLocationSelect({ lat: location.lat, lng: location.lng });
    setManualCoords({
      lat: location.lat.toFixed(6),
      lng: location.lng.toFixed(6),
    });
    setShowMap(false);
  };

  return (
    <div className={styles.pickerWrapper}>
      {!selectedLocation && !showMap && (
        <div className={styles.actionButtons}>
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className={styles.actionBtn}
          >
            📍 Pin Location
          </button>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className={styles.actionBtn}
          >
            🧭 Use Current Location
          </button>
        </div>
      )}

      {selectedLocation && (
        <div className={styles.selectedLocation}>
          <div className={styles.selectedHeader}>
            <div className={styles.selectedIcon}>✅</div>
            <div className={styles.selectedInfo}>
              <div className={styles.selectedTitle}>Location Pinned</div>
              <div className={styles.selectedCoords}>
                Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className={styles.clearBtn}
              aria-label="Clear location"
            >
              ×
            </button>
          </div>
          <div className={styles.mapPreview}>
            <a
              href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mapLink}
            >
              🗺️ View on Google Maps
            </a>
          </div>
        </div>
      )}

      {showMap && (
        <div className={styles.mapModal}>
          <div className={styles.modalHeader}>
            <h4>Select Meeting Location</h4>
            <button
              type="button"
              onClick={() => setShowMap(false)}
              className={styles.closeBtn}
            >
              ×
            </button>
          </div>

          <div className={styles.modalContent}>
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

            {/* Manual Entry */}
            <div className={styles.manualEntry}>
              <label className={styles.sectionLabel}>Enter Coordinates</label>
              <div className={styles.coordInputs}>
                <div className={styles.coordField}>
                  <label>Latitude</label>
                  <input
                    type="number"
                    value={manualCoords.lat}
                    onChange={(e) =>
                      setManualCoords({ ...manualCoords, lat: e.target.value })
                    }
                    placeholder="e.g., 29.9792"
                    step="0.000001"
                    className={styles.coordInput}
                  />
                </div>
                <div className={styles.coordField}>
                  <label>Longitude</label>
                  <input
                    type="number"
                    value={manualCoords.lng}
                    onChange={(e) =>
                      setManualCoords({ ...manualCoords, lng: e.target.value })
                    }
                    placeholder="e.g., 31.1342"
                    step="0.000001"
                    className={styles.coordInput}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleManualSubmit}
                className={styles.submitBtn}
              >
                Set Location
              </button>
            </div>

            {/* Info */}
            <div className={styles.infoBox}>
              <strong>💡 Tip:</strong> You can find coordinates by right-clicking on Google Maps
              and selecting "What's here?"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
