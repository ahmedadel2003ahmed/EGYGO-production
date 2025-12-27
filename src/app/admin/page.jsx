'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaUserPlus, FaMapMarked, FaStar, FaArrowRight } from 'react-icons/fa';
import adminService from '@/services/adminService';
import styles from './dashboard.module.css';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        pendingGuides: 0,
        totalAttractions: 0,
        featuredAttractions: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminService.getKPIs();
                setStats(data);
            } catch (error) {
                console.error("Error loading dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-4">Loading dashboard...</div>;

    const cards = [
        {
            title: 'Pending Guides',
            value: stats.pendingGuides,
            icon: <FaUserPlus />,
            color: 'blue',
            link: '/admin/guides',
            linkText: 'Review Applications'
        },
        {
            title: 'Total Attractions',
            value: stats.totalAttractions,
            icon: <FaMapMarked />,
            color: 'green',
            link: '/admin/attractions',
            linkText: 'Manage Attractions'
        },
        {
            title: 'Featured Locations',
            value: stats.featuredAttractions,
            icon: <FaStar />,
            color: 'purple',
            link: '/admin/attractions', // Could filter later
            linkText: 'View Featured'
        }
    ];

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Dashboard Overview</h1>

            <div className={styles.grid}>
                {cards.map((card, idx) => (
                    <div key={idx} className={`${styles.card} ${styles[card.color]}`}>
                        <div className={styles.cardHeader}>
                            <div>
                                <p className={styles.cardTitle}>{card.title}</p>
                                <h2 className={styles.cardValue}>{card.value}</h2>
                            </div>
                            <div className={`${styles.iconWrapper} ${styles[`bg-${card.color}`]}`}>
                                {card.icon}
                            </div>
                        </div>
                        <div className={styles.cardFooter}>
                            <Link href={card.link} className={styles.cardLink}>
                                {card.linkText} <FaArrowRight size={12} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity or other sections could go here */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Quick Actions</h3>
                <div className="d-flex gap-3">
                    <Link href="/admin/attractions/create" className="btn btn-primary">
                        + Add New Attraction
                    </Link>
                    <Link href="/admin/guides" className="btn btn-outline-primary">
                        Review Pending Guides
                    </Link>
                </div>
            </div>
        </div>
    );
}
