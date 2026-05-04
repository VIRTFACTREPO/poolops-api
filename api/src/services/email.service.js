import { Resend } from 'resend';
import { env } from '../config/env.js';

const FROM_EMAIL = 'PoolOps <noreply@mail.virtuality.co.nz>';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cardHtml({ title, body, ctaLabel, ctaUrl, footer }) {
  return `
  <div style="margin:0;padding:24px;background:#F3F4F6;font-family:Inter,Arial,sans-serif;color:#111827;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:24px;">
      <h2 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${title}</h2>
      <div style="font-size:14px;line-height:1.6;color:#374151;">${body}</div>
      ${ctaUrl ? `<div style="margin-top:20px;"><a href="${ctaUrl}" style="display:inline-block;background:#0EA5E9;color:#fff;text-decoration:none;padding:11px 16px;border-radius:10px;font-weight:600;">${ctaLabel || 'Open PoolOps'}</a></div>` : ''}
      ${footer ? `<div style="margin-top:18px;font-size:12px;color:#6B7280;">${footer}</div>` : ''}
    </div>
  </div>`;
}

async function sendTemplate({ template, to, subject, html }) {
  if (!env.RESEND_ENABLED || !env.RESEND_API_KEY) {
    console.log(`[email] stub ${template}`);
    return { sent: false, mode: 'stub' };
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) throw new Error(error.message || `Failed to send ${template}`);

  console.log(`[email] sent ${template} to ${to}`);
  return { sent: true, id: data?.id };
}

export async function sendTechnicianInviteEmail({ to, name, companyName, token }) {
  const setPasswordUrl = `${env.APP_URL}/set-password?token=${encodeURIComponent(token)}`;
  const html = cardHtml({
    title: `You've been invited to PoolOps`,
    body: `<p>Hi ${escapeHtml(name || 'there')},</p><p>${escapeHtml(companyName || 'A PoolOps company')} invited you as a technician.</p><p>Use the button below to set your password and access your schedule.</p>`,
    ctaLabel: 'Set password',
    ctaUrl: setPasswordUrl,
    footer: `If the button doesn’t work, use this link:<br>${escapeHtml(setPasswordUrl)}`,
  });

  return sendTemplate({ template: 'technician_invite', to, subject: `You've been invited to PoolOps`, html });
}

export async function sendOwnerInviteEmail({ to, ownerName, companyName, token }) {
  const html = cardHtml({
    title: 'Your pool is on PoolOps',
    body: `<p>Hi ${escapeHtml(ownerName || 'there')},</p><p>${escapeHtml(companyName || 'Your service company')} has added your account to PoolOps.</p><p>Your invite code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:1px;margin:10px 0;">${escapeHtml(token)}</p><p>Download links (coming soon): App Store / Google Play.</p>`,
    ctaLabel: 'Open PoolOps',
    ctaUrl: env.APP_URL,
  });

  return sendTemplate({ template: 'owner_invite', to, subject: 'Your pool is on PoolOps', html });
}

export async function sendPasswordResetEmail({ to, resetLink }) {
  const html = cardHtml({
    title: 'Reset your PoolOps password',
    body: '<p>We received a request to reset your password.</p><p>This link expires in 1 hour.</p>',
    ctaLabel: 'Reset password',
    ctaUrl: resetLink,
    footer: `If you did not request this, you can safely ignore this email.<br>${escapeHtml(resetLink)}`,
  });

  return sendTemplate({ template: 'password_reset', to, subject: 'Reset your PoolOps password', html });
}

export async function sendServiceReportEmail({ to, poolAddress, date, technicianName, readings, chemicalsAdded, notes }) {
  const html = cardHtml({
    title: `Service complete — ${escapeHtml(poolAddress || 'Pool')}`,
    body: `<p><strong>Date:</strong> ${escapeHtml(date || '')}</p><p><strong>Technician:</strong> ${escapeHtml(technicianName || '')}</p><p><strong>Readings:</strong><br>pH ${escapeHtml(readings?.ph ?? '—')} · Chlorine ${escapeHtml(readings?.chlorine ?? '—')} · Alkalinity ${escapeHtml(readings?.alkalinity ?? '—')}</p><p><strong>Chemicals added:</strong> ${escapeHtml(chemicalsAdded || 'None')}</p><p><strong>Notes:</strong> ${escapeHtml(notes || '—')}</p>`,
    ctaLabel: 'View report',
    ctaUrl: env.APP_URL,
  });

  return sendTemplate({ template: 'service_report', to, subject: `Service complete — ${poolAddress || 'Pool'}`, html });
}

export async function sendBookingConfirmedEmail({ to, date, technicianName, poolAddress }) {
  const html = cardHtml({
    title: `Visit confirmed — ${escapeHtml(date || '')}`,
    body: `<p>Your upcoming pool visit is booked.</p><p><strong>Date:</strong> ${escapeHtml(date || '')}<br><strong>Technician:</strong> ${escapeHtml(technicianName || 'Assigned technician')}<br><strong>Pool address:</strong> ${escapeHtml(poolAddress || '')}</p>`,
    ctaLabel: 'Open schedule',
    ctaUrl: env.APP_URL,
  });

  return sendTemplate({ template: 'booking_confirmed', to, subject: `Visit confirmed — ${date || ''}`, html });
}

export async function sendFlaggedAlertEmail({ to, poolAddress, readings, flagReason }) {
  const html = cardHtml({
    title: `⚠ Flagged reading — ${escapeHtml(poolAddress || 'Pool')}`,
    body: `<p>A reading has been flagged and needs attention.</p><p><strong>Pool address:</strong> ${escapeHtml(poolAddress || '')}</p><p><strong>Readings:</strong><br>pH ${escapeHtml(readings?.ph ?? '—')} · Chlorine ${escapeHtml(readings?.chlorine ?? '—')} · Alkalinity ${escapeHtml(readings?.alkalinity ?? '—')}</p><p><strong>Flag reason:</strong> ${escapeHtml(flagReason || '')}</p>`,
    ctaLabel: 'Review now',
    ctaUrl: env.APP_URL,
  });

  return sendTemplate({ template: 'flagged_alert', to, subject: `⚠ Flagged reading — ${poolAddress || 'Pool'}`, html });
}
