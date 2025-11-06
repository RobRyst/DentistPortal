import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getMyAppointments,
  type AppointmentSummaryDto,
} from "../api/Appointments";

function groupAndSort(items: AppointmentSummaryDto[]) {
  const now = new Date();

  const upcoming = items
    .filter((appointment) => new Date(appointment.startTime) >= now)
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  const previous = items
    .filter((a) => new Date(a.startTime) < now)
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

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
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyAppointments();
      if (mountedRef.current) setItems(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e?.response?.data ?? "Could not load your appointments.");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const { upcoming, previous } = useMemo(() => groupAndSort(items), [items]);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My appointments</h1>
        <button
          onClick={fetchData}
          className="text-sm px-3 py-1.5 rounded border hover:bg-zinc-50"
        >
          Refresh
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <section className="mb-6">
            <h2 className="font-semibold mb-2">
              Upcoming appointments{" "}
              <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded">
                {upcoming.length}
              </span>
            </h2>
            <AppointmentList
              list={upcoming}
              emptyText="No upcoming appointments."
            />
          </section>

          <section>
            <h2 className="font-semibold mb-2">
              Previous appointments{" "}
              <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded">
                {previous.length}
              </span>
            </h2>
            <AppointmentList
              list={previous}
              emptyText="No previous appointments."
            />
          </section>
        </>
      )}
    </main>
  );
}

function AppointmentList({
  list,
  emptyText,
}: {
  list: AppointmentSummaryDto[];
  emptyText: string;
}) {
  if (list.length === 0)
    return <p className="text-sm opacity-75">{emptyText}</p>;

  return (
    <ul className="space-y-2">
      {list.map((appointment) => {
        const isCancelled = appointment.status?.toLowerCase() === "cancelled";
        return (
          <li
            key={appointment.id}
            className="border rounded p-3 flex justify-between items-center"
          >
            <div className="flex flex-col">
              {appointment.notes && (
                <span className="text-sm font-medium">{appointment.notes}</span>
              )}
              <span
                className={`capitalize ${
                  isCancelled ? "line-through opacity-70" : ""
                }`}
              >
                {fmtRange(appointment.startTime, appointment.endTime)}
              </span>
            </div>

            <span
              className={`text-xs px-2 py-1 rounded ${
                isCancelled
                  ? "bg-red-100 text-red-800"
                  : appointment.status.toLowerCase() === "completed"
                  ? "bg-green-100 text-green-800"
                  : "bg-zinc-100 text-zinc-800"
              }`}
              title={appointment.status}
            >
              {appointment.status}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
