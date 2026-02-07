import nodemailer from "nodemailer";

// Validate and log SMTP configuration
console.log('🔧 Initializing Email Service...');
console.log('SMTP Configuration Status:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST ? `✅ ${process.env.SMTP_HOST}` : '❌ Missing');
console.log('  SMTP_PORT:', process.env.SMTP_PORT ? `✅ ${process.env.SMTP_PORT}` : '❌ Missing (default: 587)');
console.log('  SMTP_USER:', process.env.SMTP_USER ? `✅ ${process.env.SMTP_USER}` : '❌ Missing');
console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '✅ Configured' : '❌ Missing');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');

// Create reusable transporter
const createTransporter = () => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.error(
      '❌ CRITICAL: Email configuration incomplete. SMTP credentials required.'
    );
    console.error('Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in your .env.local file');
    return null;
  }

  try {
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    console.log('✅ Email transporter created successfully');
    console.log(`   Using ${config.host}:${config.port} (secure: ${config.secure})`);
    
    return nodemailer.createTransport(config);
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    return null;
  }
};

const transporter = createTransporter();

export async function sendOtpEmail(
  email: string,
  otpCode: string,
  type: "login" | "register" | "password_reset",
): Promise<void> {
  const subject = getOtpEmailSubject(type);
  const html = getOtpEmailTemplate(otpCode, type);
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Always log OTP in development for debugging
  if (isDevelopment) {
    console.log(`\n📧 [DEV] OTP Code for ${email}: ${otpCode}`);
    console.log(`   Type: ${type}, Expires: ${type === 'register' ? '10' : '5'} minutes`);
    console.log(`   ⚡ Development mode: OTP will work even if email fails\n`);
  }

  if (!transporter) {
    const errorMsg = 'Email service not configured. Please set up SMTP credentials in .env.local';
    console.error(`❌ ${errorMsg}`);
    
    if (isDevelopment) {
      console.log(`⚠️ [DEV] Continuing without email - OTP logged above`);
      return; // Allow development to continue
    }
    throw new Error(errorMsg);
  }

  try {
    console.log(`📤 Attempting to send ${type} OTP email to ${email}...`);
    
    const info = await transporter.sendMail({
      from: `"CyberSecChat" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`✅ OTP email sent successfully to ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
  } catch (error: any) {
    console.error(`❌ Failed to send OTP email to ${email}:`, error);
    
    if (isDevelopment) {
      // In development, log the error but don't throw - allow testing with console OTP
      console.log(`⚠️ [DEV] Email failed but continuing - use OTP from console above`);
      
      // Log specific error for debugging
      if (error.code === 'EAUTH') {
        console.log(`   Issue: Gmail authentication failed. Generate new App Password at: https://myaccount.google.com/apppasswords`);
      } else if (error.code === 'ECONNECTION') {
        console.log(`   Issue: Cannot connect to email server`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   Issue: Email sending timed out`);
      }
      return; // Don't throw in development
    }
    
    // Production: Provide specific error messages
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your SMTP credentials.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Cannot connect to email server. Please check your network and SMTP settings.');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('Email sending timed out. Please try again.');
    } else {
      throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
    }
  }
}

export async function sendWelcomeEmail(
  email: string,
  username: string,
): Promise<void> {
  if (!transporter) {
    console.log(`⚠️ Welcome email simulation for ${username} (${email}) - SMTP not configured`);
    return;
  }

  const subject = "Welcome to CyberSecChat!";
  const html = getWelcomeEmailTemplate(username);

  try {
    await transporter.sendMail({
      from: `"CyberSecChat" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error("❌ Failed to send welcome email:", error);
    // Don't throw for welcome emails - they're not critical
  }
}

export async function sendSecurityAlert(
  email: string,
  alertType: string,
  details: any,
): Promise<void> {
  if (!transporter) {
    console.log(`⚠️ Security alert simulation: ${alertType} for ${email} - SMTP not configured`);
    return;
  }

  const subject = `Security Alert: ${alertType}`;
  const html = getSecurityAlertTemplate(alertType, details);

  try {
    await transporter.sendMail({
      from: `"CyberSecChat Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`✅ Security alert sent to ${email}`);
  } catch (error) {
    console.error("❌ Failed to send security alert:", error);
    // Don't throw for security alerts - log them instead
  }
}

function getOtpEmailSubject(type: string): string {
  switch (type) {
    case "login":
      return "Your CyberSecChat Login Code";
    case "register":
      return "Verify Your CyberSecChat Account";
    case "password_reset":
      return "Reset Your CyberSecChat Password";
    default:
      return "Your CyberSecChat Verification Code";
  }
}

function getOtpEmailTemplate(otpCode: string, type: string): string {
  const action =
    type === "login"
      ? "sign in to"
      : type === "register"
        ? "verify"
        : "reset the password for";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CyberSecChat - Verification Code</title>
    </head>
    <body style="font-family: 'Courier New', monospace; background-color: #0a0a0a; color: #00d4ff; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00d4ff; margin: 0; font-size: 28px;">🛡️ CyberSecChat</h1>
          <p style="color: #888; margin: 5px 0;">Secure Communication Platform</p>
        </div>
        
        <h2 style="color: #00ff88; margin-bottom: 20px;">Verification Code</h2>
        
        <p style="color: #ccc; line-height: 1.6;">
          You requested to ${action} your CyberSecChat account. Use the verification code below:
        </p>
        
        <div style="background-color: #0a0a0a; border: 2px solid #00d4ff; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
          <div style="font-size: 36px; font-weight: bold; color: #00d4ff; letter-spacing: 8px; font-family: monospace;">
            ${otpCode}
          </div>
        </div>
        
        <p style="color: #ccc; line-height: 1.6;">
          This code will expire in ${type === "register" ? "10" : "5"} minutes for security reasons.
        </p>
        
        <div style="background-color: #2a0a0a; border: 1px solid #ff0066; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="color: #ff9999; margin: 0; font-size: 14px;">
            ⚠️ If you didn't request this code, please ignore this email and consider changing your password.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            CyberSecChat Security Team<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getWelcomeEmailTemplate(username: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to CyberSecChat</title>
    </head>
    <body style="font-family: 'Courier New', monospace; background-color: #0a0a0a; color: #00d4ff; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00d4ff; margin: 0; font-size: 28px;">🛡️ Welcome to CyberSecChat</h1>
        </div>
        
        <h2 style="color: #00ff88;">Hello ${username}!</h2>
        
        <p style="color: #ccc; line-height: 1.6;">
          Welcome to CyberSecChat, the secure communication platform for cybersecurity professionals.
        </p>
        
        <h3 style="color: #00d4ff;">Getting Started:</h3>
        <ul style="color: #ccc; line-height: 1.8;">
          <li>🔒 Set up two-factor authentication for enhanced security</li>
          <li>💬 Join secure chat rooms with your team</li>
          <li>📁 Use the encrypted file vault for sensitive documents</li>
          <li>🔍 Access real-time threat intelligence feeds</li>
          <li>🛠️ Utilize our cybersecurity tools and terminal</li>
        </ul>
        
        <div style="background-color: #0a0a0a; border: 1px solid #00ff88; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="color: #00ff88; margin: 0;">
            🔐 Your account is protected with end-to-end encryption and follows industry security best practices.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            CyberSecChat Team<br>
            Stay secure, stay connected.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getSecurityAlertTemplate(alertType: string, details: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CyberSecChat Security Alert</title>
    </head>
    <body style="font-family: 'Courier New', monospace; background-color: #0a0a0a; color: #ff0066; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border: 2px solid #ff0066; border-radius: 8px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff0066; margin: 0; font-size: 28px;">🚨 Security Alert</h1>
          <p style="color: #888; margin: 5px 0;">CyberSecChat Security System</p>
        </div>
        
        <h2 style="color: #ff0066; margin-bottom: 20px;">${alertType}</h2>
        
        <div style="background-color: #2a0a0a; border: 1px solid #ff0066; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <pre style="color: #ccc; margin: 0; white-space: pre-wrap; font-family: monospace;">
${JSON.stringify(details, null, 2)}
          </pre>
        </div>
        
        <p style="color: #ccc; line-height: 1.6;">
          This alert was generated automatically by our security monitoring system. 
          If this activity was not authorized by you, please contact our security team immediately.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            CyberSecChat Security Team<br>
            Automated Alert System
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
