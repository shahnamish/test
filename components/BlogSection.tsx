import React from 'react';
import Image from 'next/image';
import { Section } from './Section';
import { Card, CardBody, CardHeader } from './Card';
import { blogPosts } from '@/data/posts';

export const BlogSection: React.FC = () => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Section
      id="blog"
      title="Blog"
      subtitle="Thoughts on software development, product design, and technology"
    >
      <div className="space-y-6">
        {blogPosts.map((post) => (
          <Card key={post.id} hover>
            <div className="md:flex">
              <CardHeader className="md:w-1/3">
                <div className="relative h-40 md:h-full rounded-md overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              </CardHeader>
              <CardBody className="md:w-2/3 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium tracking-wide uppercase bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span>{formatDate(post.date)}</span>
                  <span>{post.readTime}</span>
                </div>
              </CardBody>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
};
