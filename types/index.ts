export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  image: string;
  technologies: string[];
  demoUrl?: string;
  githubUrl?: string;
  featured?: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  author: string;
  image: string;
  tags: string[];
  readTime?: string;
}

export interface ResumeExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string[];
  technologies?: string[];
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface ResumeSkill {
  category: string;
  skills: string[];
}

export interface Resume {
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkill[];
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}
