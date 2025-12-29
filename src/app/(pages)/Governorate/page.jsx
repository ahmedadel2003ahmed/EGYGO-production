// =====================
// File: app/governorate/page.jsx
// =====================

import GovernorateClient from "./GovernorateClient";
import styles from "./Governorate.module.css";

export const metadata = {
  title: "Explore Egypt by Governorate",
};

export default async function Governorate() {
  // ✅ SSR: Fetch guides from API
  let guides = [];

  console.time('fetchGovernorateGuides');
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://egygo-backend-production.up.railway.app';
    const response = await fetch(`${baseUrl}/api/tourist/guides`, {
      cache: 'force-cache', // Cache this data for static generation
    });

    if (response.ok) {
      const data = await response.json();
      guides = data.data || [];
    } else {
      console.warn("⚠️ Failed to fetch guides from API (server-side):", response.status);
      guides = [];
    }
  } catch (err) {
    console.warn("⚠️ Error fetching guides (server-side):", err.message || err);
    guides = [];
  }
  console.timeEnd('fetchGovernorateGuides');

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <section className={styles.headerSection}>
        <div className="container">
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Explore Governorates</h1>
            <p className={styles.pageSubtitle}>
              Discover local guides across Egypt&apos;s regions
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className={`container ${styles.inner}`}>
        {/* Client Interactive Section */}
        <GovernorateClient initialGuides={guides} />
      </section>
    </div>
  );
}
