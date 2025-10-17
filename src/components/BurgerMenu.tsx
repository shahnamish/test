import { useEffect } from 'react'
import styled from 'styled-components'
import Nav from './Nav'

type BurgerMenuProps = {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

const BurgerButton = styled.button`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: ${({ theme }) => theme.zIndices.fixed + 1};

  &:focus {
    outline: none;
  }
`

const BurgerLine = styled.div<{ $isOpen: boolean; $index: number }>`
  width: 2rem;
  height: 0.25rem;
  background: ${({ theme, $isOpen }) => ($isOpen ? theme.colors.white : theme.colors.text)};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all ${({ theme }) => theme.transitions.base};
  position: relative;
  transform-origin: center;

  ${({ $isOpen, $index }) => {
    if ($isOpen) {
      if ($index === 0) return 'transform: rotate(45deg) translateY(0.5rem);'
      if ($index === 1) return 'opacity: 0;'
      if ($index === 2) return 'transform: rotate(-45deg) translateY(-0.5rem);'
    }
    return ''
  }}
`

const MenuOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  transition: opacity ${({ theme }) => theme.transitions.base},
    visibility ${({ theme }) => theme.transitions.base};
  z-index: ${({ theme }) => theme.zIndices.fixed};
`

const MenuPanel = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 80%;
  max-width: 300px;
  height: 100vh;
  background: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing.xl};
  transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '100%')});
  transition: transform ${({ theme }) => theme.transitions.base};
  z-index: ${({ theme }) => theme.zIndices.fixed};
  overflow-y: auto;
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};

  nav ul {
    margin-top: ${({ theme }) => theme.spacing['2xl']};
  }

  nav a {
    color: ${({ theme }) => theme.colors.white};
    font-size: ${({ theme }) => theme.fontSizes.lg};

    &::after {
      background: ${({ theme }) => theme.colors.white};
    }

    &.active {
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`

const BurgerMenu = ({ isOpen, onToggle, onClose }: BurgerMenuProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      <BurgerButton onClick={onToggle} aria-label="Toggle menu">
        <BurgerLine $isOpen={isOpen} $index={0} />
        <BurgerLine $isOpen={isOpen} $index={1} />
        <BurgerLine $isOpen={isOpen} $index={2} />
      </BurgerButton>
      <MenuOverlay $isOpen={isOpen} onClick={onClose} />
      <MenuPanel $isOpen={isOpen}>
        <Nav orientation="vertical" onNavigate={onClose} />
      </MenuPanel>
    </>
  )
}

export default BurgerMenu
