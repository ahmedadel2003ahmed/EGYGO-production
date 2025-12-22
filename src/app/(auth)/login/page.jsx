"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import styles from "./login.module.css";
import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("بريد إلكتروني غير صالح").required("مطلوب"),
      password: Yup.string().min(6, "على الأقل 6 أحرف").required("مطلوب"),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      setServerError(null);

      try {
        const response = await axios.post("/api/auth/login", {
          email: values.email,
          password: values.password,
        });

        console.log("LOGIN RESPONSE:", response.data);

        if (response.data?.success) {
          // Backend returns accessToken and refreshToken
          const token = response.data?.data?.accessToken || response.data?.accessToken || response.data?.token;
          const user = response.data?.data?.user || response.data?.user;

          if (!token) {
            throw new Error("No token received from server");
          }

          if (auth?.setAuth) {
            auth.setAuth({ token, user });
          } else {
            localStorage.setItem("access_token", token);
            localStorage.setItem("laqtaha_user", JSON.stringify(user));
          }

          console.log("Token stored:", token);
          router.replace("/");
        } else {
          throw new Error(response.data?.message || "فشل تسجيل الدخول");
        }
      } catch (err) {
        console.error("login error", err);
        setServerError(
          err.response?.data?.message ||
          err.message ||
          "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى."
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Mock social handlers
  const handleGoogleSignIn = () => {
    alert("Google sign-in (mock) — ربط الـ API لاحقاً");
  };

  return (
    <div className={styles.registerWrapper}>
      <div className="row align-items-center min-vh-100 g-3 g-md-4">


        {/* Right form */}
        <div className=" col-md-6 d-flex justify-content-center order-2 order-md-2">
          <div className={styles.formCard}>
            <h2 className={`${styles.heading} text-center`}>تسجيل الدخول</h2>
            <p className={`${styles.hint} text-center`}>من فضلك ادخل بيانات حسابك</p>

            <form className={styles.form} onSubmit={formik.handleSubmit} noValidate>
              <div className="mb-3">
                <input
                  name="email"
                  type="email"
                  placeholder="البريد"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`${styles.input} ${formik.touched.email && formik.errors.email ? styles.invalid : ""
                    }`}
                />
                {formik.touched.email && formik.errors.email && (
                  <div className={styles.err}>{formik.errors.email}</div>
                )}
              </div>

              <div className="mb-3">
                <div className={styles.passwordWrapper}>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="كلمة المرور"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`${styles.input} ${formik.touched.password && formik.errors.password ? styles.invalid : ""
                      }`}
                  />
                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <div className={styles.err}>{formik.errors.password}</div>
                )}
              </div>

              {serverError && (
                <div className={`${styles.err} text-center mb-3`}>{serverError}</div>
              )}

              <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                {submitting ? "جاري الدخول..." : "دخول"}
              </button>

              <div className={styles.socialRow}>
                <button
                  type="button"
                  className={styles.socialBtn + " " + styles.google}
                  onClick={handleGoogleSignIn}
                >
                  <Image src="/images/google-logo.ico" alt="Google" width={18} height={18} />
                  <span>تسجيل عبر Google</span>
                </button>
              </div>

              <p className={`${styles.hint} text-center`} style={{ marginTop: 8 }}>
                ليس لديك حساب؟{" "}
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => router.push("/register")}
                >
                  سجل الآن
                </button>
              </p>
              <p className={`${styles.terms} text-center`}>
                من خلال تسجيل الدخول فأنت توافق تلقائياً على
                <span className={styles.highlight}> سياسة الخصوصية </span> و
                <span className={styles.highlight}> شروط الاستخدام </span>
              </p>

            </form>
          </div>
        </div>
        {/* Left visual (الصورة) */}
        <div className=" col-md-6 d-flex justify-content-center order-1 order-md-1">
          <div className={styles.leftCard}>
            <div className={styles.imageText}>
              <Image
                src="/images/logo.ico"
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

      </div>
    </div>
  );
}
