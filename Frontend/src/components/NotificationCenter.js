import React, { useState, useEffect } from 'react';
import { FiBell, FiX, FiCheck, FiCheckCircle } from 'react-icons/fi';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ Universal token getter
  const getToken = () => {
    const localToken = localStorage.getItem('token');
    if (localToken) return localToken;

    const cookieToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];
    return cookieToken || null;
  };

  // ✅ Fetch notifications
  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const token = getToken();
      console.log('🧩 Token before request:', token);

      if (!token) {
        console.error('❌ No token found in localStorage or cookies');
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/user/notifications?page=${page}&limit=10`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('🔔 Notifications fetched:', data.data.notifications);
        setNotifications(data.data.notifications);
        setTotalPages(data.data.pagination.totalPages);
        setCurrentPage(data.data.pagination.currentPage);
      } else {
        console.error('❌ Request failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('⚠️ Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch unread count
  const fetchNotificationCount = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${process.env.REACT_APP_API_URL}/user/notifications/count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        console.warn('Unauthorized: redirecting to login');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data.unread);
      }
    } catch (error) {
      console.error('⚠️ Error fetching notification count:', error);
    }
  };

  // ✅ Mark single notification as read
  const markAsRead = async (notificationId) => {
    console.log('🟢 markAsRead called with ID:', notificationId);
    try {
      const token = getToken();
      console.log('🧩 Token before request:', token);

      if (!token) {
        console.error('❌ No token found in localStorage or cookies');
        return;
      }

      const apiUrl = `${process.env.REACT_APP_API_URL}/user/notifications/${notificationId}/read`;
      console.log('📡 Calling API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📶 Response status:', response.status);

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        console.log(`✅ Notification ${notificationId} marked as read`);
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to mark as read:', errorData);
      }
    } catch (error) {
      console.error('⚠️ Error marking notification as read:', error);
    }
  };

  // ✅ Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/user/notifications/read-all`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('⚠️ Error marking all notifications as read:', error);
    }
  };

  // ✅ On mount
  useEffect(() => {
    fetchNotificationCount();

    const handleNewNotification = (event) => {
      const newNotif = event.detail;
      console.log('📩 New notification received:', newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    window.addEventListener('app:new-notification', handleNewNotification);

    return () => {
      window.removeEventListener('app:new-notification', handleNewNotification);
    };
  }, []);

  // ✅ Fetch when opened
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  // ✅ Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // ✅ Helper UI methods
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'vehicle':
        return '🚗';
      case 'mediclaim':
        return '🏥';
      case 'loan':
        return '💰';
      case 'builder':
        return '🏗️';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'vehicle':
        return '#3b82f6';
      case 'mediclaim':
        return '#10b981';
      case 'loan':
        return '#f59e0b';
      case 'builder':
        return '#8b5cf6';
      case 'system':
        return '#6b7280';
      default:
        return '#374151';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // ✅ Render
  return (
    <>
      <div className="notification-center">
        <button className="action-btn" onClick={() => setIsOpen(!isOpen)}>
          <FiBell size={20} />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </button>

        {isOpen && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              <div className="notification-actions">
                {unreadCount > 0 && (
                  <button
                    className="mark-all-read-btn"
                    onClick={markAllAsRead}
                    title="Mark all as read"
                  >
                    <FiCheckCircle size={16} /> Mark all read
                  </button>
                )}
                <button
                  className="close-btn"
                  onClick={() => setIsOpen(false)}
                  title="Close notifications"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            <div className="notification-list">
              {loading ? (
                <div className="loading">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="no-notifications">
                  <FiBell size={48} />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() =>
                      !notification.is_read && markAsRead(notification.id)
                    }
                  >
                    <div className="notification-icon">
                      <span style={{ color: getNotificationColor(notification.type) }}>
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.title}
                        {!notification.is_read && <div className="unread-dot"></div>}
                      </div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {formatDate(notification.created_at)}
                        </span>
                        <span className="notification-type">{notification.type}</span>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <button
                        className="mark-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        title="Mark as read"
                      >
                        <FiCheck size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="notification-pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => fetchNotifications(currentPage - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => fetchNotifications(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="notification-backdrop" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default NotificationCenter;
