# NOI LMS Frontend

Frontend application for NOI LMS (Islamic Learning Management System) - A modern, responsive web platform built with Next.js for Islamic education, courses, books, and blogs.

## Features

- 🎓 **Course Management** - Browse, enroll, and learn from Islamic courses
- 📝 **Advanced Quiz System** - Multiple question types with auto and manual grading
- 📚 **Book Library** - Access a comprehensive collection of Islamic books
- ✍️ **Blog System** - Read and explore Islamic articles and content
- 👤 **User Authentication** - Secure login and registration system
- 👨‍💼 **Admin Dashboard** - Manage courses, books, blogs, users, and quizzes
- 📱 **Responsive Design** - Mobile-friendly interface built with Tailwind CSS
- 🎨 **Modern UI** - Beautiful components using Radix UI and shadcn/ui

## Tech Stack

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Axios** - HTTP client for API requests
- **React Hook Form** - Form management
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Backend API server running (see [server README](../server/README.md))

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ISCourses/noi-lms-frontend.git
cd noi-lms-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Available Scripts

### Development
```bash
npm run dev
```
Starts the development server with hot-reloading.

### Production Build
```bash
npm run build
```
Creates an optimized production build.

### Start Production Server
```bash
npm start
```
Starts the production server (requires `npm run build` first).

### Linting
```bash
npm run lint
```
Runs ESLint to check code quality.

## Project Structure

```
client/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   │   ├── books/        # Book management
│   │   ├── courses/      # Course management
│   │   └── users/        # User management
│   ├── blogs/            # Blog listing and pages
│   ├── books/            # Book library pages
│   ├── courses/          # Course pages and learning
│   │   └── [id]/
│   │       ├── learn/    # Course learning interface with quizzes
│   │       └── page.tsx  # Course detail page
│   ├── admin/
│   │   ├── courses/      # Course management
│   │   │   └── [id]/
│   │   │       ├── quizzes/        # Quiz management
│   │   │       │   ├── new/        # Create new quiz
│   │   │       │   └── [quizId]/edit/  # Edit quiz
│   │   │       └── content-order/  # Arrange lessons and quizzes
│   │   └── quizzes/
│   │       └── grading/  # Manual quiz grading interface
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── profile/          # User profile page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── AdminSidebar.tsx
│   ├── FeaturedBlogs.tsx
│   ├── FeaturedBooks.tsx
│   ├── FeaturedCourses.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   └── Navbar.tsx
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication context
├── lib/                  # Utility libraries
│   ├── api.ts           # API client configuration
│   └── utils.ts         # Utility functions
├── public/               # Static assets
└── styles/               # Global styles
```

## Key Features

### Authentication
- User registration and login
- JWT token-based authentication
- Protected routes
- Automatic token refresh handling

### Course System
- Browse available courses
- Course details and enrollment
- Interactive learning interface
- Progress tracking
- Unified content ordering (lessons and quizzes)
- Rich lesson content with text, images, and videos

### Quiz System
- **Multiple Question Types**:
  - Multiple Choice (auto-graded)
  - Text (manual grading)
  - Textarea (manual grading)
  - Select/Dropdown (auto-graded)
  - Checkbox (auto-graded, multiple correct answers)
- **Auto-Grading**: Automatic scoring for multiple-choice, select, and checkbox questions
- **Manual Grading**: Admin interface for grading text and textarea questions
- **Quiz Management**: Create, edit, and organize quizzes with flexible question types
- **Quiz Attempts**: Track user attempts, scores, and completion status
- **Admin Grading Dashboard**: Dedicated interface for manually grading quiz submissions
- **Progress Integration**: Quizzes can be inserted between lessons in course flow

### Book Library
- Browse Islamic books
- Book details and reading interface
- Search and filter functionality

### Blog System
- Read Islamic articles
- Featured blog posts
- Blog categories and tags

### Admin Dashboard
- Manage courses, lessons, and quizzes
- **Quiz Creation & Editing**: Create quizzes with multiple question types
- **Quiz Grading**: Manual grading interface for text/textarea questions
- **Content Ordering**: Drag-and-drop interface to arrange lessons and quizzes
- **Lesson Content Blocks**: Rich content editor with text, images, and videos
- Book management
- Blog management
- User management and roles
- Transaction management

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api` |

## API Integration

The frontend communicates with the backend API through:
- **Base URL**: Configured via `NEXT_PUBLIC_API_URL`
- **Authentication**: JWT tokens stored in cookies
- **Axios Interceptors**: Automatic token injection and error handling

## Styling

The project uses:
- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible component primitives
- **Custom components** in the `components/ui` directory
- **Responsive design** with mobile-first approach

## Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Setup
Make sure to set `NEXT_PUBLIC_API_URL` to your production API URL before building.

### Deployment Platforms
- **Vercel** (Recommended for Next.js)
- **Netlify**
- **DigitalOcean App Platform**
- **Any Node.js hosting service**

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is part of the NOI LMS system.

## Support

For issues and questions, please contact the development team or open an issue in the repository.
# client
