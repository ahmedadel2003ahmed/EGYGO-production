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
    <main className={styles.pageContainer}>
      <section className={`container ${styles.inner}`}>
        <header className={styles.header}>
          <h1>Explore Egypt by Governorate</h1>
          <p className={styles.subtitle}>
            Discover local guides in various regions across Egypt. Select a
            governorate to see available guides and embark on an unforgettable
            journey.
          </p>
        </header>

        {/* Client Interactive Section */}
        <GovernorateClient initialGuides={guides} />
      </section>
    </main>
  );
}
