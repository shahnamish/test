import styled from 'styled-components'

const Container = styled.section`
  max-width: 1200px;
  margin: 0 auto;
`

const Heading = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing.xl};
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  color: ${({ theme }) => theme.colors.text};
`

const ProjectsGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xl};
  grid-template-columns: 1fr;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
`

const ProjectCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: transform ${({ theme }) => theme.transitions.base};

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`

const ProjectTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.primary};
`

const ProjectDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textLight};
  line-height: 1.6;
`

const projects = [
  {
    id: 1,
    title: 'Project Alpha',
    description: 'A modern web application built with React and TypeScript.',
  },
  {
    id: 2,
    title: 'Project Beta',
    description: 'An API service with authentication and real-time features.',
  },
  {
    id: 3,
    title: 'Project Gamma',
    description: 'Mobile-first design system with comprehensive documentation.',
  },
]

const Projects = () => (
  <Container>
    <Heading>My Projects</Heading>
    <ProjectsGrid>
      {projects.map((project) => (
        <ProjectCard key={project.id}>
          <ProjectTitle>{project.title}</ProjectTitle>
          <ProjectDescription>{project.description}</ProjectDescription>
        </ProjectCard>
      ))}
    </ProjectsGrid>
  </Container>
)

export default Projects
