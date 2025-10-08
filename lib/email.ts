// Email service using Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface WelcomeEmailProps {
  userEmail: string;
  userName: string;
}

interface AdminNotificationProps {
  userEmail: string;
  userName: string;
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail({ userEmail, userName }: WelcomeEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Dev Tracker <arthurk@fusion-events.ca>',
      to: [userEmail],
      subject: 'Welcome to Dev Tracker!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a); padding: 40px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="color: #60a5fa; margin: 0; font-size: 28px; font-weight: bold;">
                Dev Tracker
              </h1>
            </div>

            <div style="background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${userName}! 👋</h2>

              <p style="color: #475569; font-size: 16px;">
                Thank you for signing up for Dev Tracker! We're excited to have you on board.
              </p>

              <p style="color: #475569; font-size: 16px;">
                Dev Tracker helps you manage projects, track tasks, collaborate with your team, and stay organized.
              </p>

              <div style="background: #f1f5f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #1e293b; margin-top: 0; font-size: 18px;">Getting Started:</h3>
                <ul style="color: #475569; padding-left: 20px;">
                  <li>Create your first project</li>
                  <li>Add tasks and assign team members</li>
                  <li>Track progress with status updates</li>
                  <li>Collaborate with comments</li>
                </ul>
              </div>

              <a href="https://fusionprojects.pro"
                 style="display: inline-block; background: linear-gradient(to right, #3b82f6, #06b6d4); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px;">
                Go to Dev Tracker
              </a>

              <p style="color: #64748b; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                If you have any questions, feel free to reach out to our support team.
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
              <p>Dev Tracker - Project Management for Development Teams</p>
              <p>fusionprojects.pro</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }

    console.log('Welcome email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in sendWelcomeEmail:', error);
    return { success: false, error };
  }
}

/**
 * Send admin notification about new user signup
 */
export async function sendAdminNotification({ userEmail, userName }: AdminNotificationProps) {
  // Only send if admin email is configured
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log('No admin email configured, skipping admin notification');
    return { success: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Dev Tracker <arthurk@fusion-events.ca>',
      to: [adminEmail],
      subject: 'New User Signup - Dev Tracker',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #60a5fa; margin: 0;">New User Signup</h2>
            </div>

            <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="color: #475569; font-size: 16px;">
                A new user has signed up for Dev Tracker:
              </p>

              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>Name:</strong> ${userName}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending admin notification:', error);
      return { success: false, error };
    }

    console.log('Admin notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in sendAdminNotification:', error);
    return { success: false, error };
  }
}
