import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/purchases', label: 'Purchases', icon: '🧾', end: false },
  { to: '/library', label: 'Library', icon: '📚', end: false },
  { to: '/subscriptions', label: 'Subs', icon: '🔁', end: false },
  { to: '/settings', label: 'Settings', icon: '⚙️', end: false },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            'nav-item' + (isActive ? ' active' : '')
          }
        >
          <span className="nav-icon" aria-hidden>
            {item.icon}
          </span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
