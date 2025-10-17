import React from 'react';
import { Section } from './Section';
import { Card, CardBody, CardHeader } from './Card';
import { resume } from '@/data/resume';

const formatRange = (start: string, end?: string) => {
  const format = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (!end) {
    return `${format(start)} – Present`;
  }

  return `${format(start)} – ${format(end)}`;
};

export const ResumeSection: React.FC = () => {
  return (
    <Section
      id="resume"
      title="Resume"
      subtitle="Experience, education, and skills that inform my craft"
      actions={
        <a
          href="#contact"
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-sky-300 hover:text-sky-500"
        >
          Request full resume →
        </a>
      }
    >
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Professional Summary</h3>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {resume.summary}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Experience</h3>
            </CardHeader>
            <CardBody className="pt-6 space-y-8">
              {resume.experience.map((job) => (
                <div key={job.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {job.position}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {job.company}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
                      {formatRange(job.startDate, job.endDate)}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {job.description.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start text-gray-600 dark:text-gray-300"
                      >
                        <span className="text-sky-500 dark:text-sky-300 mr-2 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {job.technologies && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {job.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="text-xs font-medium tracking-wide uppercase bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300 px-3 py-1 rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader className="pb-0">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Education</h3>
            </CardHeader>
            <CardBody className="pt-6 space-y-6">
              {resume.education.map((education) => (
                <div key={education.id}>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {education.institution}
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400">
                    {education.degree} · {education.field}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatRange(education.startDate, education.endDate)}
                  </p>
                  {education.description && (
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                      {education.description}
                    </p>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Skills</h3>
            </CardHeader>
            <CardBody className="pt-6 space-y-6">
              {resume.skills.map((skillCategory) => (
                <div key={skillCategory.category}>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {skillCategory.category}
                  </h4>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {skillCategory.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs font-medium tracking-wide uppercase bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </Section>
  );
};
