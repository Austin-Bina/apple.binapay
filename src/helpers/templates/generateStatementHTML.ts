import { StatementGenerateResponse } from "@store/redux-api/statementApi";

const CATEGORY_COLORS: Record<string, string> = {
  "Transfer":            "#2563EB",
  "Crypto Transactions": "#16a34a",
  "Data Bundle":         "#7c3aed",
  "Airtime":             "#d97706",
  "Electricity":         "#ea580c",
  "Cable TV":            "#db2777",
  "Other":               "#6b7280",
};

// ── SVG icons (same style as receipt template) ──────────────────────────────
const ICONS = {
  person:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  card:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  email:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  bank:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V9l9-7 9 7v13"/><path d="M6 22V12h4v10M14 22V12h4v10"/><path d="M3 22h18"/></svg>`,
  hash:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
  currency:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  shield:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d1b4b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  doc:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  bar:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
};

export default function generateStatementHTML(
  data: StatementGenerateResponse,
  appLogo?: string,
): string {
  const {
    user, summary, transactions, category_summary,
    statement_id, generated_at, period, from, to,
  } = data;

  const totalTx  = transactions.length;
  const creditTx = transactions.filter(t => t.is_credit).length;
  const debitTx  = transactions.filter(t => !t.is_credit).length;
  const maxCount = Math.max(...category_summary.map(c => c.count), 1);

  // ── Transaction rows ────────────────────────────────────────────────────────
  const txRowsHTML = transactions.map((tx, i) => {
    // Use tx.currency if available (added in updated StatementService), else default NGN
    const currency = (tx as any).currency ?? "NGN";
    const symbol   = currency === "NGN" ? "₦" : "";
    const suffix   = currency !== "NGN" ? ` ${currency}` : "";
    return `
    <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8f9fb"};">
      <td style="padding:10px 12px;font-size:11px;color:#374151;white-space:nowrap;">
        ${tx.date}
        <br/><span style="font-size:10px;color:#6b7280;">${tx.time}</span>
      </td>
      <td style="padding:10px 12px;font-size:11px;color:#111827;">${tx.description}</td>
      <td style="padding:10px 12px;font-size:10px;color:#6b7280;font-family:monospace;word-break:break-all;max-width:120px;">${tx.reference}</td>
      <td style="padding:10px 12px;text-align:center;">
        <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;
          background:${tx.is_credit ? "#dcfce7" : "#fee2e2"};
          color:${tx.is_credit ? "#16a34a" : "#dc2626"};">${tx.type}</span>
      </td>
      <td style="padding:10px 12px;font-size:12px;font-weight:700;text-align:right;
        color:${tx.is_credit ? "#16a34a" : "#dc2626"};">
        ${tx.is_credit ? "+" : "-"}${symbol}${tx.amount}${suffix}
      </td>
    </tr>`;
  }).join("");

  // ── Category bars ───────────────────────────────────────────────────────────
  const categoryRowsHTML = category_summary.map(cat => {
    const color    = CATEGORY_COLORS[cat.category] ?? "#6b7280";
    const barWidth = Math.round((cat.count / maxCount) * 100);
    return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:28px;height:28px;border-radius:8px;background:${color}20;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <div style="width:10px;height:10px;border-radius:50%;background:${color};"></div>
        </div>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span style="font-size:12px;color:#374151;font-weight:500;">${cat.category}</span>
            <span style="font-size:12px;font-weight:700;color:#111827;">${cat.count} <span style="color:#9ca3af;font-weight:400;">(${cat.percentage}%)</span></span>
          </div>
          <div style="height:6px;background:#f3f4f6;border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${barWidth}%;background:${color};border-radius:3px;"></div>
          </div>
        </div>
      </div>`;
  }).join("");

  // ── Logo: use appLogo if provided, else text fallback ───────────────────────
  const logoHTML = appLogo
    ? `<img src="${appLogo}" alt="BinaPay" height="36" style="display:inline-block;vertical-align:middle;" />`
    : `<span style="font-size:22px;font-weight:800;color:#0d1b4b;letter-spacing:-0.5px;">BinaPay</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>BinaPay Statement</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; background:#f0f4ff; color:#111827; }
    .page { max-width:820px; margin:0 auto; background:#fff; }

    /* ── Top header ── */
    .top-header {
      display:flex; justify-content:space-between; align-items:flex-start;
      padding:28px 32px 22px; border-bottom:3px solid #0d1b4b;
    }
    .brand { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
    .statement-title { font-size:28px; font-weight:800; color:#0d1b4b; margin-bottom:4px; }
    .statement-subtitle { font-size:12px; color:#6b7280; }
    .statement-meta { text-align:right; }
    .meta-label { font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
    .meta-value { font-size:13px; font-weight:700; color:#0d1b4b; }

    /* ── Info cards row ── */
    .cards-row { display:flex; gap:16px; padding:20px 32px; }
    .info-card { flex:1; background:#f8f9fb; border:1px solid #e5e7eb; border-radius:12px; padding:16px; }
    .summary-card { flex:1; background:#f8f9fb; border:1px solid #e5e7eb; border-radius:12px; padding:16px; }
    .card-title {
      font-size:11px; font-weight:700; color:#2563EB;
      text-transform:uppercase; letter-spacing:0.5px;
      margin-bottom:14px;
      display:flex; align-items:center; gap:7px;
    }
    .info-row {
      display:flex; align-items:center; gap:10px;
      padding:7px 0; border-bottom:1px solid #f0f0f0;
    }
    .info-row:last-child { border-bottom:none; }
    .info-icon {
      width:24px; height:24px; background:#EEF3FF;
      border-radius:7px; display:flex; align-items:center;
      justify-content:center; flex-shrink:0;
    }
    .info-label { font-size:11px; color:#6b7280; flex:1; }
    .info-value { font-size:11px; font-weight:600; color:#111827; text-align:right; max-width:55%; }

    /* ── Summary card specifics ── */
    .summary-row {
      display:flex; justify-content:space-between;
      align-items:center; padding:9px 0; border-bottom:1px solid #f0f0f0;
    }
    .summary-row:last-child { border-bottom:none; }
    .summary-label { font-size:12px; color:#374151; }
    .summary-value { font-size:13px; font-weight:700; color:#111827; }
    .closing-row {
      background:#EEF3FF; border-radius:8px;
      padding:12px 14px; margin-top:10px;
      display:flex; justify-content:space-between; align-items:center;
    }

    /* ── Transaction table ── */
    .section { padding:0 32px 28px; }
    .section-title {
      font-size:13px; font-weight:700; color:#2563EB;
      display:flex; align-items:center; gap:8px;
      margin-bottom:14px; padding-top:22px; border-top:1px solid #f0f0f0;
    }
    .tx-table { width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; }
    .tx-table thead tr { background:#0d1b4b; }
    .tx-table thead th { padding:11px 12px; font-size:11px; font-weight:600; color:#fff; text-align:left; }
    .tx-table td { border-bottom:1px solid #f0f0f0; vertical-align:top; }
    .tx-table tr:last-child td { border-bottom:none; }

    /* ── Category + info ── */
    .bottom-section { padding:0 32px 28px; }
    .category-grid { display:flex; gap:24px; }
    .category-col { flex:1; }
    .info-panel {
      width:220px; background:#f8f9fb;
      border:1px solid #e5e7eb; border-radius:12px; padding:16px;
    }
    .note-box {
      background:#EEF3FF; border-left:3px solid #2563EB;
      padding:10px 14px; border-radius:0 6px 6px 0; margin-bottom:14px;
      font-size:11px; color:#374151; line-height:1.6;
    }
    .contact-row { font-size:11px; color:#374151; margin-bottom:5px; display:flex; align-items:center; gap:6px; }

    /* ── Footer ── */
    .footer {
      padding:20px 32px; border-top:1px solid #e5e7eb;
      display:flex; justify-content:space-between; align-items:center;
      background:#f8f9fb;
    }
    .footer-note { font-size:10px; color:#9ca3af; max-width:300px; line-height:1.7; }
    .footer-secure { display:flex; align-items:center; gap:8px; }
    .footer-secure-text { font-size:11px; font-weight:700; color:#0d1b4b; }
    .footer-contact { font-size:10px; color:#6b7280; margin-top:3px; }
  </style>
</head>
<body>
<div class="page">

  <!-- ── Top header ── -->
  <div class="top-header">
    <div>
      <div class="brand">${logoHTML}</div>
      <div class="statement-title">Statement of Account</div>
      <div class="statement-subtitle">For the period ${from} &ndash; ${to}</div>
    </div>
    <div class="statement-meta">
      <div class="meta-label">Generated</div>
      <div class="meta-value" style="margin-bottom:12px;">${generated_at}</div>
      <div class="meta-label">Statement ID</div>
      <div class="meta-value">${statement_id}</div>
    </div>
  </div>

  <!-- ── Account info + Summary ── -->
  <div class="cards-row">

    <!-- Account Information -->
    <div class="info-card">
      <div class="card-title">
        ${ICONS.person}
        Account Information
      </div>
      <div class="info-row">
        <div class="info-icon">${ICONS.person}</div>
        <span class="info-label">Account Holder</span>
        <span class="info-value">${user.name}</span>
      </div>
      <div class="info-row">
        <div class="info-icon">${ICONS.bank}</div>
        <span class="info-label">Bank</span>
        <span class="info-value">${user.bank_name}</span>
      </div>
      <div class="info-row">
        <div class="info-icon">${ICONS.card}</div>
        <span class="info-label">Account Number</span>
        <span class="info-value">${user.account_number}</span>
      </div>
      <div class="info-row">
        <div class="info-icon">${ICONS.email}</div>
        <span class="info-label">Email</span>
        <span class="info-value" style="font-size:10px;">${user.email}</span>
      </div>
      <div class="info-row">
        <div class="info-icon">${ICONS.currency}</div>
        <span class="info-label">Currency</span>
        <span class="info-value">NGN (Nigerian Naira)</span>
      </div>
    </div>

    <!-- Statement Summary -->
    <div class="summary-card">
      <div class="card-title">
        ${ICONS.bar}
        Statement Summary
      </div>
      <div class="summary-row">
        <span class="summary-label">Opening Balance</span>
        <span class="summary-value">&#8358;${summary.opening_balance}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Total Credits</span>
        <span class="summary-value" style="color:#16a34a;">&#8358;${summary.total_credit}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Total Debits</span>
        <span class="summary-value" style="color:#dc2626;">&#8358;${summary.total_debit}</span>
      </div>
      <div class="closing-row">
        <span style="font-size:13px;font-weight:700;color:#0d1b4b;">Closing Balance</span>
        <span style="font-size:17px;font-weight:800;color:#2563EB;">&#8358;${summary.closing_balance}</span>
      </div>
      <div style="height:14px;"></div>
      <div class="summary-row">
        <span class="summary-label" style="color:#2563EB;font-weight:600;">Total Transactions</span>
        <span class="summary-value" style="color:#2563EB;">${totalTx}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label" style="color:#16a34a;font-weight:600;">Credits</span>
        <span class="summary-value" style="color:#16a34a;">${creditTx}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label" style="color:#dc2626;font-weight:600;">Debits</span>
        <span class="summary-value" style="color:#dc2626;">${debitTx}</span>
      </div>
    </div>
  </div>

  <!-- ── Transaction History ── -->
  <div class="section">
    <div class="section-title">
      ${ICONS.doc}
      Transaction History
    </div>
    <table class="tx-table">
      <thead>
        <tr>
          <th style="width:110px;">Date &amp; Time</th>
          <th>Description</th>
          <th style="width:130px;">Reference</th>
          <th style="width:70px;text-align:center;">Type</th>
          <th style="width:110px;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${txRowsHTML}
      </tbody>
    </table>
    ${transactions.length === 0
      ? '<div style="text-align:center;padding:28px;color:#9ca3af;font-size:13px;">No transactions found for this period.</div>'
      : ""}
  </div>

  <!-- ── Category Summary + Contact ── -->
  <div class="bottom-section">
    <div class="category-grid">
      <div class="category-col">
        <div class="section-title" style="padding-top:0;border-top:none;margin-bottom:16px;">
          ${ICONS.bar}
          Transaction Type Breakdown
        </div>
        ${categoryRowsHTML}
      </div>
      <div class="info-panel">
        <div class="note-box">
          This is a system-generated statement.
        </div>
        <div style="margin-bottom:12px;">
          <div style="font-size:11px;font-weight:700;color:#0d1b4b;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
            ${ICONS.shield}
            BinaPay Secure
          </div>
          <div style="font-size:11px;color:#6b7280;line-height:1.6;">Thank you for banking with BinaPay.</div>
        </div>
        <div class="contact-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          www.binapay.co
        </div>
        <div class="contact-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          support@binapay.co
        </div>
        <div class="contact-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.55 5.55l.96-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/></svg>
          0704 058 7298
        </div>
      </div>
    </div>
  </div>

  <!-- ── Footer ── -->
  <div class="footer">
    <div class="footer-note">
      Note: NGN balances reflect naira wallet transactions only. Crypto transactions are shown for reference.
      <div style="margin-top:4px;font-size:9px;color:#d1d5db;">
        &copy; ${new Date().getFullYear()} BinaPay &middot; All rights reserved
      </div>
    </div>
    <div class="footer-secure">
      ${ICONS.shield}
      <div>
        <div class="footer-secure-text">BinaPay Secure</div>
        <div class="footer-contact">Generated: ${generated_at}</div>
      </div>
    </div>
  </div>

</div>
</body>
</html>`;
}
