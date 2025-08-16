// NotificationsPage.jsx
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { HeartIcon, MessageCircleIcon, UserPlusIcon, BellIcon } from 'lucide-react';
import { thunkGetUserNotifications, thunkMarkAllAsRead } from '../../redux/notification';
import './NotificationsPage.css';

const NotificationItem = ({ notification }) => {
  const getIcon = () => {
    switch (notification.notification_type) {
      case 'post_like':
        return <HeartIcon size={16} className="text-pink-500" />;
      case 'post_comment':
      case 'comment_reply':
        return <MessageCircleIcon size={16} className="text-blue-500" />;
      case 'friend_request':
      case 'friend_request_accepted':
        return <UserPlusIcon size={16} className="text-green-500" />;
      default:
        return <BellIcon size={16} className="text-yellow-500" />;
    }
  };

  const getContent = () => {
    switch (notification.notification_type) {
      case 'post_like':
        return 'liked your post';
      case 'post_comment':
        return 'commented on your post';
      case 'comment_reply':
        return 'replied to your comment';
      case 'friend_request':
        return 'sent you a friend request';
      case 'friend_request_accepted':
        return 'accepted your friend request';
      default:
        return 'sent you a notification';
    }
  };

  return (
    <div className={`flex items-center p-4 border-b border-zinc-800 ${!notification.read ? 'bg-zinc-900/50' : ''}`}>
      <div className="relative">
        <img
          src={notification.sender?.profile_img || '/default-user.png'}
          alt={notification.sender?.username}
          className="w-10 h-10 rounded-full object-cover mr-3"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-user.png';
          }}
        />
        {!notification.read && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-zinc-900"></div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center flex-wrap">
          <span className="font-semibold mr-1">{notification.sender?.username || 'Someone'}</span>
          <span>{getContent()}</span>
          {!notification.read && (
            <span className="ml-2 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">New</span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {new Date(notification.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short'
          })}
        </div>
      </div>
      <div className="flex items-center">
        {notification.post?.image_url ? (
          <img
            src={notification.post.image_url}
            alt="Post content"
            className="w-12 h-12 object-cover rounded ml-2"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-image.png';
            }}
          />
        ) : (
          <div className="ml-2 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
            {getIcon()}
          </div>
        )}
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => {
    const allNotifications = state.notifications.all || {};
    return Object.values(allNotifications).sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
  });
  const unreadCount = useSelector(state => state.notifications.unreadCount);
  const loaded = useSelector(state => state.notifications.loaded);
  const loading = useSelector(state => state.notifications.loading);

  useEffect(() => {
    dispatch(thunkGetUserNotifications());
  }, [dispatch]);

  const handleMarkAllRead = () => {
    dispatch(thunkMarkAllAsRead());
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!loaded) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Notifications header */}
      <div className="p-4 flex justify-between items-center border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
        <h1 className="text-xl font-bold">Notifications</h1>
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

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <BellIcon size={48} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg mb-1">No notifications yet</p>
            <p className="text-sm max-w-xs">
             <p>When you get notifications about likes, comments, or friend requests, they&apos;ll appear here</p>
            </p>
          </div>
        ) : (
          notifications.map(notification => (
            <NavLink 
              key={notification.id} 
              to={getNotificationLink(notification)}
              className="block hover:bg-zinc-900/50 transition-colors"
            >
              <NotificationItem notification={notification} />
            </NavLink>
          ))
        )}
      </div>
    </div>
  );
}

// Helper function to determine where notification should link to
function getNotificationLink(notification) {
  switch (notification.notification_type) {
    case 'post_like':
    case 'post_comment':
      return `/posts/${notification.post?.id}`;
    case 'comment_reply':
      return `/posts/${notification.post?.id}?comment=${notification.comment?.id}`;
    case 'friend_request':
    case 'friend_request_accepted':
      return `/users/${notification.sender?.id}`;
    default:
      return '#';
  }
}