import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { thunkAuthenticate, thunkDeleteAccount } from "../../redux/session";
import { useModal } from "../../context/Modal";

export default function EditProfileModal({ profile, onSaved }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { closeModal } = useModal();
  const [bio, setBio] = useState(profile.bio || "");
  const [username, setUsername] = useState(profile.username || "");
  const [img, setImg] = useState(profile.profile_img || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await dispatch(thunkDeleteAccount());
    setDeleting(false);
    if (!res) {
      closeModal();
      navigate("/");
    } else {
      setError(res.server || "Could not delete account");
    }
  };

  const uploadAvatar = async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: form, credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setImg(data.url);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ bio, username, profile_img: img }),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      onSaved(updated);
      dispatch(thunkAuthenticate());
      closeModal();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.errors?.username || "Could not save profile");
    }
  };

  return (
    <form className="edit-profile-modal" onSubmit={save}>
      <h2>Edit profile</h2>

      <div className="edit-avatar-row">
        <img className="avatar" width={72} height={72} src={img || `https://i.pravatar.cc/100?u=${profile.id}`} alt="" />
        <label className="btn btn-ghost edit-avatar-btn">
          Change photo
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files[0] && uploadAvatar(e.target.files[0])}
          />
        </label>
      </div>

      <label className="edit-label">Username</label>
      <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={40} />

      <label className="edit-label">Bio</label>
      <textarea
        className="input"
        rows={3}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={255}
        placeholder="Tell the night owls about yourself…"
      />
      <span className="edit-count">{bio.length}/255</span>

      {error && <p className="edit-error">{error}</p>}

      <div className="edit-actions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Privacy — intentionally subtle: discoverable, not loud */}
      <div className="edit-privacy">
        <span className="edit-privacy-label">Privacy</span>
        {!confirmDel ? (
          <button type="button" className="edit-delete-link" onClick={() => setConfirmDel(true)}>
            Delete account
          </button>
        ) : (
          <div className="edit-delete-confirm">
            <p>This permanently deletes your account, videos and data. It can&apos;t be undone.</p>
            <div className="edit-delete-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmDel(false)}>
                Keep my account
              </button>
              <button type="button" className="edit-delete-go" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
