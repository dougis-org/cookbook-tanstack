import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { UserPlus, UserMinus, Plus, Minus, Check, CheckSquare } from "lucide-react";

interface NotificationItem {
  id: string;
  userId: string;
  senderId: string;
  type: 'collaboration_invited' | 'collaboration_removed' | 'recipe_added' | 'recipe_removed';
  read: boolean;
  data?: {
    cookbookId?: string;
    cookbookTitle?: string;
    recipeId?: string;
    recipeTitle?: string;
  };
  sender?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
}

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  isLoading: boolean;
  onClose: () => void;
}

export const formatTimeAgo = (dateStr: Date | string) => {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export function NotificationDropdown({ notifications, isLoading, onClose }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    ...trpc.notifications.markRead.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["notifications"]] });
    },
  });

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await markReadMutation.mutateAsync({ id: notif.id });
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }
    onClose();
    if (notif.data?.cookbookId) {
      navigate({ to: `/cookbooks/${notif.data.cookbookId}` });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markReadMutation.mutateAsync({});
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  const getNotificationContent = (notif: NotificationItem) => {
    const senderName = notif.sender?.name || "Someone";
    const cookbookTitle = notif.data?.cookbookTitle || "a cookbook";
    const recipeTitle = notif.data?.recipeTitle || "a recipe";

    switch (notif.type) {
      case "collaboration_invited":
        return {
          icon: <UserPlus className="w-4 h-4 text-emerald-400" />,
          message: (
            <span>
              <strong className="text-slate-100">{senderName}</strong> invited you to collaborate on the cookbook{" "}
              <strong className="text-cyan-400 font-semibold">{cookbookTitle}</strong>
            </span>
          ),
        };
      case "collaboration_removed":
        return {
          icon: <UserMinus className="w-4 h-4 text-rose-400" />,
          message: (
            <span>
              Your collaboration on the cookbook <strong className="text-cyan-400 font-semibold">{cookbookTitle}</strong> has ended
            </span>
          ),
        };
      case "recipe_added":
        return {
          icon: <Plus className="w-4 h-4 text-cyan-400" />,
          message: (
            <span>
              <strong className="text-slate-100">{senderName}</strong> added{" "}
              <strong className="text-slate-100 font-medium">{recipeTitle}</strong> to the cookbook{" "}
              <strong className="text-cyan-400 font-semibold">{cookbookTitle}</strong>
            </span>
          ),
        };
      case "recipe_removed":
        return {
          icon: <Minus className="w-4 h-4 text-amber-400" />,
          message: (
            <span>
              <strong className="text-slate-100">{senderName}</strong> removed{" "}
              <strong className="text-slate-100 font-medium">{recipeTitle}</strong> from the cookbook{" "}
              <strong className="text-cyan-400 font-semibold">{cookbookTitle}</strong>
            </span>
          ),
        };
      default:
        return {
          icon: <Check className="w-4 h-4 text-slate-400" />,
          message: <span>New notification received</span>,
        };
    }
  };

  return (
    <div 
      id="notification-dropdown"
      className="absolute right-0 mt-3 w-80 sm:w-96 rounded-xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-md shadow-2xl p-1 z-50 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
        <h3 className="font-semibold text-slate-200 text-sm">Notifications</h3>
        {hasUnread && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={markReadMutation.isPending}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-800/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-400">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 px-4">
            <span className="text-xs text-slate-500 block">No notifications yet.</span>
            <span className="text-[10px] text-slate-600 block mt-1">We will notify you about updates here!</span>
          </div>
        ) : (
          notifications.map((notif) => {
            const { icon, message } = getNotificationContent(notif);
            return (
              <button
                type="button"
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full text-left flex gap-3 p-4 hover:bg-slate-800/40 focus:bg-slate-800/40 focus:outline-none transition-all duration-150 cursor-pointer ${
                  !notif.read ? "bg-slate-800/15 border-l-2 border-cyan-400/80" : ""
                }`}
              >
                <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/30">
                  {icon}
                </div>
                <div className="flex-grow flex flex-col gap-1.5 min-w-0">
                  <div className="text-xs text-slate-300 leading-normal text-left break-words">
                    {message}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                    {!notif.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse"></span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
