import ThemeToggle from "../common/ThemeToggle";

// Appearance settings. Wraps the app's existing light/dark switch in the
// shared settings-row layout (classes defined in SettingsPage.css).
export default function AppearancePanel() {
  return (
    <section className="settings-section">
      <h2 className="settings-section-title">Appearance</h2>
      <div className="settings-row">
        <div className="settings-row-main">
          <span className="settings-row-label">Theme</span>
          <span className="settings-row-sub">Switch between light and dark</span>
        </div>
        <div className="settings-row-control">
          <ThemeToggle variant="row" />
        </div>
      </div>
    </section>
  );
}
