
import { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'About', id: 'about' },
    { name: 'Skills', id: 'skills' },
    { name: 'Projects', id: 'projects' },
    { name: 'Experience', id: 'experience' },
    { name: 'Achievements', id: 'achievements' },
    { name: 'Contact', id: 'contact' },
  ];

  const handleNavigation = (id) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      console.error(`Section with ID "${id}" was not found.`);
    }

    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <button
        className="logo"
        onClick={() => handleNavigation('home')}
      >
        PARTH<span>.</span>
      </button>

      <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => handleNavigation(link.id)}
          >
            {link.name}
          </button>
        ))}
      </div>

      <button
        className="nav-contact"
        onClick={() => handleNavigation('contact')}
      >
        Let's Connect <ArrowUpRight size={16} />
      </button>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
      >
        {menuOpen ? <X /> : <Menu />}
      </button>
    </nav>
  );
}

export default Navbar;
