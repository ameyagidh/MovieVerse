import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/browse?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <nav className="navbar">
      <span className="brand">movieverse</span>
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
          Home
        </NavLink>
        <NavLink to="/browse" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Browse
        </NavLink>
        <NavLink to="/watchlist" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          My List
        </NavLink>
      </div>
      <form onSubmit={handleSearch}>
        <input
          className="nav-search"
          placeholder="Search titles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search movies"
        />
      </form>
      <div className="nav-user">
        <span>{user?.name}</span>
        <button className="btn-secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </nav>
  );
}
