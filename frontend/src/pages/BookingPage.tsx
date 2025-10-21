import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAvailableSlots, bookAppointment } from "../api/appointments";

const PROVIDER_ID = 1;

function toUtcIso(d: Date) {
  return new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  ).toISOString();
}

function endOfDayUtcIso(d: Date) {
  return new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
  ).toISOString();
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export default function BookingPage() {
  const [startDate, setStartDate] = useState(() => new Date());
  const [days, setDays] = useState(14);
  const [slots, setSlots] = useState<
    Array<{ id: number; startTime: string; endTime: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const location = useLocation();
  const treatment = location.state?.treatment as
    | {
        id: number;
        title: string;
        description?: string;
        duration?: string;
        price?: string;
      }
    | undefined;

  const rangeFrom = useMemo(() => toUtcIso(startDate), [startDate]);
  const rangeTo = useMemo(
    () => endOfDayUtcIso(addDays(startDate, days)),
    [startDate, days]
  );

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAvailableSlots(PROVIDER_ID, rangeFrom, rangeTo);
      setSlots(data);
    } catch (e: any) {
      setError(e?.response?.data ?? "Could not load available times.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSlots();
  }, [rangeFrom, rangeTo]);

  const onBook = async (slotId: number, startTime: string, endTime: string) => {
    try {
      setBookingId(slotId);
      await bookAppointment({
        providerId: PROVIDER_ID,
        startTime,
        endTime,
        notes: treatment ? `Treatment: ${treatment.title}` : undefined,
      });
      alert("Appointment confirmed!");
      await fetchSlots();
    } catch (e: any) {
      if (e?.response?.status === 409)
        alert("That time is no longer available.");
      else alert("Couldn't book this time.");
    } finally {
      setBookingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Book appointment</h1>
      {treatment && (
        <div className="mb-4 rounded-xl border p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">{treatment.title}</h2>
              {treatment.description && (
                <p className="text-sm text-gray-600">{treatment.description}</p>
              )}
              <div className="mt-1 text-sm text-gray-500 flex gap-3">
                {treatment.duration && (
                  <span>
                    <strong>Duration:</strong> {treatment.duration}
                  </span>
                )}
                {treatment.price && (
                  <span>
                    <strong>Price:</strong> {treatment.price}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 items-end mb-4">
        <div>
          <label className="block text-sm">Start date</label>
          <input
            type="date"
            value={startDate.toISOString().slice(0, 10)}
            onChange={(e) =>
              setStartDate(new Date(e.target.value + "T00:00:00"))
            }
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm">Days ahead</label>
          <input
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border rounded px-3 py-2 w-24"
          />
        </div>
      </div>

      {loading && <p>Loading available times…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && slots.length === 0 && (
        <p>No available times in this range.</p>
      )}

      <ul className="space-y-2">
        {slots.map((slot) => {
          const start = new Date(slot.startTime);
          const end = new Date(slot.endTime);
          const label = (() => {
            try {
              return new Intl.DateTimeFormat("no-NO", {
                weekday: "long",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }).formatRange(start, end);
            } catch {
              const f = new Intl.DateTimeFormat("no-NO", {
                weekday: "long",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
              return `${f.format(start)} – ${f.format(end)}`;
            }
          })();

          return (
            <li
              key={slot.id}
              className="flex items-center justify-between border rounded p-3"
            >
              <span className="capitalize">{label}</span>
              <button
                onClick={() => onBook(slot.id, slot.startTime, slot.endTime)}
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={bookingId === slot.id}
              >
                {bookingId === slot.id ? "Booking…" : "Book"}
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
