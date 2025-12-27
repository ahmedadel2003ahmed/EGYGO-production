'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaChartPie, FaUsers, FaMapMarkedAlt, FaCogs, FaSignOutAlt, FaLeaf } from 'react-icons/fa';
import styles from './AdminSidebar.module.css';

const AdminSidebar = ({ onLogout }) => {
    const pathname = usePathname();

    const navItems = [
        { name: 'Overview', path: '/admin', icon: <FaChartPie /> },
        { name: 'Guide Requests', path: '/admin/guides', icon: <FaUsers /> },
        { name: 'Attractions', path: '/admin/attractions', icon: <FaMapMarkedAlt /> },
        { name: 'System Health', path: '/admin/system', icon: <FaLeaf /> }, // Leaf for "Health"
    ];

    const isActive = (path) => {
        if (path === '/admin') return pathname === '/admin';
        return pathname.startsWith(path);
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.brand}>
                <h3>EGYGO <span className={styles.adminBadge}>Admin</span></h3>
            </div>

            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    {navItems.map((item) => (
                        <li key={item.path} className={styles.navItem}>
                            <Link
                                href={item.path}
                                className={`${styles.navLink} ${isActive(item.path) ? styles.active : ''}`}
                            >
                                <span className={styles.icon}>{item.icon}</span>
                                <span className={styles.text}>{item.name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className={styles.footer}>
                <button onClick={onLogout} className={styles.logoutBtn}>
                    <FaSignOutAlt /> Logout
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
