# Portfolio Website

A modern, responsive portfolio website built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Modern Design**: Clean, professional layout with responsive design
- 🌙 **Dark Mode Support**: Automatic dark mode based on system preferences
- 📱 **Fully Responsive**: Optimized for desktop, tablet, and mobile devices
- 🎯 **Reusable Components**: Modular card components and section layouts
- 📝 **Contact Form**: Client-side validation with react-hook-form and Zod
- 🚀 **Type-Safe**: Built with TypeScript for type safety
- 📊 **Structured Data**: JSON/TS data models for projects, blog posts, and resume

## Sections

- **Hero**: Eye-catching landing section with call-to-action buttons
- **About**: Personal introduction and key highlights
- **Projects**: Showcase of selected projects with technologies and links
- **Blog**: List of blog posts with tags and metadata
- **Resume**: Professional experience, education, and skills
- **Contact**: Form with validation for getting in touch

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portfolio.

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Project Structure

```
/
├── app/                  # Next.js app directory
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/          # React components
│   ├── AboutSection.tsx
│   ├── BlogSection.tsx
│   ├── Card.tsx         # Reusable card component
│   ├── ContactForm.tsx  # Form with validation
│   ├── ContactSection.tsx
│   ├── Footer.tsx
│   ├── Header.tsx       # Navigation
│   ├── Hero.tsx
│   ├── ProjectsSection.tsx
│   ├── ResumeSection.tsx
│   └── Section.tsx      # Reusable section wrapper
├── data/                # Data sources
│   ├── about.ts
│   ├── posts.ts         # Blog posts data
│   ├── projects.ts      # Projects data
│   └── resume.ts        # Resume data
└── types/               # TypeScript type definitions
    └── index.ts
```

## Customization

### Update Personal Information

Edit the data files in the `/data` directory:

- `data/about.ts` - Personal information and highlights
- `data/projects.ts` - Project portfolio items
- `data/posts.ts` - Blog posts
- `data/resume.ts` - Work experience, education, and skills

### Styling

The project uses Tailwind CSS v4. Customize colors and themes in `globals.css`:

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}
```

### Contact Form Integration

The contact form includes a stub implementation. To integrate with a real email service:

1. **EmailJS**: Uncomment and configure EmailJS in `ContactForm.tsx`
2. **Custom API**: Create an API route and update the form submission handler
3. **mailto**: Use the fallback `mailto:` link in the contact section

## Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first CSS
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **EmailJS** - Email service integration (optional)

## License

MIT License - feel free to use this template for your own portfolio.
