import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { AboutSection } from '@/components/AboutSection';
import { ProjectsSection } from '@/components/ProjectsSection';
import { BlogSection } from '@/components/BlogSection';
import { ResumeSection } from '@/components/ResumeSection';
import { ContactSection } from '@/components/ContactSection';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <AboutSection />
        <ProjectsSection />
        <BlogSection />
        <ResumeSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
