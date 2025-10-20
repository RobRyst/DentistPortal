import { useEffect, useMemo, useState } from "react";
import {
  getMyAppointments,
  type AppointmentSummaryDto,
} from "../api/appointments";

function groupAppointments(items: AppointmentSummaryDto[]) {
  const now = new Date();
  const upcoming: AppointmentSummaryDto[] = [];
  const previous: AppointmentSummaryDto[] = [];
  for (const appointment of items) {
    const start = new Date(appointment.startTime);
    (start >= now ? upcoming : previous).push(appointment);
  }
  return { upcoming, previous };
}

function fmtRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
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
}

export default function AppointmentListPage() {
  const [items, setItems] = useState<AppointmentSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyAppointments();
        setItems(data);
      } catch (e: any) {
        setError(e?.response?.data ?? "Kunne ikke hente timer.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const { upcoming, previous } = useMemo(
    () => groupAppointments(items),
    [items]
  );

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Mine timer</h1>
      {loading && <p>Laster…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <section className="mb-6">
            <h2 className="font-semibold mb-2">Upcoming appointments</h2>
            {upcomingList(upcoming)}
          </section>

          <section>
            <h2 className="font-semibold mb-2">Upcoming appointments</h2>
            {upcomingList(previous)}
          </section>
        </>
      )}
    </main>
  );
}

function upcomingList(list: AppointmentSummaryDto[]) {
  if (list.length === 0) return <p>None</p>;
  return (
    <ul className="space-y-2">
      {list.map((appointment) => (
        <li
          key={appointment.id}
          className="border rounded p-3 flex justify-between"
        >
          <span className="capitalize">
            {fmtRange(appointment.startTime, appointment.endTime)}
          </span>
          <span className="text-sm opacity-80">{appointment.status}</span>
        </li>
      ))}
    </ul>
  );
}
