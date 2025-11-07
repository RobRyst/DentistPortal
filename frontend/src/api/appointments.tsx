import { http } from "./Http";

export type AvailabilitySlotDto = {
  id: number;
  providerId: number;
  startTime: string;
  endTime: string;
};

export type CreateAvailabilitySlotRequest = {
  providerId: number;
  startTime: string;
  endTime: string;
};

export type AppointmentDto = {
  id: number;
  providerId: number;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string | null;
};

export type AppointmentSummaryDto = {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string | null;
};

export type BookAppointmentRequest = {
  providerId: number;
  startTime: string;
  endTime: string;
  notes?: string;
};

export async function getAvailableSlots(
  providerId: number,
  fromUtc: string,
  toUtc: string,
  opts?: { durationMinutes?: number; stepMinutes?: number }
) {
  const { data } = await http.get<AvailabilitySlotDto[]>(
    `/api/appointment/available-slots`,
    { params: { providerId, fromUtc, toUtc, ...opts } }
  );
  return data;
}

export async function adminUpdateAppointment(
  id: number,
  req: { startTime: string; endTime: string; notes?: string | null }
) {
  const { data } = await http.put<AppointmentDto>(
    `/api/appointment/${id}`,
    req
  );
  return data;
}

export async function bookAppointment(req: BookAppointmentRequest) {
  const { data } = await http.post<AppointmentDto>(
    `/api/appointment/bookings`,
    req
  );
  return data;
}

export async function getMyAppointments() {
  const { data } = await http.get<AppointmentSummaryDto[]>(
    `/api/appointment/my-appointments`
  );
  return data;
}

export async function adminListSlots(
  providerId: number,
  fromUtc: string,
  toUtc: string
) {
  const { data } = await http.get<AvailabilitySlotDto[]>(
    `/api/availability-slots`,
    {
      params: { providerId, fromUtc, toUtc },
    }
  );
  return data;
}

export async function adminCreateSlot(req: CreateAvailabilitySlotRequest) {
  const { data } = await http.post<AvailabilitySlotDto>(
    `/api/availability-slots`,
    req
  );
  return data;
}

export async function adminUpdateSlot(
  id: number,
  req: { providerId: number; startTime: string; endTime: string }
) {
  const { data } = await http.put<AppointmentDto | AvailabilitySlotDto>(
    `/api/availability-slots/${id}`,
    req
  );
  return data as AvailabilitySlotDto;
}

export async function adminDeleteSlot(id: number) {
  await http.delete<void>(`/api/availability-slots/${id}`);
}

export type CreateAppointmentRequest = {
  userId: string;
  providerId: number;
  startTime: string;
  endTime: string;
  notes?: string;
};

export async function adminListAppointments(params?: {
  fromUtc?: string;
  toUtc?: string;
  providerId?: number;
}) {
  const { data } = await http.get<AppointmentDto[]>("/api/appointment/all", {
    params,
  });
  return data;
}

export async function adminCreateAppointment(req: CreateAppointmentRequest) {
  const { data } = await http.post<AppointmentDto>("/api/appointment", req);
  return data;
}

export async function adminDeleteAppointment(id: number) {
  await http.delete<void>(`/api/appointment/${id}`);
}
