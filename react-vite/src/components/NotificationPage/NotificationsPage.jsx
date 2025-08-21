// NotificationsPage.jsx
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { HeartIcon, MessageCircleIcon, UserPlusIcon, BellIcon, CheckIcon, UserCheckIcon } from 'lucide-react';
import { thunkGetUserNotifications, thunkMarkAllAsRead } from '../../redux/notification';
import { sendFriendRequest, acceptFriendRequest } from '../../redux/friends';
import './NotificationsPage.css';

const NotificationItem = ({ notification, onAddFriend, onAcceptRequest }) => {
  const getIcon = () => {
    switch (notification.notification_type) {
      case 'post_like': return <HeartIcon size={16} className="text-pink-500" />;
      case 'post_comment':
      case 'comment_reply': return <MessageCircleIcon size={16} className="text-blue-500" />;
      case 'friend_request': return <UserPlusIcon size={16} className="text-green-500" />;
      case 'friend_request_accepted': return <UserCheckIcon size={16} className="text-green-500" />;
      default: return <BellIcon size={16} className="text-yellow-500" />;
    }
  };

  const getContent = () => {
    switch (notification.notification_type) {
      case 'post_like': return 'liked your post';
      case 'post_comment': return 'commented on your post';
      case 'comment_reply': return 'replied to your comment';
      case 'friend_request': return 'sent you a friend request';
      case 'friend_request_accepted': return 'accepted your friend request';
      default: return 'sent you a notification';
    }
  };

  // Function to handle image errors
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    // Create fallback with user initial
    const fallback = document.createElement('div');
    fallback.className = 'avatar-fallback';
    fallback.textContent = notification.sender?.username?.[0]?.toUpperCase() || 'U';
    e.target.parentNode.appendChild(fallback);
  };

  return (
    <div className={`notification-item ${notification.read ? '' : 'unread'}`}>
      <div className="flex items-center">
        <div className="avatar-container">
          {notification.sender?.profile_img ? (
            <img
              src={notification.sender.profile_img}
              alt={notification.sender.username}
              className="notification-avatar"
              onError={handleImageError}
            />
          ) : (
            <div className="avatar-fallback">
              {notification.sender?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div>
          <span className="font-semibold mr-1">{notification.sender?.username || 'Someone'}</span>
          <span>{getContent()}</span>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(notification.created_at).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Show action buttons for friend requests */}
      {notification.notification_type === 'friend_request' && (
        <div className="flex gap-2">
          <button 
            className="friend-action-btn accept"
            onClick={() => onAcceptRequest(notification.sender?.id)}
          >
            <CheckIcon size={14} /> Accept
          </button>
          <button 
            className="friend-action-btn add"
            onClick={() => onAddFriend(notification.sender?.id)}
          >
            Add Back
          </button>
        </div>
      )}

      <div className="ml-3">
        {getIcon()}
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const notifications = useSelector((state) => {
    const allNotifications = state.notifications.all || {};
    return Object.values(allNotifications).sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
  });

  const unreadCount = useSelector(state => state.notifications.unreadCount);
  const loaded = useSelector(state => state.notifications.loaded);
  const loading = useSelector(state => state.notifications.loading);
  
  // Get the current user to access friends count
  const currentUser = useSelector(state => state.session.user);

  useEffect(() => {
    dispatch(thunkGetUserNotifications());
  }, [dispatch]);

  const handleMarkAllRead = () => {
    dispatch(thunkMarkAllAsRead());
  };

  const handleAddFriend = async (friendId) => {
    try {
      const result = await dispatch(sendFriendRequest(friendId));
      
      if (result && result.success) {
        setConfirmationText('Friend request sent!');
      } else {
        setConfirmationText(result.error || 'Failed to send friend request');
      }
    } catch (error) {
      setConfirmationText('Failed to send friend request. Please try again.');
      console.error('Friend request error:', error);
    }
    
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const handleAcceptRequest = async (friendId) => {
    try {
      const result = await dispatch(acceptFriendRequest(friendId));
      
      if (result && result.success) {
        setConfirmationText('Friend request accepted!');
        // Refresh notifications to remove the accepted request
        setTimeout(() => dispatch(thunkGetUserNotifications()), 500);
      } else {
        setConfirmationText(result.error || 'Failed to accept friend request');
      }
    } catch (error) {
      setConfirmationText('Failed to accept friend request. Please try again.');
      console.error('Accept friend request error:', error);
    }
    
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!loaded) return null;

  return (
    <div className="notifications-container">
      {showConfirmation && (
        <div className="confirmation-dropdown">
          <p>{confirmationText}</p>
          <button className="close-btn" onClick={() => setShowConfirmation(false)}>×</button>
        </div>
      )}

      {/* Header with friends count */}
      <div className="p-4 flex justify-between items-center border-b border-zinc-800 sticky top-0 bg-black z-10">
        <div>
          <h1 className="text-xl font-bold">Notifications</h1>
          {currentUser && (
            <p className="text-sm text-gray-400">
              {currentUser.friends_count || 0} friends
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <span className="text-sm text-blue-500">
              {unreadCount} unread
            </span>
          )}
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
              disabled={loading}
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <BellIcon size={48} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg mb-1">No notifications yet</p>
            <p className="text-sm max-w-xs">Likes, comments, or friend requests will appear here</p>
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onAddFriend={handleAddFriend}
              onAcceptRequest={handleAcceptRequest}
            />
          ))
        )}
      </div>
    </div>
  );
}