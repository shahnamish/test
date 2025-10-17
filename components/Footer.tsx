import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alex Parker</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Full-stack developer specializing in modern web technologies.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#about"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#projects"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400"
                >
                  Projects
                </a>
              </li>
              <li>
                <a
                  href="#blog"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connect</h4>
            <div className="flex gap-4 justify-center md:justify-start">
              <a
                href="https://github.com/username"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400"
                aria-label="GitHub"
              >
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/username"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400"
                aria-label="LinkedIn"
              >
                LinkedIn
              </a>
              <a
                href="https://twitter.com/username"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400"
                aria-label="X"
              >
                X
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {currentYear} Alex Parker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
