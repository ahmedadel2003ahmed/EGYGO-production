'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import Image from 'next/image';
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import styles from './RegisterModal.module.css';

const RegisterModal = ({ isOpen, onClose }) => {
    const router = useRouter();
    const auth = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const formik = useFormik({
        initialValues: {
            name: "",
            email: "",
            password: "",
            phone: "",
            role: "tourist",
        },
        validationSchema: Yup.object({
            name: Yup.string().required("Required"),
            email: Yup.string().email("Invalid email address").required("Required"),
            password: Yup.string().min(6, "At least 6 characters").required("Required"),
            phone: Yup.string(),
            role: Yup.string().oneOf(["tourist", "guide"], "Must select account type").required("Required"),
        }),
        onSubmit: async (values) => {
            setSubmitting(true);
            setServerError(null);

            try {
                const registerRes = await axios.post("/api/auth/register", {
                    name: values.name,
                    email: values.email,
                    password: values.password,
                    phone: values.phone,
                    role: values.role,
                });

                if (registerRes.data?.success) {
                    const userId = registerRes.data?.userId || registerRes.data?.user?._id;

                    if (!userId) {
                        // Fallback if no userId but success (rare)
                        alert("✅ Account created successfully! You can now log in.");
                        onClose();
                        auth.switchToLogin();
                    } else {
                        // Send OTP
                        try {
                            await axios.post("/api/auth/send-verify-otp", { userId });
                        } catch (otpError) {
                            console.warn("Failed to send OTP:", otpError);
                        }

                        // Save for verification page
                        localStorage.setItem("pendingUserId", userId);
                        localStorage.setItem("registerEmail", values.email);

                        onClose(); // Close modal
                        router.push("/otp"); // Redirect to OTP page
                    }
                } else {
                    throw new Error(registerRes.data?.message || "Failed to create account");
                }
            } catch (err) {
                console.error("REGISTER ERROR:", err);
                setServerError(
                    err.response?.data?.message || err.message || "An error occurred during registration"
                );
            } finally {
                setSubmitting(false);
            }
        },
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setServerError(null);
            formik.resetForm();
        }
    }, [isOpen, formik]);

    // Close on Esc
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <FaTimes size={16} />
                </button>

                {/* Left Section (Image) */}
                <div className={styles.imageSection}>
                    <div className={styles.imageOverlay}></div>
                    <div className={styles.imageContent}>
                        <Image src="/images/logo.ico" alt="EgyGo Logo" width={120} height={120} />
                        <p>
                            Explore the beauty of Egypt, plan your trip with ease.

                        </p>
                    </div>
                </div>

                {/* Right Section (Form) */}
                <div className={styles.formSection}>
                    <h2 className={styles.heading}>Create New Account</h2>
                    <p className={styles.subHeading}>Sign up now and enjoy all features for free</p>

                    <form className={styles.form} onSubmit={formik.handleSubmit} noValidate>

                        {/* Name */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Full Name *</label>
                            <input
                                name="name"
                                placeholder="Full Name"
                                className={styles.input}
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                            {formik.touched.name && formik.errors.name && (
                                <span className={styles.error}>{formik.errors.name}</span>
                            )}
                        </div>

                        {/* Email */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Email Address *</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                className={styles.input}
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                            {formik.touched.email && formik.errors.email && (
                                <span className={styles.error}>{formik.errors.email}</span>
                            )}
                        </div>

                        {/* Password */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Password *</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="**********"
                                    className={styles.input}
                                    value={formik.values.password}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            {formik.touched.password && formik.errors.password && (
                                <span className={styles.error}>{formik.errors.password}</span>
                            )}
                        </div>

                        {/* Phone */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Phone Number</label>
                            <input
                                name="phone"
                                type="tel"
                                placeholder="+20123456789"
                                className={styles.input}
                                value={formik.values.phone}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                            {formik.touched.phone && formik.errors.phone && (
                                <span className={styles.error}>{formik.errors.phone}</span>
                            )}
                        </div>

                        {/* Role - Styled as simple select or radio, using standard select for now matching design speed */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Account Type *</label>
                            <select
                                name="role"
                                className={styles.input}
                                value={formik.values.role}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            >
                                <option value="tourist">Tourist</option>
                                <option value="guide">Tour Guide</option>
                            </select>
                        </div>

                        {/* Checkbox / Terms? */}

                        {/* Server Error */}
                        {serverError && <div className={styles.serverError}>{serverError}</div>}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={submitting}
                        >
                            {submitting ? 'Creating...' : 'Create Account'}
                        </button>

                        <p className={styles.loginLink}>
                            Already have an account?
                            <button type="button" onClick={() => auth.switchToLogin()}>Log In</button>
                        </p>

                        <div className={styles.terms}>
                            By clicking Create Account, you automatically agree to our
                            <br />
                            <span className={styles.highlight}> Privacy Policy </span> and
                            <span className={styles.highlight}> Terms of Use </span>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterModal;
