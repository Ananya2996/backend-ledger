require('dotenv').config();
const nodemailer = require('nodemailer');

//transporter communicate with smtp servers
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
console.log(  process.env.CLIENT_ID,
     process.env.CLIENT_SECRET,
     process.env.REFRESH_TOKEN,)
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"backend ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegisterEmail(userEmail, name){
    const subject='Welcome to backend legder!';
    const text=`Hello ${name} ,\n\nThank you for registering to BACKEND LEDGER. We're excited to have you on board!\n\nBest regards,\nThe Bcakend ledger Team`;
    const html=`<p>Hello ${name},</p><p>Thank you for registering at backend ledger. We're excited to have you on board!</p><p>Best regards,<br>The Backend ledger Team</p>`;

    await sendEmail(userEmail, subject, text ,html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount){
  const subject="Transaction Successful!";
  const text=`Hello ${name},\n\n Your transaction of $${amount} to account ${toAccount} was successful!.\n\n Best Regards,\nThe Backend Ledger Team`;
   const html=`<p>Hello ${name},</p><p> Your transaction of $${amount} to account ${toAccount} was successful!.</p><p>Best Regards,<br>The Backend Ledger Team</p>`;

   await sendEmail(userEmail, subject,text,html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount){
 const subject = "Transaction Failed";
 const text = `Hello ${name},\n\n
  Your transaction of $${amount} to account ${toAccount} was not successful.Please try again.\n\nBest Regards,\nThe Backend Ledger Team`;
 const html = `<p>Hello ${name},</p>
    <p>Your transaction of $${amount} to account ${toAccount} was not successful.</p><p>Please try again.</p><p>Best Regards,<br>The Backend Ledger Team</p> `;

  await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegisterEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
}