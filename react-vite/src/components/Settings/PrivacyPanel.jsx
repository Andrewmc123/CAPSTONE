function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`settings-toggle${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
    />
  );
}

export default function PrivacyPanel({ settings, onChange }) {
  // Settings not loaded yet — render a lightweight skeleton.
  if (!settings) {
    return (
      <section className="settings-section">
        <div className="settings-section-title">Privacy</div>
        <div className="settings-row">
          <div className="settings-row-main">
            <div className="settings-row-sub">Loading…</div>
          </div>
        </div>
      </section>
    );
  }

  const isPrivate = !!settings.is_private;
  const allowComments = settings.allow_comments || 'everyone';
  const allowMessages = settings.allow_messages || 'everyone';
  const showActivity = settings.show_activity !== false;

  return (
    <section className="settings-section">
      <div className="settings-section-title">Privacy</div>

      <div className="settings-row">
        <div className="settings-row-main">
          <div className="settings-row-label">Private account</div>
          <div className="settings-row-sub">
            Only approved followers can see your auras.
          </div>
        </div>
        <div className="settings-row-control">
          <Toggle
            checked={isPrivate}
            label="Private account"
            onChange={(v) => onChange({ is_private: v })}
          />
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <label className="settings-row-label" htmlFor="privacy-comments">
            Who can comment
          </label>
        </div>
        <div className="settings-row-control">
          <select
            id="privacy-comments"
            className="settings-select"
            value={allowComments}
            onChange={(e) => onChange({ allow_comments: e.target.value })}
          >
            <option value="everyone">Everyone</option>
            <option value="followers">Followers</option>
            <option value="off">Off</option>
          </select>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <label className="settings-row-label" htmlFor="privacy-messages">
            Who can message you
          </label>
        </div>
        <div className="settings-row-control">
          <select
            id="privacy-messages"
            className="settings-select"
            value={allowMessages}
            onChange={(e) => onChange({ allow_messages: e.target.value })}
          >
            <option value="everyone">Everyone</option>
            <option value="followers">Followers</option>
            <option value="off">Off</option>
          </select>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <div className="settings-row-label">Show my activity</div>
          <div className="settings-row-sub">
            Let others see when you visit their profile.
          </div>
        </div>
        <div className="settings-row-control">
          <Toggle
            checked={showActivity}
            label="Show my activity"
            onChange={(v) => onChange({ show_activity: v })}
          />
        </div>
      </div>
    </section>
  );
}
