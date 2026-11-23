const Categories = (() => {
  let cache = [];

  function populateSelect(select, { includeAll = false } = {}) {
    const previousValue = select.value;
    select.textContent = "";

    if (includeAll) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "All";
      select.appendChild(option);
    }

    for (const category of cache) {
      const option = document.createElement("option");
      option.value = String(category.id);
      option.textContent = category.name;
      select.appendChild(option);
    }

    if ([...select.options].some((o) => o.value === previousValue)) {
      select.value = previousValue;
    }
  }

  function nameById(id) {
    const category = cache.find((c) => String(c.id) === String(id));
    return category ? category.name : "Uncategorized";
  }

  async function refresh() {
    const { ok, data } = await Api.get("/api/categories");
    if (ok) {
      cache = data;
    }
    populateSelect(document.getElementById("expense-category"));
    populateSelect(document.getElementById("filter-category"), { includeAll: true });
    renderList();
  }

  function renderList() {
    const list = document.getElementById("category-list");
    list.textContent = "";
    for (const category of cache) {
      const li = document.createElement("li");

      const name = document.createElement("span");
      name.textContent = category.name;
      li.appendChild(name);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteCategory(category.id));
      li.appendChild(deleteBtn);

      list.appendChild(li);
    }
  }

  async function deleteCategory(id) {
    const { ok, status, data } = await Api.del(`/api/categories/${id}`);
    const status_el = document.getElementById("category-form-status");
    if (ok) {
      status_el.textContent = "";
      await refresh();
      return;
    }
    status_el.className = "form-status error";
    status_el.textContent = (data && data.error) || `Could not delete category (HTTP ${status}).`;
  }

  function init() {
    const form = document.getElementById("category-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = document.getElementById("category-name");
      const status = document.getElementById("category-form-status");
      const { ok, data } = await Api.post("/api/categories", { name: input.value });
      if (ok) {
        input.value = "";
        status.className = "form-status success";
        status.textContent = "Category added.";
        await refresh();
      } else {
        status.className = "form-status error";
        status.textContent = (data && (data.error || Object.values(data.errors || {})[0])) ||
          "Could not add category.";
      }
    });

    refresh();
  }

  return { init, refresh, nameById };
})();
