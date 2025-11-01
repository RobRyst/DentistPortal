import { useEffect, useRef, useState } from "react";
import {
  getUnreadCount,
  getNotifications,
  markRead,
  markAllRead,
  type NotificationDto,
} from "../api/Notifications";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number>(0);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await getUnreadCount();
        setCount(count);
      } catch {
        // ignore
      }
    };
    const start = () => {
      void fetchCount();
      stop();
      pollRef.current = window.setInterval(fetchCount, 30000);
    };
    const stop = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const visible = () =>
      document.visibilityState === "visible" ? start() : stop();
    document.addEventListener("visibilitychange", visible);
    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const res = await getNotifications({ take: 10, onlyUnread: false });
        setItems(res.items);
      } finally {
        setLoading(false);
      }
    }
  };

  const onMarkRead = async (id: number) => {
    try {
      await markRead(id);
      setItems((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const onMarkAll = async () => {
    try {
      await markAllRead();
      setItems((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
      setCount(0);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-zinc-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-zinc-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9a6 6 0 10-12 0v.75a8.967 8.967 0 01-2.311 6.022c1.76.68 3.607 1.154 5.454 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] leading-none h-4 min-w-4 px-1">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-white shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="font-medium text-sm">Notifications</div>
            <button
              onClick={onMarkAll}
              className="text-xs text-blue-600 hover:underline"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-80 overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-zinc-600">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-zinc-600">No notifications.</div>
            ) : (
              <ul className="divide-y">
                {items.map((notification) => (
                  <li
                    key={notification.id}
                    className="p-3 flex items-start gap-2"
                  >
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${
                        notification.isRead ? "bg-zinc-300" : "bg-blue-600"
                      }`}
                      aria-hidden
                    />
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          notification.isRead
                            ? "text-zinc-600"
                            : "text-zinc-900"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(notification.createdTime).toLocaleString(
                          "no-NO"
                        )}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => onMarkRead(notification.id)}
                        className="text-xs px-2 py-1 rounded border hover:bg-zinc-50"
                      >
                        Mark read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
