import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCircle, X, ArrowLeft } from 'lucide-react';
import MainMenu from '../components/MainMenu';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

Notification

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}


const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });
      // Update local state
      setNotifications(notifications.map(notification =>
        notification.id === id ? { ...notification, is_read: true } : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      // Remove from local state
      setNotifications(notifications.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
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

    <div className="max-w-7xl mx-auto p-8">

        {/* Header */}
        <div className="flex justify-between items-center">
            {/* Back button and title */}
            <div className="flex items-center gap-6">
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center px-3 py-3 bg-gray-50 hover:bg-white rounded-lg
                    text-gray-400 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>

                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Notifications</h1>
                    <p className="text-gray-600 hidden">Welcome back, {user?.first_name || 'Guest'}!</p>
                </div>
            </div>
        </div>



      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 mt-12 text-center">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nothing to see here</h3>
          <p className="text-gray-500">You don't have any notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                notification.is_read
                  ? 'border-gray-300'
                  : notification.type === 'alert'
                    ? 'border-red-500'
                    : notification.type === 'success'
                      ? 'border-green-500'
                      : 'border-blue-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{notification.title}</h3>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
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
     </>
  );
};

export default Notifications;