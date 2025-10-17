import styled from 'styled-components'

const FooterContainer = styled.footer`
  background-color: ${({ theme }) => theme.colors.white};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin-top: auto;
`

const FooterContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-align: center;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
`

const FooterText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};
`

const Footer = () => (
  <FooterContainer>
    <FooterContent>
      <FooterText>&copy; {new Date().getFullYear()} Portfolio. All rights reserved.</FooterText>
      <FooterText>Designed & built with passion.</FooterText>
    </FooterContent>
  </FooterContainer>
)

export default Footer
