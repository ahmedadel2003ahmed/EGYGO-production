"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './AboutUs.module.css';

export default function AboutUs() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.time('AboutUs:Render');
    setIsVisible(true);
    console.timeEnd('AboutUs:Render');
  }, []);

  const teamMembers = [
    {
      name: 'Ebrahim Mamdouh',
      role: 'Frontend Developer',
      icon: '⚛️',
      image: '/images/team/Ebrhaim1.jpeg',
      color: '#61dafb',
      description: 'Crafting beautiful and responsive user interfaces with modern web technologies',
      skills: ['React', 'Next.js', 'TypeScript', 'CSS'],
      gradient: '#3b5d80',
    },
    {
      name: 'Kerolles Sobhy',
      role: 'Backend Developer',
      icon: '⚙️',
      image: '/images/team/kero.jpeg',
      color: '#68a063',
      description: 'Building robust and scalable server architectures with secure APIs',
      skills: ['Node.js', 'Express', 'MongoDB', 'REST API'],
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      name: 'Mohamed Ali',
      role: 'Flutter Developer',
      icon: '📱',
      image: '/images/team/moAli.jpeg',
      color: '#02569b',
      description: 'Creating seamless cross-platform mobile experiences with Flutter',
      skills: ['Flutter', 'Dart', 'Mobile UI', 'iOS/Android'],
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      name: 'Basel Hesham',
      role: 'UI/UX Designer',
      icon: '🎨',
      image: '/images/team/basel.jpeg',
      color: '#ff6b6b',
      description: 'Designing intuitive and delightful user experiences that captivate',
      skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
  ];

  const stats = [
    { number: '4', label: 'Team Members', icon: '👥' },
    { number: '3', label: 'Technologies', icon: '💻' },
    { number: '100%', label: 'Dedication', icon: '🔥' },
    { number: '1', label: 'Vision', icon: '🎯' },
  ];

  const values = [
    {
      icon: '🚀',
      title: 'Innovation',
      description: 'Pushing boundaries with cutting-edge technology',
    },
    {
      icon: '💎',
      title: 'Quality',
      description: 'Delivering excellence in every line of code',
    },
    {
      icon: '🤝',
      title: 'Collaboration',
      description: 'Working together to achieve greatness',
    },
    {
      icon: '🌟',
      title: 'Passion',
      description: 'Driven by love for what we create',
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      {/* Hero Section */}
      <section className={`${styles.heroSection} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.heroBackground}>
          <div className={styles.heroCircle1}></div>
          <div className={styles.heroCircle2}></div>
          <div className={styles.heroCircle3}></div>
        </div>
        <div className="container">
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              <span className={styles.titleWord}>Meet</span>{' '}
              <span className={styles.titleWord}>the</span>{' '}
              <span className={styles.titleWordHighlight}>Dream Team</span>
            </h1>
            <p className={styles.heroSubtitle}>
              A passionate group of developers and designers crafting EgyGo -
              Your gateway to exploring Egypt&apos;s wonders
            </p>
            <div className={styles.heroDecoration}>✨ EGYGO ✨</div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={styles.teamSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.titleIcon}>👨‍💻</span>
              The Masterminds
            </h2>
            <p className={styles.sectionSubtitle}>
              Each bringing unique expertise to make EgyGo exceptional
            </p>
          </div>

          <div className={styles.teamGrid}>
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className={styles.teamCard}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.cardImageWrapper}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className={styles.memberImage}
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, 300px"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  </div>
                  <div className={styles.memberIconFallback} style={{ background: member.gradient }}>
                    <span>{member.icon}</span>
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.memberName}>{member.name}</h3>
                  <div className={styles.memberRole}>{member.role}</div>
                  <p className={styles.memberDescription}>{member.description}</p>
                  <div className={styles.skillsContainer}>
                    {member.skills.map((skill, skillIndex) => (
                      <span key={skillIndex} className={styles.skillTag}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.cardGlow} style={{ background: member.gradient }}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div
                key={index}
                className={styles.statCard}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.statIcon}>{stat.icon}</div>
                <div className={styles.statNumber}>{stat.number}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className={styles.storySection}>
        <div className="container">
          <div className={styles.storyContent}>
            <div className={styles.storyIcon}>📖</div>
            <h2 className={styles.sectionTitle}>Our Story</h2>
            <p className={styles.storyText}>
              EgyGo was born from a simple yet powerful vision: to connect travelers
              with the rich heritage and breathtaking beauty of Egypt. As a graduation
              project, we combined our diverse skills and shared passion to create a
              platform that transforms how people discover and experience Egyptian destinations.
            </p>
            <p className={styles.storyText}>
              From the bustling streets of Cairo to the serene shores of the Red Sea,
              our platform brings Egypt&apos;s magic to your fingertips. Were not just building
              an app – were crafting experiences and creating memories.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={styles.valuesSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>What Drives Us</h2>
          <div className={styles.valuesGrid}>
            {values.map((value, index) => (
              <div
                key={index}
                className={styles.valueCard}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.valueIcon}>{value.icon}</div>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDescription}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className={styles.missionSection}>
        <div className="container">
          <div className={styles.missionContent}>
            <div className={styles.missionIcon}>🎯</div>
            <h2 className={styles.missionTitle}>Our Mission</h2>
            <p className={styles.missionText}>
              To revolutionize travel experiences in Egypt by connecting adventurers
              with local guides, hidden gems, and unforgettable journeys. We believe
              every trip should be extraordinary, and every traveler should have access
              to authentic Egyptian experiences.
            </p>
            <div className={styles.missionQuote}>
              Making Egypt&apos;s wonders accessible to the world, one journey at a time
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Explore Egypt?</h2>
            <p className={styles.ctaText}>
              Join thousands of travelers discovering the magic of Egypt with EgyGo
            </p>
            <button
              className={styles.ctaButton}
              onClick={() => window.location.href = '/ExploreDestinations'}
            >
              Start Your Journey
              <span className={styles.ctaArrow}>→</span>
            </button>
          </div>
        </div>
      </section>


    </div>
  );
}
