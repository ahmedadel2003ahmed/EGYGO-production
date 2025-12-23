"use client";

import React from "react";
import Image from "next/image";
import styles from "./GlobalLoader.module.css";

const GlobalLoader = ({ isLoading = false, className = "" }) => {
  // If not loading, we don't render anything
  // You can comment this out to test the loader design permanently during dev
  if (!isLoading) return null;

  return (
    <div className={`${styles.loaderOverlay} ${className}`}>
      <div className={styles.loaderContainer}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <Image
            src="/images/logo.ico"
            alt="Miniastic Logo"
            width={100}
            height={100}
            className={styles.logo}
            priority
          />
        </div>

        {/* Main Text */}
        <div className={styles.textContainer}>
          <h1 className={styles.title}>EGYGO</h1>
          <p className={styles.subtitle}>Discover Ancient Egypt</p>
        </div>

        {/* Spinner */}
        <div className={styles.spinnerWrapper}>
          <div className={styles.spinner}></div>
        </div>

        {/* Footer Text */}
        <p className={styles.footerText}>Exploring the treasures of Egypt...</p>
      </div>
    </div>
  );
};

export default GlobalLoader;