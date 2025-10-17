import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { navigationLinks } from '../data/navigation';

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.05);
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;

  a {
    text-decoration: none;
    color: inherit;
    font-weight: 500;
    transition: color 0.2s;

    &:hover {
      color: #646cff;
    }
  }
`;

const Logo = styled.div`
  font-weight: bold;
  font-size: 1.2rem;
`;

const Header = () => {
  return (
    <Nav>
      <Logo>My Portfolio</Logo>
      <NavLinks>
        {navigationLinks.map(link => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
      </NavLinks>
    </Nav>
  );
};

export default Header;
