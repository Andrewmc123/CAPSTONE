import './BottomPanel.css';
import { NavLink } from 'react-router-dom';

const BottomPanel = () => {
  return (
    <div className="bottom-panel-container">
      <div className="bottom-panel">
        <NavLink 
          to='/home' 
          className='panel-link'
          activeClassName='active'
        >
          Home
        </NavLink>
        <NavLink 
          to='/camera' 
          className='panel-link'
          activeClassName='active'
        >
          Camera
        </NavLink>
        <NavLink 
          to='/notifications' 
          className='panel-link'
          activeClassName='active'
        >
          Notifications
        </NavLink>
        <NavLink 
          to='/profile' 
          className='panel-link'
          activeClassName='active'
        >
          Profile
        </NavLink>
      </div>
    </div>
  );
};

export default BottomPanel;