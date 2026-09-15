/**
 * Renders ONLY the official account-holder name (safe for all emails).
 * Full remittance details are NOT shown here — use bankDetailsBlock() on
 * finalised invoices/quotation only. Returns "" if not configured.
 */
const bankHolderBlock = () => {
  const holder = process.env.BANK_ACCOUNT_HOLDER;
  const brandName = process.env.BRAND_NAME || "Flag Journeys";
  if (!holder) return "";

  return `
  <div class="bank-box" style="margin-top:12px;border:1px solid #99f6e4;border-left:5px solid #0d9488;border-radius:12px;background-color:#f0fdfa;padding:16px;">
    <h4 style="margin:0 0 6px 0;color:#115e59;font-size:13.5px;font-weight:800;text-transform:uppercase;">🏦 Official Payment Account</h4>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#065f46;">
      Pay ONLY to Account Holder name: <strong style="color:#0f172a;">"${holder.toUpperCase()}"</strong>
    </p>
    <p style="margin:8px 0 0 0;font-size:12.5px;line-height:1.6;color:#065f46;">
      ℹ️ ${brandName} is a <strong>sister company</strong> of ${holder} — payments for your ${brandName} booking go into the official ${holder} account on its behalf.
    </p>
    <p style="margin:8px 0 0 0;font-size:12.5px;color:#065f46;">
      Full bank remittance details are shared separately by our team / on your portal. Please do not pay to any other account name.
    </p>
  </div>`;
};

/**
 * Renders the FULL bank-transfer details (account no., SWIFT, IFSC…) from env.
 * Use ONLY on finalised quotation/invoice emails & PDFs — NOT in welcome emails.
 * Reads BANK_ACCOUNT_* from env. Returns "" if not configured.
 */
const bankDetailsBlock = () => {
  const holder = process.env.BANK_ACCOUNT_HOLDER;
  const brandName = process.env.BRAND_NAME || "Flag Journeys";
  if (!holder || !process.env.BANK_ACCOUNT_NUMBER) return "";

  const bankRows = [
    ["Beneficiary Name", holder],
    ["Account Number", process.env.BANK_ACCOUNT_NUMBER],
    ["Account Type", process.env.BANK_ACCOUNT_TYPE],
    ["Bank Name", process.env.BANK_NAME],
    ["Branch Address", process.env.BANK_BRANCH_ADDRESS],
    ["SWIFT / BIC Code", process.env.BANK_SWIFT],
    ["IFSC Code", process.env.BANK_IFSC],
  ].filter(([, v]) => v);

  return `
  <div class="bank-box" style="margin-top:14px;border:1px solid #99f6e4;border-left:5px solid #0d9488;border-radius:12px;background-color:#f0fdfa;padding:16px;">
    <h4 style="margin:0 0 10px 0;color:#115e59;font-size:13.5px;font-weight:800;text-transform:uppercase;">🏦 Official Bank Transfer Details — Pay ONLY to this account</h4>
    <p style="margin:0 0 10px 0;font-size:12.5px;line-height:1.6;color:#065f46;">
      ℹ️ ${brandName} is a <strong>sister company</strong> of ${holder} — this official account accepts your ${brandName} payment on its behalf.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #99f6e4;border-radius:10px;background-color:#ffffff;overflow:hidden;">
      ${bankRows.map(([key, value]) => `
      <tr>
        <td style="padding:9px 12px;font-size:12.5px;color:#334155;font-weight:600;border-bottom:1px solid #e2e8f0;width:38%;background-color:#f0fdfa;">${key}</td>
        <td style="padding:9px 12px;font-size:13px;color:#0f172a;font-weight:700;border-bottom:1px solid #f1f5f9;font-family:Consolas,Monaco,monospace;word-break:break-all;">${value}</td>
      </tr>`).join("")}
    </table>
    <p style="margin:10px 0 0 0;font-size:12.5px;line-height:1.65;color:#065f46;">
      💡 Please write your <strong>Traveller ID</strong> in the payment remark and share the transfer receipt (UTR No.) on your portal so we can confirm your payment instantly.
      <br>🌐 International wire transfers usually take <strong>2–5 working days</strong> to reflect.
    </p>
  </div>`;
};

/**
 * RULE 1: WELCOME EMAIL (Simple English, Direct Touch + Document Vault Matched Perfectly)
 * Triggered when a new lead fills the form.
 */
export const generateTravellerEmailHTML = (name, travellerId, travelInfo, ownerEmail, ownerMobile) => {
  const brandName = process.env.BRAND_NAME || "Flag Journeys";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${brandName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      body { font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
      .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 20px; box-sizing: border-box; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); overflow: hidden; border: 1px solid #e2e8f0; }
      .header { background-color: #0f172a; padding: 35px 40px; text-align: center; border-bottom: 4px solid #f59e0b; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; }
      .header p { color: #94a3b8; margin: 8px 0 0 0; font-size: 13px; letter-spacing: 1px; }
      .content { padding: 40px; }
      .greeting { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
      .intro-text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px; }
      
      /* 👑 MANAGEMENT DESK BOX */
      .management-box { background-color: #f0f9ff; border: 1px solid #bae6fd; border-left: 5px solid #0284c7; padding: 22px; border-radius: 12px; margin: 25px 0; }
      .management-box h4 { margin: 0 0 10px 0; color: #0369a1; font-size: 15px; font-weight: 700; text-transform: uppercase; }

      /* 🔒 SECURE VAULT BOX */
      .portal-box { background-color: #f0fdfa; border: 1px solid #99f6e4; border-left: 5px solid #0d9488; padding: 22px; border-radius: 12px; margin: 25px 0; }
      .portal-box h4 { margin: 0 0 10px 0; color: #115e59; font-size: 15px; font-weight: 700; text-transform: uppercase; }

      /* 🛡️ SECURITY SHIELD BOX */
      .trust-shield-box { background-color: #fffbeb; border: 1px solid #fef08a; border-left: 5px solid #d97706; padding: 22px; border-radius: 12px; margin: 25px 0; }
      .trust-shield-box h4 { margin: 0 0 10px 0; color: #78350f; font-size: 15px; font-weight: 700; text-transform: uppercase; }
      
      .info-table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
      .info-table tr:nth-child(even) { background-color: #f8fafc; }
      .info-table td { padding: 14px 18px; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
      .info-table td.label { font-weight: 600; color: #475569; width: 35%; border-right: 1px solid #e2e8f0; }
      .info-table td.value { font-weight: 500; color: #0f172a; }
      
      .footer { background-color: #f1f5f9; padding: 25px 40px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <!-- Brand Header -->
        <div class="header">
          <h1>${brandName.toUpperCase()}</h1>
          <p>YOUR TRUSTED HOLIDAY PARTNER</p>
        </div>
        
        <div class="content">
          <div class="greeting">Hello, Dear ${name || "Guest"}! ✨</div>
          <p class="intro-text">
            We are so very happy to help you plan your beautiful holiday! Thank you for choosing <strong>${brandName}</strong>. A friendly travel expert from our team will contact you very soon to create a customized tour package for you.
          </p>
          
          <!-- Section 1: Inquiry Details -->
          <h2 style="font-size: 16px; font-weight:700; color:#0f172a; margin-bottom:15px; text-transform: uppercase;">Your Request Details</h2>
          <table class="info-table">
            <tbody>
              <tr><td class="label"><strong>Traveller ID</strong></td><td class="value" style="font-weight:700; color:#f59e0b;">${travellerId}</td></tr>
              ${Object.entries(travelInfo).map(([key, value]) => {
    if (!value) return '';
    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return `<tr><td class="label">${formattedKey}</td><td class="value">${value}</td></tr>`;
  }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${brandName}. Made with love for safe and happy journeys.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * RULE 2: CANCELLATION EMAIL (Soft, Sweet, Highly Caring Alert with Senior Manager Authority)
 * Triggered when an agent marks a lead as "LOST" or "CANCELLED".
 */
export const generateCancellationEmailHTML = (name, travellerId, agentName, ownerEmail, ownerMobile) => {
  const brandName = process.env.BRAND_NAME || "Flag Journeys";
  const bankHolder = process.env.BANK_ACCOUNT_HOLDER || brandName;
  const finalEmail = ownerEmail || process.env.OWNER_EMAIL || "arushka@holidays.com";
  const finalMobile = ownerMobile || process.env.OWNER_MOBILE || "+91 91367 39178";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A Sweet Update From ${brandName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      body { font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
      .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 20px; box-sizing: border-box; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); overflow: hidden; border: 1px solid #e2e8f0; }
      .content { padding: 40px; }
      
      /* 💝 SOFT AMBER BOX */
      .care-warning-box { background-color: #fffbeb; border: 1px solid #fef08a; border-left: 5px solid #d97706; padding: 24px; border-radius: 12px; margin: 30px 0; }
      .care-warning-box h4 { margin: 0 0 10px 0; color: #78350f; font-size: 15px; font-weight: 700; text-transform: uppercase; }
      
      .contact-card { background-color: #0f172a; color: #ffffff; padding: 30px; border-radius: 12px; text-align: center; margin-top: 35px; }
      .footer { background-color: #f1f5f9; padding: 25px 40px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <!-- Soft Care Header -->
        <div class="header" style="background-color: #0f172a; padding: 30px; border-bottom: 4px solid #3b82f6;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase;">${brandName} <strong>Senior Manager Desk</strong></h1>
        </div>
        
        <div class="content">
          <div style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Dear ${name || "Guest"}, 😊</div>
          
          <p style="font-size: 15px; line-height: 1.6; color: #475569;">
            We hope you are doing great! Our central management system just noticed that your tour planner, <strong>${agentName || "the assigned agent"}</strong>, has closed your <strong>Traveller ID: ${travellerId}</strong> as "Cancelled".
          </p>
          
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 10px;">
            Travel plans can change, and that is totally fine! But because our Head <strong>Senior Management</strong> cares for you deeply, we want to perform a quick security check.
          </p>

          <!-- 💝 A Caring Safety Check -->
          <div class="care-warning-box">
            <h4>💝 IMPORTANT SAFETY CHECK FROM OUR SENIOR MANAGERS</h4>
            <p style="margin: 0; font-size: 14.5px; line-height: 1.6; color: #78350f; font-weight: 500;">
              Did you pay any advance booking token to the agent's personal account? If yes, please use your <strong>Traveller ID: ${travellerId}</strong> and contact our <strong>Senior Manager Desk</strong> immediately!
            </p>
            <p style="margin-top: 12px; font-size: 13.5px; line-height: 1.6; color: #92400e;">
              <strong>Why our management checks:</strong> Since your <strong>Traveller ID</strong> is closed in our system, your private <strong>Password</strong> will get locked, and no hotels can be booked. Your funds are only safe inside the official corporate account of <strong>"${bankHolder.toUpperCase()}"</strong>.
            </p>
          </div>

          <p style="font-size: 14.5px; color: #475569; line-height: 1.6;">
            If you did not cancel this package, please connect with our head office. Our <strong>Senior Managers</strong> will strictly audit your <strong>Traveller ID</strong> and assign a senior officer to handle your tour flawlessly.
          </p>
          
          <!-- Care Hotline & Complaint Box -->
          <div class="contact-card">
            <h4 style="margin:0 0 12px 0; color:#3b82f6; font-size:16px;">Your Smile Is Our Biggest Priority! 🌸</h4>
            <div style="font-size:14.5px; color:#cbd5e1; line-height:1.6;">
              📞 Call/WhatsApp <strong>Senior Manager</strong> Desk: <strong>${finalMobile}</strong><br>
              ✉️ Direct <strong>Senior Management</strong> Box: <strong>${finalEmail}</strong>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${brandName} <strong>Senior Management</strong>. Always safeguarding your journeys.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * RULE 3: PAYMENT RECEIVED EMAIL (Professional Payment Confirmation + Portal Password)
 * Triggered when sales agent uploads the payment slip of a traveller.
 */
export const generatePaymentConfirmationEmailHTML = (name, travellerId, password, ownerEmail, ownerMobile) => {
  const brandName = process.env.BRAND_NAME || "Flag Journeys";
  const finalEmail = ownerEmail || process.env.OWNER_EMAIL || "arushka@holidays.com";
  const finalMobile = ownerMobile || process.env.OWNER_MOBILE || "+91 91367 39178";
  const portalUrl = process.env.BOOKING_PORTAL_URL || "https://booking.flagjourneys.com";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmed - ${brandName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      body { font-family: 'Inter', Arial, sans-serif; background-color: #f0fdf4; margin: 0; padding: 0; color: #1e293b; }
      .wrapper { width: 100%; background-color: #f0fdf4; padding: 40px 20px; box-sizing: border-box; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08); overflow: hidden; border: 1px solid #d1fae5; }
      .header { background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); padding: 35px 40px; text-align: center; border-bottom: 4px solid #10b981; }
      .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; }
      .header p { color: #6ee7b7; margin: 8px 0 0 0; font-size: 13px; letter-spacing: 1px; }
      .success-badge { background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 50px; display: inline-block; padding: 10px 28px; margin: 25px auto 20px; font-size: 16px; font-weight: 700; color: #065f46; }
      .content { padding: 40px; text-align: center; }
      .greeting { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
      .intro-text { font-size: 15px; line-height: 1.7; color: #475569; margin-bottom: 30px; text-align: left; }

      /* 🔑 PASSWORD BOX */
      .password-box { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 30px; margin: 20px 0; text-align: center; }
      .password-box p { color: #94a3b8; font-size: 13px; margin: 0 0 10px 0; letter-spacing: 1px; text-transform: uppercase; }
      .password-value { font-size: 28px; font-weight: 800; color: #10b981; letter-spacing: 6px; font-family: 'Courier New', monospace; background-color: #0f2417; padding: 14px 24px; border-radius: 10px; border: 2px dashed #10b981; display: inline-block; margin: 8px 0; }
      .traveller-id { font-size: 13px; color: #f59e0b; margin-top: 10px; font-weight: 600; }

      /* ✅ DETAILS TABLE */
      .info-table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #d1fae5; margin: 20px 0; }
      .info-table tr:nth-child(even) { background-color: #f0fdf4; }
      .info-table td { padding: 14px 18px; font-size: 14px; border-bottom: 1px solid #d1fae5; text-align: left; }
      .info-table td.label { font-weight: 600; color: #475569; width: 40%; border-right: 1px solid #d1fae5; }
      .info-table td.value { font-weight: 600; color: #0f172a; }

      /* 🔒 SECURITY BOX */
      .security-box { background-color: #fffbeb; border: 1px solid #fde68a; border-left: 5px solid #f59e0b; padding: 20px 22px; border-radius: 12px; margin: 25px 0; text-align: left; }
      .security-box h4 { margin: 0 0 10px 0; color: #78350f; font-size: 14px; font-weight: 700; text-transform: uppercase; }

      /* 🔵 PORTAL BUTTON */
      .portal-btn { display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 700; text-decoration: none; margin-top: 20px; letter-spacing: 0.5px; }

      .contact-card { background-color: #0f172a; color: #ffffff; padding: 28px; border-radius: 12px; margin-top: 30px; text-align: center; }
      .footer { background-color: #f1f5f9; padding: 25px 40px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>${brandName.toUpperCase()}</h1>
          <p>PAYMENT CONFIRMATION & PORTAL ACCESS</p>
        </div>

        <div class="content">
          <div class="success-badge">✅ Payment Received Successfully</div>
          <div class="greeting">Congratulations, ${name || 'Dear Guest'}! 🎉</div>
          <p class="intro-text">
            We have successfully received and verified your payment. Your tour booking is now <strong>confirmed and active</strong> in our system. Please find your secure portal login credentials below.
          </p>

          <!-- 🔑 PASSWORD SECTION -->
          <div class="password-box">
            <p>🔑 YOUR SECURE PORTAL PASSWORD</p>
            <div class="password-value">${password}</div>
            <div class="traveller-id">Traveller ID: ${travellerId}</div>
          </div>

          <!-- Details Table -->
          <table class="info-table">
            <tbody>
              <tr><td class="label">Traveller Name</td><td class="value">${name}</td></tr>
              <tr><td class="label">Traveller ID</td><td class="value" style="color: #f59e0b; font-weight: 700;">${travellerId}</td></tr>
              <tr><td class="label">Payment Status</td><td class="value" style="color: #10b981;">✅ Confirmed</td></tr>
              <tr><td class="label">Portal Access</td><td class="value">Active</td></tr>
            </tbody>
          </table>

          <!-- Security Notice -->
          <div class="security-box">
            <h4>⚠️ IMPORTANT SECURITY INSTRUCTIONS</h4>
            <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #78350f;">
              🔐 <strong>Keep your password safe.</strong> Do not share it with anyone, including our agents.<br><br>
              ❌ <strong>NEVER share</strong> your password on WhatsApp or any social media.<br><br>
              🌐 <strong>Always login</strong> through our official portal only: <strong>${portalUrl}</strong>
            </p>
          </div>

          <!-- Portal Login Button -->
          <p style="font-size: 14px; color: #475569; margin-top: 20px;">Login to your portal to track your booking, upload documents, and stay updated:</p>
          <a href="${portalUrl}" class="portal-btn">🌐 Login to My Portal →</a>

          <!-- Contact -->
          <div class="contact-card">
            <h4 style="margin: 0 0 10px 0; color: #10b981; font-size: 15px;">Need Help? We're Always Here! 💚</h4>
            <div style="font-size: 14px; color: #cbd5e1; line-height: 1.7;">
              📞 Senior Manager Helpline: <strong>${finalMobile}</strong><br>
              ✉️ Management Email: <strong>${finalEmail}</strong>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${brandName}. Your journey, our responsibility.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * RULE 4 (IMPROVED): TOUR QUOTATION EMAIL — Best Format
 * Triggered when sales agent clicks "Send Final Invoice / Quotation" from the Package Builder.
 */
export const generateInvoiceEmailHTML = (name, invoiceNo, packageDetails, subtotal, gst, discount, grandTotal, ownerEmail, ownerMobile, includeGreeting = true) => {
  const brandName = process.env.BRAND_NAME || "Flag Journeys";
  const bankHolder = process.env.BANK_ACCOUNT_HOLDER || brandName;
  const bankHtml = bankDetailsBlock();
  const finalEmail = ownerEmail || process.env.OWNER_EMAIL || "arushka@holidays.com";
  const finalMobile = ownerMobile || process.env.OWNER_MOBILE || "+91 91367 39178";
  const portalUrl = process.env.BOOKING_PORTAL_URL || "https://booking.flagjourneys.com";
  const waNumber = process.env.CHAT_PARTNER_NUMBER || finalMobile.replace(/\D/g, "");
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi! I would like to confirm Quotation ${invoiceNo || ""} (Flag Journeys).`)}`;

  const traveller = packageDetails.travellerInfo || {};
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

  // ---------- Duration ----------
  let computedDuration = packageDetails.duration || "";
  if (traveller.startDate && traveller.endDate) {
    const diffMs = new Date(traveller.endDate).getTime() - new Date(traveller.startDate).getTime();
    if (diffMs >= 0) {
      const totalDays = Math.ceil(diffMs / 86400000) + 1;
      const nights = totalDays - 1;
      computedDuration = `${nights > 0 ? nights + "N" : ""} ${totalDays > 0 ? totalDays + "D" : ""}`.trim() || computedDuration;
    }
  }

  // ---------- Banner ----------
  const banners = Array.isArray(packageDetails.bannerImageUrl)
    ? packageDetails.bannerImageUrl
    : packageDetails.bannerImageUrl
      ? [packageDetails.bannerImageUrl]
      : [];
  const bannerHtml = banners.length
    ? `<div style="margin:0 0 24px 0;">
        ${banners
      .map(
        (url) =>
          `<div style="border-radius:14px;overflow:hidden;margin-bottom:10px;border:1px solid #e2e8f0;background-color:#e2e8f0;line-height:0;">
                <img src="${url}" alt="" style="width:100%;max-height:280px;height:auto;display:block;object-fit:cover;color:transparent;font-size:0;" width="100%" />
              </div>`
      )
      .join("")}
      </div>`
    : "";

  // ---------- Trip Snapshot (top summary chips) ----------
  const snapshotChips = [];
  if (packageDetails.destination || traveller.cityNames) {
    snapshotChips.push({ icon: "📍", label: "Destination", value: packageDetails.destination || traveller.cityNames });
  }
  if (computedDuration) snapshotChips.push({ icon: "⏱", label: "Duration", value: computedDuration });
  if (traveller.startDate || traveller.endDate) {
    const range = [formatDate(traveller.startDate), formatDate(traveller.endDate)].filter(Boolean).join(" → ");
    if (range) snapshotChips.push({ icon: "📅", label: "Travel Dates", value: range });
  }
  let travellersStr = "";
  if (traveller.adults > 0) travellersStr += `${traveller.adults} Adult${traveller.adults > 1 ? "s" : ""}`;
  if (traveller.adults > 0 && traveller.children > 0) travellersStr += ", ";
  if (traveller.children > 0) travellersStr += `${traveller.children} Child${traveller.children > 1 ? "ren" : ""}`;
  if (travellersStr) snapshotChips.push({ icon: "👥", label: "Travellers", value: travellersStr });

  const snapshotHtml = snapshotChips.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;">
        <tr>
          ${snapshotChips
      .map(
        (c) => `
            <td width="${Math.floor(100 / snapshotChips.length)}%" style="padding:16px 10px;text-align:center;background-color:#f8fafc;border-right:1px solid #e2e8f0;">
              <div style="font-size:18px;line-height:1;">${c.icon}</div>
              <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-top:6px;font-weight:700;">${c.label}</div>
              <div style="font-size:13px;color:#0f172a;font-weight:700;margin-top:3px;word-break:break-word;">${c.value}</div>
            </td>`
      )
      .join("")}
        </tr>
      </table>`
    : "";

  // ---------- Traveller Info: split into Personal Information vs Requirement ----------
  const personalRows = [];
  if (traveller.name) personalRows.push({ label: "Name", value: traveller.name });
  if (traveller.email) personalRows.push({ label: "Email", value: traveller.email });
  if (traveller.phone) personalRows.push({ label: "Phone / WhatsApp", value: traveller.phone });

  const requirementRows = [];
  if (traveller.serviceType) requirementRows.push({ label: "Service Type", value: traveller.serviceType });
  if (traveller.tourTypes?.length) requirementRows.push({ label: "Tour Type", value: traveller.tourTypes.join(", ") });
  if (traveller.needGuide) requirementRows.push({ label: "Extra Service", value: "Guide Included" });

  const buildInfoTable = (rows) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      ${rows
      .map(
        (r, i) => `<tr style="${i % 2 === 1 ? "background-color:#f8fafc;" : ""}">
            <td style="padding:10px 16px;font-size:13px;color:#64748b;font-weight:600;width:38%;border-bottom:${i === rows.length - 1 ? "none" : "1px solid #edf2f7"};">${r.label}</td>
            <td style="padding:10px 16px;font-size:13px;color:#0f172a;font-weight:700;border-bottom:${i === rows.length - 1 ? "none" : "1px solid #edf2f7"};">${r.value}</td>
          </tr>`
      )
      .join("")}
    </table>`;

  const personalInfoHtml = personalRows.length
    ? `<div style="margin-bottom:20px;">
        <h3 style="color:#0f172a;font-size:13px;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.6px;font-weight:800;">Your Personal Information</h3>
        ${buildInfoTable(personalRows)}
      </div>`
    : "";

  const requirementHtml = requirementRows.length
    ? `<div style="margin-bottom:26px;">
        <h3 style="color:#0f172a;font-size:13px;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.6px;font-weight:800;">Your Requirement</h3>
        ${buildInfoTable(requirementRows)}
      </div>`
    : "";

  const travellerHtml = `${personalInfoHtml}${requirementHtml}`;

  // ---------- Itinerary ----------
  let itineraryHtml = "";
  if (Array.isArray(packageDetails.itinerary) && packageDetails.itinerary.length > 0) {
    const days = packageDetails.itinerary
      .map(
        (day, idx) => `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
          <tr>
            <td width="36" valign="top">
              <div style="width:28px;height:28px;border-radius:50%;background-color:#4f46e5;color:#ffffff;font-size:12px;font-weight:800;text-align:center;line-height:28px;">${day.day || idx + 1}</div>
            </td>
            <td valign="top" style="padding-left:10px;">
              <div style="font-weight:700;color:#0f172a;font-size:13.5px;">${day.title || `Day ${idx + 1}`}</div>
              ${day.content ? `<div style="font-size:12.5px;color:#64748b;margin-top:3px;line-height:1.6;">${day.content}</div>` : ""}
            </td>
          </tr>
        </table>`
      )
      .join("");
    itineraryHtml = `
      <div style="margin-bottom:26px;">
        <h3 style="color:#0f172a;font-size:13px;margin:0 0 14px 0;text-transform:uppercase;letter-spacing:0.6px;font-weight:800;">Day-by-Day Itinerary</h3>
        <div style="border:1px solid #e2e8f0;border-radius:10px;padding:18px 18px 4px 18px;">
          ${days}
        </div>
      </div>`;
  }

  // ---------- Services / Cost table ----------
  let servicesHtml = "";
  if (packageDetails.items && packageDetails.items.length > 0) {
    // ✅ PRIVACY: Only show service type & category — NOT vendor/hotel/car name
    const getTypeOnly = (item) => {
      if (item.ServiceName === "Hotel") return item.hotelType || "Standard";
      if (item.ServiceName === "Car") return item.carType || "Standard";
      if (item.ServiceName === "Guide") return item.guideLanguage ? `${item.guideLanguage} Speaking` : "Local Guide";
      return "—";
    };
    const badgeColor = (s) =>
      s === "Hotel" ? "background-color:#e0e7ff;color:#4338ca;" : s === "Car" ? "background-color:#d1fae5;color:#065f46;" : "background-color:#fef3c7;color:#92400e;";

    const rows = packageDetails.items
      .map(
        (item) => `
        <tr>
          <td style="padding:11px 12px;border-bottom:1px solid #eef2f7;font-size:12.5px;color:#475569;">${item.location || "—"}</td>
          <td style="padding:11px 12px;border-bottom:1px solid #eef2f7;font-size:10px;"><span style="${badgeColor(item.ServiceName)}padding:3px 9px;border-radius:20px;font-weight:800;white-space:nowrap;">${item.ServiceName}</span></td>
          <td style="padding:11px 12px;border-bottom:1px solid #eef2f7;font-size:12.5px;color:#0f172a;font-weight:600;">${getTypeOnly(item)}</td>
          <td style="padding:11px 12px;border-bottom:1px solid #eef2f7;font-size:12.5px;text-align:center;color:#475569;">${item.ServcieQty || 0}</td>
          <td style="padding:11px 12px;border-bottom:1px solid #eef2f7;font-size:12.5px;text-align:right;color:#0f172a;font-weight:700;white-space:nowrap;">₹${Number(item.TotalPrice || 0).toLocaleString()}</td>
        </tr>`
      )
      .join("");

    const costSummary =
      subtotal > 0
        ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:2px;">
          <tr><td style="padding:9px 16px;font-size:13px;color:#64748b;">Subtotal</td><td style="padding:9px 16px;text-align:right;font-size:13px;color:#0f172a;font-weight:600;">₹${Number(subtotal).toLocaleString()}</td></tr>
          <tr><td style="padding:9px 16px;font-size:13px;color:#64748b;">GST (${packageDetails.gstRate || 12}%)</td><td style="padding:9px 16px;text-align:right;font-size:13px;color:#0f172a;font-weight:600;">₹${Number(gst).toLocaleString()}</td></tr>
          ${Number(discount) > 0
          ? `<tr><td style="padding:9px 16px;font-size:13px;color:#b91c1c;">Discount</td><td style="padding:9px 16px;text-align:right;font-size:13px;color:#b91c1c;font-weight:600;">− ₹${Number(discount).toLocaleString()}</td></tr>`
          : ""
        }
          <tr>
            <td style="padding:16px;font-size:14.5px;font-weight:800;color:#ffffff;background-color:#0f172a;border-radius:0 0 0 10px;">Payable Amount</td>
            <td style="padding:16px;text-align:right;font-size:17px;font-weight:800;color:#34d399;background-color:#0f172a;border-radius:0 0 10px 0;">₹${Number(grandTotal).toLocaleString()}</td>
          </tr>
        </table>`
        : "";

    servicesHtml = `
      <div style="margin-bottom:26px;">
        <h3 style="color:#0f172a;font-size:13px;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.6px;font-weight:800;">Package Cost Breakdown</h3>
        <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <thead>
              <tr style="background-color:#f8fafc;">
                <th style="padding:9px 12px;text-align:left;font-size:10.5px;color:#94a3b8;text-transform:uppercase;font-weight:800;">City</th>
                <th style="padding:9px 12px;text-align:left;font-size:10.5px;color:#94a3b8;text-transform:uppercase;font-weight:800;">Service</th>
                <th style="padding:9px 12px;text-align:left;font-size:10.5px;color:#94a3b8;text-transform:uppercase;font-weight:800;">Details</th>
                <th style="padding:9px 12px;text-align:center;font-size:10.5px;color:#94a3b8;text-transform:uppercase;font-weight:800;">Qty</th>
                <th style="padding:9px 12px;text-align:right;font-size:10.5px;color:#94a3b8;text-transform:uppercase;font-weight:800;">Amount</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          ${costSummary}
        </div>
      </div>`;
  }

  // ---------- Includes / Excludes ----------
  const includesHtml = packageDetails.includes?.length
    ? `<td valign="top" width="50%" style="padding-right:8px;">
        <div style="border:1px solid #d1fae5;border-radius:10px;padding:16px;background-color:#f0fdf4;height:100%;">
          <h4 style="margin:0 0 10px 0;color:#065f46;font-size:12px;text-transform:uppercase;font-weight:800;">✅ Included</h4>
          <div style="font-size:12.5px;color:#334155;line-height:1.9;">
            ${packageDetails.includes.map((i) => `<div>• ${i}</div>`).join("")}
          </div>
        </div>
      </td>`
    : "";
  const excludesHtml = packageDetails.excludes?.length
    ? `<td valign="top" width="50%" style="padding-left:8px;">
        <div style="border:1px solid #fecaca;border-radius:10px;padding:16px;background-color:#fef2f2;height:100%;">
          <h4 style="margin:0 0 10px 0;color:#991b1b;font-size:12px;text-transform:uppercase;font-weight:800;">❌ Not Included</h4>
          <div style="font-size:12.5px;color:#334155;line-height:1.9;">
            ${packageDetails.excludes.map((i) => `<div>• ${i}</div>`).join("")}
          </div>
        </div>
      </td>`
    : "";
  const inclExclHtml =
    includesHtml || excludesHtml
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;"><tr>${includesHtml}${excludesHtml}</tr></table>`
      : "";

  // ---------- Notes ----------
  const notesHtml = packageDetails.notes
    ? `<div style="margin-bottom:26px;border:1px solid #fde68a;border-radius:10px;padding:16px;background-color:#fffbeb;">
        <h4 style="margin:0 0 8px 0;color:#78350f;font-size:12px;text-transform:uppercase;font-weight:800;">📝 Notes</h4>
        <div style="font-size:12.5px;color:#475569;line-height:1.8;">
          ${packageDetails.notes.split("\n").filter(Boolean).map((l) => {
            const clean = l.replace(/^[•\-\*\s]+/, "").trim();
            return clean ? `<div>• ${clean}</div>` : "";
          }).join("")}
        </div>
      </div>`
    : "";

  // ---------- Payment terms ----------
  const paymentHtml =
    packageDetails.advanceAmount > 0 || packageDetails.balanceTerms
      ? `<div style="margin-bottom:26px;border:1px solid #c7d2fe;border-radius:10px;padding:16px;background-color:#eef2ff;">
          <h4 style="margin:0 0 8px 0;color:#3730a3;font-size:12px;text-transform:uppercase;font-weight:800;">💳 Payment Terms</h4>
          ${packageDetails.advanceAmount > 0 ? `<div style="font-size:13px;color:#1e293b;margin-bottom:4px;"><strong>Advance:</strong> ₹${Number(packageDetails.advanceAmount).toLocaleString()}</div>` : ""}
          ${packageDetails.balanceTerms ? `<div style="font-size:13px;color:#475569;"><strong>Balance:</strong> ${packageDetails.balanceTerms}</div>` : ""}
        </div>`
      : "";

  // ---------- Cancellation policy ----------
  const cancellationHtml = packageDetails.cancellationPolicy
    ? `<div style="margin-bottom:26px;border:1px solid #fecaca;border-radius:10px;padding:16px;background-color:#fef2f2;">
        <h4 style="margin:0 0 8px 0;color:#991b1b;font-size:12px;text-transform:uppercase;font-weight:800;">🚫 Cancellation Policy</h4>
        <div style="font-size:12.5px;color:#475569;white-space:pre-line;line-height:1.7;">${packageDetails.cancellationPolicy}</div>
      </div>`
    : "";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Tour Quotation - ${brandName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      * { box-sizing: border-box; }
      body { font-family: 'Inter', Arial, sans-serif; background-color:#eef1f5; margin:0; padding:0; color:#1e293b; }
      .wrapper { width:100%; background-color:#eef1f5; padding:32px 16px; }
      .container { max-width:860px; margin:0 auto; background-color:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 6px 24px rgba(15,23,42,0.08); border:1px solid #e2e8f0; }
      .header { background:linear-gradient(135deg,#111827 0%,#1f2937 100%); padding:32px 36px; text-align:center; }
      .header .brand { font-size:20px; font-weight:800; color:#ffffff; letter-spacing:1.5px; margin:0; text-transform:uppercase; }
      .header .tag { color:#9ca3af; font-size:11.5px; letter-spacing:2px; margin:6px 0 0 0; text-transform:uppercase; }
      .header .quote-no { display:inline-block; margin-top:16px; background-color:rgba(255,255,255,0.08); color:#e5e7eb; font-size:12.5px; font-weight:700; padding:6px 16px; border-radius:20px; border:1px solid rgba(255,255,255,0.15); }
      .content { padding:32px 30px; }
      .content img { max-width:100% !important; height:auto !important; }
      .cta-btn { display:inline-block; background-color:#111827; color:#ffffff !important; padding:15px 40px; border-radius:50px; font-size:14.5px; font-weight:700; text-decoration:none; letter-spacing:0.3px; }
      .footer { background-color:#f8fafc; padding:22px 30px; text-align:center; font-size:11.5px; color:#94a3b8; border-top:1px solid #e2e8f0; }
      @media (max-width:480px) {
        .content { padding:24px 18px; }
        .header { padding:26px 20px; }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">

        <!-- Header -->
        <div class="header">
          <p class="brand">${brandName}</p>
          <p class="tag">Your Personalised Tour Quotation</p>
          ${invoiceNo ? `<span class="quote-no">Quotation #${invoiceNo}</span>` : ""}
        </div>

        <div class="content">

          ${includeGreeting
      ? `<div style="margin-bottom:22px;">
                  <div style="font-size:19px;font-weight:800;color:#0f172a;margin-bottom:8px;">Dear ${name || "Guest"},</div>
                  <p style="font-size:14px;color:#475569;line-height:1.7;margin:0;">
                    Thank you for planning your trip with us. Based on our conversation, we've put together the quotation below — every detail has been checked so your journey is comfortable, safe, and memorable. Please review it, and let us know if you'd like any changes.
                  </p>
                </div>`
      : ""
    }

          ${bannerHtml}
          ${snapshotHtml}
          ${travellerHtml}
          ${itineraryHtml}
          ${servicesHtml}
          ${inclExclHtml}
          ${notesHtml}
          ${paymentHtml}
          ${bankHtml}
          ${cancellationHtml}

          <!-- Single primary CTA -->
          <div style="text-align:center;margin:30px 0 8px 0;">
            <a href="${waLink}" class="cta-btn">Confirm This Quotation on WhatsApp 💬</a>
            <p style="font-size:12px;color:#94a3b8;margin-top:12px;">Or simply reply to this email at <strong>${finalEmail}</strong> saying “I confirm booking” — no sign-up, no password needed.</p>
            <p style="font-size:12px;color:#94a3b8;margin-top:6px;">Prefer online tracking? <a href="${portalUrl}" style="color:#6366f1;font-weight:700;text-decoration:underline;">View on traveller portal</a> (optional).</p>
          </div>

          <!-- Contact -->
          <div style="background-color:#0f172a;color:#ffffff;padding:24px;border-radius:12px;margin-top:26px;text-align:center;">
            <h4 style="margin:0 0 8px 0;color:#c7d2fe;font-size:13.5px;font-weight:700;">Questions about this quotation?</h4>
            <div style="font-size:13px;color:#cbd5e1;line-height:1.7;">
              📞 <strong>${finalMobile}</strong> &nbsp;·&nbsp; ✉️ <strong>${finalEmail}</strong>
            </div>
          </div>

        </div>

        <div class="footer">
          <p style="margin:0 0 4px 0;">This quotation is valid for a limited period and subject to availability at the time of confirmation.</p>
          <p style="margin:0;">© ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * RULE 6: REQUIREMENTS CONFIRMATION EMAIL
 * Triggered when sales agent saves traveller requirements.
 */
export const generateRequirementsEmailHTML = (name, travellerId, requirements, ownerEmail, ownerMobile, requirementsUrl) => {
  const brandName = process.env.BRAND_NAME || "Flag Journeys";
  const finalEmail = ownerEmail || process.env.OWNER_EMAIL || "arushka@holidays.com";
  const finalMobile = ownerMobile || process.env.OWNER_MOBILE || "+91 91367 39178";

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const rows = [
    { label: "Service Type", value: requirements.serviceType || "—" },
    { label: "Cities / Destinations", value: requirements.cityNames || "—" },
    { label: "Tour Types", value: requirements.tourTypes?.length ? requirements.tourTypes.join(", ") : "—" },
    { label: "Start Date", value: formatDate(requirements.startDate) },
    { label: "End Date", value: formatDate(requirements.endDate) },
    { label: "Adults", value: requirements.adults || "—" },
    { label: "Children", value: requirements.children || "—" },
    { label: "Budget (₹)", value: requirements.budget ? `₹${Number(requirements.budget).toLocaleString()}` : "—" },
    { label: "Guide Required", value: requirements.needGuide ? "Yes" : "No" },
  ];

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Requirements - ${brandName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      body { font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
      .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 20px; box-sizing: border-box; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); overflow: hidden; border: 1px solid #e2e8f0; }
      .header { background-color: #3730a3; padding: 35px 40px; text-align: center; border-bottom: 4px solid #818cf8; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; }
      .header p { color: #c7d2fe; margin: 8px 0 0 0; font-size: 13px; letter-spacing: 1px; }
      .content { padding: 40px; }
      .greeting { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
      .intro-text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px; }
      .info-table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
      .info-table tr:nth-child(even) { background-color: #f8fafc; }
      .info-table td { padding: 14px 18px; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
      .info-table td.label { font-weight: 600; color: #475569; width: 40%; border-right: 1px solid #e2e8f0; }
      .info-table td.value { font-weight: 600; color: #0f172a; }
      .btn-wrapper { text-align: center; margin: 24px 0; }
      .view-btn { display: inline-block; background-color: #6366f1; color: #ffffff; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 700; text-decoration: none; letter-spacing: 0.5px; }
      .contact-card { background-color: #0f172a; color: #ffffff; padding: 28px; border-radius: 12px; margin-top: 30px; text-align: center; }
      .footer { background-color: #f1f5f9; padding: 25px 40px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <h1>${brandName.toUpperCase()}</h1>
          <p>YOUR TRAVEL REQUIREMENTS</p>
        </div>
        <div class="content">
          <div class="greeting">Dear ${name || "Guest"}, 🙏</div>
          <p class="intro-text">
            As per our discussion, your travel requirements have been noted below. Our team will create a customized tour package based on these details. Please review and confirm.
          </p>

          <table class="info-table">
            <tbody>
              <tr><td class="label"><strong>Traveller ID</strong></td><td class="value" style="color: #6366f1; font-weight: 700;">${travellerId}</td></tr>
              ${rows.map(r => `<tr><td class="label">${r.label}</td><td class="value">${r.value}</td></tr>`).join('')}
            </tbody>
          </table>

          <p style="font-size: 14px; color: #64748b; margin-top: 20px; text-align: center;">
            If anything needs to be changed, please let your travel agent know.
          </p>

          <div class="contact-card">
            <h4 style="margin: 0 0 10px 0; color: #818cf8; font-size: 15px;">We Are Here To Help! 💜</h4>
            <div style="font-size: 14px; color: #cbd5e1; line-height: 1.7;">
              📞 Helpline: <strong>${finalMobile}</strong><br>
              ✉️ Email: <strong>${finalEmail}</strong>
            </div>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${brandName}. Your dream journey, our commitment.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * RULE 5: BOOKING CONFIRMATION EMAIL (after admin approves payment)
 * Includes: invoice, due payment, password, company name payment instruction, complaint handling
 */
export const generateBookingConfirmationEmailHTML = (name, travellerId, password, invoiceNo, totalInvoiced, totalPaid, dueAmount, slabLabel, requiredAmount) => {
  const brandName = process.env.BRAND_NAME || "Flag Journeys";
  const bankHolder = process.env.BANK_ACCOUNT_HOLDER || brandName;
  const finalEmail = process.env.OWNER_EMAIL || "arushka@holidays.com";
  const finalMobile = process.env.OWNER_MOBILE || "+91 91367 39178";
  const portalUrl = process.env.BOOKING_PORTAL_URL || "https://booking.flagjourneys.com";
  const due = Number(dueAmount) || 0;
  const paid = Number(totalPaid) || 0;
  const invoiced = Number(totalInvoiced) || 0;
  const required = Number(requiredAmount) || 0;
  const slab = slabLabel || "As per payment terms";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmed - ${brandName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      body { font-family: 'Inter', Arial, sans-serif; background-color: #f0fdf4; margin: 0; padding: 0; color: #1e293b; }
      .wrapper { width: 100%; background-color: #f0fdf4; padding: 40px 20px; box-sizing: border-box; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08); overflow: hidden; border: 1px solid #d1fae5; }
      .header { background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); padding: 35px 40px; text-align: center; border-bottom: 4px solid #10b981; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; }
      .header p { color: #6ee7b7; margin: 8px 0 0 0; font-size: 13px; letter-spacing: 1px; }
      .success-badge { background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 50px; display: inline-block; padding: 10px 28px; margin: 25px auto 20px; font-size: 16px; font-weight: 700; color: #065f46; }
      .content { padding: 40px; text-align: center; }
      .greeting { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
      .intro-text { font-size: 15px; line-height: 1.7; color: #475569; margin-bottom: 30px; text-align: left; }
      .password-box { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 30px; margin: 20px 0; text-align: center; }
      .password-box p { color: #94a3b8; font-size: 13px; margin: 0 0 10px 0; letter-spacing: 1px; text-transform: uppercase; }
      .password-value { font-size: 28px; font-weight: 800; color: #10b981; letter-spacing: 6px; font-family: 'Courier New', monospace; background-color: #0f2417; padding: 14px 24px; border-radius: 10px; border: 2px dashed #10b981; display: inline-block; margin: 8px 0; }
      .traveller-id { font-size: 13px; color: #f59e0b; margin-top: 10px; font-weight: 600; }
      .info-table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #d1fae5; margin: 20px 0; }
      .info-table tr:nth-child(even) { background-color: #f0fdf4; }
      .info-table td { padding: 14px 18px; font-size: 14px; border-bottom: 1px solid #d1fae5; text-align: left; }
      .info-table td.label { font-weight: 600; color: #475569; width: 40%; border-right: 1px solid #d1fae5; }
      .info-table td.value { font-weight: 600; color: #0f172a; }
      .payment-box { background-color: #f0f9ff; border: 1px solid #bae6fd; border-left: 5px solid #0284c7; padding: 20px 22px; border-radius: 12px; margin: 25px 0; text-align: left; }
      .payment-box h4 { margin: 0 0 10px 0; color: #0369a1; font-size: 14px; font-weight: 700; text-transform: uppercase; }
      .security-box { background-color: #fffbeb; border: 1px solid #fde68a; border-left: 5px solid #f59e0b; padding: 20px 22px; border-radius: 12px; margin: 25px 0; text-align: left; }
      .security-box h4 { margin: 0 0 10px 0; color: #78350f; font-size: 14px; font-weight: 700; text-transform: uppercase; }
      .complaint-box { background-color: #fef2f2; border: 1px solid #fecaca; border-left: 5px solid #ef4444; padding: 20px 22px; border-radius: 12px; margin: 25px 0; text-align: left; }
      .complaint-box h4 { margin: 0 0 10px 0; color: #991b1b; font-size: 14px; font-weight: 700; text-transform: uppercase; }
      .portal-btn { display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 700; text-decoration: none; margin-top: 20px; letter-spacing: 0.5px; }
      .contact-card { background-color: #0f172a; color: #ffffff; padding: 28px; border-radius: 12px; margin-top: 30px; text-align: center; }
      .footer { background-color: #f1f5f9; padding: 25px 40px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <h1>${brandName.toUpperCase()}</h1>
          <p>BOOKING CONFIRMED & PORTAL ACCESS</p>
        </div>
        <div class="content">
          <div class="success-badge">✅ Booking Confirmed Successfully</div>
          <div class="greeting">Congratulations, ${name || 'Dear Guest'}! 🎉</div>
          <p class="intro-text">
            We are delighted to confirm that your tour booking with <strong>${brandName}</strong> has been <strong>successfully confirmed and activated</strong> in our system. Your journey is now officially booked! Below you will find all the details you need.
          </p>
          <table class="info-table">
            <tbody>
              <tr><td class="label">Traveller Name</td><td class="value">${name}</td></tr>
              <tr><td class="label">Traveller ID</td><td class="value" style="color: #f59e0b; font-weight: 700;">${travellerId}</td></tr>
              <tr><td class="label">Invoice Number</td><td class="value" style="font-weight: 700;">${invoiceNo}</td></tr>
              <tr><td class="label">Total Package Amount</td><td class="value">₹${Number(totalInvoiced).toLocaleString()}</td></tr>
              <tr><td class="label">Amount Paid</td><td class="value" style="color: #10b981; font-weight: 700;">₹${Number(totalPaid).toLocaleString()}</td></tr>
              ${due > 0 ? `<tr><td class="label" style="color: #ef4444;">Due Amount</td><td class="value" style="color: #ef4444; font-weight: 700;">₹${Number(due).toLocaleString()}</td></tr>` : ''}
              <tr><td class="label">Booking Status</td><td class="value" style="color: #10b981;">✅ Confirmed & Active</td></tr>
            </tbody>
          </table>
          ${due > 0 ? `
          <div class="payment-box">
            <h4>💰 PENDING PAYMENT REMINDER</h4>
            <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #0369a1;">
              Your booking is confirmed, but there is still a <strong>due amount of ₹${Number(due).toLocaleString()}</strong> remaining. Kindly complete your payment before your travel date to avoid any inconvenience.
            </p>
            <p style="margin-top: 10px; font-size: 14px; line-height: 1.7; color: #075985;">
              ⭐️ <strong>Pay ONLY to the Official Company Account:</strong> Transfer the due amount ONLY to the bank account in the name of: <span style="background-color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #0369a1;">"${bankHolder.toUpperCase()}"</span>. Bank details are below.<br>
              ❌ <strong>NEVER Pay to Personal Accounts</strong> — Report immediately to our Senior Management Desk.
            </p>
            ${bankHolderBlock()}
          </div>
          ` : `
          <div class="payment-box">
            <h4>💰 PAYMENT STATUS: FULLY PAID ✅</h4>
            <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #0369a1;">You have completed all payments for your tour package. No dues are pending.</p>
            <p style="margin-top: 10px; font-size: 14px; line-height: 1.7; color: #075985;">
              ⭐️ <strong>Always pay only to the Official Company Account:</strong> "${bankHolder.toUpperCase()}" — Never pay to personal accounts.
            </p>
          </div>
          `}
          <div class="password-box">
            <p>🔑 YOUR SECURE PORTAL PASSWORD</p>
            <div class="password-value">${password}</div>
            <div class="traveller-id">Traveller ID: ${travellerId} &nbsp;|&nbsp; Login ID: ${travellerId}</div>
          </div>
          <p style="font-size: 14px; color: #475569; text-align: left;">
            Use your <strong>Traveller ID (${travellerId})</strong> as your Login ID and the above <strong>Password</strong> to access your secure portal. Through your portal, you can:
          </p>
          <ul style="text-align: left; font-size: 14px; color: #475569; line-height: 1.8; margin-bottom: 20px;">
            <li>🔍 Track your booking status in real-time</li>
            <li>📞 Connect directly with our Customer Support team</li>
            <li>📢 File a complaint if you face any issues</li>
            <li>📄 View your invoice and payment history</li>
          </ul>

          <!-- Payment Slab Info -->
          <div class="payment-box">
            <h4>💳 PAYMENT TERMS & MANDATORY ADVANCE</h4>
            <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #0369a1;">
              As per our booking policy, your <strong>mandatory advance payment requirement</strong> is:
            </p>
            <table style="width:100%;margin-top:12px;border-collapse:collapse;">
              <tr>
                <td style="padding:8px;font-size:13px;color:#475569;font-weight:600;">Applicable Rule</td>
                <td style="padding:8px;font-size:14px;color:#0f172a;font-weight:700;">${slab}</td>
              </tr>
              <tr style="background-color:#e0f2fe;">
                <td style="padding:8px;font-size:13px;color:#475569;font-weight:600;">Minimum Required Amount</td>
                <td style="padding:8px;font-size:14px;color:#0369a1;font-weight:800;">₹${required.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding:8px;font-size:13px;color:#475569;font-weight:600;">Amount Paid So Far</td>
                <td style="padding:8px;font-size:14px;color:#10b981;font-weight:800;">₹${paid.toLocaleString()}</td>
              </tr>
              ${due > 0 ? `<tr style="background-color:#fef2f2;"><td style="padding:8px;font-size:13px;color:#ef4444;font-weight:600;">Remaining Balance Due</td><td style="padding:8px;font-size:14px;color:#ef4444;font-weight:800;">₹${due.toLocaleString()}</td></tr>` : '<tr style="background-color:#f0fdf4;"><td style="padding:8px;font-size:13px;color:#10b981;font-weight:600;">Payment Status</td><td style="padding:8px;font-size:14px;color:#10b981;font-weight:800;">✅ Fully Paid</td></tr>'}
            </table>
            <p style="margin-top:10px;font-size:13px;color:#0369a1;">
              ⚠️ Remaining balance must be paid <strong>before your travel date</strong>. Pay ONLY to official company account: <strong>"${bankHolder.toUpperCase()}"</strong>
            </p>
          </div>

          <!-- Cancellation Policy -->
          <div class="complaint-box">
            <h4>🚫 CANCELLATION POLICY (Terms & Conditions)</h4>
            <p style="margin: 0 0 10px 0; font-size: 13.5px; line-height: 1.7; color: #991b1b; font-weight: 600;">
              Please read the following cancellation terms carefully before confirming your booking:
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr style="background-color:#fef2f2;">
                <td style="padding:8px 10px;font-weight:700;color:#7f1d1d;border-bottom:1px solid #fecaca;">Cancellation Period</td>
                <td style="padding:8px 10px;font-weight:700;color:#7f1d1d;border-bottom:1px solid #fecaca;">Charge</td>
              </tr>
              <tr><td style="padding:7px 10px;color:#475569;border-bottom:1px solid #fef2f2;">30 days or more before travel date</td><td style="padding:7px 10px;font-weight:600;color:#b91c1c;">10% of total package cost</td></tr>
              <tr style="background-color:#fef2f2;"><td style="padding:7px 10px;color:#475569;border-bottom:1px solid #fef2f2;">15–30 days before travel date</td><td style="padding:7px 10px;font-weight:600;color:#b91c1c;">25% of total package cost</td></tr>
              <tr><td style="padding:7px 10px;color:#475569;border-bottom:1px solid #fef2f2;">7–15 days before travel date</td><td style="padding:7px 10px;font-weight:600;color:#b91c1c;">50% of total package cost</td></tr>
              <tr style="background-color:#fef2f2;"><td style="padding:7px 10px;color:#475569;border-bottom:1px solid #fef2f2;">Less than 7 days before travel date</td><td style="padding:7px 10px;font-weight:700;color:#991b1b;">100% — Non-Refundable</td></tr>
              <tr><td style="padding:7px 10px;color:#475569;">No Show / Non-Arrival</td><td style="padding:7px 10px;font-weight:700;color:#991b1b;">100% — Non-Refundable</td></tr>
            </table>
            <p style="margin-top:12px;font-size:12.5px;color:#78350f;line-height:1.6;">
              📌 <strong>Additional Terms:</strong><br>
              • All refunds (if applicable) will be processed within 7–10 working days to the original payment source.<br>
              • Cancellation requests must be submitted in writing via your official portal or email to ${finalEmail}.<br>
              • Natural calamities, political unrest, or government travel bans: partial refund subject to vendor recovery.<br>
              • Hotel/transport bookings confirmed by vendors may carry individual non-refundable components.<br>
              • Date change requests (not cancellation) are subject to availability and may incur amendment charges of ₹500–₹2,000 per person.
            </p>
          </div>

          <div class="complaint-box">
            <h4>📢 COMPLAINT & SUPPORT - SENIOR MANAGEMENT DESK</h4>
            <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #991b1b;">
              If you face any <strong>slow updates, agent misbehavior, or any problem</strong> during your trip, instantly file a complaint using your <strong>Traveller ID (${travellerId})</strong> and <strong>Password</strong> on our portal. Our Senior Managers will resolve it immediately.
            </p>
            <p style="margin-top: 10px; font-size: 13px; color: #b91c1c;">
              📞 <strong>Direct Senior Manager Helpline:</strong> ${finalMobile}<br>
              ✉️ <strong>Direct Management Email:</strong> ${finalEmail}
            </p>
          </div>
          <div class="security-box">
            <h4>⚠️ IMPORTANT SECURITY INSTRUCTIONS</h4>
            <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #78350f;">
              🔐 <strong>Keep your password safe.</strong> Do not share it with anyone, including our agents.<br><br>
              ❌ <strong>NEVER share</strong> your password on WhatsApp or any social media.<br><br>
              🏦 <strong>Pay ONLY to the Official Company Account:</strong> ${bankHolder.toUpperCase()} — Never pay to any personal account.<br><br>
              🌐 <strong>Always login</strong> through our official portal only: <strong>${portalUrl}</strong>
            </p>
          </div>
          <a href="${portalUrl}" class="portal-btn">🌐 Login to My Portal →</a>
          <div class="contact-card">
            <h4 style="margin: 0 0 10px 0; color: #10b981; font-size: 15px;">We Are Always Here For You! 💚</h4>
            <div style="font-size: 14px; color: #cbd5e1; line-height: 1.7;">
              📞 Senior Manager Helpline: <strong>${finalMobile}</strong><br>
              ✉️ Management Email: <strong>${finalEmail}</strong>
            </div>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${brandName}. Your journey, our responsibility.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * PARTNER LEAD CARD EMAIL
 * Sent to the auto-assigned sales partner when a new public lead arrives.
 * @param {object} lead - Traveller lead object with: travellerId, name, email, phone, country, travelDate, pageReference, assignedToUser
 */
export const generatePartnerLeadEmailHTML = (lead, partnerName) => {
  const brandName = process.env.BRAND_NAME || "Flag Journeys";
  const partnerNameStr = partnerName || "Team";
  const dashboardUrl = process.env.BOOKING_PORTAL_URL || "https://booking.flagjourneys.com";
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const source = lead.pageReference && lead.pageReference !== "/booking" ? lead.pageReference : "Website Direct";

  const rows = [
    { label: "Traveller ID", value: lead.travellerId, highlight: true },
    { label: "Name", value: lead.name || "—" },
    { label: "Email", value: lead.email || "—" },
    { label: "Phone / WhatsApp", value: lead.phone || "—" },
    { label: "Country", value: lead.country || "—" },
    { label: "Travel Date", value: formatDate(lead.travelDate) },
    { label: "Lead Source", value: source },
  ];

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Lead - ${brandName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      body { font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
      .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 20px; box-sizing: border-box; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); overflow: hidden; border: 1px solid #e2e8f0; }
      .header { background-color: #0f172a; padding: 32px 40px; text-align: center; border-bottom: 4px solid #10b981; }
      .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; }
      .header p { color: #6ee7b7; margin: 8px 0 0 0; font-size: 13px; letter-spacing: 1px; }
      .content { padding: 36px; }
      .greeting { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
      .intro-text { font-size: 14.5px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
      .info-table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
      .info-table tr:nth-child(even) { background-color: #f8fafc; }
      .info-table td { padding: 13px 18px; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
      .info-table td.label { font-weight: 600; color: #475569; width: 38%; border-right: 1px solid #e2e8f0; }
      .info-table td.value { font-weight: 600; color: #0f172a; }
      .cta-wrapper { text-align: center; margin: 26px 0 8px 0; }
      .cta-btn { display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 34px; border-radius: 50px; font-size: 15px; font-weight: 700; text-decoration: none; letter-spacing: 0.4px; }
      .note-box { background-color: #f0f9ff; border: 1px solid #bae6fd; border-left: 5px solid #0284c7; padding: 16px 20px; border-radius: 10px; margin-top: 24px; }
      .footer { background-color: #f1f5f9; padding: 22px 36px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <h1>${brandName.toUpperCase()}</h1>
          <p>NEW LEAD NOTIFICATION</p>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${partnerNameStr}! 🎯</div>
          <p class="intro-text">
            A new travel inquiry just arrived and has been assigned to you. Contact the customer as soon as possible — <strong>quick response wins the booking</strong>.
          </p>

          <table class="info-table">
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td class="label">${r.label}</td>
                  <td class="value" ${r.highlight ? 'style="color: #f59e0b; font-weight: 800;"' : ""}>${r.value}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="cta-wrapper">
            <a href="${dashboardUrl}/dashboard/my-leads" class="cta-btn">Open My Leads →</a>
          </div>

          <div class="note-box">
            <p style="margin: 0; font-size: 13px; color: #0369a1; line-height: 1.7;">
              ⏱ <strong>Golden rule:</strong> Respond within <strong>1 hour</strong> for the highest chance of conversion.
              Update the lead status (Contacted → Quote Sent → Booked) in the dashboard so the team can track progress automatically.
            </p>
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${brandName}. Lead assigned automatically by the system.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};