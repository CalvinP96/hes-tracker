// Sends COR notification email via Resend
// Env vars needed: RESEND_API_KEY, ADMIN_EMAIL, COR_SECRET

import crypto from "crypto";

function makeToken(projectId, corId) {
  const secret = process.env.COR_SECRET || "hes-default-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`${projectId}:${corId}`)
    .digest("hex")
    .slice(0, 16);
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders(), body: "Method not allowed" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Missing RESEND_API_KEY env var" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { projectId, corId, corText, corBy, corDate, customerName, address, riseId, adds, removes, photo, notifyEmail, notifyCc } = body;
  if (!projectId || !corId || !corText) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "Missing required fields" }) };
  }

  // Use app-configured email, fall back to env var
  const toEmail = notifyEmail || adminEmail;
  if (!toEmail) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "No notification email configured" }) };
  }
  const toList = toEmail.split(",").map(e => e.trim()).filter(Boolean);
  const ccList = notifyCc ? notifyCc.split(",").map(e => e.trim()).filter(Boolean) : [];

  const token = makeToken(projectId, corId);
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "https://hes-ie.netlify.app";
  const approveUrl = `${siteUrl}/.netlify/functions/cor-action?projectId=${projectId}&corId=${corId}&action=approve&token=${token}`;
  const denyUrl = `${siteUrl}/.netlify/functions/cor-action?projectId=${projectId}&corId=${corId}&action=deny&token=${token}`;
  const openUrl = `${siteUrl}?project=${projectId}&tab=install`;

  const addsList = (adds || []).map((a) => `<li style="color:#16a34a">+ ${a.m || a} ${a.qty ? `(qty: ${a.qty})` : ""}</li>`).join("");
  const removesList = (removes || []).map((r) => `<li style="color:#ef4444">− ${r}</li>`).join("");
  const changesHtml = addsList || removesList ? `<div style="margin:12px 0"><strong>Scope Changes:</strong><ul style="margin:4px 0;padding-left:20px">${addsList}${removesList}</ul></div>` : "";
  const photoHtml = photo ? `<div style="margin:12px 0"><img src="${photo}" style="max-width:400px;max-height:200px;border-radius:6px;border:1px solid #ddd" alt="COR Photo"/></div>` : "";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
      <div style="background:#0f172a;padding:16px 20px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;color:#93C5FD;font-size:18px">🔄 Change Order Request</h2>
        <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">HES Retrofits Tracker</p>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;padding:20px;border-radius:0 0 8px 8px">
        <table style="width:100%;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:4px 0;color:#64748b;width:120px">Customer</td><td style="padding:4px 0;font-weight:600">${customerName || "—"}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b">Address</td><td style="padding:4px 0">${address || "—"}</td></tr>
          ${riseId ? `<tr><td style="padding:4px 0;color:#64748b">RISE PID</td><td style="padding:4px 0">${riseId}</td></tr>` : ""}
          <tr><td style="padding:4px 0;color:#64748b">Requested By</td><td style="padding:4px 0">${corBy || "—"}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b">Date</td><td style="padding:4px 0">${corDate ? new Date(corDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}</td></tr>
        </table>

        <div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-left:4px solid #f59e0b;border-radius:4px">
          <strong style="color:#92400e;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Change Requested</strong>
          <p style="margin:6px 0 0;font-size:14px;color:#334155">${corText}</p>
        </div>

        ${changesHtml}
        ${photoHtml}

        <div style="margin:24px 0 16px;text-align:center">
          <a href="${approveUrl}" style="display:inline-block;padding:12px 32px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;margin:0 8px">✅ Approve</a>
          <a href="${denyUrl}" style="display:inline-block;padding:12px 32px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;margin:0 8px">❌ Deny</a>
        </div>

        <div style="text-align:center;margin-top:12px">
          <a href="${openUrl}" style="color:#3b82f6;font-size:13px">Open project in tracker →</a>
        </div>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
        <p style="font-size:11px;color:#94a3b8;text-align:center;margin:0">Assured Energy Solutions · HES Retrofits Tracker</p>
      </div>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || "HES Tracker <notifications@resend.dev>",
        to: toList,
        ...(ccList.length > 0 ? { cc: ccList } : {}),
        subject: `🔄 COR: ${customerName || "Project"} — ${corText.slice(0, 60)}`,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, headers: corsHeaders(), body: JSON.stringify({ error: data }) };
    }
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true, id: data.id }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: err.message }) };
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
