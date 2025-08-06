import { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './FriendsSidebar.css';
import Friend from '../Friend/Friend'; 

export default function FriendsSidebar({ friends, sessionUser }) {
  const [showOnline, setShowOnline] = useState(true);
  const [showOffline, setShowOffline] = useState(true);

  const allFriends = Object.values(friends);

  // Simulate online status for all friends if no real user logged in or demo user
  const isDemoOrLoggedOut = !sessionUser || sessionUser.username === 'demo';

  const onlineFriends = isDemoOrLoggedOut
    ? allFriends.filter(() => Math.random() > 0.5)
    : allFriends.filter(f => f.isOnline);

  const offlineFriends = isDemoOrLoggedOut
    ? allFriends.filter(() => Math.random() <= 0.5)
    : allFriends.filter(f => !f.isOnline);

  if (isDemoOrLoggedOut) {
    // Show all friends together, no toggles
    return (
      <div className="friends-sidebar">
        <div className="friends-section">
          <h3>👥 Friends</h3>
          {allFriends.length === 0 && <p>No friends to show</p>}
          <ul>
            {allFriends.map(friend => (
              <li key={friend.id}>{friend.username}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Otherwise show online/offline toggles
  return (
    <div className="friends-sidebar">
      <div className="friends-section">
        <div className="friends-header" onClick={() => setShowOnline(!showOnline)}>
          <h3>🟢 Online</h3>
          {showOnline ? <FaChevronUp /> : <FaChevronDown />}
        </div>
        {showOnline && (
          <>
            {onlineFriends.length === 0 && <p>No friends online</p>}
            <ul>
            {onlineFriends.map(friend => (
            <Friend key={friend.id} friend={friend} />
         ))}
      </ul>
          </>
        )}
      </div>

      <div className="friends-section">
        <div className="friends-header" onClick={() => setShowOffline(!showOffline)}>
          <h3>⚫ Offline</h3>
          {showOffline ? <FaChevronUp /> : <FaChevronDown />}
        </div>
        {showOffline && (
          <>
            {offlineFriends.length === 0 && <p>No friends offline</p>}
            <ul>
              {offlineFriends.map(friend => (
                <li key={friend.id}>{friend.username}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
