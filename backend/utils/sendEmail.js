import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"AI Assistant" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    text,
    html,
  });
};

export default sendEmail;