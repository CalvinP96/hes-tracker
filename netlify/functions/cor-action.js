// Handles COR approve/deny from email links
// Updates Supabase directly, returns confirmation page
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

function htmlPage(title, message, color, projectId) {
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
  .btn{display:inline-block;padding:10px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px}
  .sub{font-size:11px;color:#475569;margin-top:20px}
</style></head><body>
<div class="card">
  <div class="icon">${color === "#22c55e" ? "✅" : color === "#ef4444" ? "❌" : "⚠️"}</div>
  <h1>${title}</h1>
  <p>${message}</p>
  <a href="${openUrl}" class="btn">Open Project in Tracker</a>
  <div class="sub">Assured Energy Solutions · HES Retrofits Tracker</div>
</div></body></html>`;
}

export async function handler(event) {
  const params = event.queryStringParameters || {};
  const { projectId, corId, action, token } = params;

  if (!projectId || !corId || !action || !token) {
    return { statusCode: 400, headers: { "Content-Type": "text/html" },
      body: htmlPage("Missing Parameters", "This link is incomplete or has been modified.", "#f59e0b", "") };
  }

  if (!verifyToken(projectId, corId, token)) {
    return { statusCode: 403, headers: { "Content-Type": "text/html" },
      body: htmlPage("Invalid Link", "This link has expired or is not valid.", "#ef4444", projectId) };
  }

  if (action !== "approve" && action !== "deny") {
    return { statusCode: 400, headers: { "Content-Type": "text/html" },
      body: htmlPage("Invalid Action", "Action must be approve or deny.", "#f59e0b", projectId) };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers: { "Content-Type": "text/html" },
      body: htmlPage("Server Error", "Missing Supabase configuration.", "#ef4444", projectId) };
  }

  try {
    // Fetch project
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
        body: htmlPage("COR Not Found", "This change order request no longer exists or was already processed.", "#f59e0b", projectId) };
    }

    const cor = changeOrders[corIndex];
    if (cor.status !== "pending") {
      const already = cor.status === "approved" ? "approved" : "denied";
      return { statusCode: 200, headers: { "Content-Type": "text/html" },
        body: htmlPage("Already Processed", `This COR was already ${already}.`, "#f59e0b", projectId) };
    }

    // Update the COR status
    changeOrders[corIndex] = {
      ...cor,
      status: action === "approve" ? "approved" : "denied",
      response: `${action === "approve" ? "Approved" : "Denied"} via email on ${new Date().toLocaleDateString("en-US")}`,
      reviewedBy: "admin (email)",
      reviewedAt: new Date().toISOString(),
    };

    // Add activity log entry
    const activityLog = data.activityLog || [];
    activityLog.push({
      ts: new Date().toISOString(),
      by: "admin (email)",
      txt: `COR ${action === "approve" ? "approved" : "denied"} via email: ${cor.text?.slice(0, 50)}…`,
    });

    const updatedData = { ...data, changeOrders, activityLog };

    // Save back to Supabase
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
      const errText = await updateRes.text();
      console.error("Supabase update error:", errText);
      return { statusCode: 500, headers: { "Content-Type": "text/html" },
        body: htmlPage("Update Failed", "Could not update the project. Please use the app.", "#ef4444", projectId) };
    }

    const customerName = data.customerName || "Project";
    if (action === "approve") {
      return { statusCode: 200, headers: { "Content-Type": "text/html" },
        body: htmlPage("COR Approved", `Change order for ${customerName} has been approved. The team will be notified.`, "#22c55e", projectId) };
    } else {
      return { statusCode: 200, headers: { "Content-Type": "text/html" },
        body: htmlPage("COR Denied", `Change order for ${customerName} has been denied.`, "#ef4444", projectId) };
    }
  } catch (err) {
    console.error("cor-action error:", err);
    return { statusCode: 500, headers: { "Content-Type": "text/html" },
      body: htmlPage("Server Error", `Something went wrong: ${err.message}`, "#ef4444", projectId) };
  }
}
