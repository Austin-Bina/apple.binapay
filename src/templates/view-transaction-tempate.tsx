import { PrintProps } from "@type/app";

export default function generateHTMLContent(pageData: PrintProps) {
  return `
  <html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Transaction Receipt</title>

    <style type="text/css">
      * {
        box-sizing: border-box;
      }
      body {
        font-family: Arial, sans-serif;
        padding: 16px;
        background-color: #f9fafb;
        color: #1f2937;
        margin: 0;
      }
      .header {
        max-width: 640px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 16px 0;
        text-align: center;
      }
      .header img {
        height: 60px;
        margin-bottom: 8px;
      }
      .header .transaction-date {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 12px;
      }
      .header .title {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 16px;
      }
      .watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 100px;
        font-weight: bold;
        color: #3B82F6;
        text-align: center;
        z-index: -1;
        white-space: nowrap;
        opacity: 0.3;
      }
      .container {
        max-width: 640px;
        margin: 0 auto;
        padding: 32px;
      }
      .details {
        margin: 24px 0;
      }
      .details div {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
      }
      .details .label {
        font-weight: bold;
        color: #1d4ed8;
      }
      .details .value {
        color: #111827;
        text-align: right;
      }
        .transaction-description {
        font-size: 14px;
          color: #6b7280;
          margin-top: 16px;
          text-align: center;
    }
      .footer {
        text-align: center;
        margin-top: 32px;
        font-size: 14px;
        color: #6b7280;
        padding-top: 20px;
      }
      .footer a {
        color: #1e3a8a;
        text-decoration: none;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="${pageData.appLogo}" alt="BinaPay Logo" />
      <div class="transaction-date">${pageData.transactionDate}</div>
      <div class="title">${pageData.transactionTitle}</div>
    </div>
    <div class="watermark">BinaPay</div>
    <div class="container">
      <img src="${pageData.logo}" alt="Provider Logo" height="60" width="60" style="display:block; margin: 0 auto 24px;" />

      ${
        pageData.hasDetails
          ? `
        <div class="details">
          ${pageData.transactionDetails
            .map(
              (item) => `
            <div>
              <span class="label">${item.label}:</span>
              <span class="value">${item.value}</span>
            </div>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }

      ${
        pageData.hasDetails
          ? `
        <p class="transaction-description">${pageData.transactionDescription}</p>
    `
          : ""
      }
    </div>

    <div class="footer">
      <p>Need help? Contact our support team at <a href="mailto:support@binapay.co">support@binapay.co</a></p>
      <p>${pageData.promotionalText}</p>
      <p>&copy; ${new Date().getFullYear()} BinaPay. All rights reserved.</p>
    </div>
  </body>
</html>
  `;
}
