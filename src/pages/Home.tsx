import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  min-height: 70vh;
  text-align: center;
`;

const Title = styled.h1`
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  max-width: 600px;
  font-size: 1.1rem;
  color: #475569;
`;

const CallToAction = styled(Link)`
  background: #646cff;
  color: #fff;
  padding: 0.85rem 1.75rem;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s ease;

  &:hover {
    background: #4f56d1;
  }
`;

const Home = () => {
  return (
    <Container>
      <Title>Welcome to My Portfolio</Title>
      <Subtitle>
        This React + TypeScript + Vite starter gives you a modern foundation for
        showcasing your work, telling your story, and sharing what makes you
        unique.
      </Subtitle>
      <CallToAction to="/projects">View Projects</CallToAction>
    </Container>
  );
};

export default Home;
