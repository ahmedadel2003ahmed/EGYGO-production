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

  try {
    const response = await fetch('http://localhost:5000/api/tourist/guides', {
      cache: 'no-store', // Always fetch fresh data
    });
    
    if (response.ok) {
      const data = await response.json();
      guides = data.data || [];
    } else {
      console.error("❌ Failed to fetch guides from API", response.status);
    }
  } catch (err) {
    console.error("❌ Error fetching guides:", err);
    guides = [];
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <section className={styles.headerSection}>
        <div className="container">
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Explore Governorates</h1>
            <p className={styles.pageSubtitle}>
              Discover local guides across Egypt's regions
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
