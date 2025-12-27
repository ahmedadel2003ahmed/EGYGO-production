'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import adminService from '@/services/adminService';
import { useAuth } from '@/app/context/AuthContext';
import styles from './login.module.css';

export default function AdminLogin() {
    const router = useRouter();
    const { setAuth } = useAuth();
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Required'),
            password: Yup.string().required('Required'),
        }),
        onSubmit: async (values) => {
            null, // Removed syntax error logic
                setError(null);
            try {
                const response = await adminService.login(values.email, values.password);

                // API returns token directly in data object or nested in tokens object
                const token = response.data?.accessToken || response.data?.tokens?.accessToken;

                if (response.success && token) {
                    // Sync with global AuthContext
                    setAuth({
                        token: token,
                        user: response.data.user
                    });

                    router.push('/admin');
                } else {
                    setError('Login failed. Please check your credentials.');
                }
            } catch (err) {
                console.error('Admin login error:', err);
                setError(err.response?.data?.message || 'Failed to login. Please try again.');
            }
        },
    });

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Admin Portal</h1>
                    <p className={styles.subtitle}>Sign in to manage EgyGo</p>
                </div>

                <form onSubmit={formik.handleSubmit} className={styles.form}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            className={`form-control ${formik.touched.email && formik.errors.email ? 'is-invalid' : ''}`}
                            {...formik.getFieldProps('email')}
                        />
                        {formik.touched.email && formik.errors.email && (
                            <div className="invalid-feedback">{formik.errors.email}</div>
                        )}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="password" className="form-label">Password</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className={`form-control ${formik.touched.password && formik.errors.password ? 'is-invalid' : ''}`}
                                {...formik.getFieldProps('password')}
                            />
                            <button
                                type="button"
                                className={styles.toggleBtn}
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {formik.touched.password && formik.errors.password && (
                            <div className="invalid-feedback d-block">{formik.errors.password}</div>
                        )}
                    </div>

                    {error && <div className="alert alert-danger mb-3">{error}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary w-100 py-2"
                        disabled={formik.isSubmitting}
                    >
                        {formik.isSubmitting ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
