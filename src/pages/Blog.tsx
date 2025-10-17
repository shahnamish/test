import styled from 'styled-components'

const Container = styled.section`
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const Heading = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  color: ${({ theme }) => theme.colors.text};
`

const Article = styled.article`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: ${({ theme }) => theme.spacing.xl};
`

const ArticleTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.primary};
`

const ArticleExcerpt = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textLight};
  line-height: 1.6;
`

const Blog = () => (
  <Container>
    <Heading>Latest Articles</Heading>
    <Article>
      <ArticleTitle>Designing delightful user experiences</ArticleTitle>
      <ArticleExcerpt>
        Exploring techniques and principles behind building accessible, engaging interfaces that users
        love to interact with.
      </ArticleExcerpt>
    </Article>
    <Article>
      <ArticleTitle>Scaling applications with modern tooling</ArticleTitle>
      <ArticleExcerpt>
        Lessons learned from building robust, scalable systems using the latest in cloud-native
        development.
      </ArticleExcerpt>
    </Article>
  </Container>
)

export default Blog
