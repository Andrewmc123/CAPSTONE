import { useState } from "react";
import { useModal } from "../../context/Modal";
// import { fetchFriends } from "../../redux/friends";
import { useDispatch } from "react-redux";
import './FriendsAddRemoveModal.css';
import { sendFriendRequest, removeFriend } from "../../redux/friends";

function FriendsAddRemoveModal({ actionType = "add", friend = null, onInviteSent, onFriendRemove }) {
  const { closeModal } = useModal();

  const [username, setUsername] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrors({});
    setSearchResult(null);
    setLoading(true);

    const res = await fetch(`/api/users/search?username=${username}`);
    const data = await res.json();

    setLoading(false);

    if (res.ok) {
      setSearchResult(data.user);
    } else {
      setErrors({ search: data.message || "User not found" });
    }
  };

  const handleSendRequest = async () => {
    const result = await dispatch(sendFriendRequest(searchResult.id));
    if (result === true) {
      if (onInviteSent) onInviteSent(searchResult);
      closeModal();
    } else {
      setErrors({ request: result });
    }
  };

  const handleRemoveFriend = async () => {
    const result = await dispatch(removeFriend(friend.id));
    if (result === true) {
      if (onFriendRemove) onFriendRemove(friend);
      closeModal();
    } else {
      setErrors({ request: result });
    }
  };

  return (
    <div className="modal-container" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {actionType === "add" && (
          <>
            <h1 className="modal-title">Add a Friend</h1>
            <form onSubmit={handleSearch} className="friend-search-form">
              <label>
                Search by username:
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter a username"
                />
                <button type="submit" className="friend-add-search-button">
                  {loading ? "Searching..." : "Search"}
                </button>
              </label>
            </form>
            {errors.search && <p className="error-message">{errors.search}</p>}
            {searchResult && (
              <div className="search-result">
                <center>
                  <p className="search-result-username">
                    <strong>{searchResult.firstname} {searchResult.lastname} (@{searchResult.username})</strong>
                  </p>
                </center>
                <center>
                  <button onClick={handleSendRequest} className="friend-send-request-button">
                    Send Friend Request
                  </button>
                </center>
                {errors.request && <p className="error-message">{errors.request}</p>}
              </div>
            )}
          </>
        )}

        {actionType === "remove" && friend && (
          <>
            <h1 className="modal-title">Remove Friend</h1>
            <p className="modal-description">
              Are you sure you want to remove <b>{friend.firstname} {friend.lastname}</b> from your friends list?
            </p>
            <div className="friend-remove-confirm-buttons">
              {/* <center> */}
                <button onClick={handleRemoveFriend} className="confirm-friend-remove-button">Yes, Remove</button>
                {/* <div></div> */}
                <button onClick={closeModal} className="cancel-friend-remove-button">Cancel</button>
              {/* </center> */}
            </div>
            {errors.request && <p className="error-message">{errors.request}</p>}
          </>
        )}
      </div>
    </div>
  );
}


export default FriendsAddRemoveModal;