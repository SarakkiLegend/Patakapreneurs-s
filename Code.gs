// ===== Patakapreneurs order system: Faculty & Guest version (Google Apps Script) =====
// Paste this into Extensions > Apps Script (replace everything), then Deploy > New deployment > Web app
// (Execute as: Me, Who has access: Anyone). Paste the /exec URL into SCRIPT_URL in app.js.
//
// "Orders" tab headers in row 1 (A to R):
// Timestamp | Order ID | Customer Type | Name | Phone | Delivery Option | Cabin No | Delivery Address | Map Link | Items | Total | UTR / Txn ID | Payment Status | MRP Total | Discount Given | Delivery Fee | Paid To | Referred By

const SHEET_NAME = "Orders";
const TYPES = { faculty: "Faculty", guest: "Guest" };
const DELIVERY = { college: "College (Friday, to cabin)", home: "Home delivery" };

function doGet() {
  return ContentService.createTextOutput("Patakapreneurs order system is running ✅");
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    const problem = validate_(d);
    if (problem) return json_({ ok: false, error: problem });
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Tab "' + SHEET_NAME + '" not found');

    const row = sheet.getLastRow() + 1;

    // Keep Phone, Cabin No and UTR as plain text (stops long numbers turning into 1.23E+11)
    [5, 7, 12].forEach(function (col) { sheet.getRange(row, col).setNumberFormat("@"); });

    sheet.getRange(row, 1, 1, 18).setValues([[
      new Date(),
      safe_(d.id),
      TYPES[d.customerType] || "",
      safe_(d.name),
      safe_(d.phone),
      DELIVERY[d.delivery] || "",
      safe_(d.cabin),
      safe_(d.address, 400),
      safe_(d.mapLink, 400),
      safe_(d.items, 5000),
      Number(d.total) || 0,
      safe_(d.utr),
      "Pending",
      Number(d.mrpTotal) || 0,
      Number(d.discount) || 0,
      Number(d.deliveryFee) || 0,
      safe_(d.paidTo),
      safe_(d.referredBy, 100)      // optional
    ]]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// No customer field is mandatory. We only reject an empty order, and badly formatted values when something was entered.
function validate_(d) {
  const t = function (v) { return String(v == null ? "" : v).trim(); };
  if (!t(d.items) || !(Number(d.total) > 0)) return "Empty order";
  if (t(d.customerType) && !TYPES[t(d.customerType)]) return "Invalid customer type";
  if (t(d.delivery) && !DELIVERY[t(d.delivery)]) return "Invalid delivery option";
  if (t(d.phone) && !/^[6-9][0-9]{9}$/.test(t(d.phone))) return "Invalid phone number";
  if (t(d.utr) && !/^[A-Za-z0-9]{8,30}$/.test(t(d.utr))) return "Invalid UTR";
  return "";
}

// Stops customer text from being treated as a spreadsheet formula
function safe_(v, max) {
  const s = String(v == null ? "" : v).trim().slice(0, max || 300);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run this once from the editor to test (Run > testOrder). Delete the test row afterwards.
function testOrder() {
  const res = doPost({ postData: { contents: JSON.stringify({
    id: "TEST01-FAC", customerType: "faculty", name: "Test", phone: "9999999999",
    delivery: "home", cabin: "", address: "12 Test Street, Hyderabad 500001", mapLink: "https://maps.app.goo.gl/example",
    items: "P2 Colour Koti x2",
    mrpTotal: 2500, discount: 1500, deliveryFee: 250, total: 1250, utr: "123456789012", paidTo: "Varan (Google Pay)"
  })}});
  Logger.log(res.getContent());
}
