import { PrintProps } from "@type/app";

const statusConfig = (status: string | undefined) => {
  switch (status) {
    case "success":
      return { label: "Successful", color: "#16a34a", bg: "#dcfce7", dot: "#16a34a" };
    case "failed":
      return { label: "Failed",     color: "#dc2626", bg: "#fee2e2", dot: "#dc2626" };
    case "submitted":
    case "processing":
    case "pending":
      return { label: "Processing", color: "#d97706", bg: "#fef3c7", dot: "#d97706" };
    case "refunded":
      return { label: "Refunded",   color: "#7c3aed", bg: "#ede9fe", dot: "#7c3aed" };
    default:
      return { label: "Successful", color: "#16a34a", bg: "#dcfce7", dot: "#16a34a" };
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
  const person   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  const bank     = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V9l9-7 9 7v13"/><path d="M6 22V12h4v10M14 22V12h4v10"/><path d="M3 22h18"/></svg>`;
  const card     = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;
  const link     = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
  const calendar = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const chat     = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  const send     = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  const cash     = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>`;
  const bolt     = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
  const info     = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

  if (l.includes("recipient") || l.includes("beneficiary name") || l.includes("received by")) return person;
  if (l.includes("sender"))     return send;
  if (l.includes("bank"))       return bank;
  if (l.includes("account"))    return card;
  if (l.includes("reference") || l.includes("session") || l.includes("id")) return link;
  if (l.includes("date") || l.includes("time")) return calendar;
  if (l.includes("narration") || l.includes("description")) return chat;
  if (l.includes("amount") || l.includes("fee") || l.includes("total")) return cash;
  if (l.includes("token"))      return bolt;
  return info;
};

const fmt = (n: number | null | undefined) =>
  n != null ? `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "—";

export default function generateHTMLContent(pageData: PrintProps): string {
  const sc        = statusConfig(pageData.paymentStatus ?? (pageData.status as string));
  const typeLabel = receiptTypeLabel(pageData.receiptType);
  const td        = pageData.transferDetails;
  const isTransfer = pageData.receiptType === "transfer" && td;

  // ── Amount shown in header: total charged (transfer + fee) for transfers ──
  const totalCharged = isTransfer && td
    ? (Number(td.transfer_amount ?? 0) + Number(td.service_fee ?? 0))
    : null;

  const headerAmount = totalCharged != null
    ? fmt(totalCharged)
    : (pageData.amount ? `₦${Number(pageData.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "");

  // ── Status icon ───────────────────────────────────────────────────────────
  const statusIconSVG = sc.color === "#16a34a"
    ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : sc.color === "#dc2626"
    ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
    : sc.color === "#7c3aed"
    ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`
    : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  // ── Build detail rows ────────────────────────────────────────────────────
  let detailRowsHTML = "";
  let feeBlockHTML   = "";
  let recipientHTML  = "";

  if (isTransfer && td) {
    // Recipient card
    recipientHTML = `
      <div class="recipient-card">
        <div class="recipient-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d1b4b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div class="recipient-info">
          <div class="recipient-name">${td.beneficiary_name ?? "—"}</div>
          <div class="recipient-sub">${td.bank_name ?? ""} · ${td.beneficiary_account ?? ""}</div>
        </div>
      </div>`;

    // Transaction info rows — compact
    const infoRows = [
      td.sender_name   ? { label: "Sender",      value: td.sender_name,   icon: "sender" }   : null,
      td.session_id    ? { label: "Session ID",   value: td.session_id,    icon: "session id", copyable: true } : null,
      td.narration     ? { label: "Narration",    value: td.narration,     icon: "narration" } : null,
      { label: "Date", value: pageData.transactionDate.split(" ").slice(0, 3).join(" ") + " " + pageData.transactionDate.split(" ").slice(3).join(" "), icon: "date" },
      td.reference     ? { label: "Reference ID", value: td.reference,     icon: "reference id", copyable: true } : null,
    ].filter(Boolean) as { label: string; value: string; icon: string; copyable?: boolean }[];

    detailRowsHTML = infoRows.map(row => `
      <div class="info-row">
        <span class="info-icon">${rowIconSVG(row.icon)}</span>
        <span class="info-label">${row.label}</span>
        <span class="info-value ${row.copyable ? "copyable" : ""}">${row.value}</span>
      </div>`).join("");

    // Fee breakdown block
    const hasFee = td.service_fee && Number(td.service_fee) > 0;
    feeBlockHTML = `
      <div class="fee-block">
        <div class="fee-row">
          <span class="fee-label">Transfer Amount</span>
          <span class="fee-value">${fmt(td.transfer_amount)}</span>
        </div>
        ${hasFee ? `
        <div class="fee-row">
          <span class="fee-label">Transaction Fee</span>
          <span class="fee-value fee-negative">−${fmt(td.service_fee)}</span>
        </div>` : `
        <div class="fee-row">
          <span class="fee-label">Transaction Fee</span>
          <span class="fee-value fee-free">Free</span>
        </div>`}
        <div class="fee-divider"></div>
        <div class="fee-row fee-total-row">
          <span class="fee-total-label">Total Charged</span>
          <span class="fee-total-value">${fmt(totalCharged)}</span>
        </div>
      </div>`;

  } else {
    // Non-transfer: electricity token highlight or generic details
    const rows = pageData.receiptType === "electricity" && pageData.hasHighlighted
      ? [...(pageData.transactionDetails ?? []), { label: "Token", value: pageData.hasHighlighted.value, highlight: true, copyable: true }]
      : (pageData.transactionDetails ?? []);

    detailRowsHTML = rows.map(row => `
      <div class="info-row ${(row as any).highlight ? "highlight-row" : ""}">
        <span class="info-icon">${rowIconSVG(row.label)}</span>
        <span class="info-label">${row.label}</span>
        <span class="info-value ${(row as any).copyable ? "copyable" : ""} ${(row as any).highlight ? "token-value" : ""}">${row.value}</span>
      </div>`).join("");
  }

  const providerLogoHTML = pageData.logo
    ? `<img src="${pageData.logo}" alt="Provider" height="40" width="40" style="display:inline-block; border-radius:10px; object-fit:contain; vertical-align:middle; margin-right:8px;" onerror="this.style.display='none'" />`
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
      background: #f0f4ff;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 20px 12px 40px;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 2px 20px rgba(13,27,75,0.08);
      overflow: hidden;
      margin: 0 auto;
    }

    /* ── Compact header ── */
    .card-header {
      padding: 20px 20px 16px;
      text-align: center;
      border-bottom: 1px solid #f0f0f0;
      background: #fff;
    }
    .logo-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .logo { height: 26px; }
    .type-chip {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      background: #f3f4f6;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.3px;
    }
    .status-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .status-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .status-label {
      font-size: 15px;
      font-weight: 700;
    }
    .header-amount {
      font-size: 32px;
      font-weight: 800;
      color: #0d1b4b;
      letter-spacing: -1px;
      line-height: 1.1;
      margin-bottom: 2px;
    }
    .header-sub {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 4px;
    }

    /* ── Recipient card ── */
    .recipient-section {
      padding: 14px 16px;
      border-bottom: 1px solid #f0f0f0;
    }
    .section-label {
      font-size: 10px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    }
    .recipient-card {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .recipient-icon {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: #EEF3FF;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .recipient-name {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
    }
    .recipient-sub {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
    }

    /* ── Info rows ── */
    .info-section {
      padding: 4px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-section-label {
      font-size: 10px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 12px 16px 4px;
    }
    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 16px;
      border-bottom: 1px solid #f9fafb;
    }
    .info-row:last-child { border-bottom: none; }
    .highlight-row { background: #fffbeb; }
    .info-icon { flex-shrink: 0; width: 16px; display: flex; align-items: center; }
    .info-label { font-size: 12px; color: #6b7280; flex: 1; }
    .info-value { font-size: 12px; font-weight: 600; color: #111827; text-align: right; max-width: 58%; word-break: break-all; }
    .copyable { color: #1a3a8a; }
    .token-value { color: #b45309; font-weight: 700; font-size: 13px; letter-spacing: 1px; }

    /* ── Fee block ── */
    .fee-block {
      padding: 12px 16px 14px;
      background: #f8f9fb;
      border-bottom: 1px solid #f0f0f0;
    }
    .fee-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
    }
    .fee-label { font-size: 12px; color: #6b7280; }
    .fee-value { font-size: 12px; font-weight: 600; color: #374151; }
    .fee-negative { color: #dc2626; }
    .fee-free { color: #16a34a; }
    .fee-divider { height: 1px; background: #e5e7eb; margin: 8px 0; }
    .fee-total-row { margin-top: 2px; }
    .fee-total-label { font-size: 13px; font-weight: 700; color: #0d1b4b; }
    .fee-total-value { font-size: 15px; font-weight: 800; color: #0d1b4b; }

    /* ── Footer ── */
    .card-footer {
      padding: 14px 16px;
      text-align: center;
      background: #fff;
    }
    .footer-thank { font-size: 12px; color: #374151; margin-bottom: 4px; }
    .footer-powered { font-size: 10px; color: #9ca3af; display: flex; align-items: center; justify-content: center; gap: 4px; }
    .footer-copy { font-size: 9px; color: #d1d5db; letter-spacing: 1px; text-transform: uppercase; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="card">

    <!-- Compact header -->
    <div class="card-header">
      <div class="logo-bar">
        <div style="display:flex;align-items:center;">
          ${providerLogoHTML}
          <img class="logo" src="${pageData.appLogo}" alt="BinaPay" />
        </div>
        <span class="type-chip">${typeLabel}</span>
      </div>
      <div class="status-row">
        <div class="status-dot" style="background:${sc.color};">${statusIconSVG}</div>
        <span class="status-label" style="color:${sc.color};">${sc.label}</span>
      </div>
      ${headerAmount ? `<div class="header-amount">${headerAmount}</div>` : ""}
      <div class="header-sub">${pageData.transactionDate}</div>
    </div>

    <!-- Recipient (transfer only) -->
    ${recipientHTML ? `
    <div class="recipient-section">
      <div class="section-label">To</div>
      ${recipientHTML}
    </div>` : ""}

    <!-- Transaction info rows -->
    ${detailRowsHTML ? `
    <div class="info-section">
      <div class="info-section-label">Transaction Info</div>
      ${detailRowsHTML}
    </div>` : ""}

    <!-- Fee breakdown (transfer only) -->
    ${feeBlockHTML}

    <!-- Footer -->
    <div class="card-footer">
      <p class="footer-thank">Thank you for using BinaPay 💙</p>
      <p class="footer-powered">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Powered by BinaPay Secure
      </p>
      <p class="footer-copy">&copy; ${new Date().getFullYear()} BinaPay Financial Services</p>
    </div>

  </div>
</body>
</html>`;
}
