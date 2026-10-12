import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || '',
        }
      : undefined,
  });
  return transporter;
}

export async function sendMail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const tx = getTransporter();
  const from = process.env.SMTP_FROM || 'noreply@pexen.fr';
  if (!tx) {
    console.warn('[mail] SMTP non configuré — e-mail non envoyé:', options.subject);
    return { sent: false, reason: 'SMTP non configuré' };
  }
  await tx.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
  return { sent: true };
}
