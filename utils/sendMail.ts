import nodemailer, { Transporter } from 'nodemailer';
import path from 'path';
import ejs from 'ejs';
require("dotenv").config();



interface EmailOption{
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async (options: EmailOption): Promise<void> => {
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const { email, subject, template, data } = options;

  // get the pdata to the email tempalte file
  const tempaltePath = path.join(__dirname, '../mail', template);

  // Render the email template with EJS

  const html: string = await ejs.renderFile(tempaltePath, data);

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);

}

export default sendMail;