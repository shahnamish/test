import styled from 'styled-components'

const Container = styled.section`
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing['2xl']};
`

const Heading = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  color: ${({ theme }) => theme.colors.text};
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const SectionTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  color: ${({ theme }) => theme.colors.primary};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
`

const Item = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`

const ItemTitle = styled.h4`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const ItemSubtitle = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textLight};
`

const ItemDescription = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textLight};
  line-height: 1.6;
`

const Resume = () => (
  <Container>
    <Heading>Resume</Heading>

    <Section>
      <SectionTitle>Experience</SectionTitle>
      <Item>
        <ItemTitle>Senior Software Engineer</ItemTitle>
        <ItemSubtitle>Tech Company | 2021 - Present</ItemSubtitle>
        <ItemDescription>
          Led development of scalable web applications using React, TypeScript, and modern cloud
          infrastructure.
        </ItemDescription>
      </Item>
      <Item>
        <ItemTitle>Software Engineer</ItemTitle>
        <ItemSubtitle>Startup Inc | 2019 - 2021</ItemSubtitle>
        <ItemDescription>
          Built full-stack applications and contributed to core product development.
        </ItemDescription>
      </Item>
    </Section>

    <Section>
      <SectionTitle>Education</SectionTitle>
      <Item>
        <ItemTitle>Bachelor of Science in Computer Science</ItemTitle>
        <ItemSubtitle>University Name | 2015 - 2019</ItemSubtitle>
      </Item>
    </Section>

    <Section>
      <SectionTitle>Skills</SectionTitle>
      <ItemDescription>
        React, TypeScript, Node.js, Python, Docker, AWS, Git, Agile Development, UI/UX Design
      </ItemDescription>
    </Section>
  </Container>
)

export default Resume
