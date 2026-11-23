const Expenses = (() => {
  const fieldIds = ["amount", "category_id", "expense_date", "description"];

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

  function setFormStatus(message, isError) {
    const status = document.getElementById("expense-form-status");
    status.className = isError ? "form-status error" : "form-status success";
    status.textContent = message;
  }

  function resetForm() {
    document.getElementById("expense-id").value = "";
    document.getElementById("expense-amount").value = "";
    document.getElementById("expense-date").value = "";
    document.getElementById("expense-description").value = "";
    document.getElementById("expense-form-title").textContent = "Add Expense";
    document.getElementById("expense-submit").textContent = "Add Expense";
    document.getElementById("expense-cancel-edit").hidden = true;
    clearErrors();
  }

  function buildPayload() {
    return {
      amount: document.getElementById("expense-amount").value.trim(),
      category_id: Number(document.getElementById("expense-category").value) || null,
      expense_date: document.getElementById("expense-date").value,
      description: document.getElementById("expense-description").value,
    };
  }

  function startEdit(expense) {
    document.getElementById("expense-id").value = expense.id;
    document.getElementById("expense-amount").value = expense.amount;
    document.getElementById("expense-category").value = String(expense.category_id || "");
    document.getElementById("expense-date").value = expense.expense_date;
    document.getElementById("expense-description").value = expense.description;
    document.getElementById("expense-form-title").textContent = "Edit Expense";
    document.getElementById("expense-submit").textContent = "Save Changes";
    document.getElementById("expense-cancel-edit").hidden = false;
    clearErrors();
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

  async function refreshList() {
    const query = currentFilters();
    const { ok, data } = await Api.get(`/api/expenses${query ? `?${query}` : ""}`);
    const filterStatus = document.getElementById("filter-status");
    const body = document.getElementById("expense-table-body");
    const emptyState = document.getElementById("expense-empty-state");
    body.textContent = "";

    if (!ok) {
      filterStatus.className = "form-status error";
      filterStatus.textContent = (data && Object.values(data.errors || {})[0]) ||
        "Could not load expenses.";
      return;
    }
    filterStatus.textContent = "";

    emptyState.hidden = data.length !== 0;

    for (const expense of data) {
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
      amountCell.textContent = expense.amount;
      row.appendChild(amountCell);

      const actionsCell = document.createElement("td");
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => startEdit(expense));
      actionsCell.appendChild(editBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteExpense(expense.id));
      actionsCell.appendChild(deleteBtn);

      row.appendChild(actionsCell);
      body.appendChild(row);
    }
  }

  async function deleteExpense(id) {
    if (!window.confirm("Delete this expense? This cannot be undone.")) {
      return;
    }
    const { ok, status } = await Api.del(`/api/expenses/${id}`);
    if (ok) {
      await refreshList();
    } else {
      setFormStatus(`Could not delete expense (HTTP ${status}).`, true);
    }
  }

  function init() {
    const form = document.getElementById("expense-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = document.getElementById("expense-id").value;
      const payload = buildPayload();

      const result = id
        ? await Api.put(`/api/expenses/${id}`, payload)
        : await Api.post("/api/expenses", payload);

      if (result.ok) {
        setFormStatus(id ? "Expense updated." : "Expense added.", false);
        resetForm();
        await refreshList();
      } else if (result.status === 404) {
        setFormStatus("This expense no longer exists.", true);
        resetForm();
        await refreshList();
      } else {
        showErrors(result.data && result.data.errors);
        setFormStatus("Please fix the highlighted fields.", true);
      }
    });

    document.getElementById("expense-cancel-edit").addEventListener("click", resetForm);
    document.getElementById("filter-apply").addEventListener("click", refreshList);
    document.getElementById("filter-clear").addEventListener("click", () => {
      document.getElementById("filter-category").value = "";
      document.getElementById("filter-start-date").value = "";
      document.getElementById("filter-end-date").value = "";
      refreshList();
    });

    refreshList();
  }

  return { init, refreshList };
})();

document.addEventListener("DOMContentLoaded", () => {
  Categories.init();
  Expenses.init();
});
