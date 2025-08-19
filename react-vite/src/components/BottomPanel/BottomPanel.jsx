import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import './BottomPanel.css';

const BottomPanel = () => {
  const sessionUser = useSelector(state => state.session.user);
  
  return (
    <div className="bottom-panel-container">
      <div className="bottom-panel">
        <NavLink 
          to='/dashboard' 
          className={({ isActive }) => isActive ? "panel-link active" : "panel-link"}
        >
          <i className="icon-home">⌂</i>
          <span>Home</span>
        </NavLink>
        <NavLink 
          to='/camera' 
          className={({ isActive }) => isActive ? "panel-link active" : "panel-link"}
        >
          <i className="icon-camera">📷</i>
          <span>Camera</span>
        </NavLink>
        <NavLink 
          to='/Vault' 
          className={({ isActive }) => isActive ? "panel-link active" : "panel-link"}
        >
          <i className="icon-vault">🔒</i>
          <span>Vault</span>
        </NavLink>
        <NavLink 
          to='/notifications' 
          className={({ isActive }) => isActive ? "panel-link active" : "panel-link"}
        >
          <i className="icon-bell">🔔</i>
          <span>Notifications</span>
        </NavLink>
        <NavLink 
          to={`/users/${sessionUser?.id}`} 
          className={({ isActive }) => isActive ? "panel-link active" : "panel-link"}
        >
          <i className="icon-user">👤</i>
          <span>Profile</span>
        </NavLink>
      </div>
    </div>
  );
};

export default BottomPanel;