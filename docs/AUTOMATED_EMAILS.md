# Automated Email System

This project includes automated daily and weekly email reports sent to all users.

## Features

### 1. Daily Task Snapshot (Sent at 8:00 AM daily)

Each user receives a personalized email with:
- **Task Overview**: Number of tasks in progress, due today, and overdue
- **High Priority Tasks**: Up to 5 highest priority tasks
- **Due Today**: All tasks due on the current day
- **Overdue Alerts**: Warning if tasks are overdue
- **Quick Stats**: Visual summary of task status

**When it's sent**: Every day at 8:00 AM (server timezone)
**Who receives it**: All users who have at least 1 active task
**Endpoint**: `/api/cron/daily-snapshot`

### 2. Weekly Team Activity Report (Sent Monday at 9:00 AM)

All users receive the same team-wide email with:
- **Team Statistics**: Total tasks created, completed, comments, and projects
- **Individual Contributions**: Activity breakdown for each team member
- **Top Performer Highlight**: Recognition for most active team member
- **Engagement Metrics**: Visual summary of team productivity

**When it's sent**: Every Monday at 9:00 AM (server timezone)
**Who receives it**: All users
**What period it covers**: Previous week (Monday to Sunday)
**Endpoint**: `/api/cron/weekly-report`

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` (development) and Vercel environment variables (production):

```env
# Required: Resend API key for sending emails
RESEND_API_KEY=re_your_api_key_here

# Required: Site URL for links in emails
NEXT_PUBLIC_SITE_URL=https://yoursite.com

# Optional: Secret to secure cron endpoints (recommended for production)
CRON_SECRET=your-random-secret-here
```

**Generate a secure CRON_SECRET:**
```bash
# On Mac/Linux:
openssl rand -base64 32

# Or use any random string generator
```

### 2. Vercel Deployment (Automatic Scheduling)

The `vercel.json` file configures automatic cron jobs on Vercel:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-snapshot",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 9 * * MON"
    }
  ]
}
```

**Schedule Format** (using cron syntax):
- `0 8 * * *` = Every day at 8:00 AM
- `0 9 * * MON` = Every Monday at 9:00 AM

**Timezone**: Vercel crons run in UTC by default. Adjust times accordingly.

**Setup on Vercel**:
1. Deploy your app to Vercel
2. Go to Project Settings → Environment Variables
3. Add `CRON_SECRET` with a secure random value
4. The cron jobs will automatically be configured from `vercel.json`

### 3. Manual Triggering (Testing)

You can manually trigger the emails for testing:

**Using curl with CRON_SECRET:**
```bash
# Daily snapshot
curl -X POST http://localhost:3008/api/cron/daily-snapshot \
  -H "Authorization: Bearer your-secret-here"

# Weekly report
curl -X POST http://localhost:3008/api/cron/weekly-report \
  -H "Authorization: Bearer your-secret-here"
```

**Without CRON_SECRET (if not set in .env):**
```bash
# Daily snapshot
curl -X POST http://localhost:3008/api/cron/daily-snapshot

# Weekly report
curl -X POST http://localhost:3008/api/cron/weekly-report
```

### 4. Alternative Scheduling (Non-Vercel)

If not using Vercel, you can schedule these endpoints using:

**a) External Cron Service (e.g., cron-job.org, EasyCron)**
- Schedule HTTP GET/POST requests to your endpoints
- Include `Authorization: Bearer your-secret` header
- Set up two jobs: one for daily, one for weekly

**b) Server Cron Jobs**
```bash
# Add to crontab (Linux/Mac):
# Daily at 8 AM
0 8 * * * curl -X POST https://yoursite.com/api/cron/daily-snapshot -H "Authorization: Bearer your-secret"

# Weekly on Monday at 9 AM
0 9 * * MON curl -X POST https://yoursite.com/api/cron/weekly-report -H "Authorization: Bearer your-secret"
```

**c) GitHub Actions**
```yaml
name: Send Daily Email
on:
  schedule:
    - cron: '0 8 * * *'
jobs:
  send-email:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Snapshot
        run: |
          curl -X POST ${{ secrets.SITE_URL }}/api/cron/daily-snapshot \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Email Customization

### Modifying Email Templates

Email templates are located in `lib/emails/templates.tsx`:
- `generateDailySnapshotEmail()` - Daily snapshot HTML
- `generateWeeklyReportEmail()` - Weekly report HTML

You can customize:
- **Colors and styling**: Edit inline CSS in the template functions
- **Content sections**: Add/remove sections in the HTML
- **Metrics displayed**: Modify the data passed to templates

### Modifying Data Queries

Data fetching is in `lib/emails/data.ts`:
- `getUserDailySnapshot()` - Fetches user's tasks and projects
- `getUserWeeklyActivity()` - Fetches user's activity for a week
- `getAllUsersWeeklyActivity()` - Aggregates all users' activity

### Changing Email Timing

Edit `vercel.json` cron schedules:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-snapshot",
      "schedule": "0 6 * * *"  // Changed to 6 AM
    }
  ]
}
```

**Cron syntax reference**:
- `* * * * *` = minute (0-59) | hour (0-23) | day (1-31) | month (1-12) | weekday (0-6)
- `0 8 * * *` = 8:00 AM every day
- `0 9 * * MON` = 9:00 AM every Monday
- `0 18 * * FRI` = 6:00 PM every Friday

### Changing Sender Email

Edit the `from` field in the API routes:
```typescript
await resend.emails.send({
  from: 'Dev Tracker <noreply@yourdomain.com>',  // Change this
  to: user.email,
  subject: '...',
  html: emailHtml
});
```

**Important**: The sender email must be from a domain verified in your Resend account.

## Monitoring and Logs

### Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by `/api/cron/` to see cron job executions
3. Look for success/failure messages

### API Response Format

Both endpoints return JSON with execution details:

**Daily Snapshot Response:**
```json
{
  "message": "Daily snapshot emails sent",
  "results": {
    "success": 5,
    "failed": 0,
    "skipped": 2,
    "errors": []
  }
}
```

**Weekly Report Response:**
```json
{
  "message": "Weekly reports sent",
  "weekStart": "2025-10-06T00:00:00.000Z",
  "weekEnd": "2025-10-12T23:59:59.999Z",
  "stats": {
    "totalTasksCreated": 15,
    "totalTasksCompleted": 12,
    "totalComments": 8,
    "totalProjects": 2
  },
  "results": {
    "success": 7,
    "failed": 0,
    "errors": []
  }
}
```

## Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**: Verify `RESEND_API_KEY` is set correctly
2. **Verify Domain**: Ensure sender domain is verified in Resend
3. **Check Logs**: Look for error messages in Vercel logs
4. **Test Manually**: Trigger endpoints manually to see error details

### Wrong Timezone

Vercel crons run in UTC. Convert your desired time:
- Want 8 AM EST (UTC-5)? Use `0 13 * * *` (1 PM UTC)
- Want 8 AM PST (UTC-8)? Use `0 16 * * *` (4 PM UTC)

### Users Not Receiving Emails

1. **Daily snapshots**: Only sent to users with active tasks
2. **Check spam folders**: Email might be filtered
3. **Verify email addresses**: Check profiles table for correct emails
4. **Check Resend dashboard**: View delivery status

### Cron Not Running on Vercel

1. **Check `vercel.json`**: Ensure cron configuration is valid
2. **Redeploy**: Cron jobs are only updated on deployment
3. **Check quotas**: Verify you haven't exceeded Vercel plan limits
4. **View cron logs**: Go to Project → Settings → Cron Jobs

## Security

### Protecting Cron Endpoints

The endpoints check for `CRON_SECRET` to prevent unauthorized access:

```typescript
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Best practices**:
- Always set `CRON_SECRET` in production
- Use a strong, random secret (min 32 characters)
- Never commit secrets to git
- Rotate secrets periodically

### Rate Limiting

Consider adding rate limiting if exposing endpoints publicly:
- Use Vercel's Edge Config for rate limiting
- Implement IP-based restrictions
- Monitor usage in Vercel analytics

## Performance Considerations

### Large User Base

For 100+ users, consider:
- **Batch sending**: Send emails in batches with delays
- **Queue system**: Use a job queue (BullMQ, Inngest)
- **Async processing**: Return response immediately, process in background
- **Resend limits**: Check your plan's email sending limits

### Database Queries

Current implementation queries per user. For optimization:
- Cache frequently accessed data
- Use database connection pooling
- Consider materialized views for stats
- Batch database queries where possible

## Future Enhancements

Possible improvements:
- [ ] User preferences for email frequency
- [ ] Opt-out/unsubscribe functionality
- [ ] Email digest customization
- [ ] Slack/Teams integration
- [ ] Real-time notifications
- [ ] Performance metrics tracking
- [ ] A/B testing for email content
- [ ] Template variants for different roles
