# Dev Tracker

A modern project management and task tracking application built with Next.js 14, Supabase, and TypeScript.

## Features

- 🔐 **User Authentication** - Secure email/password authentication with Supabase
- 📋 **Project Management** - Create and manage multiple projects
- ✅ **Task Tracking** - Track tasks with status, priority, assignments, and dates
- 👥 **Team Collaboration** - Add team members and assign tasks
- 💬 **Task Comments** - Collaborate with inline task comments
- 📊 **Project Statistics** - Track progress with completion percentages
- 📧 **Email Notifications** - Welcome emails for new users (via Resend)
- 🎨 **Modern UI** - Dark theme with shadcn/ui components

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Email**: Resend
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Resend account ([resend.com](https://resend.com)) - for email notifications

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/fusioneventsak/dev-tracker.git
cd dev-tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Resend Email Configuration
RESEND_API_KEY=your_resend_api_key

# Admin Email (optional)
ADMIN_EMAIL=your_admin_email@example.com
```

4. **Set up Supabase database**

The project uses the following tables:
- `projects` - Project information
- `tasks` - Task details and tracking
- `team_members` - Team member information
- `comments` - Task comments

Run the migrations in the `supabase/migrations` directory to set up your database schema.

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Email Notifications

Dev Tracker sends email notifications for:
- **Welcome emails** when new users sign up
- **Admin notifications** when new users register (optional)

### Setting up Resend

1. Create a Resend account at [resend.com](https://resend.com)
2. Verify your domain `fusionprojects.pro` (or your custom domain)
3. Add the required DNS records to your domain:
   - TXT record for verification
   - TXT record for SPF
   - CNAME records for DKIM
   - TXT record for DMARC
4. Get your API key from the Resend dashboard
5. Add the API key to `.env.local` as `RESEND_API_KEY`
6. Update the "from" email address in `lib/email.ts` if using a different domain

### DNS Records for Resend

Add these records to your domain's DNS settings (values provided by Resend):

```
Type: TXT
Name: @
Value: [verification token from Resend]

Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

Type: CNAME
Name: resend._domainkey
Value: [DKIM value from Resend]

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous key |
| `RESEND_API_KEY` | Yes | Your Resend API key for emails |
| `ADMIN_EMAIL` | No | Email to receive new user notifications |

## Project Structure

```
dev-tracker/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── projects/          # Project management pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── TaskComments.tsx  # Task comment component
├── lib/                   # Utility functions
│   ├── db.ts             # Database operations
│   ├── email.ts          # Email service
│   ├── types.ts          # TypeScript types
│   └── supabase/         # Supabase client
├── supabase/
│   └── migrations/       # Database migrations
└── public/               # Static assets
```

## Database Schema

### Projects
- `id` - UUID primary key
- `name` - Project name
- `user_id` - Creator's user ID
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Tasks
- `id` - UUID primary key
- `project_id` - Foreign key to projects
- `user_id` - Creator's user ID
- `feature_task` - Task title/feature name
- `description` - Task description
- `assigned_to` - Team member assigned
- `priority` - Low, Medium, High
- `status` - Backlog, In Progress, Code Review, Testing, Done
- `start_date` - Task start date
- `target_date` - Task deadline
- `done` - Boolean completion status
- `notes` - Additional notes
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Team Members
- `id` - UUID primary key
- `user_id` - User who created the member
- `name` - Team member name
- `email` - Team member email
- `role` - Team member role

### Comments
- `id` - UUID primary key
- `task_id` - Foreign key to tasks
- `user_id` - Commenter's user ID
- `author` - Comment author name
- `content` - Comment text
- `created_at` - Creation timestamp

## Deployment

### Deploy to Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
4. Add environment variables in Netlify dashboard
5. Deploy!

The app is currently deployed at: https://fusionprojects.netlify.app

### Custom Domain

To use a custom domain:
1. Register a domain (e.g., through Netlify Domains)
2. Add the domain to your Netlify site
3. Configure DNS records as needed
4. Update email service "from" address if using custom domain

## Contributing

This is a private project for Fusion Events team use.

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.

---

**Built with ❤️ by Fusion Events**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
