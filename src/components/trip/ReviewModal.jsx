"use client";

import React, { useState } from 'react';
import styles from './ReviewModal.module.css';

export default function ReviewModal({ isOpen, onClose, onSubmit, isSubmitting }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoveredStar, setHoveredStar] = useState(0);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) return;
        onSubmit({ rating, comment });
    };

    const resetForm = () => {
        setRating(0);
        setComment('');
        onClose();
    };

    return (
        <div className={styles.modalOverlay} onClick={resetForm}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <h2 className={styles.modalTitle}>Rate Your Experience</h2>
                        <p className={styles.modalSubtitle}>How was your trip?</p>
                    </div>
                    <button onClick={resetForm} className={styles.closeBtn}>✕</button>
                </div>

                <div className={styles.modalBody}>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.ratingSection}>
                            <div className={styles.stars}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`${styles.starBtn} ${(hoveredStar || rating) >= star ? styles.active : ''}`}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredStar(star)}
                                        onMouseLeave={() => setHoveredStar(0)}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <p className={styles.label}>
                                {rating === 0 ? 'Select a rating' : `${rating} out of 5 stars`}
                            </p>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Review (Optional)</label>
                            <textarea
                                className={styles.textarea}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience with us..."
                                rows={4}
                            />
                        </div>

                        <div className={styles.actionButtons}>
                            <button type="button" onClick={resetForm} className={styles.cancelBtn} disabled={isSubmitting}>
                                Cancel
                            </button>
                            <button type="submit" className={styles.submitBtn} disabled={rating === 0 || isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
