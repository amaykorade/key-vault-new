const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🔍 Testing GoDaddy Email Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
console.log('SMTP_SECURE:', process.env.SMTP_SECURE || 'NOT SET');
console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'NOT SET');
console.log('FROM_NAME:', process.env.FROM_NAME || 'NOT SET');
console.log('');

// Check if all required variables are set
const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.log('❌ Missing required environment variables:', missing.join(', '));
  console.log('');
  console.log('📝 Add these to your .env file:');
  console.log('SMTP_HOST=smtpout.secureserver.net');
  console.log('SMTP_PORT=465');
  console.log('SMTP_SECURE=true');
  console.log('SMTP_USER=your_email@yourdomain.com');
  console.log('SMTP_PASS=your_email_password');
  console.log('FROM_EMAIL=your_email@yourdomain.com');
  console.log('FROM_NAME=Key Vault Team');
  console.log('FRONTEND_URL=http://localhost:5173');
  process.exit(1);
}

async function testEmail() {
  try {
    console.log('🔧 Creating SMTP transporter...');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // GoDaddy specific settings
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      debug: true, // Enable debug logs
      logger: true // Enable logger
    });

    console.log('✅ Transporter created successfully');
    console.log('');

    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    console.log('');

    console.log('📧 Sending test email...');
    const testEmail = {
      from: {
        name: process.env.FROM_NAME || 'Key Vault Test',
        address: process.env.FROM_EMAIL || process.env.SMTP_USER
      },
      to: process.env.SMTP_USER, // Send test email to yourself
      subject: '🧪 Key Vault Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">✅ Email Configuration Test Successful!</h2>
          <p>Your GoDaddy email configuration is working correctly.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>SMTP Host: ${process.env.SMTP_HOST}</li>
            <li>SMTP Port: ${process.env.SMTP_PORT}</li>
            <li>From Email: ${process.env.FROM_EMAIL || process.env.SMTP_USER}</li>
            <li>Timestamp: ${new Date().toISOString()}</li>
          </ul>
          <p>Your invitation emails should now work properly! 🎉</p>
        </div>
      `,
      text: `
Email Configuration Test Successful!

Your GoDaddy email configuration is working correctly.

Test Details:
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- From Email: ${process.env.FROM_EMAIL || process.env.SMTP_USER}
- Timestamp: ${new Date().toISOString()}

Your invitation emails should now work properly!
      `
    };

    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('📤 Response:', info.response);
    console.log('');
    console.log('🎉 Check your email inbox for the test message!');
    console.log('📁 Also check your GoDaddy email "Sent" folder to confirm it appears there.');

  } catch (error) {
    console.log('❌ Email test failed!');
    console.log('');
    console.log('🔍 Error Details:');
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('Command:', error.command);
    console.log('');
    
    if (error.code === 'EAUTH') {
      console.log('🔐 Authentication Error - Check these:');
      console.log('  1. Email address is correct');
      console.log('  2. Password is correct');
      console.log('  3. Account has SMTP access enabled');
      console.log('  4. No 2FA blocking (may need app password)');
    } else if (error.code === 'ECONNECTION') {
      console.log('🌐 Connection Error - Check these:');
      console.log('  1. SMTP host is correct');
      console.log('  2. Port is correct (465 for SSL, 587 for STARTTLS)');
      console.log('  3. Firewall/network allows SMTP connections');
    } else if (error.code === 'ESOCKET') {
      console.log('🔌 Socket Error - Try these:');
      console.log('  1. Switch to port 587 with SMTP_SECURE=false');
      console.log('  2. Check if your network blocks port 465');
    }
  }
}

testEmail();

