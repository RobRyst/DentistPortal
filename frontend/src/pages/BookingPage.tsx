import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { DateTime } from "luxon";
import { getAvailableSlots, bookAppointment } from "../api/Appointments";

const PROVIDER_ID = 1;
const OSLO = "Europe/Oslo";

function rangeFromUtcISO(osloDay: DateTime) {
  return osloDay.startOf("day").setZone(OSLO).toUTC().toISO();
}
function rangeToUtcISO(osloDay: DateTime, daysAhead: number) {
  return osloDay
    .plus({ days: daysAhead })
    .endOf("day")
    .setZone(OSLO)
    .toUTC()
    .toISO();
}

function formatOsloRange(startUtcISO: string, endUtcISO: string) {
  const start = DateTime.fromISO(startUtcISO, { zone: "utc" }).setZone(OSLO);
  const end = DateTime.fromISO(endUtcISO, { zone: "utc" }).setZone(OSLO);

  const datePart = start.toFormat("EEEE dd.MM.yyyy");
  const timeStart = start.toFormat("HH:mm");
  const timeEnd = end.toFormat("HH:mm");
  if (!start.hasSame(end, "day")) {
    const endDatePart = start.toFormat("EEEE dd.MM.yyyy HH:mm");
    return `${datePart} ${timeStart} – ${endDatePart}`;
  }
  return `${datePart} ${timeStart} – ${timeEnd}`;
}

function parseDurationToMinutes(s?: string) {
  if (!s) return 30;
  const min = s.match(/(\d+)\s*m(in(ute)?s?)?/i);
  if (min) return parseInt(min[1], 10);
  const hrs = s.match(/(\d+)\s*h(our|rs)?/i);
  if (hrs) return parseInt(hrs[1], 10) * 60;
  return 30;
}

export default function BookingPage() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<DateTime>(() =>
    DateTime.now().setZone(OSLO).startOf("day")
  );
  const [days, setDays] = useState(2);
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

  const rangeFrom = useMemo(
    () => rangeFromUtcISO(startDate) as string,
    [startDate]
  );
  const rangeTo = useMemo(
    () => rangeToUtcISO(startDate, days) as string,
    [startDate, days]
  );

  const desiredMinutes = useMemo(
    () => parseDurationToMinutes(treatment?.duration),
    [treatment]
  );

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAvailableSlots(PROVIDER_ID, rangeFrom, rangeTo, {
        durationMinutes: desiredMinutes,
        stepMinutes: 15,
      });
      setSlots(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e?.response?.data ?? "Could not load available times.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSlots();
  }, [rangeFrom, rangeTo, desiredMinutes]);

  const onBook = async (slotId: number, startTime: string, endTime: string) => {
    try {
      setBookingId(slotId);
      await bookAppointment({
        providerId: PROVIDER_ID,
        startTime,
        endTime,
        notes: treatment ? `Treatment: ${treatment.title}` : undefined,
      });

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Appointment confirmed!",
        showConfirmButton: false,
        timer: 1500,
      });
      navigate("/", { replace: true });
      setTimeout(() => navigate("/", { replace: true }), 1500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e?.response?.status === 409)
        alert("That time is no longer available.");
      else alert("Couldn't book this time.");
    } finally {
      setBookingId(null);
    }
  };

  if (!treatment) {
    return <Navigate to="/treatments" replace />;
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Book appointment</h1>

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

      <div className="flex gap-2 items-end mb-4">
        <div>
          <label className="block text-sm">Start date (Oslo)</label>
          <input
            type="date"
            value={startDate.toFormat("yyyy-LL-dd")}
            onChange={(e) =>
              setStartDate(
                DateTime.fromISO(e.target.value, { zone: OSLO }).startOf("day")
              )
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
          const label = formatOsloRange(slot.startTime, slot.endTime);
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
