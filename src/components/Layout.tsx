import { Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Header from './Header';

const Main = styled.main`
  min-height: calc(100vh - 60px);
  padding: 2rem 2rem 4rem;
  background: #f7f9fb;
`;

const GradientAccent = styled.div<{ $isHome: boolean }>`
  background: linear-gradient(
    135deg,
    rgba(100, 108, 255, 0.1),
    rgba(100, 108, 255, ${({ $isHome }) => ($isHome ? '0.35' : '0.2')})
  );
  min-height: 100vh;
`;

const Layout = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <GradientAccent $isHome={isHome}>
      <Header />
      <Main>
        <Outlet />
      </Main>
    </GradientAccent>
  );
};

export default Layout;
