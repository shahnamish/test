import React from 'react';
import { Section } from './Section';
import { Card, CardBody } from './Card';
import { ContactForm } from './ContactForm';

export const ContactSection: React.FC = () => {
  return (
    <Section
      id="contact"
      title="Contact"
      subtitle="Interested in working together? Let's start a conversation"
    >
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardBody>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Let's build something great
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                I'm currently available for freelance opportunities, collaborative projects, or full-time roles. Drop a message and I will get back to you as soon as possible.
              </p>
              <div className="mt-8 space-y-5 text-sm text-gray-500 dark:text-gray-400">
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-200">Email</p>
                  <a
                    href="mailto:hello@example.com"
                    className="text-sky-600 dark:text-sky-300 hover:text-sky-500"
                  >
                    hello@example.com
                  </a>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-200">Location</p>
                  <p>Remote · Worldwide</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-200">Social</p>
                  <div className="flex items-center gap-4 mt-2">
                    <a
                      href="https://github.com/username"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-300 hover:text-sky-500 text-sm"
                    >
                      GitHub
                    </a>
                    <a
                      href="https://linkedin.com/in/username"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-300 hover:text-sky-500 text-sm"
                    >
                      LinkedIn
                    </a>
                    <a
                      href="https://twitter.com/username"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-300 hover:text-sky-500 text-sm"
                    >
                      X
                    </a>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardBody>
              <ContactForm />
            </CardBody>
          </Card>
        </div>
      </div>
    </Section>
  );
};
