import styled from 'styled-components';
import { projects } from '../data/portfolio';

const Grid = styled.div`
  display: grid;
  gap: 1.5rem;
  margin-top: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Card = styled.article`
  padding: 1.5rem;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 0.75rem;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  li {
    background: rgba(100, 108, 255, 0.09);
    color: #393e90;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.85rem;
  }
`;

const Projects = () => (
  <section>
    <h2>Featured Projects</h2>
    <Grid>
      {projects.map(project => (
        <Card key={project.id}>
          <Title>{project.title}</Title>
          <p>{project.description}</p>
          <List>
            {project.technologies.map(tech => (
              <li key={tech}>{tech}</li>
            ))}
          </List>
        </Card>
      ))}
    </Grid>
  </section>
);

export default Projects;
