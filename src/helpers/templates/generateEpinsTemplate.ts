export const generateEpinsTemplate = (pageData: any) => {
  const epins: any[] = pageData.epins || [];

  // Split into pages of 30 (3 columns × 10 rows)
  const pages: any[][] = [];
  for (let i = 0; i < epins.length; i += 30) {
    pages.push(epins.slice(i, i + 30));
  }

  const renderCard = (epin: any) => {
      const logo = pageData.logo ?? null; 

    return `
      <div class="card">
        <div class="header">
          ${logo ? `<img src="${logo}" class="logo" />` : ""}
          <div class="title">₦${epin.amount} ${epin.business_name || pageData.business_name || ""}</div>
        </div>
        <div class="pin-block">
       <span class="pin-label">PIN:</span>
      <span class="pin-value">${epin.pin}</span>
      </div>
        <div class="line">
          <span class="label">Serial:</span>
          <span class="value">${epin.serial}</span>
        </div>
        <div class="dial">Dial *311*PIN#</div>
      </div>
    `;
  };

  const renderPage = (pageEpins: any[], isLast: boolean) => `
    <div class="grid${isLast ? "" : " page-break"}">
      ${pageEpins.map(renderCard).join("")}
    </div>
  `;

  return `
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>E-PIN Receipts</title>

        <style type="text/css">
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          * { box-sizing: border-box; }

          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(10, 1fr);
            height: 257mm;
            gap: 7px;
          }

          .page-break {
            page-break-before: always;
          }

          .card {
            border: 1px solid #000;
            padding: 5px;
            height: 100%;
            background-color: white;
            overflow: hidden;
          }

          .header {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-bottom: 4px;
          }

          .logo {
            width: 20px;
            height: 20px;
            object-fit: contain;
          }

          .title {
            font-size: 11px;
            font-weight: bold;
          }

          .line {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            margin-bottom: 2px;
          }

          .label { font-weight: bold; }

          .value {
  font-weight: bold;
  white-space: nowrap;
}

.pin-block {
  margin: 2px 0 3px 0;
}

.pin-label {
  font-size: 9px;
  font-weight: bold;
  color: #333;
  vertical-align: middle;
}

.pin-value {
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 1.5px;
  line-height: 1.2;
  color: #000;
  vertical-align: middle;
}

          .dial {
            font-size: 10px;
            margin: 2px 0 0 0;
            line-height: 1;
          }
        </style>
      </head>
      <body>
        ${pages.map((pageEpins, index) =>
          renderPage(pageEpins, index === pages.length - 1)
        ).join("")}
      </body>
    </html>
  `;
};
