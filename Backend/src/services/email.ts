import nodemailer from 'nodemailer';
import { loadEnv } from '../config/env';

const env = loadEnv();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface InvitationEmailData {
  inviteeEmail: string;
  inviterName: string;
  organizationName: string;
  teamName?: string;
  role: string;
  teamRole?: string;
  invitationToken: string;
  expiresAt: Date;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  // Initialize email transporter
  private static getTransporter() {
    if (!this.transporter) {
      console.log('[Email] Checking SMTP configuration...');
      console.log('[Email] SMTP_HOST:', env.SMTP_HOST ? 'Set' : 'Missing');
      console.log('[Email] SMTP_USER:', env.SMTP_USER ? 'Set' : 'Missing');
      console.log('[Email] SMTP_PASS:', env.SMTP_PASS ? 'Set' : 'Missing');
      
      if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
        console.warn('[Email] SMTP configuration not provided. Emails will not be sent.');
        console.warn('[Email] Missing:', {
          SMTP_HOST: !env.SMTP_HOST,
          SMTP_USER: !env.SMTP_USER,
          SMTP_PASS: !env.SMTP_PASS
        });
        return null;
      }

      console.log('[Email] Creating SMTP transporter with config:', {
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT || '465'),
        secure: env.SMTP_SECURE === 'true',
        user: env.SMTP_USER
      });

      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT || '465'),
        secure: env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        // GoDaddy specific settings
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      });
    }

    return this.transporter;
  }

  // Send email
  private static async sendEmail(options: EmailOptions): Promise<void> {
    console.log('[Email] Attempting to send email to:', options.to);
    
    const transporter = this.getTransporter();
    
    if (!transporter) {
      console.log('[Email] Skipping email send - SMTP not configured');
      return;
    }

    try {
      const mailOptions = {
        from: {
          name: env.FROM_NAME || 'APIVault',
          address: env.FROM_EMAIL || env.SMTP_USER || 'noreply@example.com'
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      console.log('[Email] Mail options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      const info = await transporter.sendMail(mailOptions);
      console.log('[Email] Message sent successfully:', info.messageId);
      console.log('[Email] Response:', info.response);
    } catch (error: any) {
      console.error('[Email] Failed to send email:', error);
      console.error('[Email] Error details:', {
        message: error?.message,
        code: error?.code,
        command: error?.command
      });
      throw new Error('Failed to send email');
    }
  }

  // Generate invitation email template
  private static generateInvitationEmailTemplate(data: InvitationEmailData): { html: string; text: string } {
    const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';
    const invitationUrl = `${frontendUrl}/invitations/${data.invitationToken}`;
    
    const expiryDate = data.expiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to Join ${data.organizationName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          .title {
            color: #1a202c;
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 10px 0;
          }
          .subtitle {
            color: #718096;
            font-size: 16px;
            margin: 0;
          }
          .invitation-details {
            background: #f7fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .detail-label {
            color: #718096;
            font-weight: 500;
          }
          .detail-value {
            color: #1a202c;
            font-weight: 600;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
          }
          .warning {
            background: #fef5e7;
            border: 1px solid #f6d55c;
            border-radius: 6px;
            padding: 12px;
            margin: 20px 0;
            color: #92400e;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
            </div>
            <h1 class="title">You're Invited!</h1>
            <p class="subtitle">${data.inviterName} has invited you to join their ${data.teamName ? 'team' : 'organization'}</p>
          </div>

          <div class="invitation-details">
            <div class="detail-row">
              <span class="detail-label">Organization:</span>
              <span class="detail-value">${data.organizationName}</span>
            </div>
            ${data.teamName ? `
            <div class="detail-row">
              <span class="detail-label">Team:</span>
              <span class="detail-value">${data.teamName}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Your Role:</span>
              <span class="detail-value">${data.role}${data.teamRole ? ` (Team ${data.teamRole})` : ''}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Invited By:</span>
              <span class="detail-value">${data.inviterName}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${invitationUrl}" class="cta-button">
              Accept Invitation
            </a>
          </div>

          <div class="warning">
            <strong>⏰ This invitation expires on ${expiryDate}</strong><br>
            Make sure to accept it before then!
          </div>

          <p style="color: #718096; font-size: 14px; line-height: 1.5;">
            By accepting this invitation, you'll ${data.teamName ? `join the ${data.teamName} team in` : 'become a member of'} 
            ${data.organizationName} and gain access to shared projects and secrets based on your assigned permissions.
          </p>

          <div class="footer">
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>This invitation link is unique to you and should not be shared.</p>
            <p style="margin-top: 20px;">
              <strong>APIVault</strong> - Secure Secret Management<br>
              <a href="${frontendUrl}" style="color: #667eea;">Visit APIVault</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
You're Invited to Join ${data.organizationName}!

${data.inviterName} has invited you to join their ${data.teamName ? 'team' : 'organization'}.

Invitation Details:
- Organization: ${data.organizationName}
${data.teamName ? `- Team: ${data.teamName}` : ''}
- Your Role: ${data.role}${data.teamRole ? ` (Team ${data.teamRole})` : ''}
- Invited By: ${data.inviterName}

Accept your invitation by clicking this link:
${invitationUrl}

⏰ This invitation expires on ${expiryDate}

By accepting this invitation, you'll ${data.teamName ? `join the ${data.teamName} team in` : 'become a member of'} 
${data.organizationName} and gain access to shared projects and secrets based on your assigned permissions.

If you didn't expect this invitation, you can safely ignore this email.
This invitation link is unique to you and should not be shared.

---
APIVault - Secure Secret Management
${frontendUrl}
    `;

    return { html, text };
  }

  // Send team invitation email
  static async sendTeamInvitationEmail(data: InvitationEmailData): Promise<void> {
    const { html, text } = this.generateInvitationEmailTemplate(data);
    
    const subject = data.teamName 
      ? `You're invited to join ${data.teamName} team in ${data.organizationName}`
      : `You're invited to join ${data.organizationName}`;

    await this.sendEmail({
      to: data.inviteeEmail,
      subject,
      html,
      text
    });
  }

  static async sendEarlyAccessConfirmation(email: string, name?: string | null, developerType?: string): Promise<void> {
    const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';
    const displayName = name?.trim() ? name.trim() : 'there';

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Thanks for joining APIVault Early Access</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: #0f172a;
              color: #e2e8f0;
              padding: 32px;
            }
            .container {
              max-width: 560px;
              margin: 0 auto;
              background: #111827;
              border-radius: 16px;
              border: 1px solid #1f2937;
              padding: 32px;
              box-shadow: 0 20px 40px rgba(15, 23, 42, 0.35);
            }
            .logo {
              width: 52px;
              height: 52px;
              border-radius: 14px;
              background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 24px;
            }
            h1 {
              margin: 0 0 12px 0;
              font-size: 24px;
              color: #ecfeff;
            }
            p {
              line-height: 1.6;
              margin: 16px 0;
            }
            .badge {
              display: inline-flex;
              padding: 6px 10px;
              border-radius: 9999px;
              background: rgba(16, 185, 129, 0.12);
              color: #34d399;
              font-size: 12px;
              letter-spacing: 0.08em;
              font-weight: 600;
              text-transform: uppercase;
            }
            .footer {
              margin-top: 32px;
              font-size: 12px;
              color: #94a3b8;
              border-top: 1px solid #1f2937;
              padding-top: 16px;
            }
            a.button {
              display: inline-block;
              margin-top: 24px;
              padding: 12px 24px;
              border-radius: 8px;
              background: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%);
              color: white;
              font-weight: 600;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <svg width="26" height="26" fill="none" stroke="white" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div class="badge">Early Access</div>
            <h1>Thanks for joining, ${displayName}!</h1>
            <p>
              We're excited to have you in the APIVault private beta. We're polishing the experience for developers like you${developerType ? ` (${developerType})` : ''}, and you'll be one of the first to know when the platform opens up.
            </p>
            <p>
              Expect a personal note from us soon with roadmap updates, sneak peeks, and a heads-up when your seat is ready. In the meantime, feel free to reply to this email with anything you'd love APIVault to support.
            </p>
            <a class="button" href="${frontendUrl}">Learn more</a>
            <div class="footer">
              Built by indie hackers who hate leaked API keys as much as you do.<br />
              We'll never share your email. Opt out anytime.
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `Thanks for joining APIVault early access, ${displayName}!

We're excited to have you in the private beta. We'll reach out soon with updates and let you know as soon as your spot is ready.

Best,
The APIVault Team
${frontendUrl}
`;

    await this.sendEmail({
      to: email,
      subject: 'You’re on the APIVault early access list 🚀',
      html,
      text,
    });
  }

  // Send welcome email after invitation acceptance
  static async sendWelcomeEmail(
    email: string, 
    name: string, 
    organizationName: string, 
    teamName?: string
  ): Promise<void> {
    const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${organizationName}!</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          .title {
            color: #1a202c;
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 10px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h1 class="title">Welcome to ${organizationName}!</h1>
            <p style="color: #718096; font-size: 16px; margin: 0;">
              Hi ${name}, you've successfully joined ${teamName ? `the ${teamName} team in ` : ''}${organizationName}
            </p>
          </div>

          <div style="margin: 30px 0;">
            <h3 style="color: #1a202c; margin-bottom: 15px;">What's Next?</h3>
            <ul style="color: #4a5568; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Explore your team's projects and secrets</li>
              <li style="margin-bottom: 8px;">Collaborate with your team members</li>
              <li style="margin-bottom: 8px;">Set up your profile and preferences</li>
              <li style="margin-bottom: 8px;">Learn about your permissions and access levels</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${frontendUrl}/teams" class="cta-button">
              Go to Your Teams
            </a>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
            <p>Need help getting started? Contact your team lead or organization admin.</p>
            <p style="margin-top: 20px;">
              <strong>APIVault</strong> - Secure Secret Management<br>
              <a href="${frontendUrl}" style="color: #10b981;">Visit APIVault</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to ${organizationName}!

Hi ${name}, you've successfully joined ${teamName ? `the ${teamName} team in ` : ''}${organizationName}.

What's Next?
- Explore your team's projects and secrets
- Collaborate with your team members  
- Set up your profile and preferences
- Learn about your permissions and access levels

Get started: ${frontendUrl}/teams

Need help getting started? Contact your team lead or organization admin.

---
APIVault - Secure Secret Management
${frontendUrl}
    `;

    await this.sendEmail({
      to: email,
      subject: `Welcome to ${organizationName}!`,
      html,
      text
    });
  }

  // Test email configuration
  static async testEmailConfiguration(): Promise<boolean> {
    const transporter = this.getTransporter();
    
    if (!transporter) {
      return false;
    }

    try {
      await transporter.verify();
      console.log('[Email] SMTP configuration verified successfully');
      return true;
    } catch (error) {
      console.error('[Email] SMTP configuration verification failed:', error);
      return false;
    }
  }
}
