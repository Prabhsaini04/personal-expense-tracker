const Expenses = (() => {
  const fieldIds = ["amount", "category_id", "expense_date", "description"];
  let currentRows = [];
  let sortState = { field: "expense_date", direction: "desc" };

  function clearErrors() {
    for (const field of fieldIds) {
      const el = document.getElementById(`error-${field}`);
      if (el) el.textContent = "";
    }
  }

  function showErrors(errors) {
    clearErrors();
    for (const [field, message] of Object.entries(errors || {})) {
      const el = document.getElementById(`error-${field}`);
      if (el) el.textContent = message;
    }
  }

  function openModal(expense = null) {
    clearErrors();
    const backdrop = document.getElementById("expense-modal-backdrop");
    if (expense) {
      document.getElementById("expense-id").value = expense.id;
      document.getElementById("expense-amount").value = expense.amount;
      document.getElementById("expense-category").value = String(expense.category_id || "");
      document.getElementById("expense-date").value = expense.expense_date;
      document.getElementById("expense-description").value = expense.description;
      document.getElementById("expense-form-title").textContent = "Edit Expense";
      document.getElementById("expense-submit").textContent = "Save Changes";
    } else {
      document.getElementById("expense-id").value = "";
      document.getElementById("expense-amount").value = "";
      document.getElementById("expense-date").value = "";
      document.getElementById("expense-description").value = "";
      document.getElementById("expense-form-title").textContent = "Add Expense";
      document.getElementById("expense-submit").textContent = "Add Expense";
    }
    backdrop.hidden = false;
    document.getElementById("expense-amount").focus();
  }

  function closeModal() {
    document.getElementById("expense-modal-backdrop").hidden = true;
  }

  function buildPayload() {
    return {
      amount: document.getElementById("expense-amount").value.trim(),
      category_id: Number(document.getElementById("expense-category").value) || null,
      expense_date: document.getElementById("expense-date").value,
      description: document.getElementById("expense-description").value,
    };
  }

  function currentFilters() {
    const params = new URLSearchParams();
    const categoryId = document.getElementById("filter-category").value;
    const start = document.getElementById("filter-start-date").value;
    const end = document.getElementById("filter-end-date").value;
    if (categoryId) params.set("category_id", categoryId);
    if (start) params.set("start_date", start);
    if (end) params.set("end_date", end);
    return params.toString();
  }

  function sortRows(rows) {
    const { field, direction } = sortState;
    const sign = direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      let va = a[field];
      let vb = b[field];
      if (field === "amount") {
        va = Number(va);
        vb = Number(vb);
      }
      if (va < vb) return -1 * sign;
      if (va > vb) return 1 * sign;
      return 0;
    });
  }

  function renderRow(expense, { withActions }) {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = expense.expense_date;
    row.appendChild(dateCell);

    const categoryCell = document.createElement("td");
    categoryCell.textContent = expense.category_name;
    row.appendChild(categoryCell);

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = expense.description;
    row.appendChild(descriptionCell);

    const amountCell = document.createElement("td");
    amountCell.className = "num";
    amountCell.textContent = formatCurrency(expense.amount);
    row.appendChild(amountCell);

    if (withActions) {
      const actionsCell = document.createElement("td");
      actionsCell.className = "row-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-icon";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => openModal(expense));
      actionsCell.appendChild(editBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn btn-icon";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteExpense(expense));
      actionsCell.appendChild(deleteBtn);

      row.appendChild(actionsCell);
    }

    return row;
  }

  function updateSortIndicators() {
    document.querySelectorAll(".sortable-col").forEach((th) => {
      const indicator = th.querySelector(".sort-indicator");
      if (th.dataset.sort === sortState.field) {
        indicator.textContent = sortState.direction === "asc" ? "▲" : "▼";
      } else {
        indicator.textContent = "";
      }
    });
  }

  async function refreshList() {
    const query = currentFilters();
    const { ok, data } = await Api.get(`/api/expenses${query ? `?${query}` : ""}`);
    const body = document.getElementById("expense-table-body");
    const emptyState = document.getElementById("expense-empty-state");
    body.textContent = "";

    if (!ok) {
      Toast.error((data && Object.values(data.errors || {})[0]) || "Could not load expenses.");
      return;
    }

    currentRows = data;
    emptyState.hidden = data.length !== 0;
    for (const expense of sortRows(currentRows)) {
      body.appendChild(renderRow(expense, { withActions: true }));
    }
    updateSortIndicators();
  }

  async function refreshDashboard() {
    const { ok, data } = await Api.get("/api/expenses");
    const body = document.getElementById("dashboard-recent-body");
    const emptyState = document.getElementById("dashboard-empty-state");
    body.textContent = "";

    if (!ok) {
      Toast.error("Could not load dashboard.");
      return;
    }

    emptyState.hidden = data.length !== 0;
    for (const expense of data.slice(0, 5)) {
      body.appendChild(renderRow(expense, { withActions: false }));
    }

    const total = data.reduce((sum, e) => sum + Number(e.amount), 0);
    const byCategory = {};
    for (const expense of data) {
      byCategory[expense.category_name] = (byCategory[expense.category_name] || 0) + Number(expense.amount);
    }
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

    document.getElementById("summary-total").textContent = formatCurrency(total);
    document.getElementById("summary-count").textContent = String(data.length);
    document.getElementById("summary-top-category").textContent = topCategory ? topCategory[0] : "--";
  }

  async function submitForm() {
    const id = document.getElementById("expense-id").value;
    const payload = buildPayload();

    const result = id
      ? await Api.put(`/api/expenses/${id}`, payload)
      : await Api.post("/api/expenses", payload);

    if (result.ok) {
      Toast.success(id ? "Expense updated." : "Expense added.");
      closeModal();
      await refreshList();
      await refreshDashboard();
    } else if (result.status === 404) {
      Toast.error("This expense no longer exists.");
      closeModal();
      await refreshList();
    } else {
      showErrors(result.data && result.data.errors);
    }
  }

  async function deleteExpense(expense) {
    const confirmed = await Confirm.ask(
      `Delete the ${formatCurrency(expense.amount)} expense from ${expense.expense_date}? This cannot be undone.`
    );
    if (!confirmed) return;

    const { ok } = await Api.del(`/api/expenses/${expense.id}`);
    if (ok) {
      Toast.success("Expense deleted.");
      await refreshList();
      await refreshDashboard();
    } else {
      Toast.error("Could not delete expense.");
    }
  }

  function init() {
    document.getElementById("expense-form").addEventListener("submit", (event) => {
      event.preventDefault();
      submitForm();
    });

    document.getElementById("expense-cancel").addEventListener("click", closeModal);
    document.getElementById("expense-modal-close").addEventListener("click", closeModal);
    document.getElementById("expense-modal-backdrop").addEventListener("click", (event) => {
      if (event.target.id === "expense-modal-backdrop") closeModal();
    });

    document.getElementById("dashboard-add-btn").addEventListener("click", () => openModal());
    document.getElementById("expenses-add-btn").addEventListener("click", () => openModal());

    document.getElementById("filter-category").addEventListener("change", refreshList);
    document.getElementById("filter-start-date").addEventListener("change", refreshList);
    document.getElementById("filter-end-date").addEventListener("change", refreshList);
    document.getElementById("filter-clear").addEventListener("click", () => {
      document.getElementById("filter-category").value = "";
      document.getElementById("filter-start-date").value = "";
      document.getElementById("filter-end-date").value = "";
      refreshList();
    });

    document.querySelectorAll(".sortable-col").forEach((th) => {
      th.addEventListener("click", () => {
        const field = th.dataset.sort;
        if (sortState.field === field) {
          sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
        } else {
          sortState = { field, direction: "asc" };
        }
        const body = document.getElementById("expense-table-body");
        body.textContent = "";
        for (const expense of sortRows(currentRows)) {
          body.appendChild(renderRow(expense, { withActions: true }));
        }
        updateSortIndicators();
      });
    });

    document.addEventListener("categories:changed", refreshList);
    document.addEventListener("tab:activated", (event) => {
      if (event.detail.tabName === "dashboard") refreshDashboard();
      if (event.detail.tabName === "expenses") refreshList();
    });

    refreshList();
    refreshDashboard();
  }

  return { init, refreshList, refreshDashboard, openModal };
})();
