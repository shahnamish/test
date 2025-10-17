import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import BurgerMenu from './BurgerMenu'
import Nav from './Nav'

const HeaderContainer = styled.header`
  background-color: ${({ theme }) => theme.colors.white};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndices.sticky};
`

const HeaderContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Logo = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
  transition: color ${({ theme }) => theme.transitions.base};

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const DesktopNav = styled.nav`
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`

const BurgerMenuWrapper = styled.div`
  display: block;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">Portfolio</Logo>
        <DesktopNav>
          <Nav />
        </DesktopNav>
        <BurgerMenuWrapper>
          <BurgerMenu isOpen={isMenuOpen} onToggle={toggleMenu} onClose={closeMenu} />
        </BurgerMenuWrapper>
      </HeaderContent>
    </HeaderContainer>
  )
}

export default Header
