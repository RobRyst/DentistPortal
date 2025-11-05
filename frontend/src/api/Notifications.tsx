import { http } from "./Http";

export type NotificationDto = {
  id: number;
  message: string;
  isRead: boolean;
  createdTime: string;
};

export type NotificationListResponse = {
  count: number;
  items: NotificationDto[];
};

export async function getUnreadCount() {
  const { data } = await http.get<{ count: number }>(
    "/api/notifications/unread-count"
  );
  return data.count;
}

export async function getNotifications(params?: {
  skip?: number;
  take?: number;
  onlyUnread?: boolean;
}) {
  const { data } = await http.get<NotificationListResponse>(
    "/api/notifications",
    { params }
  );
  return data;
}

export async function markRead(id: number) {
  await http.post<void>(`/api/notifications/${id}/read`);
}

export async function markAllRead() {
  await http.post<void>("/api/notifications/read-all");
}
