import styled from 'styled-components'

const Container = styled.section`
  max-width: 600px;
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
  line-height: 1.6;
`

const ContactLink = styled.a`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  transition: color ${({ theme }) => theme.transitions.base};

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Contact = () => (
  <Container>
    <Heading>Contact</Heading>
    <Paragraph>
      Feel free to reach out for collaborations, opportunities, or just a friendly hello. You can
      contact me directly at <ContactLink href="mailto:hello@example.com">hello@example.com</ContactLink>.
    </Paragraph>
    <Paragraph>
      You can also connect with me on social platforms like LinkedIn, GitHub, and Twitter to stay up to
      date with my latest work and articles.
    </Paragraph>
  </Container>
)

export default Contact
