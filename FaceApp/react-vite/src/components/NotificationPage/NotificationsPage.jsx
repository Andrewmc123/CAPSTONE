import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { thunkGetUserNotifications, thunkMarkAllAsRead } from "../../redux/notification";
import { Link } from 'react-router-dom';
import './NotificationsPage.css';

function NotificationsPage() {
  const dispatch = useDispatch();
  const notifications = useSelector(state => state.notifications.notifications);
  const unreadCount = useSelector(state => state.notifications.unreadCount);

  useEffect(() => {
    dispatch(thunkGetUserNotifications());
  }, [dispatch]);

  const handleMarkAllAsRead = () => {
    dispatch(thunkMarkAllAsRead());
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <button 
            className="mark-all-read-btn"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>
      
      {notifications.length > 0 ? (
        <ul className="notifications-list">
          {notifications.map(notification => (
            <li 
              key={notification.id} 
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
            >
              <Link to={notification.link || '#'} className="notification-link">
                <div className="notification-avatar">
                  <img 
                    src={notification.sender.profile_img || '/default-avatar.png'} 
                    alt={notification.sender.username} 
                  />
                </div>
                <div className="notification-content">
                  <p className="notification-message">{notification.message}</p>
                  <p className="notification-time">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-notifications">No notifications yet</p>
      )}
    </div>
  );
}

export default NotificationsPage;