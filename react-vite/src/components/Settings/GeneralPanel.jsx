import { useState } from 'react';

export default function GeneralPanel({ user, onSaveProfile }) {
  const [firstname, setFirstname] = useState(user?.firstname || '');
  const [lastname, setLastname] = useState(user?.lastname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [birthdate, setBirthdate] = useState(user?.birthdate || '');
  const [address, setAddress] = useState(user?.address || '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    setSaved(false);
    try {
      const result = await onSaveProfile?.({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        bio: bio.trim(),
        city: city.trim(),
        birthdate,
        address: address.trim(),
      });
      if (result) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="settings-section">
      <div className="settings-section-title">General information</div>

      <div className="settings-row">
        <div className="settings-row-main">
          <label className="settings-row-label" htmlFor="general-firstname">First name</label>
          <input
            id="general-firstname"
            className="settings-input"
            type="text"
            value={firstname}
            maxLength={40}
            placeholder="First name"
            onChange={(e) => setFirstname(e.target.value)}
          />
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <label className="settings-row-label" htmlFor="general-lastname">Last name</label>
          <input
            id="general-lastname"
            className="settings-input"
            type="text"
            value={lastname}
            maxLength={40}
            placeholder="Last name"
            onChange={(e) => setLastname(e.target.value)}
          />
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <label className="settings-row-label" htmlFor="general-bio">Bio</label>
          <textarea
            id="general-bio"
            className="settings-input"
            value={bio}
            maxLength={160}
            rows={3}
            placeholder="Tell people about yourself"
            onChange={(e) => setBio(e.target.value)}
          />
          <div className="settings-row-sub">{bio.length}/160</div>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <label className="settings-row-label" htmlFor="general-city">City</label>
          <input
            id="general-city"
            className="settings-input"
            type="text"
            value={city}
            maxLength={80}
            placeholder="City"
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <label className="settings-row-label" htmlFor="general-birthdate">Birthday</label>
          <input
            id="general-birthdate"
            className="settings-input"
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
          <div className="settings-row-sub">Aura will wish you a happy birthday 🎉</div>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <label className="settings-row-label" htmlFor="general-address">Address</label>
          <input
            id="general-address"
            className="settings-input"
            type="text"
            value={address}
            maxLength={200}
            placeholder="Street, city, country"
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </div>

      <div className="settings-row-control">
        <button type="button" className="settings-btn" onClick={handleSave} disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="settings-row-sub">Saved</span>}
      </div>
    </section>
  );
}
