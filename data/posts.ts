import { BlogPost } from '@/types';

export const blogPosts: BlogPost[] = [
  {
    id: 'post-1',
    title: 'Designing Scalable Frontend Architectures',
    excerpt: 'Explore strategies for building resilient frontend systems that scale with your product.',
    date: '2024-09-12',
    author: 'Alex Parker',
    image: '/images/posts/frontend-architecture.svg',
    tags: ['Architecture', 'Frontend', 'Scalability'],
    readTime: '8 min',
  },
  {
    id: 'post-2',
    title: 'Type-Safe APIs with TypeScript and Zod',
    excerpt: 'Learn how to leverage Zod with TypeScript to ensure runtime safety alongside compile-time guarantees.',
    date: '2024-08-03',
    author: 'Alex Parker',
    image: '/images/posts/typescript-zod.svg',
    tags: ['TypeScript', 'Zod', 'APIs'],
    readTime: '6 min',
  },
  {
    id: 'post-3',
    title: 'UX Principles for Data-Heavy Dashboards',
    excerpt: 'Practical UX guidelines to make complex data dashboards intuitive and actionable.',
    date: '2024-06-21',
    author: 'Alex Parker',
    image: '/images/posts/data-dashboard.svg',
    tags: ['UX', 'Product', 'Dashboard'],
    readTime: '7 min',
  },
];
