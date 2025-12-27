"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import styles from './ItineraryBuilder.module.css';

export default function ItineraryBuilder({ itinerary, onChange, totalDuration }) {
  const [selectedPlace, setSelectedPlace] = useState('');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [ticketRequired, setTicketRequired] = useState(false);

  // Fetch available places
  const { data: placesData, isLoading: placesLoading } = useQuery({
    queryKey: ['places'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/places');
        const places = response.data?.data?.places || response.data?.data || [];
        // Ensure we return an array
        return Array.isArray(places) ? places : [];
      } catch (error) {
        console.error('Failed to fetch places:', error);
        return [];
      }
    },
  });

  // Ensure places is always an array
  const places = Array.isArray(placesData) ? placesData : [];

  const handleAddPlace = () => {
    if (!selectedPlace) return;

    const place = places.find((p) => p._id === selectedPlace);
    if (!place) return;

    const newItem = {
      placeId: selectedPlace,
      placeName: place.name,
      visitDurationMinutes: duration,
      notes: notes,
      ticketRequired: ticketRequired,
    };

    onChange([...itinerary, newItem]);

    // Reset form
    setSelectedPlace('');
    setDuration(60);
    setNotes('');
    setTicketRequired(false);
  };

  const handleRemovePlace = (index) => {
    onChange(itinerary.filter((_, i) => i !== index));
  };

  const totalItineraryDuration = itinerary.reduce(
    (sum, item) => sum + item.visitDurationMinutes,
    0
  );

  const isOverDuration = totalItineraryDuration > totalDuration;

  return (
    <div className={styles.builderWrapper}>
      {/* Add Place Form */}
      <div className={styles.addPlaceForm}>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className={styles.label}>Select Place</label>
            <select
              value={selectedPlace}
              onChange={(e) => setSelectedPlace(e.target.value)}
              className={styles.select}
              disabled={placesLoading || places.length === 0}
            >
              <option value="">
                {placesLoading
                  ? 'Loading places...'
                  : places.length === 0
                    ? 'No places available'
                    : 'Choose a destination...'}
              </option>
              {places.map((place) => (
                <option key={place._id} value={place._id}>
                  {place.name} - {place.governorate || 'Egypt'}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={15}
              max={480}
              step={15}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className={styles.label}>Visit Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Visit pyramid interior"
              className={styles.input}
            />
          </div>

          <div className={styles.checkboxField}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={ticketRequired}
                onChange={(e) => setTicketRequired(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Ticket Required</span>
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddPlace}
          disabled={!selectedPlace}
          className={styles.addBtn}
        >
          + Add to Itinerary
        </button>
      </div>

      {/* Itinerary List */}
      {itinerary.length > 0 && (
        <div className={styles.itineraryList}>
          <div className={styles.listHeader}>
            <h4>Your Itinerary ({itinerary.length} places)</h4>
            <div className={styles.durationInfo}>
              <span className={isOverDuration ? styles.durationOver : ''}>
                Total: {totalItineraryDuration} min
              </span>
              <span className={styles.durationSeparator}>/</span>
              <span>Trip: {totalDuration} min</span>
            </div>
          </div>

          {isOverDuration && (
            <div className={styles.warningBanner}>
              ⚠️ Itinerary duration exceeds trip duration. Consider reducing visit times.
            </div>
          )}

          <div className={styles.placesList}>
            {itinerary.map((item, index) => (
              <div key={index} className={styles.placeItem}>
                <div className={styles.placeNumber}>{index + 1}</div>
                <div className={styles.placeContent}>
                  <div className={styles.placeName}>{item.placeName}</div>
                  <div className={styles.placeDetails}>
                    <span className={styles.placeDuration}>
                      ⏱️ {item.visitDurationMinutes} min
                    </span>
                    {item.ticketRequired && (
                      <span className={styles.placeTicket}>🎫 Ticket</span>
                    )}
                    {item.notes && (
                      <span className={styles.placeNotes}>📝 {item.notes}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePlace(index)}
                  className={styles.removeBtn}
                  aria-label="Remove place"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {itinerary.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📍</div>
          <p>No places added yet. Start building your itinerary!</p>
        </div>
      )}
    </div>
  );
}
