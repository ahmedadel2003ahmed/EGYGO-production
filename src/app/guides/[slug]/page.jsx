import GuideProfileClient from "./GuideProfileClient";
import styles from "./GuideProfile.module.css";

// Generate metadata for each guide
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  
  return {
    title: `Guide Profile - EgyGo`,
    description: `View guide profile and book your tour in Egypt`,
    keywords: "Egypt tour guide, tourism, travel guide, Egyptian guide",
  };
}

export default function GuidePage({ params }) {
  return (
    <div className={styles.guidePage}>
      <GuideProfileClient />
    </div>
  );
}