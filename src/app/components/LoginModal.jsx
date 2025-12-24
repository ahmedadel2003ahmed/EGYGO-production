'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import Image from 'next/image';
import { FaTimes, FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';
import { FaXTwitter } from "react-icons/fa6"; // Assuming you have this or use a generic icon
import { useAuth } from '@/app/context/AuthContext';
import styles from './LoginModal.module.css';

const LoginModal = ({ isOpen, onClose }) => {
    const router = useRouter();
    const auth = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setServerError(null);
            formik.resetForm();
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Required'),
            password: Yup.string().min(6, 'At least 6 characters').required('Required'),
        }),
        onSubmit: async (values) => {
            setSubmitting(true);
            setServerError(null);

            try {
                const response = await axios.post('/api/auth/login', {
                    email: values.email,
                    password: values.password,
                });

                if (response.data?.success) {
                    const token = response.data?.data?.accessToken || response.data?.accessToken || response.data?.token;
                    const user = response.data?.data?.user || response.data?.user;

                    if (!token) throw new Error('No token received');

                    if (auth?.setAuth) {
                        auth.setAuth({ token, user });
                    } else {
                        localStorage.setItem('access_token', token);
                        localStorage.setItem('laqtaha_user', JSON.stringify(user));
                    }

                    onClose(); // Close modal on success
                    // No page reload needed - state management handles UI updates
                } else {
                    throw new Error(response.data?.message || 'Login failed');
                }
            } catch (err) {
                console.error('login error', err);
                setServerError(
                    err.response?.data?.message || err.message || 'An error occurred during login'
                );
            } finally {
                setSubmitting(false);
            }
        },
    });

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
                    <h2 className={styles.heading}>Log In</h2>
                    <p className={styles.subHeading}>Welcome back, sign in to continue</p>

                    <form className={styles.form} onSubmit={formik.handleSubmit} noValidate>

                        {/* Email Field */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Email Address *</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className={styles.input}
                                    value={formik.values.email}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                />
                            </div>
                            {formik.touched.email && formik.errors.email && (
                                <span className={styles.error}>{formik.errors.email}</span>
                            )}
                        </div>

                        {/* Password Field */}
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

                        {/* Options Row */}
                        <div className={styles.optionsRow}>
                            <label className={styles.rememberMe}>
                                <input type="checkbox" /> Remember me
                            </label>
                            <a href="#" className={styles.forgotPassword}>Forgot password?</a>
                        </div>

                        {/* Server Error */}
                        {serverError && <div className={styles.serverError}>{serverError}</div>}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={styles.loginBtn}
                            disabled={submitting}
                            style={{ background: '#d2a16e' }} // Matching the "purple" vibe requested
                        >
                            {submitting ? 'Logging in...' : 'Log In'}
                        </button>

                        {/* Social Login */}
                        <div className={styles.divider}>Or sign in with</div>
                        <div className={styles.socialButtons}>
                            <button type="button" className={styles.socialBtn} onClick={() => { }}>
                                <FaGoogle size={20} color="#DB4437" />
                            </button>
                            <button type="button" className={styles.socialBtn} onClick={() => { }}>
                                <FaXTwitter size={20} color="#000" />
                            </button>
                        </div>

                        <p className={styles.registerLink}>
                            Don't have an account?
                            <button type="button" onClick={() => auth.switchToRegister()}>Sign up for free</button>
                        </p>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
