import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  thunkFetchSettings,
  thunkUpdateSettings,
  thunkUpdateProfile,
} from '../../redux/settings';
import { thunkLogout, thunkAuthenticate } from '../../redux/session';
import { useModal } from '../../context/Modal';
import EditProfileModal from '../UserProfilePage/EditProfileModal';
import AccountPanel from './AccountPanel';
import GeneralPanel from './GeneralPanel';
import PrivacyPanel from './PrivacyPanel';
import NotificationsPanel from './NotificationsPanel';
import AppearancePanel from './AppearancePanel';
import './SettingsPage.css';

function SettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.session.user);
  const { setModalContent } = useModal();

  const [settings, setSettings] = useState(null);

  useEffect(() => {
    dispatch(thunkFetchSettings()).then((d) => {
      if (d) setSettings(d);
    });
  }, [dispatch]);

  if (!user) return <Navigate to="/" replace />;

  // Optimistically merge a partial settings patch into local state, then persist.
  const patchSettings = (partial) => {
    setSettings((prev) => ({ ...(prev || {}), ...partial }));
    dispatch(thunkUpdateSettings(partial));
  };

  // Merge notification-pref keys, keeping the rest of settings intact.
  const patchNotif = (partial) => {
    setSettings((prev) => ({
      ...(prev || {}),
      notif_prefs: { ...((prev && prev.notif_prefs) || {}), ...partial },
    }));
    dispatch(thunkUpdateSettings({ notif_prefs: partial }));
  };

  const handleLogout = async () => {
    await dispatch(thunkLogout());
    navigate('/');
  };

  const handleEditProfile = () =>
    setModalContent(<EditProfileModal profile={user} onSaved={() => dispatch(thunkAuthenticate())} />);

  return (
    <div className="settings-page">
      <div className="settings-head">
        <button
          type="button"
          className="settings-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          &#8592;
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      <AccountPanel user={user} onLogout={handleLogout} onEditProfile={handleEditProfile} />
      <GeneralPanel
        user={user}
        onSaveProfile={(patch) => dispatch(thunkUpdateProfile(patch))}
      />
      <PrivacyPanel settings={settings} onChange={patchSettings} />
      <NotificationsPanel notifPrefs={settings?.notif_prefs} onChange={patchNotif} />
      <AppearancePanel />
    </div>
  );
}

export default SettingsPage;
