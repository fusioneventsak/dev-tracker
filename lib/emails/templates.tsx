import { Task, Project } from '@/lib/types';

interface DailySnapshotData {
  userName: string;
  tasks: Task[];
  projects: Project[];
  overdueCount: number;
  dueTodayCount: number;
  inProgressCount: number;
}

interface UserActivity {
  userId: string;
  userName: string;
  userEmail: string;
  tasksCreated: number;
  tasksCompleted: number;
  commentsAdded: number;
  projectsCreated: number;
}

interface WeeklyReportData {
  userActivities: UserActivity[];
  totalTasksCreated: number;
  totalTasksCompleted: number;
  totalComments: number;
  totalProjects: number;
  weekStart: string;
  weekEnd: string;
}

export function generateDailySnapshotEmail(data: DailySnapshotData): string {
  const { userName, tasks, projects, overdueCount, dueTodayCount, inProgressCount } = data;

  // Group tasks by priority
  const highPriorityTasks = tasks.filter(t => t.priority === 'High' && !t.done);
  const dueTodayTasks = tasks.filter(t => {
    if (!t.targetDate || t.done) return false;
    const today = new Date().toISOString().split('T')[0];
    return t.targetDate === today;
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Task Snapshot</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 5px 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #334155;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 25px 0;
    }
    .stat-card {
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .stat-number {
      font-size: 28px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .task-item {
      background-color: #f8fafc;
      border-left: 3px solid #94a3b8;
      padding: 12px 15px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .task-item.high-priority {
      border-left-color: #ef4444;
      background-color: #fef2f2;
    }
    .task-item.due-today {
      border-left-color: #f59e0b;
      background-color: #fffbeb;
    }
    .task-title {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .task-meta {
      font-size: 13px;
      color: #64748b;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }
    .badge-high {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .badge-overdue {
      background-color: #fef2f2;
      color: #991b1b;
    }
    .badge-today {
      background-color: #fef3c7;
      color: #92400e;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
    }
    .no-tasks {
      text-align: center;
      padding: 30px;
      color: #64748b;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Daily Task Snapshot</h1>
      <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="content">
      <div class="greeting">Good morning, ${userName}! 👋</div>

      <p>Here's your task overview for today:</p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${inProgressCount}</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${dueTodayCount}</div>
          <div class="stat-label">Due Today</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${overdueCount}</div>
          <div class="stat-label">Overdue</div>
        </div>
      </div>

      ${highPriorityTasks.length > 0 ? `
        <div class="section">
          <div class="section-title">🔴 High Priority Tasks</div>
          ${highPriorityTasks.slice(0, 5).map(task => `
            <div class="task-item high-priority">
              <div class="task-title">${task.featureTask}</div>
              <div class="task-meta">
                ${task.assignedTo ? `Assigned to: ${task.assignedTo} • ` : ''}
                Status: ${task.status}
                ${task.targetDate ? ` • Due: ${new Date(task.targetDate).toLocaleDateString()}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${dueTodayTasks.length > 0 ? `
        <div class="section">
          <div class="section-title">📅 Due Today</div>
          ${dueTodayTasks.map(task => `
            <div class="task-item due-today">
              <div class="task-title">${task.featureTask}</div>
              <div class="task-meta">
                ${task.assignedTo ? `Assigned to: ${task.assignedTo} • ` : ''}
                Status: ${task.status}
                <span class="badge badge-today">DUE TODAY</span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${overdueCount > 0 ? `
        <div class="section">
          <div class="section-title">⚠️ Overdue Tasks</div>
          <p style="color: #dc2626; font-size: 14px;">You have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} that need attention.</p>
        </div>
      ` : ''}

      ${tasks.length === 0 ? `
        <div class="no-tasks">
          <p>🎉 You're all caught up! No pending tasks.</p>
        </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3008'}" class="cta-button">
          View All Tasks
        </a>
      </div>
    </div>

    <div class="footer">
      <p>Dev Tracker - Daily Task Snapshot</p>
      <p style="margin-top: 5px; font-size: 12px;">
        You're receiving this email because you have an account in Dev Tracker.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateWeeklyReportEmail(data: WeeklyReportData): string {
  const { userActivities, totalTasksCreated, totalTasksCompleted, totalComments, totalProjects, weekStart, weekEnd } = data;

  const topPerformer = userActivities.reduce((max, user) =>
    (user.tasksCompleted + user.tasksCreated + user.commentsAdded) >
    (max.tasksCompleted + max.tasksCreated + max.commentsAdded) ? user : max
  , userActivities[0]);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Team Activity Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 600;
    }
    .header p {
      margin: 8px 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 30px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 25px 0;
    }
    .summary-card {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .summary-number {
      font-size: 32px;
      font-weight: 700;
      color: #3b82f6;
      margin-bottom: 5px;
    }
    .summary-label {
      font-size: 13px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    .user-activity {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 15px 20px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .user-activity.top-performer {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #fbbf24;
    }
    .user-info {
      flex: 1;
    }
    .user-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .user-stats {
      font-size: 13px;
      color: #64748b;
      margin-top: 5px;
    }
    .trophy {
      font-size: 24px;
    }
    .stat-inline {
      display: inline-block;
      margin-right: 15px;
    }
    .highlight-box {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .highlight-box h3 {
      margin: 0 0 10px 0;
      color: #1e40af;
      font-size: 16px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      text-decoration: none;
      padding: 14px 35px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Weekly Team Activity Report</h1>
      <p>${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #334155;">Here's a summary of your team's activity this week:</p>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-number">${totalTasksCreated}</div>
          <div class="summary-label">Tasks Created</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">${totalTasksCompleted}</div>
          <div class="summary-label">Tasks Completed</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">${totalComments}</div>
          <div class="summary-label">Comments Added</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">${totalProjects}</div>
          <div class="summary-label">New Projects</div>
        </div>
      </div>

      ${topPerformer ? `
        <div class="highlight-box">
          <h3>🏆 Top Performer This Week</h3>
          <p style="margin: 0; font-size: 15px;">
            <strong>${topPerformer.userName}</strong> led the team with
            ${topPerformer.tasksCompleted} tasks completed, ${topPerformer.tasksCreated} tasks created,
            and ${topPerformer.commentsAdded} comments added. Great work!
          </p>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Team Member Activity</div>
        ${userActivities.map((user, index) => `
          <div class="user-activity ${index === 0 && topPerformer?.userId === user.userId ? 'top-performer' : ''}">
            <div class="user-info">
              <div class="user-name">
                ${user.userName}
                ${index === 0 && topPerformer?.userId === user.userId ? '<span class="trophy">🏆</span>' : ''}
              </div>
              <div class="user-stats">
                <span class="stat-inline">✅ ${user.tasksCompleted} completed</span>
                <span class="stat-inline">➕ ${user.tasksCreated} created</span>
                <span class="stat-inline">💬 ${user.commentsAdded} comments</span>
                ${user.projectsCreated > 0 ? `<span class="stat-inline">📁 ${user.projectsCreated} projects</span>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3008'}" class="cta-button">
          View Dashboard
        </a>
      </div>
    </div>

    <div class="footer">
      <p>Dev Tracker - Weekly Team Report</p>
      <p style="margin-top: 5px; font-size: 12px;">
        You're receiving this email because you're part of the team.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

interface TaskAssignmentData {
  assigneeName: string;
  assignedBy: string;
  taskTitle: string;
  taskDescription: string;
  projectName?: string;
  priority: string;
  targetDate?: string;
  taskUrl: string;
}

interface TaskCommentData {
  recipientName: string;
  commenterName: string;
  taskTitle: string;
  commentText: string;
  projectName?: string;
  taskUrl: string;
}

export function generateTaskAssignmentEmail(data: TaskAssignmentData): string {
  const { assigneeName, assignedBy, taskTitle, taskDescription, projectName, priority, targetDate, taskUrl } = data;

  const priorityColor = priority === 'High' ? '#ef4444' : priority === 'Medium' ? '#f59e0b' : '#10b981';
  const priorityBg = priority === 'High' ? '#fef2f2' : priority === 'Medium' ? '#fffbeb' : '#f0fdf4';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Task Assignment</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 5px 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 30px;
    }
    .task-box {
      background-color: #f8fafc;
      border-left: 4px solid ${priorityColor};
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .task-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 10px;
    }
    .task-description {
      color: #475569;
      font-size: 15px;
      line-height: 1.6;
      margin: 15px 0;
    }
    .task-meta {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin-top: 15px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #64748b;
    }
    .priority-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      background-color: ${priorityBg};
      color: ${priorityColor};
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ New Task Assigned</h1>
      <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #334155;">
        Hi ${assigneeName},
      </p>
      <p style="color: #64748b;">
        <strong>${assignedBy}</strong> has assigned you a new task${projectName ? ` in <strong>${projectName}</strong>` : ''}.
      </p>

      <div class="task-box">
        <div class="task-title">${taskTitle}</div>
        ${taskDescription ? `<div class="task-description">${taskDescription}</div>` : ''}

        <div class="task-meta">
          <div class="meta-item">
            <span>🎯 Priority:</span>
            <span class="priority-badge">${priority}</span>
          </div>
          ${targetDate ? `
            <div class="meta-item">
              <span>📅 Due:</span>
              <strong>${new Date(targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </div>
          ` : ''}
          ${projectName ? `
            <div class="meta-item">
              <span>📁 Project:</span>
              <strong>${projectName}</strong>
            </div>
          ` : ''}
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${taskUrl}" class="cta-button">
          View Task Details
        </a>
      </div>

      <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
        Click the button above to view the full task details and get started.
      </p>
    </div>

    <div class="footer">
      <p>Dev Tracker - Task Notification</p>
      <p style="margin-top: 5px; font-size: 12px;">
        You're receiving this email because you were assigned a task.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateTaskCommentEmail(data: TaskCommentData): string {
  const { recipientName, commenterName, taskTitle, commentText, projectName, taskUrl } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Comment on Task</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 5px 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 30px;
    }
    .task-reference {
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .task-reference-title {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 5px;
    }
    .task-reference-name {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
    .comment-box {
      background-color: #f8fafc;
      border-left: 4px solid #06b6d4;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .commenter-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    .commenter-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
    }
    .commenter-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 15px;
    }
    .comment-text {
      color: #475569;
      font-size: 15px;
      line-height: 1.7;
      white-space: pre-wrap;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      color: white;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💬 New Comment</h1>
      <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #334155;">
        Hi ${recipientName},
      </p>
      <p style="color: #64748b;">
        <strong>${commenterName}</strong> left a comment on a task${projectName ? ` in <strong>${projectName}</strong>` : ''}.
      </p>

      <div class="task-reference">
        <div class="task-reference-title">📋 Task</div>
        <div class="task-reference-name">${taskTitle}</div>
      </div>

      <div class="comment-box">
        <div class="commenter-info">
          <div class="commenter-avatar">${commenterName.charAt(0).toUpperCase()}</div>
          <div class="commenter-name">${commenterName}</div>
        </div>
        <div class="comment-text">${commentText}</div>
      </div>

      <div style="text-align: center;">
        <a href="${taskUrl}" class="cta-button">
          View Task & Reply
        </a>
      </div>

      <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
        Click the button above to view the task and reply to this comment.
      </p>
    </div>

    <div class="footer">
      <p>Dev Tracker - Comment Notification</p>
      <p style="margin-top: 5px; font-size: 12px;">
        You're receiving this email because you're involved in this task.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
