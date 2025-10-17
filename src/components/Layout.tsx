import { ReactNode } from 'react'
import styled from 'styled-components'
import Header from './Header'
import Footer from './Footer'

type LayoutProps = {
  children: ReactNode
}

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`

const MainContent = styled.main`
  flex: 1;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing.xl};
  }
`

const Layout = ({ children }: LayoutProps) => (
  <LayoutContainer>
    <Header />
    <MainContent>{children}</MainContent>
    <Footer />
  </LayoutContainer>
)

export default Layout
