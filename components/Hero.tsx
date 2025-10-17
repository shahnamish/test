import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400 font-medium">
              Full-Stack Developer
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white">
              Hi, I'm <span className="text-sky-600 dark:text-sky-400">Alex Parker</span>
            </h1>
          </div>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            I craft delightful digital experiences with modern web technologies,
            bridging design and engineering to ship impactful products.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-6">
            <a
              href="#projects"
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-medium py-3 px-8 rounded-lg transition-colors"
            >
              View My Work
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 border-2 border-gray-300 dark:border-gray-600 hover:border-sky-500 dark:hover:border-sky-500 text-gray-700 dark:text-gray-200 font-medium py-3 px-8 rounded-lg transition-colors"
            >
              Get In Touch
            </a>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <a href="#about" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </a>
      </div>
    </section>
  );
};
