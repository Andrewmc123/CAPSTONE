import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaChevronDown, FaUserFriends } from 'react-icons/fa';
import './FriendsSidebar.css';

export default function FriendsSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const friendsState = useSelector(state => state.friends);
  const friends = Object.values(friendsState.friends || {});

  // Group friends by online status
  const onlineFriends = friends.filter(friend => friend.status === 'online');
  const offlineFriends = friends.filter(friend => friend.status !== 'online');

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once initially
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`friends-sidebar ${isExpanded ? 'expanded' : ''}`}>
      <div 
        className="friends-header-toggle" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="friends-toggle-content">
          <FaUserFriends className="friends-icon" />
          <span>Friends ({friends.length})</span>
        </div>
        <FaChevronDown className={`toggle-icon ${isExpanded ? 'rotated' : ''}`} />
      </div>

      {isExpanded && (
        <div className="friends-content">
          <div className="friends-section">
            <div className="status-header">
              <span className="online-dot">•</span>
              <span>Online ({onlineFriends.length})</span>
            </div>
            <ul className="friends-list">
              {onlineFriends.map(friend => (
                <li key={friend.id} className="friend-item">
                  <div className="friend-avatar">
                    <img 
                      src={friend.profile_img || '/images/default-avatar.jpg'} 
                      alt={friend.username}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/default-avatar.jpg';
                      }}
                    />
                    <span className={`status-dot online`} />
                  </div>
                  <span className="friend-username">{friend.username}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="friends-section">
            <div className="status-header">
              <span className="offline-dot">•</span>
              <span>Offline ({offlineFriends.length})</span>
            </div>
            <ul className="friends-list">
              {offlineFriends.map(friend => (
                <li key={friend.id} className="friend-item">
                  <div className="friend-avatar">
                    <img 
                      src={friend.profile_img || '/images/default-avatar.jpg'} 
                      alt={friend.username}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/default-avatar.jpg';
                      }}
                    />
                    <span className={`status-dot offline`} />
                  </div>
                  <span className="friend-username">{friend.username}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}