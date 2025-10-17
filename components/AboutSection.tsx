import React from 'react';
import { Section } from './Section';
import { aboutContent } from '@/data/about';

export const AboutSection: React.FC = () => {
  return (
    <Section 
      id="about" 
      title="About Me" 
      subtitle="Learn more about my journey and expertise"
    >
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {aboutContent.name}
            </h3>
            <p className="text-lg text-sky-600 dark:text-sky-400 font-medium">
              {aboutContent.title}
            </p>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {aboutContent.description}
          </p>
        </div>
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-8">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Highlights
          </h4>
          <ul className="space-y-3">
            {aboutContent.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start">
                <svg
                  className="w-5 h-5 text-sky-500 dark:text-sky-400 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
};
