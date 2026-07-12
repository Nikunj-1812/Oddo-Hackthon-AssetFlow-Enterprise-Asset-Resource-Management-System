"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createBooking, cancelBooking } from "@/features/bookings/actions";
import { CalendarDays, Clock, ShieldAlert, BadgeInfo, CheckCircle2, User, HelpCircle, XCircle, FileSpreadsheet } from "lucide-react";

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-CA"); // YYYY-MM-DD
const fmtTime = (d: string | Date) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

interface Props {
  bookableAssets: any[];
  initialBookings: any[];
}

export default function BookingsClient({ bookableAssets, initialBookings }: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  
  // Form state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [minDate, setMinDate] = useState<Date>(new Date());
  
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    setMinDate(now);
  }, []);

  const handleBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createBooking(formData);

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSubmitting(false);
        window.location.reload();
      }, 1000);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    const result = await cancelBooking(bookingId);
    if (result?.error) {
      alert(result.error);
    } else {
      window.location.reload();
    }
  };

  const exportCSV = () => {
    const headers = ["Resource Tag", "Resource Name", "Reserved By", "Start Time", "End Time", "Status"];
    const rows = bookings.map((b) => [
      b.asset.tag,
      b.asset.name,
      b.user?.name || "Staff",
      new Date(b.startTime).toLocaleString(),
      new Date(b.endTime).toLocaleString(),
      b.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((e: any[]) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reservations_schedule_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", fontFamily: "'Inter', sans-serif" }}>
      {/* LEFT COLUMN: Booking Form */}
      <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div 
          style={{ 
            backgroundColor: "#ffffff", 
            padding: "1.75rem", 
            borderRadius: "16px", 
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
        >
          <h2 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>
            Reserve Shared Resource
          </h2>
          
          <form onSubmit={handleBook} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Select Resource</label>
              <select name="assetId" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", backgroundColor: "#ffffff", outline: "none" }}>
                <option value="">-- Choose Bookable Resource --</option>
                {bookableAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.tag}] {a.name} (Location: {a.location})
                  </option>
                ))}
              </select>
            </div>

            <input type="hidden" name="startTime" value={startDate ? startDate.toISOString() : ""} />
            <input type="hidden" name="endTime" value={endDate ? endDate.toISOString() : ""} />

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Start Time</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date as Date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={minDate}
                placeholderText="Select start date and time"
                required
                className="auth-input"
                wrapperClassName="w-full"
                customInput={<input style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", outline: "none" }} />}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>End Time</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date as Date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={startDate || minDate}
                placeholderText="Select end date and time"
                required
                className="auth-input"
                wrapperClassName="w-full"
                customInput={<input style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", outline: "none" }} />}
              />
            </div>

            {error && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{error}</span>}
            {success && <span style={{ color: "#10b981", fontSize: "0.75rem" }}>Resource booked successfully!</span>}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "11px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#92E4BA",
                color: "#1e293b",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.85rem",
                boxShadow: "0 4px 10px rgba(146,228,186,0.2)",
                transition: "all 0.2s",
              }}
            >
              {submitting ? "Checking Overlaps..." : "Reserve Slot"}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Bookings Table */}
      <div 
        style={{ 
          flex: 2, 
          minWidth: "450px", 
          backgroundColor: "#ffffff", 
          padding: "1.75rem", 
          borderRadius: "16px", 
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#111827" }}>
            Reservation Agenda Schedule
          </h2>
          <button
            onClick={exportCSV}
            style={{
              padding: "6px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              color: "#374151",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FileSpreadsheet size={14} /> Export CSV
          </button>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280", backgroundColor: "#fafafa" }}>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Resource</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Reserved By</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Start Time</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>End Time</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Status</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                    No reservations booked.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} style={{ borderBottom: "1px solid #f3f4f6", opacity: booking.status === "CANCELLED" ? 0.6 : 1 }}>
                    <td style={{ padding: "14px", fontWeight: 700, color: "#111827" }}>
                      [{booking.asset.tag}] {booking.asset.name}
                    </td>
                    <td style={{ padding: "14px", color: "#374151", fontWeight: 500 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><User size={14} style={{ color: "#9ca3af" }} /> {booking.user?.name}</span>
                    </td>
                    <td style={{ padding: "14px", color: "#4b5563" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Clock size={12} style={{ color: "#9ca3af" }} /> {fmtDate(booking.startTime)} {fmtTime(booking.startTime)}</span>
                    </td>
                    <td style={{ padding: "14px", color: "#4b5563" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Clock size={12} style={{ color: "#9ca3af" }} /> {fmtDate(booking.endTime)} {fmtTime(booking.endTime)}</span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          backgroundColor:
                            booking.status === "UPCOMING"
                              ? "#eff6ff"
                              : booking.status === "CANCELLED"
                              ? "#f3f4f6"
                              : "#ecfdf5",
                          color:
                            booking.status === "UPCOMING"
                              ? "#1d4ed8"
                              : booking.status === "CANCELLED"
                              ? "#374151"
                              : "#047857",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                        }}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      {booking.status === "UPCOMING" && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          style={{
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fee2e2",
                            color: "#ef4444",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "0.78rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
