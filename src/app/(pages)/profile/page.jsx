"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import styles from './Profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [editedData, setEditedData] = useState({
    name: '',
    phone: '',
  });

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Fetch user profile
  const {
    data: userData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        'http://localhost:5000/api/auth/me',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data?.data;
    },
    onSuccess: (data) => {
      setEditedData({
        name: data?.name || '',
        phone: data?.phone || '',
      });
    },
  });

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('laqtaha_user');
      router.push('/login');
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedData({
        name: userData?.name || '',
        phone: userData?.phone || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(
        'http://localhost:5000/api/auth/me',
        editedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      refetch();
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorWrapper}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>Failed to Load Profile</h2>
        <p>{error?.response?.data?.message || 'Unable to load profile data'}</p>
        <button onClick={() => router.push('/login')} className={styles.backBtn}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <section className={styles.headerSection}>
        <div className="container">
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>My Profile</h1>
              <p className={styles.pageSubtitle}>Manage your account information</p>
            </div>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <span className={styles.logoutIcon}>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </section>

      {/* Profile Content */}
      <section className={styles.contentSection}>
        <div className="container">
          <div className={styles.profileGrid}>
            {/* Profile Card */}
            <div className={styles.profileCard}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper}>
                  <div className={styles.avatar}>
                    {getInitials(userData?.name)}
                  </div>
                  <button className={styles.avatarEditBtn} title="Change photo">
                    📷
                  </button>
                </div>
                <h2 className={styles.userName}>{userData?.name}</h2>
                <p className={styles.userEmail}>{userData?.email}</p>
                <div className={styles.badgeContainer}>
                  {userData?.role && (
                    <span className={styles.roleBadge}>
                      {userData.role === 'tourist' ? '🧳' : '👤'} {userData.role}
                    </span>
                  )}
                  {userData?.isEmailVerified && (
                    <span className={styles.verifiedBadge}>
                      ✓ Verified
                    </span>
                  )}
                  {userData?.isActive && (
                    <span className={styles.activeBadge}>
                      ● Active
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.statsSection}>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>📅</div>
                  <div className={styles.statContent}>
                    <span className={styles.statLabel}>Member Since</span>
                    <span className={styles.statValue}>
                      {new Date(userData?.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>🕐</div>
                  <div className={styles.statContent}>
                    <span className={styles.statLabel}>Last Login</span>
                    <span className={styles.statValue}>
                      {userData?.lastLogin
                        ? new Date(userData.lastLogin).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className={styles.detailsCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Personal Information</h3>
                {!isEditing ? (
                  <button onClick={handleEditToggle} className={styles.editBtn}>
                    <span className={styles.editIcon}>✏️</span>
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className={styles.editActions}>
                    <button onClick={handleEditToggle} className={styles.cancelBtn}>
                      Cancel
                    </button>
                    <button onClick={handleSaveChanges} className={styles.saveBtn}>
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoGrid}>
                  {/* Name */}
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>
                      <span className={styles.labelIcon}>👤</span>
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.name}
                        onChange={(e) =>
                          setEditedData({ ...editedData, name: e.target.value })
                        }
                        className={styles.infoInput}
                        placeholder="Enter your name"
                      />
                    ) : (
                      <p className={styles.infoValue}>{userData?.name || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>
                      <span className={styles.labelIcon}>📧</span>
                      Email Address
                    </label>
                    <p className={styles.infoValue}>
                      {userData?.email}
                      {userData?.isEmailVerified && (
                        <span className={styles.verifiedIcon} title="Verified">
                          ✓
                        </span>
                      )}
                    </p>
                    <span className={styles.infoHint}>Email cannot be changed</span>
                  </div>

                  {/* Phone */}
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>
                      <span className={styles.labelIcon}>📱</span>
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedData.phone}
                        onChange={(e) =>
                          setEditedData({ ...editedData, phone: e.target.value })
                        }
                        className={styles.infoInput}
                        placeholder="+20 XXX XXX XXXX"
                      />
                    ) : (
                      <p className={styles.infoValue}>{userData?.phone || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Account ID */}
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>
                      <span className={styles.labelIcon}>🆔</span>
                      Account ID
                    </label>
                    <p className={styles.infoValue}>
                      <code className={styles.codeValue}>{userData?._id}</code>
                    </p>
                  </div>

                  {/* Created At */}
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>
                      <span className={styles.labelIcon}>🕐</span>
                      Account Created
                    </label>
                    <p className={styles.infoValue}>{formatDate(userData?.createdAt)}</p>
                  </div>

                  {/* Updated At */}
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>
                      <span className={styles.labelIcon}>🔄</span>
                      Last Updated
                    </label>
                    <p className={styles.infoValue}>{formatDate(userData?.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.actionsCard}>
            <h3 className={styles.actionsTitle}>Quick Actions</h3>
            <div className={styles.actionsGrid}>
              <button
                onClick={() => router.push('/my-trips')}
                className={styles.actionBtn}
              >
                <span className={styles.actionIcon}>✈️</span>
                <div className={styles.actionContent}>
                  <span className={styles.actionLabel}>My Trips</span>
                  <span className={styles.actionDesc}>View all your trips</span>
                </div>
              </button>
              <button 
                className={styles.actionBtn}
                onClick={() => setIsChangePasswordOpen(true)}
              >
                <span className={styles.actionIcon}>🔒</span>
                <div className={styles.actionContent}>
                  <span className={styles.actionLabel}>Security</span>
                  <span className={styles.actionDesc}>Change password</span>
                </div>
              </button>
              <button className={styles.actionBtn}>
                <span className={styles.actionIcon}>🔔</span>
                <div className={styles.actionContent}>
                  <span className={styles.actionLabel}>Notifications</span>
                  <span className={styles.actionDesc}>Manage preferences</span>
                </div>
              </button>
              <button className={styles.actionBtn}>
                <span className={styles.actionIcon}>⚙️</span>
                <div className={styles.actionContent}>
                  <span className={styles.actionLabel}>Settings</span>
                  <span className={styles.actionDesc}>App preferences</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
