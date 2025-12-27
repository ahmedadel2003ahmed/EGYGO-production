'use client';

import { FaUserCircle, FaBell } from 'react-icons/fa';
import styles from './AdminHeader.module.css';

const AdminHeader = ({ user }) => {
    return (
        <header className={styles.header}>
            <div className={styles.title}>
                {/* Placeholder for page title or breadcrumbs if needed */}
            </div>

            <div className={styles.actions}>
                <button className={styles.iconBtn}>
                    <FaBell />
                    <span className={styles.badge}>2</span>
                </button>

                <div className={styles.profile}>
                    <span className={styles.userName}>{user?.name || 'Admin'}</span>
                    <FaUserCircle className={styles.avatar} />
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
