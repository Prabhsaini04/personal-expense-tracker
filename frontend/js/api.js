const Api = (() => {
  async function request(path, options = {}) {
    const resp = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (resp.status === 204) {
      return { ok: true, status: 204, data: null };
    }

    const data = await resp.json().catch(() => null);
    return { ok: resp.ok, status: resp.status, data };
  }

  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
    del: (path) => request(path, { method: "DELETE" }),
  };
})();
