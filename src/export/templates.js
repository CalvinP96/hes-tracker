/**
 * Lightweight template engine for HTML export forms
 * Supports: {{variable}}, {{#if condition}}...{{/if}}, {{#each array}}...{{/each}}
 * Handles nested properties like {{project.name}}
 */

export function render(template, data) {
  let result = template;

  // Handle {{#each items}}...{{/each}}
  // Supports {{this}} for simple arrays of strings
  result = result.replace(
    /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (match, key, body) => {
      const arr = data[key];
      if (!Array.isArray(arr)) return "";
      return arr
        .map((item, i) => {
          const itemData = typeof item === "object" ? item : { this: item };
          return render(body, {
            ...data,
            ...itemData,
            _index: i,
            _first: i === 0,
            _last: i === arr.length - 1,
          });
        })
        .join("");
    }
  );

  // Handle {{#if condition}}...{{else}}...{{/if}}
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (match, key, ifBody, elseBody) => {
      return data[key] ? render(ifBody, data) : elseBody ? render(elseBody, data) : "";
    }
  );

  // Handle {{variable}} including nested properties (e.g., {{project.name}})
  result = result.replace(
    /\{\{(\w+(?:\.\w+)*)\}\}/g,
    (match, key) => {
      const val = key.split(".").reduce((obj, k) => obj?.[k], data);
      return val !== undefined && val !== null ? String(val) : "—";
    }
  );

  return result;
}

// ═══════════════════════════════════════════════════════════════
// PRE-BUILT TEMPLATES
// ═══════════════════════════════════════════════════════════════

export const TEMPLATES = {
  // Base wrapper for all print forms
  formWrapper: `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DM Sans',sans-serif;font-size:11px;color:#1a1a1a;padding:20px;max-width:850px;margin:0 auto;line-height:1.4}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a1a1a;padding-bottom:8px;margin-bottom:12px}
  .title{font-size:16px;font-weight:700}
  .subtitle{font-size:11px;color:#666}
  .customer{text-align:right}
  .sec{margin-bottom:12px;border:1px solid #ddd;border-radius:6px;padding:10px}
  .sec h3{font-size:12px;font-weight:700;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:6px}
  .row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f5f5f5}
  .lbl{color:#666;flex:1}
  .val{font-weight:600;text-align:right}
  .pass{color:#16a34a;font-weight:700}
  .fail{color:#dc2626;font-weight:700}
  .na{color:#999}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:4px 16px}
  .sig-row{display:flex;gap:20px;margin-top:16px;padding-top:12px;border-top:2px solid #1a1a1a}
  .sig-box{flex:1;text-align:center}
  .sig-line{border-top:1px solid #999;margin-top:40px;padding-top:4px;font-size:10px;color:#666}
  .sig-img{height:50px;object-fit:contain}
  table{width:100%;border-collapse:collapse;font-size:10px;margin-top:4px}
  th{text-align:left;padding:3px 6px;border:1px solid #ccc;background:#f0f0f0;font-weight:600}
  td{padding:3px 6px;border:1px solid #ddd}
  @media print{body{padding:10px}@page{margin:0.5in}}
</style>
</head><body>
<div class="header">
  <div><div class="title">{{formTitle}}</div><div class="subtitle">Home Energy Savings — Retrofits Program</div></div>
  <div class="customer"><div style="font-weight:600">{{customerName}}</div><div>{{address}}</div>
  {{#if riseId}}<div style="font-size:10px;color:#666">RISE: {{riseId}}</div>{{/if}}
  {{#if date}}<div style="font-size:10px;color:#666">Date: {{date}}</div>{{/if}}
  </div>
</div>
{{content}}
{{#if signatures}}
<div class="sig-row">
{{#each signatures}}
<div class="sig-box">
{{#if image}}<img src="{{image}}" class="sig-img" alt="Signature"/>{{/if}}
<div class="sig-line">{{label}}</div>
</div>
{{/each}}
</div>
{{/if}}
</body></html>`,

  // Section block - generic key-value pairs
  section: `<div class="sec"><h3>{{title}}</h3>
{{#each rows}}<div class="row"><span class="lbl">{{label}}</span><span class="val">{{value}}</span></div>{{/each}}
{{#if text}}<p style="margin-top:4px">{{text}}</p>{{/if}}
</div>`,

  // Table section - structured tabular data
  tableSection: `<div class="sec"><h3>{{title}}</h3>
<table>
<tr>{{#each headers}}<th>{{this}}</th>{{/each}}</tr>
{{#each rows}}<tr>{{#each cells}}<td>{{this}}</td>{{/each}}</tr>{{/each}}
</table></div>`,

  // Checklist section - items with pass/fail/na status
  checklistSection: `<div class="sec"><h3>{{title}}</h3>
{{#each items}}<div class="row"><span class="lbl">{{label}}</span><span class="{{statusClass}}">{{status}}</span></div>{{/each}}
</div>`,

  // Grid section - two-column layout
  gridSection: `<div class="sec"><h3>{{title}}</h3>
<div class="grid">
{{#each items}}<div><span class="lbl">{{label}}</span><div class="val">{{value}}</div></div>{{/each}}
</div></div>`,
};

/**
 * Build a complete form from sections
 * @param {Object} config - Form configuration
 * @param {string} config.title - Form title
 * @param {Object} config.project - Project data (customerName, address, riseId)
 * @param {string} config.date - Optional date string
 * @param {Array} config.sections - Array of section objects
 * @param {Array} config.signatures - Optional array of signature objects
 * @returns {string} Complete HTML form
 */
export function buildForm({ title, project, date, sections, signatures }) {
  const content = sections
    .map((sec) => {
      if (sec.type === "table") return render(TEMPLATES.tableSection, sec);
      if (sec.type === "checklist") return render(TEMPLATES.checklistSection, sec);
      if (sec.type === "grid") return render(TEMPLATES.gridSection, sec);
      return render(TEMPLATES.section, sec);
    })
    .join("");

  return render(TEMPLATES.formWrapper, {
    formTitle: title,
    customerName: project?.customerName || "Unnamed",
    address: project?.address || "",
    riseId: project?.riseId || "",
    date: date || new Date().toLocaleDateString(),
    content,
    signatures: signatures || null,
  });
}

/**
 * Helper to format checklist item status
 * @param {string} status - 'pass', 'fail', or 'na'
 * @returns {Object} Status and CSS class
 */
export function formatChecklistStatus(status) {
  const map = {
    pass: { label: "✓ Pass", class: "pass" },
    fail: { label: "✗ Fail", class: "fail" },
    na: { label: "N/A", class: "na" },
  };
  return map[status] || { label: "—", class: "na" };
}

/**
 * Helper to create section data from project fields
 * @param {Object} project - Project object
 * @param {Array} fields - Array of field names to extract
 * @returns {Object} Section with rows
 */
export function projectSectionFromFields(title, project, fields) {
  return {
    type: "default",
    title,
    rows: fields.map((field) => ({
      label: field.charAt(0).toUpperCase() + field.slice(1),
      value: project[field] || "—",
    })),
  };
}
