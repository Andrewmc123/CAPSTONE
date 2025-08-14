// NotificationsPage.jsx
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { thunkGetUserNotifications, thunkMarkAllAsRead } from '../../redux/notification';
import './NotificationsPage.css';  // Create this CSS file

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const notifications = useSelector(state => 
    Object.values(state.notifications.all || {}).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )
  );
  const unreadCount = useSelector(state => state.notifications.unreadCount);
  const loaded = useSelector(state => state.notifications.loaded);

  useEffect(() => {
    dispatch(thunkGetUserNotifications());
  }, [dispatch]);

  const handleMarkAllRead = () => {
    dispatch(thunkMarkAllAsRead());
  };

  if (!loaded) return <div className="loading">Loading notifications...</div>;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="mark-read-btn"
          >
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-notifications">
            No notifications yet
          </div>
        ) : (
          notifications.map(notification => (
            <NavLink
              key={notification.id}
              to={notification.link || "#"}
              className={`notification ${notification.is_read ? 'read' : 'unread'}`}
            >
              <div className="notification-avatar">
                <img 
                  src={notification.sender?.profile_img || '/default-user.png'} 
                  alt={notification.sender?.username}
                />
              </div>
              <div className="notification-content">
                <p>{notification.message}</p>
                <small>
                  {new Date(notification.created_at).toLocaleString()}
                </small>
              </div>
              {!notification.is_read && (
                <div className="unread-dot"></div>
              )}
            </NavLink>
          ))
        )}
      </div>
    </div>
  );
}