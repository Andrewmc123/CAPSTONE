import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { 
  fetchFriends,
  fetchPendingFriends,
  sendFriendRequest,
  removeFriend
} from '../../redux/friends';
import OpenModalButton from '../OpenModalButton/OpenModalButton';
import FriendsAddRemoveModal from '../FriendsAddRemoveModal/FriendsAddRemoveModal';
import './Friends.css';

const Friends = () => {
  const dispatch = useDispatch();
  const [inviteSentFriend, setInviteSentFriend] = useState(null);
  const [friendRemoved, setFriendRemoved] = useState(null);

  const friendsObj = useSelector(state => state.friends?.allFriends || {});
  const pendingFriends = useSelector(state => state.friends?.pending || {});

  const friends = useMemo(() => {
    return Object.values(friendsObj).sort((a, b) => {
      const nameA = a.firstname.toLowerCase();
      const nameB = b.firstname.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [friendsObj]);

  useEffect(() => {
    dispatch(fetchFriends());
    dispatch(fetchPendingFriends()); // Now using fetchPendingFriends
  }, [dispatch]);

  const handleInviteSent = async (friend) => {
    const result = await dispatch(sendFriendRequest(friend.id)); // Now using sendFriendRequest
    if (result === true) {
      setInviteSentFriend(friend);
      setTimeout(() => setInviteSentFriend(null), 3000);
    }
  };

  const handleRemoveFriend = async (friend) => {
    const result = await dispatch(removeFriend(friend.id)); // Now using removeFriend
    if (result === true) {
      setFriendRemoved(friend);
      setTimeout(() => setFriendRemoved(null), 3000);
    }
  };

  return (
    <div className="friends-container">
      <div className="friends-content">
        <div className="friends-top-section">
          <div><h1>Friends</h1></div>
          <div className="spacer"></div>

          {inviteSentFriend && (
            <div className="pending-friends-confirmation-dropdown fixed-toast">
              <center><p><b>Friend request sent to {inviteSentFriend.firstname}!</b></p></center>
            </div>
          )}

          {friendRemoved && (
            <div className="pending-friends-confirmation-dropdown fixed-toast">
              <center><p style={{ color: '#F24822' }}>
                <b>{friendRemoved.firstname} is no longer your friend. How sad!</b>
              </p></center>
            </div>
          )}

          <div className="friends-buttons">
            <OpenModalButton
              buttonText="Add a Friend"
              className="add-friend-button"
              modalComponent={<FriendsAddRemoveModal onInviteSent={handleInviteSent} />}
            />
            <NavLink to="/friends/pending">
              <button className="pending-friend-request-button">
                Pending Requests ({Object.keys(pendingFriends).length})
              </button>
            </NavLink>
          </div>
        </div>

        <div className="all-friends-list-container">
          <center>
            <div className="all-friends-list">
              {friends.length === 0 ? (
                <p className="friend-item">No friends yet.</p>
              ) : (
                <ul>
                  {friends.map(friend => (
                    <li key={friend.id} className="friend-item">
                      <div className="friend-content">
                        <div className="friend-info">
                          <div className="main-friend-img">
                            <img src={friend.profile_img} alt="" />
                          </div>
                          <NavLink to={`/users/${friend.id}`}>
                            <b>{friend.firstname} {friend.lastname} (@{friend.username})</b>
                          </NavLink>
                        </div>
                        <div className="friend-actions">
                          <OpenModalButton
                            buttonText="Remove"
                            className="friend-remove-button"
                            modalComponent={
                              <FriendsAddRemoveModal
                                actionType="remove"
                                friend={friend}
                                onFriendRemove={handleRemoveFriend}
                              />
                            }
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </center>
        </div>
      </div>
    </div>
  );
};

export default Friends;