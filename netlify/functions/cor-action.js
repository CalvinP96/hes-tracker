// Handles COR approve/deny from email links
// TWO-STEP: GET shows confirmation page, POST processes the action
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, COR_SECRET

import crypto from "crypto";

function verifyToken(projectId, corId, token) {
  const secret = process.env.COR_SECRET || "hes-default-secret";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${projectId}:${corId}`)
    .digest("hex")
    .slice(0, 16);
  return token === expected;
}

function htmlPage(title, message, color, projectId, showButton) {
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "https://hes-ie.netlify.app";
  const openUrl = `${siteUrl}?project=${projectId}&tab=install`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#e2e8f0}
  .card{background:#1e293b;border-radius:12px;padding:32px;max-width:420px;text-align:center;border:1px solid rgba(255,255,255,.1)}
  .icon{font-size:48px;margin-bottom:12px}
  h1{margin:0 0 8px;font-size:22px;color:${color}}
  p{margin:0 0 20px;color:#94a3b8;font-size:14px}
  .btn{display:inline-block;padding:12px 28px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;border:none;cursor:pointer}
  .btn-approve{background:#16a34a}
  .btn-deny{background:#dc2626}
  .link{display:block;margin-top:16px;color:#3b82f6;font-size:13px;text-decoration:none}
  .sub{font-size:11px;color:#475569;margin-top:20px}
</style></head><body>
<div class="card">
  <div class="icon">${color === "#22c55e" ? "✅" : color === "#ef4444" ? "❌" : "🔄"}</div>
  <h1>${title}</h1>
  <p>${message}</p>
  ${showButton || ""}
  <a href="${openUrl}" class="link">Open Project in Tracker →</a>
  <div class="sub">Assured Energy Solutions · HES Retrofits Tracker</div>
</div></body></html>`;
}

function confirmPage(action, projectId, corId, token, corText, customerName) {
  const isApprove = action === "approve";
  const color = isApprove ? "#22c55e" : "#ef4444";
  const btnClass = isApprove ? "btn-approve" : "btn-deny";
  const label = isApprove ? "✅ Confirm Approve" : "❌ Confirm Deny";
  const formHtml = `<form method="POST" style="display:inline">
    <input type="hidden" name="projectId" value="${projectId}"/>
    <input type="hidden" name="corId" value="${corId}"/>
    <input type="hidden" name="action" value="${action}"/>
    <input type="hidden" name="token" value="${token}"/>
    <button type="submit" class="btn ${btnClass}">${label}</button>
  </form>`;
  return htmlPage(
    `${isApprove ? "Approve" : "Deny"} COR?`,
    `${customerName || "Project"}: "${(corText || "").slice(0, 80)}"`,
    color,
    projectId,
    formHtml
  );
}

function parseFormBody(body) {
  const params = {};
  body.split("&").forEach(pair => {
    const [k, v] = pair.split("=").map(decodeURIComponent);
    params[k] = v;
  });
  return params;
}

export async function handler(event) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers: { "Content-Type": "text/html" },
      body: htmlPage("Server Error", "Missing Supabase configuration.", "#ef4444", "") };
  }

  // GET = show confirmation page (safe for email scanners to hit)
  if (event.httpMethod === "GET") {
    const params = event.queryStringParameters || {};
    const { projectId, corId, action, token } = params;

    if (!projectId || !corId || !action || !token) {
      return { statusCode: 400, headers: { "Content-Type": "text/html" },
        body: htmlPage("Missing Parameters", "This link is incomplete.", "#f59e0b", "") };
    }
    if (!verifyToken(projectId, corId, token)) {
      return { statusCode: 403, headers: { "Content-Type": "text/html" },
        body: htmlPage("Invalid Link", "This link has expired or is not valid.", "#ef4444", projectId) };
    }

    // Fetch COR details for confirmation page
    try {
      const fetchRes = await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${projectId}&select=*`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      const rows = await fetchRes.json();
      if (!rows || rows.length === 0) {
        return { statusCode: 404, headers: { "Content-Type": "text/html" },
          body: htmlPage("Project Not Found", "This project no longer exists.", "#f59e0b", projectId) };
      }
      const data = rows[0].data || {};
      const cor = (data.changeOrders || []).find(c => c.id === corId);
      if (!cor) {
        return { statusCode: 404, headers: { "Content-Type": "text/html" },
          body: htmlPage("COR Not Found", "This change order no longer exists.", "#f59e0b", projectId) };
      }
      if (cor.status !== "pending") {
        return { statusCode: 200, headers: { "Content-Type": "text/html" },
          body: htmlPage("Already Processed", `This COR was already ${cor.status}.`, "#f59e0b", projectId) };
      }
      return { statusCode: 200, headers: { "Content-Type": "text/html" },
        body: confirmPage(action, projectId, corId, token, cor.text, data.customerName) };
    } catch (err) {
      return { statusCode: 500, headers: { "Content-Type": "text/html" },
        body: htmlPage("Error", err.message, "#ef4444", projectId) };
    }
  }

  // POST = actually process the approval/denial
  if (event.httpMethod === "POST") {
    const params = parseFormBody(event.body || "");
    const { projectId, corId, action, token } = params;

    if (!projectId || !corId || !action || !token) {
      return { statusCode: 400, headers: { "Content-Type": "text/html" },
        body: htmlPage("Missing Parameters", "Invalid form submission.", "#f59e0b", "") };
    }
    if (!verifyToken(projectId, corId, token)) {
      return { statusCode: 403, headers: { "Content-Type": "text/html" },
        body: htmlPage("Invalid Link", "This link is not valid.", "#ef4444", projectId) };
    }

    try {
      const fetchRes = await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${projectId}&select=*`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      const rows = await fetchRes.json();
      if (!rows || rows.length === 0) {
        return { statusCode: 404, headers: { "Content-Type": "text/html" },
          body: htmlPage("Project Not Found", "This project no longer exists.", "#f59e0b", projectId) };
      }

      const project = rows[0];
      const data = project.data || {};
      const changeOrders = data.changeOrders || [];
      const corIndex = changeOrders.findIndex((c) => c.id === corId);

      if (corIndex === -1) {
        return { statusCode: 404, headers: { "Content-Type": "text/html" },
          body: htmlPage("COR Not Found", "This change order no longer exists.", "#f59e0b", projectId) };
      }

      const cor = changeOrders[corIndex];
      if (cor.status !== "pending") {
        return { statusCode: 200, headers: { "Content-Type": "text/html" },
          body: htmlPage("Already Processed", `This COR was already ${cor.status}.`, "#f59e0b", projectId) };
      }

      changeOrders[corIndex] = {
        ...cor,
        status: action === "approve" ? "approved" : "denied",
        response: `${action === "approve" ? "Approved" : "Denied"} via email on ${new Date().toLocaleDateString("en-US")}`,
        reviewedBy: "admin (email)",
        reviewedAt: new Date().toISOString(),
      };

      const activityLog = data.activityLog || [];
      activityLog.push({
        ts: new Date().toISOString(),
        by: "admin (email)",
        txt: `COR ${action === "approve" ? "approved" : "denied"} via email: ${cor.text?.slice(0, 50)}…`,
      });

      const updatedData = { ...data, changeOrders, activityLog };

      const updateRes = await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${projectId}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          data: updatedData,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!updateRes.ok) {
        return { statusCode: 500, headers: { "Content-Type": "text/html" },
          body: htmlPage("Update Failed", "Could not update. Please use the app.", "#ef4444", projectId) };
      }

      const customerName = data.customerName || "Project";
      if (action === "approve") {
        return { statusCode: 200, headers: { "Content-Type": "text/html" },
          body: htmlPage("COR Approved", `Change order for ${customerName} has been approved.`, "#22c55e", projectId) };
      } else {
        return { statusCode: 200, headers: { "Content-Type": "text/html" },
          body: htmlPage("COR Denied", `Change order for ${customerName} has been denied.`, "#ef4444", projectId) };
      }
    } catch (err) {
      return { statusCode: 500, headers: { "Content-Type": "text/html" },
        body: htmlPage("Server Error", err.message, "#ef4444", projectId) };
    }
  }

  return { statusCode: 405, headers: { "Content-Type": "text/html" },
    body: htmlPage("Method Not Allowed", "Invalid request method.", "#f59e0b", "") };
}
