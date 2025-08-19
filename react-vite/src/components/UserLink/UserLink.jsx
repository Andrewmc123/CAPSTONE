import { NavLink } from 'react-router-dom';

const UserLink = ({ user, children }) => {
  return (
    <NavLink to={`/users/${user.id}`} className="user-link">
      {children || user.username}
    </NavLink>
  );
};

export default UserLink;