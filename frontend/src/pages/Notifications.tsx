import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCircle, X, ArrowLeft, CheckCheck, AlertTriangle, Info, CheckSquare } from 'lucide-react';
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
          navigate(`/invoices`);
          break;
        case 'client':
          navigate(`/clients`);
          break;
        case 'business':
          navigate(`/businesses/${notification.related_entity_id}`);
          break;
        case 'create':
          navigate(`/new`);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
      case 'error':
        return <AlertTriangle className="w-5 h-5" />;
      case 'success':
        return <CheckSquare className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getNotificationColors = (type: string, isRead: boolean) => {
    if (isRead) {
      return {
        border: 'border-gray-300',
        icon: 'text-gray-500',
        bg: 'bg-gray-50'
      };
    }

    switch (type) {
      case 'warning':
      case 'error':
        return {
          border: 'border-red-300',
          icon: 'text-red-500',
          bg: 'bg-red-50'
        };
      case 'success':
        return {
          border: 'border-green-300',
          icon: 'text-green-500',
          bg: 'bg-green-50'
        };
      default:
        return {
          border: 'border-blue-300',
          icon: 'text-blue-500',
          bg: 'bg-blue-50'
        };
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
      <div className="md:block hidden  sticky top-0 left-0 w-full z-30">
        <MainMenu showLogo={false} />
      </div>
      <div className="md:hidden block">
        <MainMenu />
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className=" rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
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
                className="px-4 py-3 text-white min-w-32 bg-teal-600 rounded-md hover:bg-teal-500 transition-colors"
              >
                <CheckCheck size={16} className="mr-2 inline" />
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Nothing to see here</h3>
              <p className="text-gray-500">You don't have any notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-4 ">
              {notifications.map((notification) => {
                const colors = getNotificationColors(notification.type, notification.is_read);
                return (
                  <div
                    key={notification.id}
                    className={`${colors.bg} rounded-xl p-4 border ${colors.border} cursor-pointer transition-all hover:bg-gray-100`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`${colors.icon} mt-0.5`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1">
                            <h3 className="font-semibold text-gray-900 text-base">
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <span className="ml-2 w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2 leading-relaxed text-sm">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-teal-500 hover:bg-white rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle size={20} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                          title="Delete notification"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions Section (if you want to add more functionality later) */}
        <div className="bg-white rounded-xl hidden p-8 border border-gray-300">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
              <p className="text-gray-500 text-sm mt-1">
                Manage how and when you receive notifications.
              </p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-3 text-teal-600 border-2 border-teal-600 rounded-md hover:bg-teal-50 transition-colors whitespace-nowrap"
            >
              Manage Settings
            </button>
          </div>
        </div>
      </div>
      <Navbar />
    </>
  );
};

export default Notifications;