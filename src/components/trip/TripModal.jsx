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
import { useAuth } from '@/app/context/AuthContext';

export default function TripModal({ isOpen, onClose, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const auth = useAuth();

  // Fallback governorate list (with actual MongoDB IDs from API)
  const FALLBACK_GOVERNORATES = [
    { _id: '6935efa247a0b161dbdeee4e', name: 'Alexandria', slug: 'alexandria' },
    { _id: '6935efa347a0b161dbdeee50', name: 'Aswan', slug: 'aswan' },
    { _id: '6935efa747a0b161dbdeee59', name: 'Beheira', slug: 'beheira' },
    { _id: '6935efaa47a0b161dbdeee62', name: 'Beni Suef', slug: 'beni-suef' },
    { _id: '6935efa247a0b161dbdeee4c', name: 'Cairo', slug: 'cairo' },
    { _id: '6935efa847a0b161dbdeee5d', name: 'Damietta', slug: 'damietta' },
    { _id: '6935efaa47a0b161dbdeee63', name: 'Fayoum', slug: 'fayoum' },
    { _id: '6935efa847a0b161dbdeee5b', name: 'Gharbia', slug: 'gharbia' },
    { _id: '6935efa247a0b161dbdeee4d', name: 'Giza', slug: 'giza' },
    { _id: '6935efa747a0b161dbdeee58', name: 'Ismailia', slug: 'ismailia' },
    { _id: '6935efa847a0b161dbdeee5a', name: 'Kafr El Sheikh', slug: 'kafr-el-sheikh' },
    { _id: '6935efa347a0b161dbdeee4f', name: 'Luxor', slug: 'luxor' },
    { _id: '6935efaa47a0b161dbdeee64', name: 'Matrouh', slug: 'matrouh' },
    { _id: '6935efaa47a0b161dbdeee65', name: 'North Sinai', slug: 'north-sinai' },
    { _id: '6935efa647a0b161dbdeee55', name: 'Qalyubia', slug: 'qalyubia' },
    { _id: '6935efa947a0b161dbdeee61', name: 'Qena', slug: 'qena' },
    { _id: '6935efa447a0b161dbdeee51', name: 'Red Sea', slug: 'red-sea' },
    { _id: '6935efa547a0b161dbdeee54', name: 'Sharqia', slug: 'sharqia' },
    { _id: '6935efa747a0b161dbdeee57', name: 'Suez', slug: 'suez' },
  ];

  // Fetch provinces
  React.useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get('/api/provinces');
        if (response.data?.success && response.data?.data?.provinces) {
          setProvinces(response.data.data.provinces);
        } else {
          // Use fallback if API doesn't return data
          setProvinces(FALLBACK_GOVERNORATES);
        }
      } catch (err) {
        console.error('Failed to fetch provinces:', err);
        // Use fallback governorates if API fails
        setProvinces(FALLBACK_GOVERNORATES);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

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
    provinceId: Yup.string()
      .required('Please select a governorate for your trip'),
  });

  const formik = useFormik({
    initialValues: {
      startAt: null,
      meetingAddress: '',
      totalDurationMinutes: 240,
      notes: '',
      provinceId: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          // Show login modal instead of redirecting
          onClose();
          auth?.requireAuth?.(() => {
            // Reopen trip modal after login
            // Note: You might need to handle this differently
            console.log('User logged in, trip creation can continue');
          });
          return;
        }

        const tripData = {
          startAt: values.startAt.toISOString(),
          meetingAddress: values.meetingAddress,
          totalDurationMinutes: values.totalDurationMinutes,
          notes: values.notes,
          provinceId: values.provinceId, // Always include the selected province
        };

        // Add itinerary if provided
        if (itinerary.length > 0) {
          tripData.itinerary = itinerary.map(item => ({
            placeId: item.placeId,
            visitDurationMinutes: item.visitDurationMinutes,
            notes: item.notes || '',
            ticketRequired: item.ticketRequired || false,
          }));
          
          // Use createdFromPlaceId if itinerary exists
          tripData.createdFromPlaceId = itinerary[0].placeId;
        }

        if (selectedLocation) {
          tripData.meetingPoint = {
            type: 'Point',
            coordinates: [selectedLocation.lng, selectedLocation.lat],
          };
        }

        console.log('📤 [TripModal] Sending trip data:', JSON.stringify(tripData, null, 2));
        console.log('📤 [TripModal] Request URL:', '/api/tourist/trips');
        console.log('📤 [TripModal] Token present:', !!token);

        const response = await axios.post(
          '/api/tourist/trips',
          tripData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('✅ [TripModal] Response received:', response.data);

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
        console.error('❌ [TripModal] Create trip error:', err);
        console.error('❌ [TripModal] Error response:', err.response);
        console.error('❌ [TripModal] Response data:', err.response?.data);
        console.error('❌ [TripModal] Response status:', err.response?.status);
        console.error('❌ [TripModal] Response headers:', err.response?.headers);
        
        if (err.response?.status === 401) {
          setError('Your session has expired. Please login again.');
          onClose();
          auth?.requireAuth?.(() => {
            console.log('Session refreshed');
          });
          return;
        }
        
        if (err.response?.status === 422) {
          const errorData = err.response?.data;
          console.error('❌ [TripModal] 422 Validation details:', errorData);
          console.error('❌ [TripModal] Validation errors array:', errorData?.errors);
          console.error('❌ [TripModal] Each error:', errorData?.errors?.map((e, i) => ({ index: i, error: e })));
          
          // Try to extract meaningful error message
          let validationError = 'Validation failed. Please check your inputs.';
          
          if (errorData?.errors && Array.isArray(errorData.errors)) {
            // If errors is an array of validation errors
            validationError = errorData.errors.map(e => e.msg || e.message || e).join(', ');
          } else if (errorData?.message) {
            validationError = errorData.message;
          } else if (errorData?.error) {
            validationError = errorData.error;
          } else if (typeof errorData === 'string') {
            validationError = errorData;
          } else if (!errorData || Object.keys(errorData).length === 0) {
            // Empty response body - this is the issue!
            validationError = 'Server validation failed. Please check: date is in future, meeting address is detailed (10+ chars), and province is selected.';
          }
          
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

            {/* Governorate Selection */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Governorate <span className={styles.required}>*</span>
              </label>
              <p className={styles.helpText}>
                Select the governorate where your trip will take place
              </p>
              <select
                name="provinceId"
                value={formik.values.provinceId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`${styles.select} ${
                  formik.touched.provinceId && formik.errors.provinceId
                    ? styles.inputError
                    : ''
                }`}
                disabled={loadingProvinces}
              >
                <option value="">Select a governorate...</option>
                {provinces.map((province) => (
                  <option key={province._id} value={province._id}>
                    {province.name}
                  </option>
                ))}
              </select>
              {formik.touched.provinceId && formik.errors.provinceId && (
                <div className={styles.errorText}>{formik.errors.provinceId}</div>
              )}
            </div>

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
                Add destinations to help us find suitable guides in your area
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
