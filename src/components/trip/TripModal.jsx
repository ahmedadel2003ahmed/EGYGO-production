"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from './TripModal.module.css';
import ItineraryBuilder from '@/components/trip/ItineraryBuilder';
import LocationPicker from '@/components/trip/LocationPicker';

export default function TripModal({ isOpen, onClose, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const validationSchema = Yup.object({
    startAt: Yup.date()
      .min(new Date(), 'Trip date must be in the future')
      .required('Start date and time is required'),
    meetingAddress: Yup.string()
      .min(10, 'Please provide a detailed meeting address')
      .required('Meeting address is required'),
    totalDurationMinutes: Yup.number()
      .min(60, 'Trip duration must be at least 1 hour')
      .max(1440, 'Trip duration cannot exceed 24 hours')
      .required('Duration is required'),
    notes: Yup.string()
      .max(500, 'Notes cannot exceed 500 characters'),
  });

  const formik = useFormik({
    initialValues: {
      startAt: null,
      meetingAddress: '',
      totalDurationMinutes: 240,
      notes: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const tripData = {
          startAt: values.startAt.toISOString(),
          meetingAddress: values.meetingAddress,
          totalDurationMinutes: values.totalDurationMinutes,
          notes: values.notes,
          itinerary: itinerary.map(item => ({
            placeId: item.placeId,
            visitDurationMinutes: item.visitDurationMinutes,
            notes: item.notes || '',
            ticketRequired: item.ticketRequired || false,
          })),
        };

        if (selectedLocation) {
          tripData.meetingPoint = {
            type: 'Point',
            coordinates: [selectedLocation.lng, selectedLocation.lat],
          };
        }

        const response = await axios.post(
          'http://localhost:5000/api/tourist/trips',
          tripData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data?.success) {
          const tripId = response.data?.data?.trip?._id || 
                        response.data?.data?._id || 
                        response.data?.trip?._id ||
                        response.data?._id;
          
          console.log('Extracted tripId:', tripId);
          console.log('Response data structure:', response.data?.data);
          
          if (!tripId) {
            throw new Error('Trip created but no ID returned');
          }
          
          // Reset form
          formik.resetForm();
          setItinerary([]);
          setSelectedLocation(null);
          
          // Close modal
          onClose();
          
          // Notify parent
          if (onSuccess) {
            onSuccess();
          }
          
          // Redirect to guide selection
          router.push(`/create-trip/${tripId}/select-guide`);
        } else {
          throw new Error(response.data?.message || 'Failed to create trip');
        }
      } catch (err) {
        console.error('Create trip error:', err);
        
        if (err.response?.status === 401) {
          setError('Your session has expired. Please login again.');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }
        
        if (err.response?.status === 422) {
          const validationError = err.response?.data?.message || 
                                 err.response?.data?.error ||
                                 JSON.stringify(err.response?.data);
          setError(`Validation Error: ${validationError}`);
          return;
        }
        
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to create trip. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    },
  });

  const handleDurationChange = (hours) => {
    formik.setFieldValue('totalDurationMinutes', hours * 60);
  };

  const handleClose = () => {
    if (!loading) {
      formik.resetForm();
      setItinerary([]);
      setSelectedLocation(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Create Your Trip</h2>
            <p className={styles.modalSubtitle}>
              Plan your perfect Egyptian adventure with a professional guide
            </p>
          </div>
          <button
            onClick={handleClose}
            className={styles.closeBtn}
            disabled={loading}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          <form onSubmit={formik.handleSubmit} noValidate>
            {error && (
              <div className={styles.errorAlert}>
                <span className={styles.errorIcon}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Trip Date & Time */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Trip Date & Time <span className={styles.required}>*</span>
              </label>
              <DatePicker
                selected={formik.values.startAt}
                onChange={(date) => formik.setFieldValue('startAt', date)}
                onBlur={formik.handleBlur}
                showTimeSelect
                minDate={new Date()}
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select date and time"
                className={`${styles.input} ${
                  formik.touched.startAt && formik.errors.startAt
                    ? styles.inputError
                    : ''
                }`}
              />
              {formik.touched.startAt && formik.errors.startAt && (
                <div className={styles.errorText}>{formik.errors.startAt}</div>
              )}
            </div>

            {/* Duration */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Trip Duration <span className={styles.required}>*</span>
              </label>
              <div className={styles.durationSelector}>
                {[2, 4, 6, 8].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => handleDurationChange(hours)}
                    className={`${styles.durationBtn} ${
                      formik.values.totalDurationMinutes === hours * 60
                        ? styles.durationBtnActive
                        : ''
                    }`}
                  >
                    {hours} Hours
                  </button>
                ))}
              </div>
              <input
                type="number"
                name="totalDurationMinutes"
                value={formik.values.totalDurationMinutes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Or enter custom duration in minutes"
                className={styles.input}
              />
              {formik.touched.totalDurationMinutes &&
                formik.errors.totalDurationMinutes && (
                  <div className={styles.errorText}>
                    {formik.errors.totalDurationMinutes}
                  </div>
                )}
            </div>

            {/* Meeting Location */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Meeting Address <span className={styles.required}>*</span>
              </label>
              <textarea
                name="meetingAddress"
                value={formik.values.meetingAddress}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter detailed meeting address (e.g., Giza Pyramids Main Entrance, Cairo)"
                rows={3}
                className={`${styles.textarea} ${
                  formik.touched.meetingAddress && formik.errors.meetingAddress
                    ? styles.inputError
                    : ''
                }`}
              />
              {formik.touched.meetingAddress && formik.errors.meetingAddress && (
                <div className={styles.errorText}>
                  {formik.errors.meetingAddress}
                </div>
              )}
            </div>

            {/* Location Picker */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Pin Meeting Location (Optional)</label>
              <LocationPicker
                onLocationSelect={setSelectedLocation}
                selectedLocation={selectedLocation}
              />
            </div>

            {/* Notes */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Additional Notes (Optional)</label>
              <textarea
                name="notes"
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Any special requirements or preferences? (e.g., Prefer English-speaking guide)"
                rows={4}
                className={styles.textarea}
              />
              {formik.touched.notes && formik.errors.notes && (
                <div className={styles.errorText}>{formik.errors.notes}</div>
              )}
              <div className={styles.charCount}>
                {formik.values.notes.length}/500 characters
              </div>
            </div>

            {/* Itinerary Builder */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Trip Itinerary (Optional)
              </label>
              <p className={styles.helpText}>
                Add places you want to visit during this trip
              </p>
              <ItineraryBuilder
                itinerary={itinerary}
                onChange={setItinerary}
                totalDuration={formik.values.totalDurationMinutes}
              />
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button
                type="button"
                onClick={handleClose}
                className={styles.cancelBtn}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Creating Trip...
                  </>
                ) : (
                  'Continue to Select Guide'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
