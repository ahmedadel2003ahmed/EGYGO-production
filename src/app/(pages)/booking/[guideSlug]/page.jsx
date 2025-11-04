"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./Booking.module.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function BookingPage() {
  const { guideSlug } = useParams();
  const router = useRouter();

  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hours, setHours] = useState(1);
  const [total, setTotal] = useState(0);

  // ✅ get guide by slug from json
  useEffect(() => {
    async function fetchGuideData() {
      try {
        setLoading(true);
        const res = await fetch("/data/guides.json");
        
        if (!res.ok) {
          throw new Error("Failed to fetch guides data");
        }
        
        const allGuides = await res.json();
        const foundGuide = allGuides.find((g) => g.slug === guideSlug);
        setGuide(foundGuide);
        
        if (!foundGuide) {
          console.error("Guide not found with slug:", guideSlug);
        }
      } catch (error) {
        console.error("Error loading guide:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (guideSlug) {
      fetchGuideData();
    }
  }, [guideSlug]);

  // ✅ calculate price
  useEffect(() => {
    if (guide) {
      setTotal(hours * guide.card.pricePerHour);
    }
  }, [guide, hours]);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading booking details...</span>
          </div>
          <p className="mt-3">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="alert alert-warning" role="alert">
            <h4>Guide Not Found</h4>
            <p>The guide you're trying to book doesn't exist.</p>
            <button 
              className="btn btn-primary"
              onClick={() => router.push('/guides')}
            >
              Browse All Guides
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">

      <h2 className="text-center fw-bold mb-5">Confirm Your Booking</h2>

      <div className="row g-4">

        {/* ✅ Left Side (Schedule + Tour Details) */}
        <div className="col-md-6">
          <div className={styles.cardBox}>
            <h5 className={styles.cardTitle}>Tour Details & Schedule</h5>

            <div className="d-flex align-items-center gap-3 mb-3">
              <Image
                src={guide.card.avatar}
                width={60}
                height={60}
                alt={guide.card.name}
                className="rounded-circle"
              />

              <div>
                <h6 className="fw-bold mb-0">{guide.card.name}</h6>
                <p className="text-muted small mb-0">{guide.card.specialization}</p>
              </div>
            </div>

            <label className="form-label fw-semibold">Date</label>
            <DatePicker
              className="form-control mb-3"
              placeholderText="Pick a date"
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              minDate={new Date()}
            />

            <label className="form-label fw-semibold">Hours</label>
            <input
              type="number"
              className="form-control"
              value={hours}
              min="1"
              onChange={(e) => setHours(Number(e.target.value))}
            />

            <div className="d-flex justify-content-between mt-4">
              <span>Total Amount</span>
              <span className={styles.price}>${total.toFixed(2)}</span>
            </div>

            <button className={styles.contactGuideBtn}>Contact Guide</button>
          </div>
        </div>

        {/* ✅ Right Side (Payment Info) */}
        <div className="col-md-6">
          <div className={styles.cardBox}>
            <h5 className={styles.cardTitle}>Payment Information</h5>

            <label className="form-label fw-semibold">Card Number</label>
            <input type="text" className="form-control mb-3" placeholder="•••• •••• •••• ••••" />

            <label className="form-label fw-semibold">Card Holder Name</label>
            <input type="text" className="form-control mb-3" placeholder="John Doe" />

            <div className="row">
              <div className="col-6">
                <label className="form-label fw-semibold">Expiry Date</label>
                <input type="text" className="form-control mb-3" placeholder="MM/YY" />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold">CVC</label>
                <input type="text" className="form-control mb-3" placeholder="•••" />
              </div>
            </div>

            <button className={styles.paypalBtn}>Pay with PayPal</button>

            <p className="text-muted small mt-2">
              ✅ Your payment information is securely processed and encrypted.
            </p>
          </div>
        </div>
      </div>

      {/* ✅ Bottom Confirm Button */}
      <div className="text-center">
        <button className={styles.confirmBtn}>
          Confirm Booking & Pay
        </button>
      </div>
    </div>
  );
}
