import { useEffect, useMemo, useState, useCallback } from "react";
import {
  adminListSlots,
  adminCreateSlot,
  adminDeleteSlot,
  adminUpdateSlot,
  type AvailabilitySlotDto,
} from "../../api/Appointments";

const PROVIDER_ID = 1;

function toUtcIsoLocal(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minutes] = time.split(":").map(Number);
  const local = new Date(year, month - 1, day, hour, minutes, 0, 0);
  return new Date(
    local.getTime() - local.getTimezoneOffset() * 60000
  ).toISOString();
}

function dateInputValueFromIso(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function timeInputValueFromIso(iso: string) {
  const date = new Date(iso);
  return date.toTimeString().slice(0, 5);
}

type SlotRowProps = {
  slot: AvailabilitySlotDto;
  onSave: (id: number, startIso: string, endIso: string) => void;
  onDelete: (id: number) => void;
};

function SlotRow({ slot, onSave, onDelete }: SlotRowProps) {
  const [dateVal, setDateVal] = useState(() =>
    dateInputValueFromIso(slot.startTime)
  );
  const [startVal, setStartVal] = useState(() =>
    timeInputValueFromIso(slot.startTime)
  );
  const [endVal, setEndVal] = useState(() =>
    timeInputValueFromIso(slot.endTime)
  );

  const label = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("no-NO", {
        weekday: "long",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).formatRange(new Date(slot.startTime), new Date(slot.endTime));
    } catch {
      const format = new Intl.DateTimeFormat("no-NO", {
        weekday: "long",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${format.format(new Date(slot.startTime))} – ${format.format(
        new Date(slot.endTime)
      )}`;
    }
  }, [slot.startTime, slot.endTime]);

  const save = () => {
    const newStart = toUtcIsoLocal(dateVal, startVal);
    const newEnd = toUtcIsoLocal(dateVal, endVal);
    onSave(slot.id, newStart, newEnd);
  };

  return (
    <li className="border rounded p-3">
      <div className="flex items-center justify-between">
        <span className="capitalize">{label}</span>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateVal}
            onChange={(event) => setDateVal(event.target.value)}
            className="border rounded px-2 py-1"
          />
          <input
            type="time"
            value={startVal}
            onChange={(event) => setStartVal(event.target.value)}
            className="border rounded px-2 py-1"
          />
          <input
            type="time"
            value={endVal}
            onChange={(event) => setEndVal(event.target.value)}
            className="border rounded px-2 py-1"
          />
          <button
            onClick={save}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={() => onDelete(slot.id)}
            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}

export default function SlotsAdminPage() {
  const [rangeStart, setRangeStart] = useState(() => new Date());
  const [days, setDays] = useState(14);
  const [slots, setSlots] = useState<AvailabilitySlotDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fromUtc = useMemo(() => {
    const date = new Date(
      Date.UTC(
        rangeStart.getFullYear(),
        rangeStart.getMonth(),
        rangeStart.getDate(),
        0,
        0,
        0,
        0
      )
    );
    return date.toISOString();
  }, [rangeStart]);

  const toUtc = useMemo(() => {
    const end = new Date(rangeStart);
    end.setDate(end.getDate() + days);
    const date = new Date(
      Date.UTC(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
        23,
        59,
        59,
        999
      )
    );
    return date.toISOString();
  }, [rangeStart, days]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await adminListSlots(PROVIDER_ID, fromUtc, toUtc);
      setSlots(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.response?.data ?? "Failed to fetch availability.");
    } finally {
      setLoading(false);
    }
  }, [fromUtc, toUtc]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const [cDate, setCDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [cStart, setCStart] = useState("09:00");
  const [cEnd, setCEnd] = useState("09:30");

  const onCreate = async () => {
    try {
      const startTime = toUtcIsoLocal(cDate, cStart);
      const endTime = toUtcIsoLocal(cDate, cEnd);
      await adminCreateSlot({ providerId: PROVIDER_ID, startTime, endTime });
      await refresh();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(e?.response?.data ?? "Could not create slot.");
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete slot?")) return;
    try {
      await adminDeleteSlot(id);
      await refresh();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(e?.response?.data ?? "Could not delete slot.");
    }
  };

  const onSave = async (id: number, startIso: string, endIso: string) => {
    try {
      const slot = slots.find((x) => x.id === id);
      if (!slot) throw new Error("Slot not found");
      await adminUpdateSlot(id, {
        providerId: slot.providerId,
        startTime: startIso,
        endTime: endIso,
      });
      await refresh();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(e?.response?.data ?? "Could not update slot.");
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Availability (Admin/Provider)
      </h1>

      <div className="flex gap-2 items-end mb-4">
        <div>
          <label className="block text-sm">Start date</label>
          <input
            type="date"
            value={rangeStart.toISOString().slice(0, 10)}
            onChange={(event) =>
              setRangeStart(new Date(event.target.value + "T00:00:00"))
            }
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm">Days ahead</label>
          <input
            type="number"
            min={1}
            max={60}
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="border rounded px-3 py-2 w-24"
          />
        </div>
      </div>

      <section className="mb-6">
        <h2 className="font-semibold mb-2">New slot</h2>
        <div className="flex gap-2 items-end">
          <input
            type="date"
            value={cDate}
            onChange={(event) => setCDate(event.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="time"
            value={cStart}
            onChange={(event) => setCStart(event.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="time"
            value={cEnd}
            onChange={(event) => setCEnd(event.target.value)}
            className="border rounded px-3 py-2"
          />
          <button
            onClick={onCreate}
            className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Add
          </button>
        </div>
      </section>

      <h2 className="font-semibold mb-2">Existing slots</h2>
      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">{err}</p>}
      {!loading && !err && slots.length === 0 && (
        <p>No slots in selected range.</p>
      )}

      <ul className="space-y-2">
        {slots.map((slot) => (
          <SlotRow
            key={slot.id}
            slot={slot}
            onSave={onSave}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </main>
  );
}
