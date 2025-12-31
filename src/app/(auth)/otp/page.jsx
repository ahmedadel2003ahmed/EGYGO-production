"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./otp.module.css";
import Image from "next/image";

export default function Otp() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  // Load email from localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem("registerEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // Keep fallback just in case, or redirect to register?
      // user might have refreshed.
      setEmail("user@example.com");
    }
  }, []);

  // OTP Input Control
  const handleChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle Submit
  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length < 4) {
      setError("Please enter the complete 4-digit code.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: code,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.message || "Verification failed. Check the code and try again.");
        return;
      }

      // Success
      setVerified(true);
      setError("");

      localStorage.removeItem("registerEmail");
      localStorage.removeItem("pendingUserId");

    } catch (err) {
      console.error("Verification error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Navigate after success
  const handleNext = () => {
    localStorage.removeItem("pendingUserId");
    localStorage.removeItem("registerEmail");

    // Redirect to login page
    router.replace("/login");
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageOverlay}></div>

      <div className={styles.container}>
        {/* Left Section (Image) */}
        <div className={styles.imageSection}>
          <div className={styles.imageOverlay}></div>
          <div className={styles.imageContent}>
            <Image src="/images/logo.ico" alt="Logo" width={100} height={100} style={{ marginBottom: 20 }} />
            <h2>Welcome to EgyGo</h2>
            <p>Verify your email to continue exploring the beauty of Egypt.</p>
          </div>
        </div>

        {/* Right Section (Form) */}
        <div className={styles.formSection}>
          {!verified ? (
            <>
              <h2 className={styles.heading}>Verify Your Email</h2>
              <p className={styles.subHeading}>
                We&apos;ve sent a 4-digit verification code to <br /> <strong>{email}</strong>
              </p>

              <div className={styles.otpInputs}>
                {otp.map((v, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    maxLength="1"
                    value={v}
                    onChange={(e) => handleChange(i, e.target.value)}
                    className={styles.otpBox}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && <div className={styles.errorText}>{error}</div>}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <button
                className={styles.resendLink}
                onClick={() => alert("Resend code functionality to be implemented")}
              >
                Didn&apos;t receive the code? Resend
              </button>
            </>
          ) : (
            <div className={styles.successWrapper}>
              <h2 className={styles.heading} style={{ color: '#10B981' }}>Verified Successfully!</h2>
              <Image
                src="/images/success.png"
                alt="Success"
                width={150}
                height={150}
                className={styles.successIcon}
              />
              <p className={styles.subHeading}>Your account has been verified. Please log in to continue.</p>

              <button onClick={handleNext} className={styles.submitBtn}>
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
