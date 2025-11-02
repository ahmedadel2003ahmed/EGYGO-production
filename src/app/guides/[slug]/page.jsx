import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import GuideProfileClient from "./GuideProfileClient";
import styles from "./GuideProfile.module.css";

// Generate static params for all guides
export async function generateStaticParams() {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "guides.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const guides = JSON.parse(raw);
    
    return guides.map((guide) => ({
      slug: guide.slug,
    }));
  } catch (error) {
    console.error("Error generating static params for guides:", error);
    return [];
  }
}

// Generate metadata for each guide
export async function generateMetadata({ params }) {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "guides.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const guides = JSON.parse(raw);
    
    const guide = guides.find((g) => g.slug === params.slug);
    
    if (!guide) {
      return {
        title: "Guide Not Found",
        description: "The requested guide profile could not be found.",
      };
    }

    return {
      title: `${guide.card.name} - Expert Guide in Egypt`,
      description: `Book ${guide.card.name}, a ${guide.card.specialization} guide. Rating: ${guide.card.rating}/5 with ${guide.card.reviewsCount} reviews. Starting at $${guide.card.pricePerHour}/hour.`,
      keywords: [
        guide.card.name,
        guide.card.specialization,
        ...guide.filters.serviceLocations,
        ...guide.filters.landmarkSpecialties,
        "Egypt tour guide",
        "tourism",
      ].join(", "),
    };
  } catch (error) {
    console.error("Error generating metadata for guide:", error);
    return {
      title: "Guide Profile",
      description: "Explore expert guides in Egypt",
    };
  }
}

export default async function GuidePage({ params }) {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "guides.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const guides = JSON.parse(raw);
    
    const guide = guides.find((g) => g.slug === params.slug);
    
    if (!guide) {
      notFound();
    }

    return (
      <div className={styles.guidePage}>
        <GuideProfileClient guide={guide} />
      </div>
    );
  } catch (error) {
    console.error("Error loading guide:", error);
    notFound();
  }
}