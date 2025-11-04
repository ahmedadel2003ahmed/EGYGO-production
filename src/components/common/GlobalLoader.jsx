'use client'

import React from 'react'
import Image from 'next/image'
import styles from './GlobalLoader.module.css'

const GlobalLoader = ({ isLoading = false, className = '' }) => {
  if (!isLoading) return null

  return (
    <div className={`${styles.loaderOverlay} ${className}`}>
      <div className={styles.loaderContainer}>
        
        {/* Spinning Ring Animation */}
        <div className={styles.spinnerRing}>
          <div className={styles.spinnerInner}></div>
        </div>
        
        {/* Logo Container */}
        <div className={styles.logoContainer}>
          <Image
            src="/images/logo.ico"
            alt="EgyGo Logo"
            width={120}
            height={120}
            className={styles.logo}
            priority
          />
        </div>
        
        {/* Loading Text */}
        <div className={styles.textContainer}>
          <h2 className={styles.primaryText}>
            Finding the perfect guide for your next adventure...
          </h2>
          <p className={styles.secondaryText}>
            Please wait — we are preparing your experience.
          </p>
        </div>
        
        {/* Decorative Elements */}
        <div className={styles.decorativeElements}>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
        </div>
        
        {/* Bottom Glow Effect */}
        <div className={styles.bottomGlow}></div>
      </div>
    </div>
  )
}

export default GlobalLoader