import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, Clock, User, Calendar, CheckCheck, Inbox, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: any;
  createdAt: string;
}

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  earlier: Notification[];
}

// Skeleton loader for notifications
function NotificationSkeleton() {
  return (
    <div className="p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  // Fetch unread count
  const { data: countData } = useQuery({
    queryKey: ["/api/notifications/unread/count"],
    refetchInterval: 30000,
  });

  const unreadCount = (countData as { count: number })?.count || 0;

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: GroupedNotifications = { today: [], yesterday: [], earlier: [] };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    (notifications as Notification[]).forEach((notification) => {
      const notificationDate = new Date(notification.createdAt);
      const notificationDay = new Date(
        notificationDate.getFullYear(),
        notificationDate.getMonth(),
        notificationDate.getDate()
      );

      if (notificationDay.getTime() >= today.getTime()) {
        groups.today.push(notification);
      } else if (notificationDay.getTime() >= yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });

    return groups;
  }, [notifications]);

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread/count"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread/count"] });
      toast({
        title: "All caught up!",
        description: "All notifications marked as read",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread/count"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_lead':
        return {
          icon: <User className="w-4 h-4" />,
          bgColor: "bg-blue-100 dark:bg-blue-900/40",
          iconColor: "text-blue-600 dark:text-blue-400"
        };
      case 'new_booking':
        return {
          icon: <Calendar className="w-4 h-4" />,
          bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
          iconColor: "text-emerald-600 dark:text-emerald-400"
        };
      case 'system':
        return {
          icon: <Sparkles className="w-4 h-4" />,
          bgColor: "bg-purple-100 dark:bg-purple-900/40",
          iconColor: "text-purple-600 dark:text-purple-400"
        };
      default:
        return {
          icon: <Bell className="w-4 h-4" />,
          bgColor: "bg-gray-100 dark:bg-gray-800",
          iconColor: "text-gray-600 dark:text-gray-400"
        };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderNotificationItem = (notification: Notification) => {
    const { icon, bgColor, iconColor } = getNotificationIcon(notification.type);

    return (
      <div
        key={notification.id}
        className={cn(
          "group relative px-4 py-3 transition-all duration-200",
          "hover:bg-gray-50 dark:hover:bg-gray-800/50",
          !notification.isRead && "bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-950/30 dark:to-transparent"
        )}
        data-testid={`notification-${notification.id}`}
      >
        <div className="flex items-start gap-3">
          {/* Icon with colored background */}
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105",
            bgColor
          )}>
            <span className={iconColor}>{icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <p className={cn(
                "text-sm truncate",
                !notification.isRead
                  ? "font-semibold text-gray-900 dark:text-white"
                  : "font-medium text-gray-700 dark:text-gray-200"
              )}>
                {notification.title}
              </p>
              {!notification.isRead && (
                <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(notification.createdAt)}
            </p>
          </div>

          {/* Action buttons - appear on hover */}
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {!notification.isRead && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsReadMutation.mutate(notification.id);
                      }}
                      disabled={markAsReadMutation.isPending}
                      className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg"
                      data-testid={`button-mark-read-${notification.id}`}
                    >
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Mark as read
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotificationMutation.mutate(notification.id);
                    }}
                    disabled={deleteNotificationMutation.isPending}
                    className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg"
                    data-testid={`button-delete-${notification.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Delete
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;

    return (
      <div>
        <div className="sticky top-0 z-10 px-4 py-2 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
          {items.map(renderNotificationItem)}
        </div>
      </div>
    );
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative group"
        onClick={() => setIsOpen(true)}
        data-testid="button-notifications"
      >
        <Bell className={cn(
          "w-5 h-5 transition-colors duration-200",
          unreadCount > 0
            ? "text-gray-700 dark:text-gray-200"
            : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
        )} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[85vh] p-0 gap-0 rounded-2xl overflow-hidden shadow-2xl border-0 mx-auto">
          {/* Header */}
          <DialogHeader className="p-4 pb-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3 pr-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : 'All caught up!'}
                  </DialogDescription>
                </div>
              </div>
              {unreadCount > 0 && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                        className="h-9 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg font-medium text-sm"
                        data-testid="button-mark-all-read"
                      >
                        <CheckCheck className="w-4 h-4 mr-1.5" />
                        Read all
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Mark all as read
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </DialogHeader>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[calc(85vh-80px)] bg-white dark:bg-gray-900">
            {isLoading ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[...Array(4)].map((_, i) => (
                  <NotificationSkeleton key={i} />
                ))}
              </div>
            ) : (notifications as Notification[]).length === 0 ? (
              <div className="py-16 px-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Inbox className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
                  No notifications
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You're all caught up! Check back later.
                </p>
              </div>
            ) : (
              <div>
                {renderSection("Today", groupedNotifications.today)}
                {renderSection("Yesterday", groupedNotifications.yesterday)}
                {renderSection("Earlier", groupedNotifications.earlier)}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}