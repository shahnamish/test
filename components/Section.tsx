import React from 'react';

interface SectionProps {
  id: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ id, title, subtitle, actions, children }) => {
  return (
    <section id={id} className="py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 dark:text-sky-400">{id}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-2">{title}</h2>
            {subtitle && (
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-3 max-w-2xl">{subtitle}</p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
        {children}
      </div>
    </section>
  );
};
