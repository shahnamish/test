import React from 'react';
import Image from 'next/image';
import { Section } from './Section';
import { Card, CardBody, CardFooter, CardHeader } from './Card';
import { projects } from '@/data/projects';

export const ProjectsSection: React.FC = () => {
  return (
    <Section
      id="projects"
      title="Projects"
      subtitle="Selected work that showcases my craftsmanship and problem-solving skills"
    >
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} hover className="flex flex-col">
            <CardHeader className="pb-4">
              <div className="relative h-48 rounded-md overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
              </div>
            </CardHeader>
            <CardBody className="flex-1">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {project.description}
              </p>
              {project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs font-medium tracking-wide uppercase bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300 px-3 py-1 rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </CardBody>
            <CardFooter className="mt-auto pt-0">
              <div className="flex flex-wrap gap-4">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-sky-600 dark:text-sky-300 hover:text-sky-500"
                  >
                    View Demo →
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-sky-500"
                  >
                    Source Code →
                  </a>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </Section>
  );
};
