import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui-custom/Button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  related_entity?: string | null;
  related_id?: string | null;
  user_id: string;
}

export const NotificationBell = ({ className = "" }: { className?: string }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const typedNotifications = (data || []).map((notification: any): Notification => ({
        ...notification,
        type: notification.type as 'info' | 'success' | 'warning' | 'error',
      }));

      setNotifications(typedNotifications);
      setUnreadCount(typedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = {
            ...(payload.new as Omit<Notification, 'type'>),
            type: (payload.new as any).type as 'info' | 'success' | 'warning' | 'error',
          };

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={`relative cursor-pointer ${className}`}>
        <div className="flex items-center justify-center h-9 w-9">
  <Bell className="h-5 w-5" />
</div>
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center bg-red-500 border-none text-white text-[10px] rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 rounded-xl shadow-lg" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.filter(n => !n.read).length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No new notifications
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.filter(n => !n.read).map(notification => (
                <div 
                  key={notification.id}
                  className="p-2 bg-white border border-gray-100 hover:bg-gray-50 rounded-lg flex flex-col text-xs relative"
                >
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="absolute top-1 right-1 text-gray-400 hover:text-red-500 text-xs"
                    title="Dismiss"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-semibold text-[13px]">{notification.title}</h4>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-700 mt-1">{notification.message}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
