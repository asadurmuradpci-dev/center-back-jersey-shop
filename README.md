# Center Back Jersey Shop

A responsive, white-and-blue storefront template with product cards, search/category filtering, size/quantity selection, and a Cash on Delivery order form.

## Important before publishing

- The product catalog currently uses sample products, prices, and remote sample images. Replace them with your actual products, prices, sizes, stock availability, and images in `script.js`.
- Set the real Facebook page URL in `config.js`.
- The order form is **not connected to storage by default**. With `ORDER_ENDPOINT` empty, it explicitly tells customers that it is in demo mode and does not claim to save orders.
- Do not collect customer data until you have configured and tested a secure endpoint. Do not place API keys or other secrets in `config.js`.

## Free static hosting

### Option A: GitHub Pages
1. Sign in at https://github.com/ and create a new public repository, e.g. `center-back-jersey-shop`.
2. Upload `index.html`, `styles.css`, `script.js`, and `config.js` to the repository root.
3. Open **Settings → Pages**.
4. Under build/deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
5. Wait for GitHub Pages to publish. Your site URL will be shown on the Pages settings screen.
6. Test on a phone and desktop. A custom domain is optional and usually costs money.

### Option B: Netlify
1. Sign in at https://www.netlify.com/.
2. Create a new site by importing your GitHub repository, or use the manual deploy/drop feature if available in your account.
3. Publish the folder containing the four site files.
4. Netlify gives you a public subdomain. Test the published site and its order form.

Static hosting alone does not store orders. Configure the order endpoint below before accepting real orders.

## Save real orders with Google Apps Script (no separate server required)

This example sends orders to a Google Sheet through a Google Apps Script web app. Treat the spreadsheet as private because it contains customer names, phone numbers and delivery addresses.

1. Create a new Google Sheet. Copy its ID from the URL between `/d/` and `/edit`.
2. In the Sheet, open **Extensions → Apps Script**.
3. Replace the editor contents with the code below. Change `SPREADSHEET_ID`.
4. Save the project.
5. In Apps Script, open **Project Settings → Script Properties** and add:
   - Property: `ORDER_TOKEN`
   - Value: a long random secret string of your own
6. Deploy → **New deployment** → type **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone** (the public order form must be able to send orders; this means endpoint abuse is possible, so use the token and consider spam protections/rate limits).
7. Authorize the script, then copy the deployed Web App URL ending in `/exec`.
8. Set `ORDER_ENDPOINT` in `config.js` to that `/exec` URL, and set the same `ORDER_TOKEN` value in the `ORDER_TOKEN` field in `config.js` as shown below.
9. Deploy the updated website and submit a test order. Verify a new row appears in the sheet. Then remove the test row and keep the sheet private.

### Client config.js (after deploying Apps Script)

Add the same token used in Script Properties. This token will be visible in browser source code, so it is only a basic obstacle, not a truly secret credential. For a public shop, consider an endpoint with abuse protection, validation, rate limits and CAPTCHA before collecting real orders.

```js
window.SHOP_CONFIG = {
  currency: "৳",
  ORDER_ENDPOINT: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE",
  ORDER_TOKEN: "PASTE_THE_SAME_LONG_RANDOM_TOKEN_HERE",
  FACEBOOK_PAGE_URL: "PASTE_YOUR_FACEBOOK_PAGE_URL_HERE"
};
```

### Google Apps Script code (Code.gs)

```javascript
const SPREADSHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";
const SHEET_NAME = "Orders";

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const expected = PropertiesService.getScriptProperties().getProperty("ORDER_TOKEN");
    if (!expected || body.token !== expected) {
      return json({ ok: false, message: "Unauthorized" });
    }

    // Basic server-side validation. Never trust only browser validation.
    const required = ["orderId", "productId", "productName", "customerName", "phone", "address", "size"];
    for (const key of required) {
      if (!String(body[key] || "").trim()) return json({ ok: false, message: "Missing required field" });
    }
    const quantity = Number(body.quantity);
    const unitPrice = Number(body.unitPrice);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10 ||
        !Number.isFinite(unitPrice) || unitPrice < 0) {
      return json({ ok: false, message: "Invalid quantity or price" });
    }
    if (String(body.customerName).length > 100 ||
        String(body.phone).length > 30 ||
        String(body.address).length > 500 ||
        String(body.note || "").length > 500) {
      return json({ ok: false, message: "Field too long" });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow(["Created At", "Order ID", "Product ID", "Product", "Unit Price", "Quantity", "Subtotal", "Size", "Customer Name", "Phone", "Address", "Note", "Payment", "Status"]);
        sheet.setFrozenRows(1);
      }
      // Prefix customer-provided text to reduce spreadsheet formula injection.
      const safe = value => {
        const s = String(value == null ? "" : value);
        return /^[=+\-@]/.test(s) ? "'" + s : s;
      };
      sheet.appendRow([
        new Date(), safe(body.orderId), safe(body.productId), safe(body.productName),
        unitPrice, quantity, unitPrice * quantity, safe(body.size), safe(body.customerName),
        safe(body.phone), safe(body.address), safe(body.note || ""),
        "Cash on Delivery", "Pending"
      ]);
    } finally {
      lock.releaseLock();
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, message: "Unable to save order" });
  }
}

function doGet() {
  return json({ ok: true, service: "Center Back Jersey Shop order endpoint" });
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Required JavaScript change for token

In `script.js`, inside `form.addEventListener("submit", ...)`, change the request body from:

```js
body:JSON.stringify(order),
```

to:

```js
body:JSON.stringify({...order, token: config.ORDER_TOKEN || ""}),
```

Also ensure the `ORDER_TOKEN` field is included in `config.js`.

## Launch checklist

- [ ] Replace all sample products, images, prices, sizes, and stock information.
- [ ] Update Facebook page link.
- [ ] Set up and test order storage endpoint.
- [ ] Test a successful order and a failed submission.
- [ ] Confirm delivery fee and delivery zones in your policies.
- [ ] Add a return/exchange policy and privacy notice.
- [ ] Test on mobile.
- [ ] Do not advertise “order confirmed” until the order endpoint has actually accepted the order.
