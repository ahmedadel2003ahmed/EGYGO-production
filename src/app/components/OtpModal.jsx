'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaTimes } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import styles from './OtpModal.module.css';

const OtpModal = ({ isOpen, onClose }) => {
    const auth = useAuth();
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");

    // Load email when modal opens
    useEffect(() => {
        if (isOpen) {
            // Reset state
            setOtp(["", "", "", ""]);
            setVerified(false);
            setError("");
            setLoading(false);

            const storedEmail = localStorage.getItem("registerEmail");
            if (storedEmail) {
                setEmail(storedEmail);
            } else {
                // Fallback or maybe access from auth state if possible?
                // For now, consistent with page logic.
                setEmail("user@example.com");
            }
        }
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleChange = (index, value) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 3) {
            const nextInput = document.getElementById(`otp-modal-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Backspace support to move to previous input
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-modal-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleSubmit = async () => {
        const code = otp.join("");
        if (code.length < 4) {
            setError("Please enter the complete 4-digit code.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    otp: code,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data?.message || "Verification failed. Check the code and try again.");
                return;
            }

            // Success
            setVerified(true);

            // Cleanup
            localStorage.removeItem("registerEmail");
            localStorage.removeItem("pendingUserId");

        } catch (err) {
            console.error("Verification error:", err);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        onClose();
        auth.switchToLogin();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                    <FaTimes size={16} />
                </button>

                {/* Left Section */}
                <div className={styles.imageSection}>
                    <div className={styles.imageOverlay}></div>
                    <div className={styles.imageContent}>
                        <Image src="/images/logo.ico" alt="EgyGo Logo" width={100} height={100} style={{ marginBottom: 20 }} />
                        <h2>Welcome to EgyGo</h2>
                        <p>Verify your email to verify your account and start your journey.</p>
                    </div>
                </div>

                {/* Right Section */}
                <div className={styles.formSection}>
                    {!verified ? (
                        <>
                            <h2 className={styles.heading}>Verify Your Email</h2>
                            <p className={styles.subHeading}>
                                We&apos;ve sent a 4-digit verification code to <br />
                                <strong>{email}</strong>
                            </p>

                            <div className={styles.otpInputs}>
                                {otp.map((v, i) => (
                                    <input
                                        key={i}
                                        id={`otp-modal-${i}`}
                                        maxLength="1"
                                        value={v}
                                        onChange={(e) => handleChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        className={styles.otpBox}
                                        autoFocus={i === 0}
                                        autoComplete="off"
                                    />
                                ))}
                            </div>

                            {error && <div className={styles.errorText}>{error}</div>}

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className={styles.submitBtn}
                            >
                                {loading ? "Verifying..." : "Verify Code"}
                            </button>

                            <button
                                className={styles.resendLink}
                                onClick={() => alert("Resend code functionality to be implemented")}
                            >
                                Didn&apos;t receive the code? Resend
                            </button>
                        </>
                    ) : (
                        <div className={styles.successWrapper}>
                            <Image
                                src="/images/success.png"
                                alt="Success"
                                width={120}
                                height={120}
                                className={styles.successIcon}
                            />
                            <h2 className={styles.heading} style={{ color: '#10B981' }}>Verified Successfully!</h2>
                            <p className={styles.subHeading}>
                                Your account is now active. Please log in to continue.
                            </p>

                            <button onClick={handleContinue} className={styles.submitBtn}>
                                Go to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OtpModal;
