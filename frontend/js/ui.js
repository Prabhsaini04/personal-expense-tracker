const Toast = (() => {
  function show(message, type = "info") {
    const stack = document.getElementById("toast-stack");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  return {
    success: (message) => show(message, "success"),
    error: (message) => show(message, "error"),
    info: (message) => show(message, "info"),
  };
})();

const Confirm = (() => {
  function ask(message, { confirmLabel = "Delete" } = {}) {
    return new Promise((resolve) => {
      const backdrop = document.getElementById("confirm-modal-backdrop");
      const messageEl = document.getElementById("confirm-message");
      const okBtn = document.getElementById("confirm-ok");
      const cancelBtn = document.getElementById("confirm-cancel");

      messageEl.textContent = message;
      okBtn.textContent = confirmLabel;
      backdrop.hidden = false;

      const cleanup = (result) => {
        backdrop.hidden = true;
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        backdrop.removeEventListener("click", onBackdropClick);
        resolve(result);
      };
      const onOk = () => cleanup(true);
      const onCancel = () => cleanup(false);
      const onBackdropClick = (event) => {
        if (event.target === backdrop) cleanup(false);
      };

      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
      backdrop.addEventListener("click", onBackdropClick);
    });
  }

  return { ask };
})();

const Tabs = (() => {
  function init() {
    const buttons = document.querySelectorAll(".tab-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => activate(btn.dataset.tab));
    });
  }

  function activate(tabName) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle("active", view.id === `view-${tabName}`);
    });
    document.dispatchEvent(new CustomEvent("tab:activated", { detail: { tabName } }));
  }

  return { init, activate };
})();

function formatCurrency(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
