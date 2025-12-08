"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ استيراد router من App Router
import styles from "./otp.module.css";
import Image from "next/image";

export default function Otp() {
  const router = useRouter(); // ✅ تهيئة الـ router
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  // 📩 قراءة الإيميل من localStorage عند تحميل الصفحة
  useEffect(() => {
    const storedEmail = localStorage.getItem("registerEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      setEmail("ebrahimmamdoh3@gmail.com"); // fallback مؤقت
    }
  }, []);

  // 🧩 التحكم في حقول OTP
  const handleChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // 🧠 عند الضغط على زر التحقق
  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length < 4) {
      setError("الرجاء إدخال رمز مكون من 4 أرقام");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: code,
        }),
      });

      const data = await res.json();

      // ⚠️ فحص النتيجة
      if (!res.ok || !data.success) {
        setError(
          data?.message?.ar ||
            "فشل التحقق من الرمز، تأكد من صحته أو أعد المحاولة لاحقًا."
        );
        return;
      }

      // ✅ نجاح التحقق
      setVerified(true);
      setError("");
      localStorage.removeItem("registerEmail");
      localStorage.removeItem("pendingUserId");
    } catch (err) {
      console.error("Verification error:", err);
      setError("حدث خطأ أثناء الاتصال بالخادم، حاول مجددًا.");
    } finally {
      setLoading(false);
    }

    // ✅ منطق مؤقت لعرض شاشة النجاح مباشرة (بدون تحقق)
    setTimeout(() => {
      setVerified(true);
      setLoading(false);
    }, 600);
  };

  // ✅ منطق الانتقال بعد التحقق بنجاح
  const handleNext = () => {
    // تنظيف البيانات المؤقتة
    localStorage.removeItem("pendingUserId");
    localStorage.removeItem("registerEmail");
    
    // الانتقال إلى الصفحة الرئيسية
    router.replace("/home");
  };

  return (
    <>
      <div className={styles.registerWrapper}>
        <div className="row align-items-center min-vh-100 g-3 g-md-4">
          {/* Left visual */}
          <div className="col-12 col-md-6 d-flex justify-content-center order-1 order-md-1">
            <div className={styles.leftCard}>
              <div className={styles.imageText}>
   <Image
                src="/images/logo.png"
                alt="Logo"
                width={140}
                height={100}
                className={styles.logoImage}
              />              
                <h2>مرحبا بكم في لقطها</h2>
                <p>اطلب مني اللي تريده وخليني ألقطها عشانك</p>
              </div>
            </div>
          </div>

          {/* Right form */}
          <div className={`${styles.formCard}col-12 col-md-6 d-flex flex-column justify-content-center  order-2 order-md-2 text-center`}>
            {!verified ? (
              <>
                <h2 className={`${styles.heading}`}>
                  قد قمنا بإرسال رمز التحقق إليك، المرجو التحقق منه في بريدك الإلكتروني
                </h2>

                <div className={styles.otpInputs}>
                  {otp.map((v, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      maxLength="1"
                      value={v}
                      onChange={(e) => handleChange(i, e.target.value)}
                      className={styles.otpBox}
                    />
                  ))}
                </div>

                {error && <p className={styles.errorText}>{error}</p>}

                <p className={styles.resendText}>لم يصلك الرمز؟</p>
                <button className={styles.resendLink}onClick={() => alert("سيتم إرسال الكود مجددًا")}
                >
                  إعادة إرسال رمز التحقق
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`${styles.primaryBtn}  mx-auto`}
                >
                  {loading ? "جارٍ التحقق..." : "التالي"}
                </button>
              </>
            ) : (
                <>
                <div className={styles.sccessWrapper}>
                <h2 className={styles.heading}>
                  تم التحقق من البريد الإلكتروني بنجاح!!
                  <br />
                  لنقم بإعداد التطبيق من أجلك
                </h2>

                <div className={styles.successIcon}>
                  <Image
                    src="/images/success-check.svg"
                    alt="Success"
                    width={300}
                    height={300}
                  />
                </div>

                {/* ✅ تم استبدال الـ alert بالتوجيه */}
                <button onClick={handleNext} className={styles.primaryBtn}>
                  التالي
                </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
