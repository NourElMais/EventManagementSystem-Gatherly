import React from "react";
import api from "../services/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const formatTime = (date) => {
  if (!date) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Note: fction to combine date and time
const combineDateAndTime = (date, timeStr) => {
  if (!date || !timeStr) return null;
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const merged = new Date(date);
  merged.setHours(h, m, 0, 0);
  return merged;
};

const timeOptions = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00","22:00","23:00","24:00"
];

const buildAssetUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
  if (!base) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

const locationOptions = [
  "Grand Hyatt Beirut",
  "Le Royal Hotels & Resorts",
  "Four Seasons Hotel Beirut",
  "The Phoenicia Hotel",
  "Le Gray Beirut",
  "InterContinental Beirut",
  "Radisson Blu Martinez",
  "Gefinor Rotana",
  "Monroe Hotel"
];

export default function ClientEventRequest({
  occasions,
  eventType,
  startDateTime,
  endDateTime,
  nbOfGuests,
  location,
  description,
  clothingOptions = [],
  selectedClothesId = null,
  onTypeChange,
  onStartChange,
  onEndChange,
  onGuestsChange,
  onLocationChange,
  onDescriptionChange,
  onClothesChange,
  onSubmit,
  submitting = false,
  errorMessage = "",
}) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-cream px-8 py-6 border-b border-gray-100">
        <p className="text-xs uppercase tracking-[0.3em] text-ocean font-semibold">
          Create Request
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">
          What is Your Occasion?
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Select any occasion from the list below
        </p>
      </div>

      <div className="p-8">
        {/* Icons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {occasions.map((o) => (
            <label
              key={o.id}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                eventType === o.label
                  ? "border-ocean bg-sky shadow-md"
                  : "border-gray-100 bg-cream hover:border-gray-200 hover:bg-mist"
              }`}
            >
              <img
                src={o.icon}
                alt={o.label}
                className="w-16 h-16 object-contain"
              />
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="eventType"
                  value={o.label}
                  checked={eventType === o.label}
                  onChange={() => onTypeChange(o.label)}
                  className="accent-indigo-600"
                />
                <span className={`text-sm font-medium ${
                  eventType === o.label ? "text-ocean" : "text-gray-700"
                }`}>
                  {o.label}
                </span>
              </div>
            </label>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-8">
          <div className="bg-cream rounded-2xl p-6 border border-gray-100 space-y-6">
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
                {errorMessage}
              </div>
            )}

            {clothingOptions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-ocean font-semibold">
                      Outfit
                    </p>
                    <p className="text-sm text-gray-700">Pick the dress/uniform for this event</p>
                  </div>
                  {selectedClothesId && (
                    <button
                      type="button"
                      onClick={() => onClothesChange?.(null)}
                      className="text-xs font-semibold text-gray-600 hover:text-ocean"
                      disabled={submitting}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clothingOptions.map((item) => {
                    const isActive = Number(selectedClothesId) === Number(item.clothesId);
                    return (
                      <button
                        key={item.clothesId}
                        type="button"
                        onClick={() => onClothesChange?.(item.clothesId)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                          isActive
                            ? "border-ocean bg-white shadow-md"
                            : "border-gray-200 bg-white hover:border-ocean/50"
                        }`}
                        disabled={submitting}
                      >
                        {item.picture && (
                          <div className="h-16 w-16 rounded-xl overflow-hidden bg-cream flex-shrink-0">
                            <img
                              src={buildAssetUrl(item.picture)}
                              alt={item.clothingLabel}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">{item.clothingLabel}</p>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {item.description || "Standard uniform"}
                          </p>
                          {item.stockInfo && (
                            <p className="text-[0.7rem] uppercase tracking-wide text-ocean">
                              {item.stockInfo}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Title or Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about the occasion, vibe, and any special requests"
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean focus:border-ocean bg-white resize-none"
                  disabled={submitting}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Location
                </label>
                <select
                  value={location}
                  onChange={(e) => onLocationChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean focus:border-ocean bg-white"
                  disabled={submitting}
                  required
                >
                 <option value="" disabled hidden>
                  Select a location
                  </option>

                  {locationOptions.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky text-ocean">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-ocean font-semibold">Start</p>
                    <p className="text-sm text-gray-700">Date and time</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm space-y-3">
                  <DatePicker
                    selected={startDateTime}
                    onChange={(date) => onStartChange(date)}
                    placeholderText="Start date"
                    dateFormat="yyyy-MM-dd"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean focus:border-ocean bg-white"
                    disabled={submitting}
                    popperClassName="z-50"
                  />
                  <select
                    value={formatTime(startDateTime)}
                    onChange={(e) => {
                      const merged = combineDateAndTime(startDateTime, e.target.value);
                      if (merged) onStartChange(merged);
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean focus:border-ocean bg-white"
                    disabled={submitting || !startDateTime}
                  >
                    <option value="">Select time</option>
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-gray-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-ocean font-semibold">End</p>
                    <p className="text-sm text-gray-700">Date and time</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm space-y-3">
                  <DatePicker
                    selected={endDateTime}
                    onChange={(date) => onEndChange(date)}
                    placeholderText="End date"
                    dateFormat="yyyy-MM-dd"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean focus:border-ocean bg-white"
                    disabled={submitting}
                    popperClassName="z-50"
                    minDate={startDateTime || undefined}
                  />
                  <select
                    value={formatTime(endDateTime)}
                    onChange={(e) => {
                      const merged = combineDateAndTime(endDateTime, e.target.value);
                      if (merged) onEndChange(merged);
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean focus:border-ocean bg-white"
                    disabled={submitting || !endDateTime}
                  >
                    <option value="">Select time</option>
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Guests
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 120"
                  value={nbOfGuests}
                  onChange={(e) => onGuestsChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean focus:border-ocean bg-white"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-ocean text-white text-sm font-semibold shadow-md hover:bg-ocean/90 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
