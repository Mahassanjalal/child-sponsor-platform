# Child Sponsorship Platform ðŸŒŸ

A full-stack web application connecting sponsors with children in need of educational support. This platform enables recurring or one-time sponsorships through Stripe payments, with transparent progress tracking and reporting.

## ðŸ“‹ Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [User Roles](#user-roles)
- [Payment Integration](#payment-integration)
- [Email Notifications](#email-notifications)
- [Contributing](#contributing)
- [License](#license)

## ðŸŽ¯ Overview

This Child Sponsorship Platform is designed to facilitate educational support for children by connecting them with compassionate sponsors. The platform provides a seamless experience for:

- **Sponsors**: Browse available children, make secure payments, track sponsorships, and receive progress updates
- **Administrators**: Manage children profiles, upload reports, track sponsorships, and monitor payments
- **Children**: Receive consistent educational support and have their progress documented

## âœ¨ Features

### For Sponsors
- ðŸ‘¤ **User Authentication**: Secure registration and login with password reset functionality
- ðŸ” **Browse Children**: View featured children available for sponsorship
- ðŸ’³ **Flexible Payments**: Choose between monthly recurring or one-time sponsorships
- ðŸ“Š **Dashboard**: Track active sponsorships, payment history, and child progress
- ðŸ“§ **Email Notifications**: Receive confirmations and updates
- ðŸ‘¥ **Profile Management**: Update personal information and view sponsorship history
- ðŸ“± **Responsive Design**: Mobile-friendly interface with dark/light theme support

### For Administrators
- ðŸ“ **Child Management**: Add, edit, and remove children profiles
- ðŸ“¸ **Image Uploads**: Upload child photos and report images via cloud storage
- ðŸ“ˆ **Progress Reports**: Create and manage progress reports for sponsored children
- ðŸ’° **Payment Tracking**: Monitor all payments and sponsorship statuses
- ðŸ‘¨â€ðŸ’¼ **Sponsor Management**: View and manage sponsor accounts
- ðŸ“Š **Analytics Dashboard**: Overview of sponsorships, payments, and system statistics

### General Features
- ðŸ” **Secure Authentication**: Passport.js with session management
- ðŸ’³ **Stripe Integration**: PCI-compliant payment processing with webhook support
- ðŸ“§ **Email System**: Automated emails using Resend
- ðŸŽ¨ **Modern UI**: Built with Shadcn UI components and Tailwind CSS
- ðŸŒ“ **Theme Support**: Light and dark mode toggle
- âš¡ **Real-time Updates**: React Query for efficient data fetching
- ðŸ“± **Responsive Design**: Works seamlessly on desktop and mobile devices
- ðŸ”„ **Type Safety**: End-to-end TypeScript implementation

## ðŸ›  Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight routing)
- **State Management**: React Query (@tanstack/react-query)
- **UI Components**: Shadcn UI (Radix UI primitives)
- **Styling**: Tailwind CSS with animations
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion
- **Icons**: Lucide React, React Icons
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript
- **Authentication**: Passport.js with express-session
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Payment Processing**: Stripe
- **Email Service**: Resend
- **Session Store**: connect-pg-simple (PostgreSQL)
- **File Storage**: Local disk uploads
- **File Upload**: Uppy (@uppy/aws-s3, @uppy/dashboard)

### DevOps & Tools
- **Development**: tsx for hot reloading
- **Database Migrations**: Drizzle Kit
- **Type Validation**: Zod with drizzle-zod
- **Hosting**: Any Node.js-compatible platform

## ðŸ“ Project Structure

```
Child-Sponsor-Hub/
   client/                      # Frontend React application
      public/                  # Static assets
      src/
         assets/              # Images and media
         components/          # Reusable UI components
            ui/              # Shadcn UI components
            animated-container.tsx
            theme-provider.tsx
            ObjectUploader.tsx
         hooks/               # Custom React hooks
            use-auth.tsx     # Authentication hook
            use-toast.ts     # Toast notifications
            use-upload.ts    # File upload hook
         lib/                 # Utility functions
            protected-route.tsx
            queryClient.ts
            utils.ts
         pages/               # Page components
            landing-page.tsx
            auth-page.tsx
            sponsor-dashboard.tsx
            admin-dashboard.tsx
            profile-page.tsx
            sponsor-child.tsx
            child-detail.tsx
            contact.tsx
            terms.tsx        # Terms of Service
            privacy.tsx      # Privacy Policy
            [other pages]
         App.tsx              # Main app component
         main.tsx             # Entry point
      index.html
   server/                      # Backend Express application
      auth.ts                  # Authentication logic
      config.ts                # Environment validation
      db.ts                    # Database connection
      email.ts                 # Email service
      index.ts                 # Server entry point
      rateLimit.ts             # Rate limiting middleware
      routes.ts                # API route handlers
      seed.ts                  # Database seeding
      storage.ts               # Data access layer
      stripeClient.ts          # Stripe configuration
      stripeWebhookLocal.ts    # Stripe webhook handlers
   shared/                      # Shared code between client/server
      schema.ts                # Database schema and validation
   script/                      # Build and utility scripts
      build.ts
   drizzle.config.ts            # Drizzle ORM configuration
   package.json                 # Dependencies and scripts
   tsconfig.json                # TypeScript configuration
   tailwind.config.ts           # Tailwind CSS configuration
   vite.config.ts               # Vite build configuration
   README.md                    # This file
```

## ðŸ“¦ Prerequisites

Before running this application, ensure you have:

- **Node.js**: Version 20.x or higher
- **PostgreSQL**: Version 12 or higher
- **npm** or **yarn**: Package manager
- **Stripe Account**: For payment processing (optional for UI-only local testing)
- **Resend Account**: For email service (optional; emails are mocked if not set)
- **File Uploads**: Local uploads stored in `./uploads`

## ðŸš€ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Child-Sponsor-Hub
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   If you hit an esbuild platform mismatch error (for example when copying `node_modules` between OSes), remove `node_modules` and reinstall on the target platform:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## âš™ï¸ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/child_sponsorship

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# Session
SESSION_SECRET=your-super-secret-session-key

# App URL (used for emails + Stripe checkout redirects)
BASE_URL=http://localhost:5000
```

### Local Uploads (Dev)

Uploads are stored on disk in the `uploads/` folder and served from:
- `GET /uploads/:fileName`

## ðŸ—„ï¸ Database Setup

1. **Create PostgreSQL database**:
   ```sql
   CREATE DATABASE child_sponsorship;
   ```

2. **Push schema to database**:
   ```bash
   npm run db:push
   ```

3. **Seed the database** (optional):
   The application automatically seeds the database with sample data on first run, including:
   - Admin user (email: admin@example.com, password: admin123)
   - Sample children profiles
   - Example sponsorships and reports

## ðŸƒâ€â™‚ï¸ Running the Application

### Development Mode

Start the development server with hot reloading:

```bash
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5000`
- Backend API: `http://localhost:5000/api`

### Production Build

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

### Type Checking

Run TypeScript type checking:

```bash
npm run check
```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `GET /api/user` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify-reset-token/:token` - Verify reset token

### Children
- `GET /api/children/featured` - Get featured children (public)
- `GET /api/children/available` - Get available children (authenticated)
- `GET /api/children/:id` - Get single child (authenticated)
- `GET /api/admin/children` - Get all children (admin only)
- `POST /api/admin/children` - Create child (admin only)
- `PUT /api/admin/children/:id` - Update child (admin only)
- `DELETE /api/admin/children/:id` - Delete child (admin only)

### Sponsorships
- `GET /api/sponsorships/my` - Get user's sponsorships
- `POST /api/sponsorships` - Create sponsorship (internal fallback)
- `POST /api/sponsorships/:id/cancel` - Cancel sponsorship
- `GET /api/admin/sponsorships` - Get all sponsorships (admin only)

### Reports
- `GET /api/reports/my` - Get reports for user's sponsored children
- `GET /api/reports/child/:childId` - Get reports for specific child
- `GET /api/admin/reports` - Get all reports (admin only)
- `POST /api/admin/reports` - Create report (admin only)
- `PUT /api/admin/reports/:id` - Update report (admin only)
- `DELETE /api/admin/reports/:id` - Delete report (admin only)

### Payments
- `GET /api/payments/my` - Get user's payments
- `GET /api/admin/payments` - Get all payments (admin only)

### Profile
- `GET /api/profile` - Get current profile
- `PUT /api/profile` - Update user profile
- `PUT /api/profile/password` - Change password
- `DELETE /api/profile` - Delete account (non-admin only)

### Contact
- `POST /api/contact` - Submit contact form (rate limited)

### Stripe
- `GET /api/stripe/publishable-key` - Get Stripe publishable key
- `POST /api/stripe/create-checkout` - Create Stripe checkout session
- `POST /api/stripe/confirm-sponsorship` - Confirm sponsorship after payment
- `POST /api/stripe/webhook` - Stripe webhook endpoint

### Uploads
- `POST /api/uploads/request-url` - Request upload URL (admin only)
- `PUT /api/uploads/local/:fileName` - Local upload endpoint
- `GET /uploads/:fileName` - Serve local uploads

## ðŸ‘¥ User Roles

### Sponsor (Default Role)
- Browse available children
- Create sponsorships
- Make payments
- View own sponsorship history
- View progress reports for sponsored children
- Update own profile

### Admin
- All sponsor capabilities
- Create, update, and delete children profiles
- Upload child photos
- Create, update, and delete progress reports
- View all sponsorships and payments
- Manage user accounts
- Access admin dashboard with analytics

### Default Admin Credentials
After seeding the database:
- **Email**: admin@hopeconnect.org
- **Password**: admin123

âš ï¸ **Important**: Change these credentials immediately in production!

## ðŸ’³ Payment Integration

### Stripe Setup

1. **Create a Stripe account** at [stripe.com](https://stripe.com)

2. **Get API keys** from the Stripe Dashboard

3. **Configure webhook endpoint**:
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen to:
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`

4. **Local development (Stripe CLI)**:
   ```bash
   stripe login
   stripe listen --forward-to localhost:5000/api/stripe/webhook
   ```
   - Copy the webhook signing secret printed by Stripe CLI into `STRIPE_WEBHOOK_SECRET`.

5. **Webhook Handlers**:
   The platform handles the following webhook events:
   - **invoice.payment_succeeded**: Records monthly recurring payments
   - **invoice.payment_failed**: Records failed payment attempts
   - **customer.subscription.deleted**: Cancels sponsorship
   - **customer.subscription.updated**: Cancels sponsorship when status is `canceled`
   - **checkout.session.completed**: Sponsorship confirmation is handled via `/api/stripe/confirm-sponsorship` after redirect

### Payment Types

- **Monthly Recurring**: Automatic monthly charges via Stripe subscriptions
- **One-time**: Single payment for a specific period

## ðŸ“§ Email Notifications

The platform sends automated emails for:

1. **Welcome Email**: Sent to new users upon registration
2. **Password Reset**: Contains secure link to reset password
3. **Sponsorship Confirmation**: Sent after successful sponsorship creation
4. **New Progress Report**: Notifies sponsors when new reports are added for their children
5. **Payment Receipts**: Handled by Stripe

### Email Configuration

The application uses [Resend](https://resend.com) for email delivery. Configure the following in your `.env` file:

```env
RESEND_API_KEY=re_your_api_key
FROM_EMAIL=noreply@yourdomain.com
```

## ðŸŽ¨ UI/UX Features

- **Responsive Design**: Mobile-first approach with breakpoints for all devices
- **Dark/Light Mode**: User preference with persistence
- **Animations**: Smooth transitions using Framer Motion
- **Loading States**: Skeleton loaders for better perceived performance
- **Toast Notifications**: User feedback for actions
- **Form Validation**: Real-time validation with helpful error messages
- **Accessibility**: ARIA labels and keyboard navigation support

## ðŸ”’ Security Features

- **Password Hashing**: Scrypt for secure password storage
- **Session Management**: Secure, HTTP-only cookies with PostgreSQL store
- **CSRF Protection**: Built into session management
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **XSS Protection**: React's built-in escaping
- **Rate Limiting**: Implemented for authentication and sensitive endpoints
  - Login: 5 attempts per 15 minutes
  - Registration: 3 attempts per hour
  - Password Reset: 3 requests per hour
  - Contact Form: 5 submissions per hour
- **Environment Validation**: Required variables validated at startup
- **Stripe Webhook Verification**: Validates webhook signatures
- **Input Validation**: Zod schemas for all user inputs

## ðŸ“œ Legal Pages

The platform includes required legal pages for compliance:

- **Terms of Service** (`/terms`) - User agreement and platform rules
- **Privacy Policy** (`/privacy`) - GDPR and CCPA compliant privacy policy

## ðŸ§ª Testing

To add tests to this project, you can use:

```bash
# Install testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

## ðŸ“ Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ðŸ“„ License

This project is licensed under the MIT License - see the LICENSE file for details.

## ðŸ¤ Support

For support, email support@example.com or open an issue in the repository.

## ðŸ™ Acknowledgments

- Built with â¤ï¸ for children in need of educational support
- UI components from [Shadcn UI](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Powered by [Stripe](https://stripe.com/) for payments
- Email service by [Resend](https://resend.com/)

---

**Made with ðŸ’™ to help children achieve their educational dreams**
