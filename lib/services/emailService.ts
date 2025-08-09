import nodemailer from "nodemailer";

// Create reusable transporter
const createTransporter = () => {
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  ) {
    console.warn(
      "Email configuration missing. Emails will be logged to console.",
    );
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

export async function sendOtpEmail(
  email: string,
  otpCode: string,
  type: "login" | "register" | "password_reset",
): Promise<void> {
  const subject = getOtpEmailSubject(type);
  const html = getOtpEmailTemplate(otpCode, type);

  if (!transporter) {
    // For development/demo - log to console
    console.log(`
    ═══════════════════════════════════════
    📧 EMAIL SIMULATION
    ═══════════════════════════════════════
    To: ${email}
    Subject: ${subject}
    OTP Code: ${otpCode}
    Type: ${type}
    ═══════════════════════���═══════════════
    `);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"CyberSecChat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("Failed to send email");
  }
}

export async function sendWelcomeEmail(
  email: string,
  username: string,
): Promise<void> {
  if (!transporter) {
    console.log(`Welcome email simulation for ${username} (${email})`);
    return;
  }

  const subject = "Welcome to CyberSecChat!";
  const html = getWelcomeEmailTemplate(username);

  try {
    await transporter.sendMail({
      from: `"CyberSecChat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

export async function sendSecurityAlert(
  email: string,
  alertType: string,
  details: any,
): Promise<void> {
  if (!transporter) {
    console.log(`Security alert simulation: ${alertType} for ${email}`);
    return;
  }

  const subject = `Security Alert: ${alertType}`;
  const html = getSecurityAlertTemplate(alertType, details);

  try {
    await transporter.sendMail({
      from: `"CyberSecChat Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`Security alert sent to ${email}`);
  } catch (error) {
    console.error("Failed to send security alert:", error);
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
          This code will expire in ${type === "register" ? "2" : "5"} minutes for security reasons.
        </p>
        
        <div style="background-color:rgb(0, 0, 0); background-opacity: 0.1; border: 1px solid rgb(8, 0, 4); border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="color:rgb(17, 0, 7); margin: 0; font-size: 14px;">
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
        
        <div style="background-color: #ff0066; background-opacity: 0.1; border: 1px solid #ff0066; border-radius: 6px; padding: 20px; margin: 20px 0;">
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
