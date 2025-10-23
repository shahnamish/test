import { NavLink } from 'react-router-dom'
import styled, { css } from 'styled-components'

type NavProps = {
  orientation?: 'horizontal' | 'vertical'
  onNavigate?: () => void
}

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/projects', label: 'Projects' },
  { path: '/portfolio-dashboard', label: 'Portfolio' },
  { path: '/bet-scanner', label: 'Bet Scanner' },
  { path: '/blog', label: 'Blog' },
  { path: '/resume', label: 'Resume' },
  { path: '/contact', label: 'Contact' },
]

const NavList = styled.ul<{ $orientation: 'horizontal' | 'vertical' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};

  ${({ $orientation, theme }) =>
    $orientation === 'vertical'
      ? css`
          flex-direction: column;
          align-items: flex-start;
          gap: ${theme.spacing.md};
        `
      : css`
          flex-direction: row;
        `}
`

const StyledNavLink = styled(NavLink)`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textLight};
  transition: color ${({ theme }) => theme.transitions.base};

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -4px;
    width: 100%;
    height: 2px;
    background: ${({ theme }) => theme.colors.primary};
    transform: scaleX(0);
    transform-origin: left;
    transition: transform ${({ theme }) => theme.transitions.base};
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  &.active {
    color: ${({ theme }) => theme.colors.primary};

    &::after {
      transform: scaleX(1);
    }
  }
`

const Nav = ({ orientation = 'horizontal', onNavigate }: NavProps) => (
  <NavList $orientation={orientation}>
    {navLinks.map(({ path, label }) => (
      <li key={path}>
        <StyledNavLink to={path} end={path === '/'} onClick={onNavigate}>
          {label}
        </StyledNavLink>
      </li>
    ))}
  </NavList>
)

export default Nav
