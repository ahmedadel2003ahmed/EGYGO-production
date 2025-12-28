"use client";

import React, { useState } from 'react';
import axios from 'axios';
import styles from './ChangePasswordModal.module.css';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must include uppercase, lowercase, number, and special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        '/api/auth/change-password',
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setSuccessMessage('Password changed successfully!');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Change password error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to change password';
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
    setSuccessMessage('');
    setShowPasswords({ current: false, new: false, confirm: false });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerIcon}>🔒</div>
          <h2 className={styles.modalTitle}>Change Password</h2>
          <p className={styles.modalSubtitle}>Secure your account with a strong password</p>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Current Password */}
          <div className={styles.formGroup}>
            <label htmlFor="currentPassword" className={styles.label}>
              Current Password <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={`${styles.input} ${errors.currentPassword ? styles.inputError : ''}`}
                placeholder="Enter your current password"
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.togglePasswordBtn}
                onClick={() => togglePasswordVisibility('current')}
                aria-label="Toggle password visibility"
              >
                {showPasswords.current ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.currentPassword && (
              <span className={styles.errorText}>{errors.currentPassword}</span>
            )}
          </div>

          {/* New Password */}
          <div className={styles.formGroup}>
            <label htmlFor="newPassword" className={styles.label}>
              New Password <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={`${styles.input} ${errors.newPassword ? styles.inputError : ''}`}
                placeholder="Enter new password"
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.togglePasswordBtn}
                onClick={() => togglePasswordVisibility('new')}
                aria-label="Toggle password visibility"
              >
                {showPasswords.new ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.newPassword && (
              <span className={styles.errorText}>{errors.newPassword}</span>
            )}
            <div className={styles.passwordHint}>
              <p className={styles.hintTitle}>Password must contain:</p>
              <ul className={styles.hintList}>
                <li className={formData.newPassword.length >= 8 ? styles.valid : ''}>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(formData.newPassword) ? styles.valid : ''}>
                  One uppercase letter
                </li>
                <li className={/[a-z]/.test(formData.newPassword) ? styles.valid : ''}>
                  One lowercase letter
                </li>
                <li className={/\d/.test(formData.newPassword) ? styles.valid : ''}>
                  One number
                </li>
                <li className={/[@$!%*?&]/.test(formData.newPassword) ? styles.valid : ''}>
                  One special character (@$!%*?&)
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm New Password <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                placeholder="Confirm new password"
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.togglePasswordBtn}
                onClick={() => togglePasswordVisibility('confirm')}
                aria-label="Toggle password visibility"
              >
                {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className={styles.errorText}>{errors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className={styles.errorAlert}>
              <span className={styles.errorIcon}>⚠️</span>
              {errors.submit}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className={styles.successAlert}>
              <span className={styles.successIcon}>✓</span>
              {successMessage}
            </div>
          )}

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
