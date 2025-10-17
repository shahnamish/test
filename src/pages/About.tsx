import styled from 'styled-components'

const Container = styled.section`
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
`

const Heading = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  color: ${({ theme }) => theme.colors.text};
`

const Paragraph = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  line-height: 1.7;
`

const About = () => (
  <Container>
    <Heading>About Me</Heading>
    <Paragraph>
      I am a passionate developer with a focus on building immersive digital experiences. I enjoy
      working with modern technologies, designing elegant user interfaces, and crafting body of work
      that balances functionality with aesthetics.
    </Paragraph>
    <Paragraph>
      With experience across front-end frameworks, back-end services, and cloud infrastructure, I aim
      to create impactful products that solve real problems. When I&apos;m not coding, you can find me
      exploring design trends, reading, or contributing to open-source projects.
    </Paragraph>
  </Container>
)

export default About
