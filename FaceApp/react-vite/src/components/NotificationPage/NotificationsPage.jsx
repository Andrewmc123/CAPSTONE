import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  thunkGetUserNotifications, 
  thunkMarkAllAsRead 
} from "../../redux/notification";
import { 
  acceptFriendRequest, 
  declineFriendRequest 
} from "../../redux/friends";
import { Link } from 'react-router-dom';
import './NotificationsPage.css';

function NotificationsPage() {
  const dispatch = useDispatch();
  const notifications = useSelector(state => state.notifications.notifications);
  const unreadCount = useSelector(state => state.notifications.unreadCount);
  const [loadingActions, setLoadingActions] = useState({});

  useEffect(() => {
    dispatch(thunkGetUserNotifications());
  }, [dispatch]);

  const handleMarkAllAsRead = () => {
    dispatch(thunkMarkAllAsRead());
  };

  const handleAcceptRequest = async (senderId) => {
    try {
      setLoadingActions(prev => ({ ...prev, [senderId]: 'accepting' }));
      const success = await dispatch(acceptFriendRequest(senderId));
      if (success) {
        await dispatch(thunkGetUserNotifications());
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [senderId]: null }));
    }
  };

  const handleDeclineRequest = async (senderId) => {
    try {
      setLoadingActions(prev => ({ ...prev, [senderId]: 'declining' }));
      const success = await dispatch(declineFriendRequest(senderId));
      if (success) {
        await dispatch(thunkGetUserNotifications());
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [senderId]: null }));
    }
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>Notifications {unreadCount > 0 && `(${unreadCount})`}</h2>
        {unreadCount > 0 && (
          <button 
            className="mark-all-read-btn"
            onClick={handleMarkAllAsRead}
            disabled={loadingActions.markAll}
          >
            {loadingActions.markAll ? 'Processing...' : 'Mark all as read'}
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
              <div className="notification-content-wrapper">
                <Link to={`/users/${notification.sender.id}`} className="notification-link">
                  <div className="notification-avatar">
                    <img 
                      src={notification.sender.profile_img || '/default-avatar.png'} 
                      alt={notification.sender.username} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <p className="notification-time">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </Link>
                
                {notification.notification_type === 'friend_request' && (
                  <div className="friend-request-actions">
                    <button 
                      className="accept-btn"
                      onClick={() => handleAcceptRequest(notification.sender.id)}
                      disabled={loadingActions[notification.sender.id] === 'accepting'}
                    >
                      {loadingActions[notification.sender.id] === 'accepting' 
                        ? 'Accepting...' 
                        : 'Accept'}
                    </button>
                    <button 
                      className="decline-btn"
                      onClick={() => handleDeclineRequest(notification.sender.id)}
                      disabled={loadingActions[notification.sender.id] === 'declining'}
                    >
                      {loadingActions[notification.sender.id] === 'declining' 
                        ? 'Declining...' 
                        : 'Decline'}
                    </button>
                  </div>
                )}
              </div>
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