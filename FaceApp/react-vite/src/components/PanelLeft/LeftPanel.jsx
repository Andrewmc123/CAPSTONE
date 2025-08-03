import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
//import { fetchFriends } from '../../redux/friends';
import './LeftPanel.css'
import { NavLink } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { fetchFriends } from '../../redux/friends';

const LeftPanel = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const friendsObj = useSelector(state => state.friends?.friends || {});
  
  // Memoize and sort
  const friends = useMemo(() => Object.values(friendsObj).sort((a, b) => {
    const nameA = a.friend.firstname.toLowerCase();
    const nameB = b.friend.firstname.toLowerCase();
    return nameA.localeCompare(nameB);
  }), [friendsObj]);

  useEffect(() => {
    dispatch(fetchFriends());
    // dispatch(fetchPendingFriends());
  }, [dispatch]);

  const isFriendsPage = location.pathname === "/friends" || location.pathname === "/friends/pending";

  return (
    <>
      <div className="left-panel-contianer">
        <div className="left-panel">
          <NavLink to='/dashboard' className='panel-link'>Dashboard</NavLink>
          <NavLink to='/expenses' className='panel-link'>All Expenses</NavLink>
          <NavLink to='/payments' className='panel-link'>Payment History</NavLink>
          <NavLink to='/friends' className='panel-link'>Friends</NavLink> {/*  temp, for my sanitiy */}
        </div>

        <div className="left-panel-friends">
          {/* display short friends list here when not in Friends page */}
          
          {isFriendsPage ? ('') : (
          <div className="mini-friends-list">
            
            {friends.length === 0 ? (
              <p className="friend-item">No friends yet.</p>
            ) : (
              <ul>
                <div className="friends-group-name" title='Group Feature Coming Soon!'>
                  <center>
                    <button className="friend-group-button" onClick={() => alert('Group Feature Coming Soon!')}>
                      the squad
                    </button>
                  </center>
                </div>
                {friends.slice(0,3).map(friend => (
                  <li key={friend.id} className="mini-friend-item">

                    <div className="friend-content">
                      <div className="mini-friend-info">
                        <div className="mini-friend-img">
                          <img src={friend.friend.profile_img} alt="" />
                        </div>
                        <NavLink to={`/users/${friend.friend.id}`} >
                          <span className="mini-friend-name">{friend.friend.firstname} {friend.friend.lastname}</span>
                        </NavLink>
                      </div>
                        
                    </div>

                  </li>
                ))}
                <div className="view-all-friends-link">
                  <NavLink to="/friends">
                    + View All Friends
                  </NavLink>
                </div>
                
              </ul>
            )}
          </div>
          )}
        </div>
      </div>


    </>
  )
}

export default LeftPanel