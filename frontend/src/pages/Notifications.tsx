import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCircle, X, ArrowLeft, CheckCheck } from 'lucide-react';
import MainMenu from '../components/MainMenu';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications?user_id=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        console.error('Error fetching notifications:', data.error);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/unread-count?user_id=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(notification =>
          notification.id === id ? { ...notification, is_read: true } : notification
        ));

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/read-all?user_id=${user?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update all notifications to read
        setNotifications(notifications.map(notification => ({
          ...notification,
          is_read: true
        })));

        // Reset unread count
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove from local state
        const deletedNotification = notifications.find(n => n.id === id);
        setNotifications(notifications.filter(notification => notification.id !== id));

        // Update unread count if the deleted notification was unread
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navigate to related entity if available
    if (notification.related_entity_type && notification.related_entity_id) {
      switch (notification.related_entity_type) {
        case 'invoice':
          navigate(`/invoices/${notification.related_entity_id}`);
          break;
        case 'client':
          navigate(`/clients/${notification.related_entity_id}`);
          break;
        case 'business':
          navigate(`/businesses/${notification.related_entity_id}`);
          break;
        default:
          // Do nothing for unknown entity types
          break;
      }
    }

    // Mark as read if unread
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="md:block hidden sticky top-0 left-0 w-full z-30">
        <MainMenu showLogo={false} />
      </div>
      <div className="md:hidden block">
        <MainMenu />
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Bell className="h-8 w-8 text-gray-700 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors"
            >
              <CheckCheck size={16} className="mr-2" />
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nothing to see here</h3>
            <p className="text-gray-500">You don't have any notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow p-4 border-l-4 cursor-pointer ${
                  notification.is_read
                    ? 'border-gray-300'
                    : notification.type === 'warning' || notification.type === 'error'
                      ? 'border-red-500'
                      : notification.type === 'success'
                        ? 'border-green-500'
                        : 'border-blue-500'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{notification.title}</h3>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-400 hover:text-green-500"
                        title="Mark as read"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-500"
                      title="Delete notification"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Navbar />
    </>
  );
};

export default Notifications;