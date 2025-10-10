interface InvitationEmailProps {
  name: string;
  inviterName: string;
  setupUrl: string;
}

export const InvitationEmail = ({
  name,
  inviterName,
  setupUrl,
}: InvitationEmailProps) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to join the Dev Tracker team</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 0; text-align: center;">
              <div style="width: 80px; height: 80px; margin: 0 auto; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <h1 style="margin: 0 0 16px; color: #f1f5f9; font-size: 28px; font-weight: 700; text-align: center;">
                You're Invited! 🎉
              </h1>

              <p style="margin: 0 0 24px; color: #cbd5e1; font-size: 16px; line-height: 1.6; text-align: center;">
                Hi <strong style="color: #60a5fa;">${name}</strong>,
              </p>

              <p style="margin: 0 0 24px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                <strong style="color: #f1f5f9;">${inviterName}</strong> has invited you to join their team on <strong style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Dev Tracker</strong> - a powerful project management platform for development teams.
              </p>

              <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 8px; color: #f1f5f9; font-size: 14px; font-weight: 600;">
                  ✨ What you'll get:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                  <li>Collaborative task management</li>
                  <li>Real-time project tracking</li>
                  <li>Team communication tools</li>
                  <li>Progress dashboards and analytics</li>
                </ul>
              </div>

              <p style="margin: 0 0 24px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                Click the button below to set up your account and create your password:
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 24px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${setupUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                      Set Up My Account →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; padding: 12px; background-color: #0f172a; border-radius: 8px; color: #60a5fa; font-size: 13px; word-break: break-all; text-align: center;">
                ${setupUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #0f172a; border-top: 1px solid rgba(59, 130, 246, 0.1);">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; line-height: 1.6; text-align: center;">
                This invitation will expire in <strong style="color: #94a3b8;">7 days</strong>.
              </p>
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>

              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(100, 116, 139, 0.2); text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 12px;">
                  © ${new Date().getFullYear()} Dev Tracker. All rights reserved.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};
