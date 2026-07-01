import { useState } from 'react';

function formatMemberSince(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function AccountPanel({ user, onLogout, onEditProfile }) {
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onLogout?.();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    alert('To delete your account, contact support.');
  };

  return (
    <section className="settings-section">
      <div className="settings-section-title">Account</div>

      <div className="settings-row settings-link" role="button" tabIndex={0} onClick={onEditProfile}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEditProfile?.(); } }}>
        <div className="settings-row-main">
          <div className="settings-row-label">Edit profile</div>
          <div className="settings-row-sub">Photo, username &amp; bio</div>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <div className="settings-row-label">Email</div>
          <div className="settings-row-sub">{user.email || '—'}</div>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <div className="settings-row-label">Username</div>
          <div className="settings-row-sub">@{user.username}</div>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <div className="settings-row-label">Member since</div>
          <div className="settings-row-sub">{formatMemberSince(user.created_at)}</div>
        </div>
      </div>

      <div className="settings-row settings-link" role="button" tabIndex={0} onClick={handleDelete}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDelete(); } }}>
        <div className="settings-row-main">
          <div className="settings-row-label">Delete account</div>
          <div className="settings-row-sub">Permanently remove your account</div>
        </div>
      </div>

      <div className="settings-row-control">
        <button type="button" className="settings-btn danger" onClick={handleLogout} disabled={busy}>
          {busy ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </section>
  );
}
