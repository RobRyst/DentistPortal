import { useEffect, useMemo, useState, useCallback } from "react";
import {
  adminListAppointments,
  adminUpdateAppointment,
  type AppointmentDto,
} from "../../api/Appointments";

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
    const fmt = new Intl.DateTimeFormat("no-NO", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  }
}

function toUtcIsoLocal(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const local = new Date(year, month - 1, day, hour, minute, 0, 0);
  const utc = new Date(local.getTime() - local.getTimezoneOffset() * 60000);
  return utc.toISOString();
}

function dateInputValueFromIso(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function timeInputValueFromIso(iso: string) {
  const d = new Date(iso);
  return d.toTimeString().slice(0, 5);
}

function toUtcStartOfDayIso(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const local = new Date(year, month - 1, day, 0, 0, 0, 0);
  const utc = new Date(local.getTime() - local.getTimezoneOffset() * 60000);
  return utc.toISOString();
}

function toUtcEndOfDayIso(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const local = new Date(year, month - 1, day, 23, 59, 59, 999);
  const utc = new Date(local.getTime() - local.getTimezoneOffset() * 60000);
  return utc.toISOString();
}

function extractPatientAndDetails(notes?: string | null) {
  if (!notes) return { patient: "-", details: "" };

  const prefix = "Patient:";
  if (!notes.startsWith(prefix)) {
    return { patient: "-", details: notes };
  }

  const afterPrefix = notes.substring(prefix.length).trim();
  const [patientPart, ...rest] = afterPrefix.split("–");
  const patient = patientPart.trim();
  const details = rest.join("–").trim();

  return { patient: patient || "-", details };
}

function treatmentNameFromDetails(details: string) {
  if (!details) return "";
  const m = details.match(/^Treatment:\s*(.+)$/i);
  if (m) return m[1].trim();
  return details;
}

export default function AdminAppointmentsPage() {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [fromDate, setFromDate] = useState(todayIso);
  const [toDate, setToDate] = useState(todayIso);
  const [providerId, setProviderId] = useState<string>("");

  const [items, setItems] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTreatment, setEditTreatment] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const fromUtc = useMemo(() => toUtcStartOfDayIso(fromDate), [fromDate]);
  const toUtc = useMemo(() => toUtcEndOfDayIso(toDate), [toDate]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params: { fromUtc?: string; toUtc?: string; providerId?: number } =
        {
          fromUtc,
          toUtc,
        };
      if (providerId.trim() !== "") {
        const idNum = Number(providerId);
        if (!Number.isNaN(idNum)) params.providerId = idNum;
      }

      const data = await adminListAppointments(params);
      setItems(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.response?.data ?? "Kunne ikke laste avtaler.");
    } finally {
      setLoading(false);
    }
  }, [fromUtc, toUtc, providerId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startEditing = (appt: AppointmentDto) => {
    setEditingId(appt.id);
    setEditDate(dateInputValueFromIso(appt.startTime));
    setEditStart(timeInputValueFromIso(appt.startTime));
    setEditEnd(timeInputValueFromIso(appt.endTime));

    const { details } = extractPatientAndDetails(appt.notes);
    setEditTreatment(treatmentNameFromDetails(details));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDate("");
    setEditStart("");
    setEditEnd("");
    setEditTreatment("");
  };

  const saveEdit = async (appt: AppointmentDto) => {
    try {
      setSaving(true);
      const newStart = toUtcIsoLocal(editDate, editStart);
      const newEnd = toUtcIsoLocal(editDate, editEnd);
      const { patient } = extractPatientAndDetails(appt.notes);
      const treatmentRaw = editTreatment.trim();

      let notes: string;
      if (treatmentRaw) {
        const treatmentPart = treatmentRaw
          .toLowerCase()
          .startsWith("treatment:")
          ? treatmentRaw
          : `Treatment: ${treatmentRaw}`;
        notes = `Patient: ${patient} – ${treatmentPart}`;
      } else {
        notes = `Patient: ${patient}`;
      }

      await adminUpdateAppointment(appt.id, {
        startTime: newStart,
        endTime: newEnd,
        notes,
      });

      await refresh();
      cancelEditing();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(e?.response?.data ?? "Kunne ikke oppdatere avtale.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">All Appointments</h1>
          <p className="text-sm text-zinc-600">
            Administrative overview of all booked appointments. You can change
            the time and treatment for existing appointments.
          </p>
        </div>
        <button
          onClick={refresh}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Oppdater
        </button>
      </div>

      <section className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Provider-ID (Optional)
            </label>
            <input
              type="number"
              min={1}
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="border rounded px-3 py-2 text-sm w-28"
            />
          </div>
        </div>
      </section>

      {loading && <p className="text-zinc-600">Loading appointments...</p>}
      {err && <p className="text-red-600">{err}</p>}

      {!loading && !err && items.length === 0 && (
        <p className="text-sm text-zinc-600">
          No appointments in the chosen window
        </p>
      )}

      {!loading && !err && items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">
                  Time
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">
                  Patient
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">
                  Treatment
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">
                  Provider
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">
                  Status
                </th>
                <th className="px-3 py-2 text-right font-medium text-zinc-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((appt) => {
                const { patient, details } = extractPatientAndDetails(
                  appt.notes
                );
                const treatmentName = treatmentNameFromDetails(details);
                const lowerStatus = appt.status.toLowerCase();

                const badgeColor =
                  lowerStatus === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : lowerStatus === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-zinc-100 text-zinc-800";

                const isEditing = editingId === appt.id;

                return (
                  <tr key={appt.id} className="hover:bg-zinc-50 align-top">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="border rounded px-2 py-1 text-xs"
                          />
                          <div className="flex gap-1">
                            <input
                              type="time"
                              value={editStart}
                              onChange={(e) => setEditStart(e.target.value)}
                              className="border rounded px-2 py-1 text-xs"
                            />
                            <span className="text-xs text-zinc-500 self-center">
                              –
                            </span>
                            <input
                              type="time"
                              value={editEnd}
                              onChange={(e) => setEditEnd(e.target.value)}
                              className="border rounded px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="capitalize">
                          {fmtRange(appt.startTime, appt.endTime)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium">{patient}</td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTreatment}
                          onChange={(e) => setEditTreatment(e.target.value)}
                          placeholder="F.eks. Root Canal"
                          className="border rounded px-2 py-1 text-xs w-full"
                        />
                      ) : treatmentName ? (
                        treatmentName
                      ) : (
                        <span className="text-zinc-500">–</span>
                      )}
                    </td>

                    <td className="px-3 py-2">#{appt.providerId}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${badgeColor}`}
                      >
                        {appt.status}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-right">
                      {isEditing ? (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => saveEdit(appt)}
                            disabled={saving}
                            className="rounded px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                          >
                            {saving ? "Lagrer…" : "Lagre"}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="rounded px-2 py-1 text-xs border hover:bg-zinc-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(appt)}
                          className="rounded px-2 py-1 text-xs border hover:bg-zinc-50"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
