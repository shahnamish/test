import { Resume } from '@/types';

export const resume: Resume = {
  summary: 'Full-stack developer with 5+ years of experience building scalable web applications. Passionate about clean code, user experience, and modern web technologies. Proven track record of delivering high-quality solutions in fast-paced environments.',
  experience: [
    {
      id: 'exp-1',
      company: 'Tech Solutions Inc.',
      position: 'Senior Full-Stack Developer',
      startDate: '2022-01',
      description: [
        'Led development of a microservices-based e-commerce platform serving 100K+ users',
        'Architected and implemented CI/CD pipelines, reducing deployment time by 60%',
        'Mentored junior developers and conducted code reviews to maintain high code quality',
        'Collaborated with product team to define technical requirements and roadmap',
      ],
      technologies: ['React', 'Node.js', 'AWS', 'Docker', 'PostgreSQL'],
    },
    {
      id: 'exp-2',
      company: 'Digital Innovations LLC',
      position: 'Full-Stack Developer',
      startDate: '2020-03',
      endDate: '2021-12',
      description: [
        'Developed and maintained multiple client-facing web applications',
        'Implemented responsive designs and improved site performance by 40%',
        'Integrated third-party APIs and payment processing systems',
        'Participated in agile ceremonies and sprint planning',
      ],
      technologies: ['Vue.js', 'Python', 'Django', 'MySQL', 'Redis'],
    },
    {
      id: 'exp-3',
      company: 'Startup Ventures',
      position: 'Junior Developer',
      startDate: '2019-06',
      endDate: '2020-02',
      description: [
        'Built features for SaaS products using modern JavaScript frameworks',
        'Fixed bugs and improved application stability',
        'Wrote unit tests and participated in code reviews',
        'Contributed to technical documentation',
      ],
      technologies: ['React', 'Express.js', 'MongoDB', 'Jest'],
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'State University',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2015-09',
      endDate: '2019-05',
      description: 'Graduated with honors. Focus on software engineering and web technologies.',
    },
  ],
  skills: [
    {
      category: 'Frontend',
      skills: ['React', 'Next.js', 'TypeScript', 'Vue.js', 'Tailwind CSS', 'HTML/CSS'],
    },
    {
      category: 'Backend',
      skills: ['Node.js', 'Python', 'Django', 'Express.js', 'REST APIs', 'GraphQL'],
    },
    {
      category: 'Database',
      skills: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Prisma'],
    },
    {
      category: 'DevOps',
      skills: ['Docker', 'AWS', 'CI/CD', 'GitHub Actions', 'Vercel'],
    },
    {
      category: 'Tools',
      skills: ['Git', 'VSCode', 'Figma', 'Postman', 'Jest', 'Webpack'],
    },
  ],
};
