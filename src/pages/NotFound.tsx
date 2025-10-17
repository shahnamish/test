import styled from 'styled-components';
import { Link } from 'react-router-dom';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;
`;

const NotFound = () => (
  <Wrapper>
    <h2>Page Not Found</h2>
    <p>The page you were looking for does not exist.</p>
    <Link to="/">Head back to the home page</Link>
  </Wrapper>
);

export default NotFound;
