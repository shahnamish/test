import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import About from './pages/About'
import BetScanner from './pages/BetScanner'
import Blog from './pages/Blog'
import Contact from './pages/Contact'
import Home from './pages/Home'
import OrderPlacement from './pages/OrderPlacement'
import PortfolioDashboard from './pages/PortfolioDashboard'
import Projects from './pages/Projects'
import Resume from './pages/Resume'

const App = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/resume" element={<Resume />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/portfolio-dashboard" element={<PortfolioDashboard />} />
      <Route path="/bet-scanner" element={<BetScanner />} />
      <Route path="/orders/new/:marketId" element={<OrderPlacement />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Layout>
)

export default App
