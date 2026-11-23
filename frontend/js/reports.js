const Reports = (() => {
  function buildQuery() {
    const params = new URLSearchParams();
    const start = document.getElementById("report-start-date").value;
    const end = document.getElementById("report-end-date").value;
    if (start) params.set("start_date", start);
    if (end) params.set("end_date", end);
    return params.toString();
  }

  function renderBars(containerId, rows, labelKey) {
    const container = document.getElementById(containerId);
    container.textContent = "";

    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No data for this period.";
      container.appendChild(empty);
      return;
    }

    const max = Math.max(1, ...rows.map((r) => Number(r.total)));

    for (const row of rows) {
      const wrapper = document.createElement("div");
      wrapper.className = "bar-row";

      const label = document.createElement("span");
      label.textContent = row[labelKey];
      wrapper.appendChild(label);

      const track = document.createElement("div");
      track.className = "bar-track";
      const fill = document.createElement("div");
      fill.className = "bar-fill";
      const pct = (Number(row.total) / max) * 100;
      fill.style.width = `${pct}%`;
      track.appendChild(fill);
      wrapper.appendChild(track);

      const value = document.createElement("span");
      value.className = "bar-value";
      value.textContent = formatCurrency(row.total);
      wrapper.appendChild(value);

      container.appendChild(wrapper);
    }
  }

  async function run() {
    const query = buildQuery();

    const [categoryResult, monthlyResult] = await Promise.all([
      Api.get(`/api/reports/category-totals${query ? `?${query}` : ""}`),
      Api.get(`/api/reports/monthly-totals${query ? `?${query}` : ""}`),
    ]);

    if (!categoryResult.ok || !monthlyResult.ok) {
      const errorData = (!categoryResult.ok ? categoryResult.data : monthlyResult.data) || {};
      Toast.error(Object.values(errorData.errors || {})[0] || "Could not load reports.");
      return;
    }

    const categoryRows = categoryResult.data
      .filter((r) => Number(r.total) > 0)
      .sort((a, b) => Number(b.total) - Number(a.total));
    renderBars("category-totals-bars", categoryRows, "category_name");
    renderBars("monthly-totals-bars", monthlyResult.data, "month");
  }

  function init() {
    document.getElementById("report-run").addEventListener("click", run);
    document.addEventListener("tab:activated", (event) => {
      if (event.detail.tabName === "reports") run();
    });
    run();
  }

  return { init };
})();
