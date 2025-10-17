import styled from 'styled-components';
import { skills } from '../data/portfolio';

const Wrapper = styled.div`
  margin: 0 auto;
  max-width: 800px;
  padding: 2rem;
  line-height: 1.8;
`;

const Heading = styled.h2`
  margin-bottom: 1rem;
`;

const SkillGrid = styled.div`
  margin-top: 2rem;
  display: grid;
  gap: 1.5rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
`;

const SkillCard = styled.section`
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
`;

const SkillCategory = styled.h3`
  margin-top: 0;
`;

const SkillList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;

  li + li {
    margin-top: 0.5rem;
  }
`;

const About = () => (
  <Wrapper>
    <Heading>About Me</Heading>
    <p>
      This starter project provides a strong foundation for building a personal
      portfolio. Customize it to share your story, experience, and favorite
      projects.
    </p>

    <SkillGrid>
      {skills.map(skill => (
        <SkillCard key={skill.category}>
          <SkillCategory>{skill.category}</SkillCategory>
          <SkillList>
            {skill.items.map(item => (
              <li key={item}>{item}</li>
            ))}
          </SkillList>
        </SkillCard>
      ))}
    </SkillGrid>
  </Wrapper>
);

export default About;
