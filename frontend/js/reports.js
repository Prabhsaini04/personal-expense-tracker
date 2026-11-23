const Reports = (() => {
  function buildQuery() {
    const params = new URLSearchParams();
    const start = document.getElementById("report-start-date").value;
    const end = document.getElementById("report-end-date").value;
    if (start) params.set("start_date", start);
    if (end) params.set("end_date", end);
    return params.toString();
  }

  function fillTable(bodyId, rows, renderRow) {
    const body = document.getElementById(bodyId);
    body.textContent = "";
    for (const row of rows) {
      body.appendChild(renderRow(row));
    }
  }

  function row(cells) {
    const tr = document.createElement("tr");
    for (const text of cells) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    }
    return tr;
  }

  async function run() {
    const query = buildQuery();
    const status = document.getElementById("report-status");

    const [categoryResult, monthlyResult] = await Promise.all([
      Api.get(`/api/reports/category-totals${query ? `?${query}` : ""}`),
      Api.get(`/api/reports/monthly-totals${query ? `?${query}` : ""}`),
    ]);

    if (!categoryResult.ok || !monthlyResult.ok) {
      status.className = "form-status error";
      const errorData = (!categoryResult.ok ? categoryResult.data : monthlyResult.data) || {};
      status.textContent = Object.values(errorData.errors || {})[0] || "Could not load reports.";
      return;
    }
    status.textContent = "";

    fillTable("category-totals-body", categoryResult.data, (r) =>
      row([r.category_name, r.total])
    );
    fillTable("monthly-totals-body", monthlyResult.data, (r) => row([r.month, r.total]));
  }

  function init() {
    document.getElementById("report-run").addEventListener("click", run);
    run();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  Reports.init();
});
