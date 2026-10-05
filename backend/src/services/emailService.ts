import nodemailer from 'nodemailer';

import {
  env,
} from '../config/env.js';

function getTransporter() {
  if (
    !env.email.host ||
    !env.email.port ||
    !env.email.user ||
    !env.email.appPassword
  ) {
    throw new Error(
      'Email delivery is not configured.',
    );
  }

  return nodemailer.createTransport({
    host:
      env.email.host,

    port:
      env.email.port,

    secure:
      env.email.secure,

    auth: {
      user:
        env.email.user,

      pass:
        env.email.appPassword,
    },
  });
}

export async function sendPasswordResetCode(
  recipientEmail: string,
  resetCode: string,
): Promise<void> {
  const transporter =
    getTransporter();

  const fromAddress =
    env.email.from ||
    env.email.user;

  await transporter.sendMail({
    from:
      fromAddress,

    to:
      recipientEmail,

    subject:
      'Sky Avenir Expense password reset',

    text:
      [
        'Your Sky Avenir Expense password reset code is:',
        '',
        resetCode,
        '',
        `This code expires in ${env.passwordReset.codeExpiryMinutes} minutes.`,
        '',
        'If you did not request a password reset, you can ignore this email.',
      ].join('\n'),

    html:
      `
        <div style="font-family: Arial, sans-serif; color: #173F60;">
          <h2>Sky Avenir Expense</h2>

          <p>Your password reset code is:</p>

          <div
            style="
              font-size: 28px;
              font-weight: 700;
              letter-spacing: 6px;
              margin: 20px 0;
            "
          >
            ${resetCode}
          </div>

          <p>
            This code expires in
            ${env.passwordReset.codeExpiryMinutes}
            minutes.
          </p>

          <p style="color: #71879A;">
            If you did not request a password reset,
            you can ignore this email.
          </p>
        </div>
      `,
  });
}

export async function sendEmailVerificationCode(
  recipientEmail: string,
  verificationCode: string,
): Promise<void> {
  const transporter =
    getTransporter();

  const fromAddress =
    env.email.from ||
    env.email.user;

  await transporter.sendMail({
    from:
      fromAddress,

    to:
      recipientEmail,

    subject:
      'Verify your Sky Avenir Expense account',

    text:
      [
        'Welcome to Sky Avenir Expense.',
        '',
        'Your email verification code is:',
        '',
        verificationCode,
        '',
        `This code expires in ${env.emailVerification.codeExpiryMinutes} minutes.`,
        '',
        'If you did not create this account, you can ignore this email.',
      ].join('\n'),

    html:
      `
        <div style="font-family: Arial, sans-serif; color: #173F60;">
          <h2>Sky Avenir Expense</h2>

          <p>
            Welcome to Sky Avenir Expense.
          </p>

          <p>
            Your email verification code is:
          </p>

          <div
            style="
              font-size: 28px;
              font-weight: 700;
              letter-spacing: 6px;
              margin: 20px 0;
            "
          >
            ${verificationCode}
          </div>

          <p>
            This code expires in
            ${env.emailVerification.codeExpiryMinutes}
            minutes.
          </p>

          <p style="color: #71879A;">
            If you did not create this account,
            you can ignore this email.
          </p>
        </div>
      `,
  });
}