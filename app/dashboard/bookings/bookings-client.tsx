"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createBooking, cancelBooking, rescheduleBooking } from "@/features/bookings/actions";
import { CalendarDays, Clock, ShieldAlert, CheckCircle2, User, XCircle, FileSpreadsheet, Layers, ArrowRight, ArrowLeft } from "lucide-react";

interface Props {
  bookableAssets: any[];
  initialBookings: any[];
  users: any[];
  departments: any[];
}

export default function BookingsClient({ bookableAssets, initialBookings, users, departments }: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  
  // Tab states for calendar view
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Selected detail modal
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<any | null>(null);
  
  // Reschedule Form States
  const [showReschedule, setShowReschedule] = useState(false);
  const [reschStartDate, setReschStartDate] = useState<Date | null>(null);
  const [reschEndDate, setReschEndDate] = useState<Date | null>(null);

  // Creation form states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [bookFor, setBookFor] = useState<"EMPLOYEE" | "DEPARTMENT">("EMPLOYEE");

  // Helper date generators
  const getDaysInMonth = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    
    const days = [];
    const startOffset = firstDay.getDay(); // 0 is Sunday
    
    // Previous month offset days
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push(new Date(y, m, -i));
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(y, m, i));
    }
    
    return days;
  };

  const handleBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    if (!startDate || !endDate) {
      setError("Please select both start and end times.");
      setSubmitting(false);
      return;
    }

    if (startDate < new Date()) {
      setError("Cannot book slots in the past.");
      setSubmitting(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append("startTime", startDate.toISOString());
    formData.append("endTime", endDate.toISOString());
    formData.append("bookForType", bookFor);

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

  const handleRescheduleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBookingDetail || !reschStartDate || !reschEndDate) return;
    
    setError(null);
    const result = await rescheduleBooking(selectedBookingDetail.id, reschStartDate.toISOString(), reschEndDate.toISOString());
    if (result?.error) {
      setError(result.error);
    } else {
      alert("Rescheduled successfully!");
      window.location.reload();
    }
  };

  const exportCSV = () => {
    const headers = ["Resource Tag", "Resource Name", "Book For", "Target ID", "Start Time", "End Time", "Status"];
    const rows = bookings.map((b) => [
      b.asset.tag,
      b.asset.name,
      b.bookForType || "EMPLOYEE",
      b.departmentId || b.userId,
      new Date(b.startTime).toLocaleString(),
      new Date(b.endTime).toLocaleString(),
      b.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((e: any[]) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "calendar_reservations_schedule.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterBookingsByDay = (day: Date) => {
    return bookings.filter((b) => {
      const bDate = new Date(b.startTime);
      return bDate.getDate() === day.getDate() &&
             bDate.getMonth() === day.getMonth() &&
             bDate.getFullYear() === day.getFullYear();
    });
  };

  // Navigation handlers
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === "month") nextDate.setMonth(currentDate.getMonth() - 1);
    else if (viewMode === "week") nextDate.setDate(currentDate.getDate() - 7);
    else nextDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === "month") nextDate.setMonth(currentDate.getMonth() + 1);
    else if (viewMode === "week") nextDate.setDate(currentDate.getDate() + 7);
    else nextDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDate);
  };

  // Calendar render elements
  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px", background: "#f3f4f6", padding: "5px", borderRadius: "12px" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.72rem", fontWeight: 700, color: "#4b5563", padding: "8px 0" }}>
            {d}
          </div>
        ))}
        {days.map((day, idx) => {
          const dayBookings = filterBookingsByDay(day);
          const isToday = new Date().toDateString() === day.toDateString();
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();

          return (
            <div
              key={idx}
              style={{
                minHeight: "85px",
                background: isToday ? "#f0faf5" : "#ffffff",
                border: isToday ? "1.5px solid #92E4BA" : "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "6px",
                opacity: isCurrentMonth ? 1 : 0.45,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                overflow: "hidden"
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: isToday ? "#1a4a2e" : "#374151" }}>
                {day.getDate()}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto", flex: 1 }}>
                {dayBookings.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedBookingDetail(b); }}
                    style={{
                      fontSize: "0.65rem",
                      background: "#e0e7ff",
                      color: "#3730a3",
                      padding: "2px 5px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontWeight: 600
                    }}
                  >
                    {b.asset.tag}: {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <span style={{ fontSize: "0.6rem", color: "#6b7280", fontWeight: 700 }}>
                    +{dayBookings.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    // Generate week days starting from Sunday
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    return (
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px repeat(7, 1fr)", borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
          <div style={{ padding: "10px", borderRight: "1px solid #e5e7eb" }} />
          {days.map((day) => {
            const isToday = new Date().toDateString() === day.toDateString();
            return (
              <div key={day.toISOString()} style={{ padding: "10px", textAlign: "center", borderRight: "1px solid #e5e7eb", background: isToday ? "#f0faf5" : "transparent" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b7280" }}>{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: isToday ? "#1a4a2e" : "#111827" }}>{day.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div style={{ height: "400px", overflowY: "auto" }}>
          {Array.from({ length: 24 }).map((_, hour) => (
            <div key={hour} style={{ display: "grid", gridTemplateColumns: "80px repeat(7, 1fr)", borderBottom: "1px solid #f3f4f6", minHeight: "45px" }}>
              <div style={{ padding: "5px 10px", fontSize: "0.72rem", color: "#9ca3af", textAlign: "right", borderRight: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                {hour === 0 ? "12 AM" : hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
              </div>
              {days.map((day) => {
                const dayBookings = filterBookingsByDay(day).filter(b => new Date(b.startTime).getHours() === hour);
                return (
                  <div key={day.toISOString()} style={{ borderRight: "1px solid #f3f4f6", padding: "2px", display: "flex", flexDirection: "column", gap: "2px", position: "relative" }}>
                    {dayBookings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBookingDetail(b)}
                        style={{
                          fontSize: "0.65rem",
                          background: "#e0e7ff",
                          color: "#3730a3",
                          padding: "2px 4px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: 700,
                          lineHeight: 1.2
                        }}
                      >
                        {b.asset.name.slice(0, 10)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDailyView = () => {
    const dayBookings = filterBookingsByDay(currentDate);

    return (
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb", background: "#fafafa", textAlign: "center", fontWeight: 800 }}>
          {currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div style={{ height: "400px", overflowY: "auto" }}>
          {Array.from({ length: 24 }).map((_, hour) => {
            const hourBookings = dayBookings.filter(b => new Date(b.startTime).getHours() === hour);
            return (
              <div key={hour} style={{ display: "grid", gridTemplateColumns: "100px 1fr", borderBottom: "1px solid #f3f4f6", minHeight: "50px" }}>
                <div style={{ padding: "10px", fontSize: "0.72rem", color: "#9ca3af", textAlign: "right", borderRight: "1px solid #e5e7eb" }}>
                  {hour === 0 ? "12 AM" : hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                </div>
                <div style={{ padding: "4px", display: "flex", gap: "6px", alignItems: "center" }}>
                  {hourBookings.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBookingDetail(b)}
                      style={{
                        padding: "4px 10px",
                        background: "#e0e7ff",
                        color: "#3730a3",
                        borderRadius: "6px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      [{b.asset.tag}] {b.asset.name} (Reserved by {b.user?.name || "Staff"})
                    </div>
                  ))}
                  {hourBookings.length === 0 && (
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontStyle: "italic", marginLeft: "10px" }}>Slot Available</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", fontFamily: "'Inter', sans-serif" }}>
      
      {/* LEFT COLUMN: Reserve Form */}
      <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>
            Reserve Shared Resource
          </h2>
          
          <form onSubmit={handleBook} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            
            {/* Book For Selection */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Book For</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", cursor: "pointer" }}>
                  <input type="radio" checked={bookFor === "EMPLOYEE"} onChange={() => setBookFor("EMPLOYEE")} style={{ accentColor: "#92E4BA" }} />
                  Employee
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", cursor: "pointer" }}>
                  <input type="radio" checked={bookFor === "DEPARTMENT"} onChange={() => setBookFor("DEPARTMENT")} style={{ accentColor: "#92E4BA" }} />
                  Department
                </label>
              </div>
            </div>

            {bookFor === "EMPLOYEE" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Select Employee</label>
                <select name="userId" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", backgroundColor: "#ffffff" }}>
                  <option value="">-- Choose Employee --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Select Department</label>
                <select name="departmentId" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", backgroundColor: "#ffffff" }}>
                  <option value="">-- Choose Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Select Resource</label>
              <select name="assetId" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", backgroundColor: "#ffffff", outline: "none" }}>
                <option value="">-- Choose Bookable Resource --</option>
                {bookableAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.tag}] {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Start Time</label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={new Date()}
                placeholderText="Select start date and time"
                required
                className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm"
                wrapperClassName="w-full"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>End Time</label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={startDate || new Date()}
                placeholderText="Select end date and time"
                required
                className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm"
                wrapperClassName="w-full"
              />
            </div>

            {error && (
              <div style={{ padding: "8px 12px", background: "#fef2f2", color: "#dc2626", borderRadius: "8px", fontSize: "0.78rem" }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: "8px 12px", background: "#f0fdf4", color: "#15803d", borderRadius: "8px", fontSize: "0.78rem" }}>
                ✓ Resource reserved successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "11px",
                borderRadius: "9px",
                border: "none",
                backgroundColor: "#92E4BA",
                color: "#1a4a2e",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.85rem",
                boxShadow: "0 4px 10px rgba(146,228,186,0.25)"
              }}
            >
              {submitting ? "Booking Resource..." : "Confirm Booking"}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Enterprise Calendar Grid */}
      <div style={{ flex: 2, minWidth: "450px", display: "flex", flexDirection: "column", gap: "1rem" }}>
        
        {/* Navigation & Tab Selection */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={handlePrev} style={{ padding: "6px 12px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer" }}>
              <ArrowLeft size={14} />
            </button>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>
              {viewMode === "month" && currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              {viewMode === "week" && `Week of ${currentDate.toLocaleDateString()}`}
              {viewMode === "day" && currentDate.toLocaleDateString()}
            </h3>
            <button onClick={handleNext} style={{ padding: "6px 12px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer" }}>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {(["month", "week", "day"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: viewMode === mode ? "#111827" : "#ffffff",
                  color: viewMode === mode ? "#ffffff" : "#4b5563"
                }}
              >
                {mode === "month" ? "Month" : mode === "week" ? "Week" : "Day"}
              </button>
            ))}
            <button onClick={exportCSV} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", background: "#ffffff" }}>
              <FileSpreadsheet size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* View Grid */}
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "day" && renderDailyView()}
      </div>

      {/* DETAIL & RESCHEDULE MODAL */}
      {selectedBookingDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "440px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Booking Reservation Details</h3>
              <button onClick={() => { setSelectedBookingDetail(null); setShowReschedule(false); }} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", color: "#4b5563" }}>
              <div>Resource: <strong style={{ color: "#111827" }}>[{selectedBookingDetail.asset.tag}] {selectedBookingDetail.asset.name}</strong></div>
              <div>Reserved For: <strong style={{ color: "#111827" }}>{selectedBookingDetail.bookForType || "EMPLOYEE"} {selectedBookingDetail.departmentId ? `(Dept ID: ${selectedBookingDetail.departmentId})` : `(User: ${selectedBookingDetail.user?.name || "Staff"})`}</strong></div>
              <div>Start: <strong>{new Date(selectedBookingDetail.startTime).toLocaleString()}</strong></div>
              <div>End: <strong>{new Date(selectedBookingDetail.endTime).toLocaleString()}</strong></div>
              <div>Status: <span style={{ padding: "2px 8px", background: "#f3f4f6", borderRadius: "5px", fontSize: "0.7rem", fontWeight: 700 }}>{selectedBookingDetail.status}</span></div>

              {selectedBookingDetail.status === "UPCOMING" && !showReschedule && (
                <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                  <button
                    onClick={() => {
                      setReschStartDate(new Date(selectedBookingDetail.startTime));
                      setReschEndDate(new Date(selectedBookingDetail.endTime));
                      setShowReschedule(true);
                    }}
                    style={{ flex: 1, padding: "8px", background: "#111827", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Reschedule Booking
                  </button>
                  <button
                    onClick={() => handleCancel(selectedBookingDetail.id)}
                    style={{ flex: 1, padding: "8px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Cancel Booking
                  </button>
                </div>
              )}

              {showReschedule && (
                <form onSubmit={handleRescheduleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid #e5e7eb", paddingTop: "12px", marginTop: "10px" }}>
                  <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 800 }}>Reschedule Time Slots</h4>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>New Start Time</label>
                    <DatePicker
                      selected={reschStartDate}
                      onChange={(date: Date | null) => setReschStartDate(date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>New End Time</label>
                    <DatePicker
                      selected={reschEndDate}
                      onChange={(date: Date | null) => setReschEndDate(date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      minDate={reschStartDate || new Date()}
                      className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button type="button" onClick={() => setShowReschedule(false)} style={{ flex: 1, padding: "7px", border: "1px solid #d1d5db", background: "transparent", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
                    <button type="submit" style={{ flex: 2, padding: "7px", background: "#92E4BA", color: "#1a4a2e", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem" }}>Confirm Reschedule</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
