const nodemailer = require('nodemailer');

const sendWelcomeEmail = async ({ email, password, name, brand, dashboardUrl }) => {
  // Use environment variables for SMTP, fallback to logging
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_USER || null,
      pass: process.env.SMTP_PASS || null,
    },
  });

  const brandName = brand === 'antigraviity' ? 'Antigraviity' : 'Forge India Connect';
  
  const mailOptions = {
    from: `"Vaults Administration" <noreply@vault-platform.com>`,
    to: email,
    subject: `Welcome to ${brandName} Project Vault`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h1 style="color: ${brand === 'antigraviity' ? '#6366f1' : '#f97316'}; text-align: center;">Welcome, ${name}!</h1>
        <p>You have been added as a team member to the <strong>${brandName}</strong> Project Vault platform.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0;">Your Credentials:</h3>
          <p><strong>URL:</strong> <a href="${dashboardUrl}">${dashboardUrl}</a></p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${password}</p>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">Please login and change your password as soon as possible for security reasons.</p>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 12px;">Powered by Antigravity AI</p>
      </div>
    `,
  };

  try {
    let activeTransporter = transporter;
    
    // If no real SMTP user, create a temporary ethereal account for testing
    if (!process.env.SMTP_USER) {
      console.log('--- GENERATING TEST EMAIL ACCOUNT ---');
      const testAccount = await nodemailer.createTestAccount();
      activeTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await activeTransporter.sendMail(mailOptions);
    
    if (!process.env.SMTP_USER) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('--- TEST EMAIL SENT ---');
      console.log(`Preview URL: ${previewUrl}`);
      console.log('-----------------------');
      return { success: true, test: true, previewUrl };
    }

    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendWelcomeEmail };
