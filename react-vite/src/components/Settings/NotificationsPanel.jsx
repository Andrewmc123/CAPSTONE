const NOTIF_OPTIONS = [
  { key: 'likes', label: 'New auras (likes)', sub: 'When someone gives your post an aura' },
  { key: 'comments', label: 'Comments', sub: 'When someone comments on your post' },
  { key: 'follows', label: 'New followers', sub: 'When someone starts following you' },
  { key: 'live', label: 'Live from creators', sub: 'When creators you follow go live' },
  { key: 'mentions', label: 'Mentions', sub: 'When someone mentions you' },
];

export default function NotificationsPanel({ notifPrefs, onChange }) {
  // Guard: when prefs are missing, treat every notification as enabled.
  const prefs = notifPrefs || {};

  const isOn = (key) => prefs[key] !== false;

  const toggle = (key) => {
    onChange?.({ [key]: !isOn(key) });
  };

  return (
    <section className="settings-section">
      <div className="settings-section-title">Notifications</div>

      {NOTIF_OPTIONS.map(({ key, label, sub }) => {
        const on = isOn(key);
        return (
          <div className="settings-row" key={key}>
            <div className="settings-row-main">
              <div className="settings-row-label">{label}</div>
              <div className="settings-row-sub">{sub}</div>
            </div>
            <div className="settings-row-control">
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={label}
                className={`settings-toggle${on ? ' on' : ''}`}
                onClick={() => toggle(key)}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}
