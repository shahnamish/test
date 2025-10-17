export interface Project {
  id: number;
  title: string;
  description: string;
  technologies: string[];
  link?: string;
}

export const projects: Project[] = [
  {
    id: 1,
    title: 'Portfolio Website',
    description: 'A modern portfolio built with React, TypeScript, and Vite',
    technologies: ['React', 'TypeScript', 'Styled Components', 'Vite'],
  },
];

export interface Skill {
  category: string;
  items: string[];
}

export const skills: Skill[] = [
  {
    category: 'Frontend',
    items: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS'],
  },
  {
    category: 'Tools',
    items: ['Git', 'npm', 'Vite', 'ESLint', 'Prettier'],
  },
];
