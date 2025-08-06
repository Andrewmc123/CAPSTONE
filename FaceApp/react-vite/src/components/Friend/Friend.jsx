import React from 'react';
import './Friend.css';

export default function Friend({ friend }) {
  if (!friend) return null;

  return (
    <div className="friend-item">
      <img
        src={friend.profile_img || '/default-profile.png'}
        alt={`${friend.username}'s profile`}
        className="friend-avatar"
      />
      <div className="friend-info">
        <span className="friend-username">{friend.username}</span>
        {friend.isOnline !== undefined && (
          <span className={`friend-status ${friend.isOnline ? 'online' : 'offline'}`}>
            {friend.isOnline ? 'Online' : 'Offline'}
          </span>
        )}
      </div>
    </div>
  );
}
