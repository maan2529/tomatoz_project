import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const toggleMenu = () => setIsOpen(!isOpen)

  const styles = {
    nav: {
      backgroundColor: scrolled ? '#000000' : 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(10px)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      transition: 'all 0.3s ease',
      borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.05)'
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 2rem'
    },
    flexContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: scrolled ? '4rem' : '5rem',
      transition: 'height 0.3s ease'
    },
    logo: {
      fontSize: '1.75rem',
      fontWeight: '800',
      color: '#ffffff',
      textDecoration: 'none',
      letterSpacing: '-0.02em',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      zIndex: 1001
    },
    logoAccent: {
      width: '8px',
      height: '8px',
      backgroundColor: '#ffffff',
      borderRadius: '50%',
      animation: 'pulse 2s ease-in-out infinite'
    },
    hamburgerButton: {
      background: 'none',
      border: 'none',
      color: '#ffffff',
      cursor: 'pointer',
      padding: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      zIndex: 1001,
      borderRadius: '50%'
    },
    fullscreenMenu: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100vh',
      backgroundColor: '#000000',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      transition: 'all 0.5s cubic-bezier(0.77, 0, 0.175, 1)',
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? 'auto' : 'none',
      transform: isOpen ? 'scale(1)' : 'scale(1.1)'
    },
    menuLink: {
      color: '#ffffff',
      textDecoration: 'none',
      fontSize: '2.5rem',
      fontWeight: '700',
      margin: '1rem 0',
      transition: 'all 0.4s ease',
      opacity: 0,
      transform: 'translateY(30px)',
      letterSpacing: '-0.02em',
      position: 'relative',
      overflow: 'hidden'
    },
    menuLinkActive: {
      opacity: 1,
      transform: 'translateY(0)'
    },
    menuFooter: {
      position: 'absolute',
      bottom: '3rem',
      display: 'flex',
      gap: '2rem',
      opacity: 0,
      transition: 'all 0.4s ease',
      transitionDelay: '0.4s'
    },
    menuFooterActive: {
      opacity: 1
    },
    footerLink: {
      color: 'rgba(255, 255, 255, 0.6)',
      textDecoration: 'none',
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      letterSpacing: '0.05em'
    }
  }

  const menuItems = [
    { name: 'Home', href: '#home', delay: '0.1s' },
    { name: 'Services', href: '#services', delay: '0.15s' },
    { name: 'About', href: '#about', delay: '0.2s' },
    { name: 'Portfolio', href: '#portfolio', delay: '0.25s' },
    { name: 'Contact', href: '#contact', delay: '0.3s' }
  ]

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        .menu-link-hover::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0%;
          height: 3px;
          background-color: #ffffff;
          transition: width 0.4s ease;
        }
        .menu-link-hover:hover::before {
          width: 100%;
        }
        .menu-link-hover:hover {
          transform: translateX(20px);
        }
      `}</style>

      <nav style={styles.nav}>
        <div style={styles.container}>
          <div style={styles.flexContainer}>
            {/* Logo */}
            <a href="#" style={styles.logo}>
              <div style={styles.logoAccent}></div>
              Tomatoze
            </a>

            {/* Hamburger Button */}
            <button
              onClick={toggleMenu}
              style={styles.hamburgerButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.transform = 'rotate(90deg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.transform = 'rotate(0deg)'
              }}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Fullscreen Menu */}
      <div style={styles.fullscreenMenu}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {menuItems.map((item, index) => (
            <a
              key={item.name}
              href={item.href}
              className="menu-link-hover"
              style={{
                ...styles.menuLink,
                ...(isOpen && styles.menuLinkActive),
                transitionDelay: isOpen ? item.delay : '0s'
              }}
              onClick={() => setIsOpen(false)}
              onMouseEnter={(e) => {
                e.target.style.color = '#cccccc'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#ffffff'
              }}
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Menu Footer */}
        <div style={{
          ...styles.menuFooter,
          ...(isOpen && styles.menuFooterActive)
        }}>
          <a
            href="#instagram"
            style={styles.footerLink}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
          >
            INSTAGRAM
          </a>
          <a
            href="#twitter"
            style={styles.footerLink}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
          >
            TWITTER
          </a>
          <a
            href="#linkedin"
            style={styles.footerLink}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
          >
            LINKEDIN
          </a>
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div style={{ height: scrolled ? '4rem' : '5rem' }}></div>
    </>
  )
}

export default Navbar