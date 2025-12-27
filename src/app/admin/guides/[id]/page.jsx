'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import adminService from '@/services/adminService';
import styles from './page.module.css';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaStar, FaGlobe, FaCheck, FaTimes } from 'react-icons/fa';

export default function GuideDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [guide, setGuide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // -- Verification State --
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [rejectionNote, setRejectionNote] = useState('');

    useEffect(() => {
        const fetchGuide = async () => {
            try {
                const response = await adminService.getGuideDetails(id);
                if (response.success) {
                    setGuide(response.data);
                } else {
                    console.error('Failed to fetch guide details');
                }
            } catch (error) {
                console.error('Error fetching guide details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchGuide();
        }
    }, [id]);

    const handleVerifyDocument = async (docId, status, note = '') => {
        setVerifyLoading(true);
        try {
            const response = await adminService.verifyDocument(id, docId, status, note);
            if (response.success && response.guide) {
                setGuide(response.guide);
            } else {
                alert('Verification update failed.');
            }
        } catch (error) {
            console.error('Error verifying document:', error);
            alert('An error occurred while verifying the document.');
        } finally {
            setVerifyLoading(false);
            // Close modal if open
            setShowRejectModal(false);
            setRejectionNote('');
            setSelectedDocId(null);
        }
    };

    const openRejectModal = (docId) => {
        setSelectedDocId(docId);
        setRejectionNote('');
        setShowRejectModal(true);
    };

    const confirmRejection = () => {
        if (!selectedDocId) return;
        const note = rejectionNote.trim() || 'Document is not clear or does not meet verification requirements. Please resubmit with higher quality images.';
        handleVerifyDocument(selectedDocId, 'rejected', note);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!guide) {
        return <div className="p-4 text-center">Guide not found</div>;
    }

    const { user } = guide; // Note: API returned 'user' object inside guide data for personal info like email/phone, but guide specific fields are at root level

    // Fallback for names if not directly on guide object
    const guideName = guide.name || user?.name || 'Unknown Guide';
    const guideEmail = user?.email || guide.email;
    const guidePhone = user?.phone || guide.phone;
    const guideBio = guide.bio || 'No biography provided.';
    const guidePhoto = guide.photo?.url || '/assets/images/placeholder-avatar.png'; // Fallback image needed

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Guide Details</h1>
                <div className={styles.breadcrumb}>
                    Guide Management / Pending Guides / {guideName}
                </div>
            </div>

            <div className={styles.grid}>
                {/* Left Column: Profile Card */}
                <div className={`${styles.card} ${styles.profileCard}`}>
                    <div className={styles.avatarWrapper}>
                        {/* Use simple img tag for external cloudinary URLs or next/image with config */}
                        <img
                            src={guidePhoto}
                            alt={guideName}
                            className={styles.avatar}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                        />
                    </div>

                    <h2 className={styles.name}>{guideName}</h2>
                    <span className={`${styles.statusBadge} ${guide.isVerified ? 'bg-success text-white' : ''}`}>
                        {guide.isVerified ? 'Verified' : 'Pending'}
                    </span>

                    <div className={styles.contactInfo}>
                        <div className={styles.infoItem}>
                            <FaEnvelope className={styles.icon} />
                            <span>{guideEmail}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <FaPhone className={styles.icon} />
                            <span>{guidePhone}</span>
                        </div>
                    </div>

                    <button
                        className={styles.actionButton}
                        onClick={() => setActiveTab('documents')}
                    >
                        Review Documents
                    </button>
                </div>

                {/* Right Column: Details & Tabs */}
                <div className={`${styles.card} ${styles.detailsCard}`}>
                    <div className={styles.tabs}>
                        <div
                            className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : activeTab === 'documents' ? '' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </div>
                        <div
                            className={`${styles.tab} ${activeTab === 'documents' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('documents')}
                        >
                            Documents
                        </div>
                        <div
                            className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            Verification History
                        </div>
                    </div>

                    <div className={styles.tabContent}>
                        {activeTab === 'overview' && (
                            <div className="animation-fade-in">
                                <h3 className={styles.sectionTitle}>About {guideName}</h3>

                                <div className={styles.detailGroup}>
                                    <span className={styles.detailLabel}>Biography:</span>
                                    <p className={styles.biography}>
                                        {guideBio}
                                    </p>
                                </div>

                                <div className={styles.detailGroup}>
                                    <span className={styles.detailLabel}>Languages Spoken:</span>
                                    <p className={styles.detailValue}>
                                        {guide.languages && guide.languages.length > 0
                                            ? guide.languages.join(', ')
                                            : 'No languages listed'}
                                    </p>
                                </div>

                                <div className={styles.detailGroup}>
                                    <span className={styles.detailLabel}>Experience & Pricing:</span>
                                    <p className={styles.detailValue}>
                                        Price per hour: {guide.pricePerHour ? `${guide.pricePerHour} EGP` : 'Not set'}
                                    </p>
                                </div>

                                <div className={styles.detailGroup}>
                                    <span className={styles.detailLabel}>Member Since:</span>
                                    <p className={styles.detailValue}>
                                        {guide.createdAt ? new Date(guide.createdAt).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className={styles.documentsGrid}>
                                {guide.documents && guide.documents.length > 0 ? (
                                    guide.documents.map((doc) => (
                                        <div key={doc._id} className={styles.documentCard}>
                                            <div className={styles.documentPreview}>
                                                <img
                                                    src={doc.url}
                                                    alt={doc.type}
                                                    className={styles.documentImage}
                                                    onError={(e) => { e.target.src = '/assets/images/placeholder-document.png'; }}
                                                />
                                            </div>
                                            <div className={styles.documentDetails}>
                                                <h5 className={styles.documentTitle}>{doc.type.replace(/_/g, ' ').toUpperCase()}</h5>
                                                <span className={`${styles.statusBadge} ${doc.status === 'approved' ? 'bg-success' : doc.status === 'rejected' ? 'bg-danger' : 'bg-warning'}`}>
                                                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                                </span>
                                                {doc.note && doc.status === 'rejected' && (
                                                    <p className="text-danger small mt-1">Reason: {doc.note}</p>
                                                )}
                                            </div>
                                            <div className={styles.documentActions}>
                                                {doc.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleVerifyDocument(doc._id, 'approved')}
                                                            disabled={verifyLoading}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => openRejectModal(doc._id)}
                                                            disabled={verifyLoading}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {doc.status === 'approved' && (
                                                    <span className="text-success small">Approved</span>
                                                )}
                                                {doc.status === 'rejected' && (
                                                    <span className="text-danger small">Rejected</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted">No documents uploaded.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className={styles.historyList}>
                                {guide.documents?.map(doc => (
                                    <div key={doc._id} className={styles.historyItem}>
                                        <p className="mb-1"><strong>{doc.type.replace('_', ' ').toUpperCase()}</strong> - {new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}</p>
                                        <p className="mb-0 text-muted small">
                                            Status: <span className={doc.status === 'approved' ? 'text-success' : doc.status === 'rejected' ? 'text-danger' : 'text-warning'}>{doc.status}</span>
                                            {doc.note ? ` — Note: ${doc.note}` : ''}
                                        </p>
                                    </div>
                                ))}
                                {(!guide.documents || guide.documents.length === 0) && (
                                    <div className={styles.historyItem}>
                                        <small className="text-muted">No history available yet.</small>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h4 className="h5 mb-3">Reject Document</h4>
                        <p className="small text-muted mb-3">Please provide a reason for rejection.</p>
                        <textarea
                            className="form-control mb-3"
                            rows="3"
                            placeholder="e.g., Document is blurry..."
                            value={rejectionNote}
                            onChange={(e) => setRejectionNote(e.target.value)}
                        ></textarea>
                        <div className="d-flex justify-content-end gap-2">
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setShowRejectModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={confirmRejection}
                                disabled={verifyLoading}
                            >
                                {verifyLoading ? 'Processing...' : 'Reject Document'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
