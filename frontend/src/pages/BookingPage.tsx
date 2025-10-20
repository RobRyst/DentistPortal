import { useEffect, useMemo, useState } from "react";
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

  const rangeFrom = useMemo(() => toUtcIso(startDate), [startDate]);
  const rangeTo = useMemo(
    () => endOfDayUtcIso(addDays(startDate, days)),
    [startDate, days]
  );

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAvailableSlots(PROVIDER_ID, rangeFrom, rangeTo);
        setSlots(data);
      } catch (e: any) {
        setError(e?.response?.data ?? "Kunne ikke hente ledige timer.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [rangeFrom, rangeTo]);

  const onBook = async (slotId: number, startTime: string, endTime: string) => {
    try {
      await bookAppointment({ providerId: PROVIDER_ID, startTime, endTime });
      alert("Time bekreftet!");
      const data = await getAvailableSlots(PROVIDER_ID, rangeFrom, rangeTo);
      setSlots(data);
    } catch (e: any) {
      if (e?.response?.status === 409) alert("Tiden er allerede booket.");
      else alert("Kunne ikke bestille time.");
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Bestill time</h1>

      <div className="flex gap-2 items-end mb-4">
        <div>
          <label className="block text-sm">Startdato</label>
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
          <label className="block text-sm">Dager frem</label>
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

      {loading && <p>Laster ledige tider…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && slots.length === 0 && (
        <p>Ingen ledige timer i valgt periode.</p>
      )}

      <ul className="space-y-2">
        {slots.map((slot) => {
          const start = new Date(slot.startTime);
          const end = new Date(slot.endTime);
          const label = new Intl.DateTimeFormat("no-NO", {
            weekday: "long",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).formatRange(start, end);

          return (
            <li
              key={slot.id}
              className="flex items-center justify-between border rounded p-3"
            >
              <span className="capitalize">{label}</span>
              <button
                onClick={() => onBook(slot.id, slot.startTime, slot.endTime)}
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Bestill
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
