const el = (id) => document.getElementById(id);

const ROLES = ["admin", "analyst", "support", "viewer", "user"];

const state = {
  token: null,
  currentUser: null,
  users: [],
};

function setToken(token) {
  state.token = token;
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
}

function parseError(text, fallback) {
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed.detail) return String(parsed.detail);
  } catch (e) {}
  return text;
}

async function api(path, opts = {}) {
  const headers = Object.assign({}, opts.headers || {});
  if (!headers["Content-Type"] && opts.method && opts.method !== "GET") {
    headers["Content-Type"] = "application/json";
  }
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const resp = await fetch(path, Object.assign({}, opts, { headers }));
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(parseError(body, `HTTP ${resp.status}`));
  }

  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await resp.json();
  }
  return null;
}

function showLoginError(message) {
  const node = el("login-error");
  node.textContent = message || "";
  node.classList.toggle("hidden", !message);
}

function switchView(adminMode) {
  el("login-view").classList.toggle("hidden", adminMode);
  el("admin-view").classList.toggle("hidden", !adminMode);
}

function fmtDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch (e) {
    return value;
  }
}

function boolBadge(value) {
  const span = document.createElement("span");
  span.className = value ? "badge danger" : "badge ok";
  span.textContent = value ? "yes" : "no";
  return span;
}

function roleSelect(value) {
  const select = document.createElement("select");
  ROLES.forEach((role) => {
    const option = document.createElement("option");
    option.value = role;
    option.textContent = role;
    if (role === value) option.selected = true;
    select.appendChild(option);
  });
  return select;
}

async function doLogin() {
  const username = (el("username").value || "").trim();
  const password = el("password").value || "";
  if (!username || !password) {
    showLoginError("Введите username и password");
    return;
  }

  try {
    showLoginError("");
    const tokenResponse = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(tokenResponse.access_token);
    await bootstrapByToken();
  } catch (err) {
    showLoginError(String(err.message || err));
  }
}

function clearCreateUserForm() {
  el("create-username").value = "";
  el("create-email").value = "";
  el("create-password").value = "";
  el("create-role").value = "user";
}

function setCreateUserMessage(text, isError) {
  const node = el("create-user-msg");
  node.textContent = text || "";
  node.style.color = isError ? "#b91c1c" : "#334155";
}

async function createUser() {
  const username = (el("create-username").value || "").trim();
  const email = (el("create-email").value || "").trim();
  const password = el("create-password").value || "";
  const role = el("create-role").value;

  if (!username || !password) {
    setCreateUserMessage("Username и password обязательны", true);
    return;
  }

  try {
    setCreateUserMessage("", false);
    await api("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        username,
        email: email || null,
        password,
        role,
      }),
    });
    setCreateUserMessage("Пользователь создан", false);
    clearCreateUserForm();
    await Promise.all([loadUsers(), loadActivity()]);
  } catch (err) {
    setCreateUserMessage(String(err.message || err), true);
  }
}

async function assignRole(userId, role) {
  try {
    await api(`/admin/users/${userId}/role`, {
      method: "POST",
      body: JSON.stringify({ role }),
    });
    await Promise.all([loadUsers(), loadActivity()]);
  } catch (err) {
    alert(`Не удалось назначить роль: ${String(err.message || err)}`);
  }
}

async function toggleBlock(user) {
  const nextBlocked = !user.is_blocked;
  const reason = nextBlocked ? prompt("Причина блокировки (optional):", "") : "";

  try {
    await api(`/admin/users/${user.id}/block`, {
      method: "POST",
      body: JSON.stringify({ blocked: nextBlocked, reason: reason || null }),
    });
    await Promise.all([loadUsers(), loadActivity()]);
  } catch (err) {
    alert(`Не удалось изменить статус блокировки: ${String(err.message || err)}`);
  }
}

async function forceLogout(user) {
  if (!confirm(`Принудительно завершить все сессии пользователя ${user.username}?`)) return;
  const reason = prompt("Причина (optional):", "admin action");

  try {
    await api(`/admin/users/${user.id}/force-logout`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || null }),
    });
    await Promise.all([loadUsers(), loadActivity()]);
  } catch (err) {
    alert(`Не удалось выполнить принудительный выход: ${String(err.message || err)}`);
  }
}

async function deleteUser(user) {
  if (!confirm(`Удалить пользователя ${user.username}?`)) return;

  try {
    await api(`/admin/users/${user.id}`, { method: "DELETE" });
    await Promise.all([loadUsers(), loadActivity()]);
  } catch (err) {
    alert(`Не удалось удалить пользователя: ${String(err.message || err)}`);
  }
}

function renderUsers() {
  const tbody = el("users-tbody");
  tbody.innerHTML = "";

  if (!state.users.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.className = "muted";
    cell.textContent = "Пользователи не найдены";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  state.users.forEach((user) => {
    const row = document.createElement("tr");

    const idCell = document.createElement("td");
    idCell.textContent = String(user.id || "-");
    row.appendChild(idCell);

    const nameCell = document.createElement("td");
    nameCell.textContent = user.username || "-";
    row.appendChild(nameCell);

    const emailCell = document.createElement("td");
    emailCell.textContent = user.email || "-";
    row.appendChild(emailCell);

    const roleCell = document.createElement("td");
    roleCell.className = "inline-cell";
    const select = roleSelect(user.role || "user");
    const roleBtn = document.createElement("button");
    roleBtn.className = "btn";
    roleBtn.textContent = "Назначить";
    roleBtn.addEventListener("click", () => assignRole(user.id, select.value));
    roleCell.appendChild(select);
    roleCell.appendChild(roleBtn);
    row.appendChild(roleCell);

    const blockedCell = document.createElement("td");
    blockedCell.appendChild(boolBadge(Boolean(user.is_blocked)));
    row.appendChild(blockedCell);

    const seenCell = document.createElement("td");
    seenCell.textContent = fmtDate(user.last_seen_at);
    row.appendChild(seenCell);

    const actionsCell = document.createElement("td");
    actionsCell.className = "inline-cell";

    const blockBtn = document.createElement("button");
    blockBtn.className = "btn";
    blockBtn.textContent = user.is_blocked ? "Разблокировать" : "Блокировать";
    blockBtn.addEventListener("click", () => toggleBlock(user));

    const forceBtn = document.createElement("button");
    forceBtn.className = "btn";
    forceBtn.textContent = "Выход сессий";
    forceBtn.addEventListener("click", () => forceLogout(user));

    const delBtn = document.createElement("button");
    delBtn.className = "btn ghost";
    delBtn.textContent = "Удалить";
    delBtn.disabled = state.currentUser && user.id === state.currentUser.id;
    delBtn.addEventListener("click", () => deleteUser(user));

    actionsCell.appendChild(blockBtn);
    actionsCell.appendChild(forceBtn);
    actionsCell.appendChild(delBtn);
    row.appendChild(actionsCell);

    tbody.appendChild(row);
  });
}

function readUserFilters() {
  const query = (el("search-query").value || "").trim();
  const role = el("filter-role").value || "";
  const blocked = el("filter-blocked").value;

  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (role) params.set("role", role);
  if (blocked !== "") params.set("blocked", blocked);
  params.set("limit", "200");
  return params;
}

async function loadUsers() {
  const params = readUserFilters();
  const data = await api(`/admin/users?${params.toString()}`);
  state.users = data.items || [];
  renderUsers();
}

function renderActivitySummary(data) {
  const root = el("activity-summary");
  root.innerHTML = "";

  const items = [
    { label: "События (24ч)", value: data.total_events ?? 0 },
    { label: "Активные пользователи", value: data.active_users ?? 0 },
    { label: "Заблокированные", value: data.blocked_users ?? 0 },
  ];

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "summary-card";

    const title = document.createElement("div");
    title.className = "summary-title";
    title.textContent = item.label;

    const value = document.createElement("div");
    value.className = "summary-value";
    value.textContent = String(item.value);

    card.appendChild(title);
    card.appendChild(value);
    root.appendChild(card);
  });
}

function renderActivityRows(items) {
  const tbody = el("activity-tbody");
  tbody.innerHTML = "";

  if (!items.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "muted";
    cell.textContent = "Событий не найдено";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  items.forEach((event) => {
    const row = document.createElement("tr");

    const timeCell = document.createElement("td");
    timeCell.textContent = fmtDate(event.created_at);

    const userCell = document.createElement("td");
    userCell.textContent = event.username || "-";

    const actionCell = document.createElement("td");
    actionCell.textContent = event.action || "-";

    const detailsCell = document.createElement("td");
    detailsCell.textContent = event.details ? JSON.stringify(event.details) : "-";

    const ipCell = document.createElement("td");
    ipCell.textContent = event.ip || "-";

    row.appendChild(timeCell);
    row.appendChild(userCell);
    row.appendChild(actionCell);
    row.appendChild(detailsCell);
    row.appendChild(ipCell);

    tbody.appendChild(row);
  });
}

async function loadActivity() {
  const [summary, feed] = await Promise.all([
    api("/admin/activity/summary"),
    api("/admin/activity?limit=50"),
  ]);

  renderActivitySummary(summary || {});
  renderActivityRows((feed && feed.items) || []);
}

function renderServiceList(items) {
  const root = el("services-list");
  root.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "Нет данных по сервисам";
    root.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "service-card";

    const top = document.createElement("div");
    top.className = "service-top";

    const name = document.createElement("strong");
    name.textContent = item.name;

    const badge = document.createElement("span");
    badge.className = `badge ${item.status === "up" ? "ok" : item.status === "down" ? "danger" : "warn"}`;
    badge.textContent = item.status;

    top.appendChild(name);
    top.appendChild(badge);

    const meta = document.createElement("div");
    meta.className = "muted service-meta";
    const parts = [];
    if (item.http_status) parts.push(`HTTP ${item.http_status}`);
    if (item.latency_ms !== undefined) parts.push(`${item.latency_ms} ms`);
    if (item.age_seconds !== undefined) parts.push(`age ${item.age_seconds}s`);
    if (item.error) parts.push(`error: ${item.error}`);
    if (!parts.length) parts.push("-");
    meta.textContent = parts.join(" | ");

    card.appendChild(top);
    card.appendChild(meta);
    root.appendChild(card);
  });
}

async function loadServices() {
  const data = await api("/admin/services/status");
  renderServiceList((data && data.services) || []);
}

async function loadAll() {
  await Promise.all([loadUsers(), loadActivity(), loadServices()]);
}

async function bootstrapByToken() {
  if (!state.token) {
    switchView(false);
    return;
  }

  try {
    const me = await api("/auth/me");
    state.currentUser = me;

    if (!(me && (me.is_admin || me.role === "admin"))) {
      showLoginError("Пользователь не имеет роли admin");
      switchView(false);
      return;
    }

    showLoginError("");
    switchView(true);
    await loadAll();
  } catch (err) {
    setToken(null);
    state.currentUser = null;
    showLoginError(String(err.message || err));
    switchView(false);
  }
}

function resetFilters() {
  el("search-query").value = "";
  el("filter-role").value = "";
  el("filter-blocked").value = "";
}

function wireFloating(id) {
  const input = el(id);
  const field = input.closest(".field");
  function update() {
    if (input.value && input.value.trim() !== "") field.classList.add("filled");
    else field.classList.remove("filled");
  }
  input.addEventListener("input", update);
  input.addEventListener("focus", () => field.classList.add("filled"));
  input.addEventListener("blur", update);
  update();
}

function wireEvents() {
  el("btn-login").addEventListener("click", (e) => {
    e.preventDefault();
    doLogin();
  });

  el("username").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doLogin();
    }
  });

  el("password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doLogin();
    }
  });

  el("btn-search").addEventListener("click", async () => {
    await loadUsers();
  });

  el("btn-clear-filters").addEventListener("click", async () => {
    resetFilters();
    await loadUsers();
  });

  el("search-query").addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await loadUsers();
    }
  });

  el("btn-create-user").addEventListener("click", async () => {
    await createUser();
  });

  el("btn-refresh-all").addEventListener("click", async () => {
    await loadAll();
  });

  el("btn-reload-activity").addEventListener("click", async () => {
    await loadActivity();
  });

  el("btn-reload-services").addEventListener("click", async () => {
    await loadServices();
  });

  el("btn-logout").addEventListener("click", () => {
    setToken(null);
    state.currentUser = null;
    switchView(false);
  });

  wireFloating("username");
  wireFloating("password");
}

(function init() {
  wireEvents();

  try {
    const params = new URLSearchParams(window.location.search);
    const tokenFromQuery = params.get("token");
    if (tokenFromQuery) {
      setToken(tokenFromQuery);
      params.delete("token");
      const url = new URL(window.location.href);
      url.search = params.toString();
      window.history.replaceState({}, "", url.toString());
    } else {
      const saved = localStorage.getItem("auth_token");
      if (saved) setToken(saved);
    }
  } catch (e) {}

  bootstrapByToken();
})();
