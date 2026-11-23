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

  function all() {
    return cache;
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
    document.dispatchEvent(new CustomEvent("categories:changed"));
  }

  function renderList() {
    const list = document.getElementById("category-list");
    list.textContent = "";
    if (cache.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No categories yet. Add one above.";
      list.appendChild(empty);
      return;
    }
    for (const category of cache) {
      const chip = document.createElement("span");
      chip.className = "chip";

      const name = document.createElement("span");
      name.textContent = category.name;
      chip.appendChild(name);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "×";
      deleteBtn.setAttribute("aria-label", `Delete ${category.name}`);
      deleteBtn.addEventListener("click", () => deleteCategory(category));
      chip.appendChild(deleteBtn);

      list.appendChild(chip);
    }
  }

  async function deleteCategory(category) {
    const confirmed = await Confirm.ask(`Delete category "${category.name}"?`);
    if (!confirmed) return;

    const { ok, data } = await Api.del(`/api/categories/${category.id}`);
    if (ok) {
      Toast.success(`Category "${category.name}" deleted.`);
      await refresh();
    } else {
      Toast.error((data && data.error) || "Could not delete category.");
    }
  }

  function init() {
    const form = document.getElementById("category-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = document.getElementById("category-name");
      const { ok, data } = await Api.post("/api/categories", { name: input.value });
      if (ok) {
        input.value = "";
        Toast.success("Category added.");
        await refresh();
      } else {
        Toast.error((data && (data.error || Object.values(data.errors || {})[0])) ||
          "Could not add category.");
      }
    });

    refresh();
  }

  return { init, refresh, nameById, all };
})();
