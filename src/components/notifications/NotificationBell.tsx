import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Bell } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch unread notifications count
  const { data: unreadCount = 0 } = useQuery(
    trpc.notifications.unreadCount.queryOptions()
  );

  // Fetch 10 most recent notifications
  const { data: notifications = [], isLoading } = useQuery({
    ...trpc.notifications.list.queryOptions(),
    enabled: isOpen,
  });

  // Toggle dropdown
  const toggleDropdown = () => setIsOpen((prev) => !prev);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={toggleDropdown}
        aria-label="Toggle notifications"
        className="relative flex items-center justify-center p-2 rounded-lg text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-surface-hover)] transition-all duration-200 focus:outline-none hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span 
            id="unread-badge"
            className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-slate-950 shadow-[0_0_8px_rgba(34,211,238,0.7)] animate-bounce"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          isLoading={isLoading}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
