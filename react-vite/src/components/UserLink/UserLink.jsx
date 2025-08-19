import { Link } from 'react-router-dom';

export default function UserLink({ user, children }) {
  if (!user) return <span>{children}</span>;
  
  return (
    <Link 
      to={`/users/${user.id}`}
      className="user-link"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
}