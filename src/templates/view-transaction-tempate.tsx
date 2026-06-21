import { PrintProps } from "@type/app";

const statusConfig = (status: string | undefined) => {
  switch (status) {
    case "success":
      return { label: "Successful", color: "#16a34a", bg: "#dcfce7" };
    case "failed":
      return { label: "Failed",     color: "#dc2626", bg: "#fee2e2" };
    case "submitted":
    case "processing":
    case "pending":
      return { label: "Processing", color: "#d97706", bg: "#fef3c7" };
    default:
      return { label: "Successful", color: "#16a34a", bg: "#dcfce7" };
  }
};

const receiptTypeLabel = (type: string | undefined) => {
  switch (type) {
    case "transfer":    return "Bank Transfer";
    case "airtime":     return "Airtime Top-up";
    case "data":        return "Data Purchase";
    case "electricity": return "Electricity Bill";
    case "cable":       return "Cable Subscription";
    case "crypto":      return "Crypto Transaction";
    default:            return "Transaction";
  }
};

const rowIconSVG = (label: string): string => {
  const l = label.toLowerCase();
  const person   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  const bank     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V9l9-7 9 7v13"/><path d="M6 22V12h4v10M14 22V12h4v10"/><path d="M3 22h18"/></svg>`;
  const card     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;
  const link     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
  const calendar = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const clock    = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  const chat     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  const send     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  const cash     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>`;
  const bolt     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
  const phone    = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.55 5.55l.96-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/></svg>`;
  const info     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

  if (l.includes("recipient") || l.includes("beneficiary name") || l.includes("received by")) return person;
  if (l.includes("sender"))     return send;
  if (l.includes("bank"))       return bank;
  if (l.includes("account"))    return card;
  if (l.includes("reference") || l.includes("session") || l.includes("id")) return link;
  if (l.includes("date"))       return calendar;
  if (l.includes("time"))       return clock;
  if (l.includes("narration") || l.includes("description")) return chat;
  if (l.includes("amount") || l.includes("fee") || l.includes("total")) return cash;
  if (l.includes("token"))      return bolt;
  if (l.includes("phone") || l.includes("number") || l.includes("recipient")) return phone;
  return info;
};

const buildDetailRows = (pageData: PrintProps): { label: string; value: string; highlight?: boolean; copyable?: boolean }[] => {
  const td = pageData.transferDetails;

  if (pageData.receiptType === "transfer" && td) {
    return [
      { label: "Recipient",      value: td.beneficiary_name    ?? "—" },
      { label: "Bank",           value: td.bank_name           ?? "—" },
      { label: "Account Number", value: td.beneficiary_account ?? "—" },
      { label: "Reference ID",   value: td.reference           ?? "—", copyable: true },
      ...(td.session_id ? [{ label: "Session ID", value: td.session_id, copyable: true }] : []),
      { label: "Date",           value: pageData.transactionDate.split(" ").slice(0, 3).join(" ") },
      { label: "Time",           value: pageData.transactionDate.split(" ").slice(3).join(" ") },
      ...(td.narration ? [{ label: "Narration", value: td.narration }] : []),
      ...(td.sender_name ? [{ label: "Sender Name", value: td.sender_name }] : []),
    ].filter(r => r.value && r.value !== "—");
  }

  if (pageData.receiptType === "electricity" && pageData.hasHighlighted) {
    return [
      ...pageData.transactionDetails,
      { label: "Token", value: pageData.hasHighlighted.value, highlight: true, copyable: true },
    ];
  }

  // Everything else (data, airtime, cable, crypto) — use transactionDetails as-is, same as old template
  return pageData.transactionDetails ?? [];
};

export default function generateHTMLContent(pageData: PrintProps): string {
  const sc        = statusConfig(pageData.paymentStatus ?? (pageData.status as string));
  const typeLabel = receiptTypeLabel(pageData.receiptType);
  const rows      = buildDetailRows(pageData);

  const amount = pageData.transferDetails?.amount
    ? `₦${Number(pageData.transferDetails.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
    : pageData.amount ?? "";

  const statusIconSVG = sc.color === "#16a34a"
    ? `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${sc.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : sc.color === "#dc2626"
    ? `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${sc.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
    : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${sc.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  const rowsHTML = rows.map(row => `
    <div class="detail-row ${row.highlight ? "highlight-row" : ""}">
      <span class="row-icon">${rowIconSVG(row.label)}</span>
      <span class="row-label">${row.label}</span>
      <span class="row-value ${row.copyable ? "copyable" : ""} ${row.highlight ? "token-value" : ""}">${row.value}</span>
    </div>
  `).join("");

  // pageData.logo — exactly as the old template used it, the provider logo from UtilityTransaction
  const providerLogoHTML = pageData.logo
    ? `<img src="${pageData.logo}" alt="Provider" height="60" width="60" style="display:block; border-radius:12px; object-fit:contain; margin:0 auto 16px;" onerror="this.style.display='none'" />`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BinaPay Receipt</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
      background: #EEF3FF;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 32px 16px 48px;
    }
    .card {
      background: #ffffff;
      border-radius: 24px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 4px 32px rgba(13,27,75,0.10);
      overflow: hidden;
      margin: 0 auto;
    }
    .card-header {
      padding: 32px 28px 24px;
      text-align: center;
      border-bottom: 1px solid #f0f0f0;
    }
    .logo-row { display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
    .logo { height: 36px; }
    .status-circle {
      width: 56px; height: 56px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
    }
    .status-text { font-size: 16px; font-weight: 700; margin-bottom: 10px; }
    .amount { font-size: 36px; font-weight: 800; color: #0d1b4b; letter-spacing: -1.5px; margin-bottom: 8px; }
    .type-label { font-size: 13px; color: #6b7280; font-weight: 500; }
    .details { padding: 4px 0; }
    .detail-row {
      display: flex; align-items: center; gap: 10px;
      padding: 13px 24px; border-bottom: 1px solid #f3f4f6;
    }
    .detail-row:last-child { border-bottom: none; }
    .highlight-row { background: #fffbeb; }
    .row-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .row-label { font-size: 13px; color: #6b7280; flex: 1; }
    .row-value { font-size: 13px; font-weight: 600; color: #111827; text-align: right; max-width: 55%; word-break: break-all; }
    .copyable { color: #1a3a8a; }
    .token-value { color: #b45309; font-weight: 700; font-size: 14px; letter-spacing: 1px; }
    .card-footer {
      padding: 20px 24px 24px; text-align: center;
      border-top: 1px dashed #e5e7eb; background: #f8f9fb;
    }
    .footer-thank { font-size: 13px; color: #374151; margin-bottom: 6px; }
    .footer-powered { font-size: 11px; color: #9ca3af; display: flex; align-items: center; justify-content: center; gap: 5px; margin-bottom: 12px; }
    .footer-copy { font-size: 10px; color: #d1d5db; letter-spacing: 1.2px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <div class="logo-row">
        <img class="logo" src="${pageData.appLogo}" alt="BinaPay" />
      </div>
      ${providerLogoHTML}
      <div class="status-circle" style="background:${sc.bg};">${statusIconSVG}</div>
      <div class="status-text" style="color:${sc.color};">${sc.label}</div>
      ${amount ? `<div class="amount">${amount}</div>` : ""}
      <div class="type-label">${typeLabel}</div>
    </div>

    <div class="details">${rowsHTML}</div>

    <div class="card-footer">
      <p class="footer-thank">Thank you for using BinaPay &#x1F499;</p>
      <p class="footer-powered">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Powered by BinaPay Secure
      </p>
      <p class="footer-copy">&copy; ${new Date().getFullYear()} BinaPay Financial Services</p>
    </div>
  </div>
</body>
</html>`;
}
