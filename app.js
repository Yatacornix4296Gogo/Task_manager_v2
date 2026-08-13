const STORAGE = {
  tasks: "tm_tasks_v1",
  todos: "tm_todos_v1",
  history: "tm_history_v1"
};

let state = {
  tasks: [],
  todos: [],
  history: []
};

const $ = (id) => document.getElementById(id);

function loadState() {
  const savedTasks = localStorage.getItem(STORAGE.tasks);
  const savedTodos = localStorage.getItem(STORAGE.todos);
  const savedHistory = localStorage.getItem(STORAGE.history);

  state.tasks = savedTasks ? JSON.parse(savedTasks) : [];
  state.todos = savedTodos ? JSON.parse(savedTodos) : [];
  state.history = savedHistory ? JSON.parse(savedHistory) : [];
}

function save() {
  localStorage.setItem(STORAGE.tasks, JSON.stringify(state.tasks));
  localStorage.setItem(STORAGE.todos, JSON.stringify(state.todos));
  localStorage.setItem(STORAGE.history, JSON.stringify(state.history));
}

function uid(prefix = "id") {
  return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(key) {
  const [y, m, d] = key.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelector(`#${name}View`).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  $("pageTitle").textContent = name === "home" ? "今日" : name === "tasks" ? "タスク" : "履歴";
  renderAll();
  window.scrollTo({top: 0, behavior: "smooth"});
}

function renderAll() {
  renderToday();
  renderTasks();
  renderHistory();
  updateSubjectFilter();
}

function renderToday() {
  const today = todayKey();
  const todos = state.todos.filter(t => t.date === today);
  const done = todos.filter(t => t.done).length;
  $("progressText").textContent = `${done} / ${todos.length}`;
  $("progressBar").style.width = todos.length ? `${done / todos.length * 100}%` : "0%";

  $("todayList").innerHTML = todos.map(todo => {
    const task = state.tasks.find(t => t.id === todo.taskId);
    const title = task?.title || todo.title || "削除されたタスク";
    const subject = task?.subject || todo.subject || "";
    const type = task?.type || todo.type || "";
    const minutes = task?.minutes ?? todo.minutes ?? "";
    return `
      <article class="task-card">
        <div class="task-main">
          <button class="check ${todo.done ? "done" : ""}" data-action="toggle-todo" data-id="${todo.id}" aria-label="完了"></button>
          <div class="task-info">
            <div class="task-title ${todo.done ? "done-text" : ""}">${escapeHTML(title)}</div>
            <div class="meta">${escapeHTML(subject)} ・ ${escapeHTML(type)}${minutes ? ` ・ ${minutes}分` : ""}</div>
          </div>
        </div>
        <div class="task-actions">
          <button class="small-btn" data-action="remove-todo" data-id="${todo.id}">Todoから外す</button>
        </div>
      </article>`;
  }).join("");

  $("emptyToday").classList.toggle("hidden", todos.length > 0);
}

function getFilteredTasks() {
  const q = $("searchInput").value.trim().toLowerCase();
  const subject = $("subjectFilter").value;
  const type = $("typeFilter").value;

  return state.tasks.filter(t => {
    const hay = `${t.title} ${t.subject} ${t.type} ${t.memo}`.toLowerCase();
    return (!q || hay.includes(q)) && (!subject || t.subject === subject) && (!type || t.type === type);
  });
}

function renderTasks() {
  const tasks = getFilteredTasks();
  $("taskCount").textContent = `${tasks.length}件`;

  const today = todayKey();
  const todayTaskIds = new Set(state.todos.filter(t => t.date === today).map(t => t.taskId));

  $("taskList").innerHTML = tasks.map(task => {
    const inToday = todayTaskIds.has(task.id);
    return `
      <article class="task-card">
        <div class="task-main">
          <div class="task-info">
            <div class="task-title">${escapeHTML(task.title)}</div>
            <div class="meta">${escapeHTML(task.subject)} ・ ${escapeHTML(task.type)} ・ ${task.minutes || 0}分</div>
            ${task.memo ? `<div class="meta">${escapeHTML(task.memo)}</div>` : ""}
          </div>
        </div>
        <div class="task-actions">
          <button class="small-btn primary" data-action="add-todo" data-id="${task.id}" ${inToday ? "disabled" : ""}>
            ${inToday ? "今日のTodoに追加済み" : "今日のTodoに追加"}
          </button>
          <button class="small-btn edit" data-action="edit-task" data-id="${task.id}">編集</button>
          <button class="small-btn delete" data-action="delete-task" data-id="${task.id}">削除</button>
        </div>
      </article>`;
  }).join("");
}

function renderHistory() {
  const groups = {};
  [...state.history].sort((a,b) => b.completedAt.localeCompare(a.completedAt)).forEach(item => {
    const key = item.date;
    (groups[key] ||= []).push(item);
  });

  const keys = Object.keys(groups);
  if (!keys.length) {
    $("historyList").innerHTML = `<div class="empty"><div class="empty-icon">◷</div><h2>まだ履歴がありません</h2><p>Todoを完了するとここに記録されます。</p></div>`;
    return;
  }

  $("historyList").innerHTML = keys.map(key => `
    <section class="history-day">
      <div class="history-date">${formatDate(key)}</div>
      ${groups[key].map(item => `
        <div class="history-item">
          <div>
            <div class="task-title">${escapeHTML(item.title)}</div>
            <div class="meta">${escapeHTML(item.subject)} ・ ${escapeHTML(item.type)}</div>
          </div>
          <div class="meta">${item.minutes ? item.minutes + "分" : ""}</div>
        </div>
      `).join("")}
    </section>
  `).join("");
}

function updateSubjectFilter() {
  const current = $("subjectFilter").value;
  const subjects = [...new Set(state.tasks.map(t => t.subject).filter(Boolean))].sort();
  $("subjectFilter").innerHTML = `<option value="">すべての科目</option>` +
    subjects.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join("");
  $("subjectFilter").value = subjects.includes(current) ? current : "";
}

function openModal(task = null) {
  $("modal").classList.remove("hidden");
  $("modalTitle").textContent = task ? "タスクを編集" : "タスクを追加";
  $("editId").value = task?.id || "";
  $("titleInput").value = task?.title || "";
  $("subjectInput").value = task?.subject || "英語";
  $("typeInput").value = task?.type || "演習";
  $("minutesInput").value = task?.minutes ?? 30;
  $("memoInput").value = task?.memo || "";
  $("deleteBtn").classList.toggle("hidden", !task);
  setTimeout(() => $("titleInput").focus(), 100);
}

function closeModal() {
  $("modal").classList.add("hidden");
}

function addTodo(task) {
  const date = todayKey();
  if (state.todos.some(t => t.date === date && t.taskId === task.id)) return;
  state.todos.push({
    id: uid("todo"),
    taskId: task.id,
    date,
    done: false,
    addedAt: new Date().toISOString()
  });
  save();
  renderAll();
}

function toggleTodo(id) {
  const todo = state.todos.find(t => t.id === id);
  if (!todo) return;

  if (!todo.done) {
    todo.done = true;
    const task = state.tasks.find(t => t.id === todo.taskId);
    if (!state.history.some(h => h.todoId === todo.id)) {
      state.history.push({
        id: uid("history"),
        todoId: todo.id,
        taskId: todo.taskId,
        title: task?.title || "不明なタスク",
        subject: task?.subject || "",
        type: task?.type || "",
        minutes: task?.minutes || 0,
        date: todayKey(),
        completedAt: new Date().toISOString()
      });
    }
  } else {
    todo.done = false;
    state.history = state.history.filter(h => h.todoId !== todo.id);
  }
  save();
  renderAll();
}

function removeTodo(id) {
  state.todos = state.todos.filter(t => t.id !== id);
  state.history = state.history.filter(h => h.todoId !== id);
  save();
  renderAll();
}

function deleteTask(id) {
  if (!confirm("このタスクを削除しますか？\n過去の実行履歴は残ります。")) return;
  state.tasks = state.tasks.filter(t => t.id !== id);
  state.todos = state.todos.filter(t => t.taskId !== id);
  save();
  renderAll();
}

$("taskForm").addEventListener("submit", e => {
  e.preventDefault();
  const id = $("editId").value;
  const data = {
    title: $("titleInput").value.trim(),
    subject: $("subjectInput").value,
    type: $("typeInput").value,
    minutes: Math.max(1, Number($("minutesInput").value) || 1),
    memo: $("memoInput").value.trim()
  };

  if (!data.title) return;

  if (id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) Object.assign(task, data);
  } else {
    state.tasks.push({ id: uid("task"), ...data });
  }
  save();
  closeModal();
  renderAll();
});

$("deleteBtn").addEventListener("click", () => {
  const id = $("editId").value;
  if (id) {
    closeModal();
    deleteTask(id);
  }
});

$("closeModal").addEventListener("click", closeModal);
document.querySelector(".modal-backdrop").addEventListener("click", closeModal);
$("quickAddBtn").addEventListener("click", () => openModal());

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

document.querySelectorAll("[data-go]").forEach(btn => {
  btn.addEventListener("click", () => showView(btn.dataset.go));
});

document.addEventListener("click", e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (action === "add-todo") {
    const task = state.tasks.find(t => t.id === id);
    if (task) addTodo(task);
  } else if (action === "toggle-todo") toggleTodo(id);
  else if (action === "remove-todo") removeTodo(id);
  else if (action === "edit-task") {
    const task = state.tasks.find(t => t.id === id);
    if (task) openModal(task);
  } else if (action === "delete-task") deleteTask(id);
});

$("searchInput").addEventListener("input", renderTasks);
$("subjectFilter").addEventListener("change", renderTasks);
$("typeFilter").addEventListener("change", renderTasks);
$("filterBtn").addEventListener("click", () => $("filterPanel").classList.toggle("hidden"));

$("clearHistoryBtn").addEventListener("click", () => {
  if (!state.history.length) return;
  if (confirm("実行履歴をすべて消去しますか？")) {
    state.history = [];
    save();
    renderHistory();
  }
});

$("importBtn").addEventListener("click", () => $("jsonFile").click());
$("jsonFile").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) throw new Error("配列ではありません");
    const valid = imported.filter(t => t && t.title).map(t => ({
      id: t.id || uid("task"),
      title: String(t.title),
      subject: String(t.subject || "その他"),
      type: String(t.type || "演習"),
      minutes: Number(t.minutes) || 30,
      memo: String(t.memo || "")
    }));
    if (!valid.length) throw new Error("有効なタスクがありません");
    state.tasks = valid;
    save();
    renderAll();
    alert(`${valid.length}件のタスクを読み込みました。`);
  } catch (err) {
    alert("tasks.jsonを読み込めませんでした。\n" + err.message);
  }
  e.target.value = "";
});

async function initialize() {
  loadState();

  // localStorageが空の場合、同じフォルダのtasks.jsonを試す。
  // iPhoneの「ファイル」アプリ等ではfetchが制限される場合があるため、
  // その場合は「tasks.jsonを読み込む」ボタンを使用する。
  if (!state.tasks.length) {
    try {
      const response = await fetch("tasks.json", {cache: "no-store"});
      if (response.ok) {
        const initial = await response.json();
        if (Array.isArray(initial)) {
          state.tasks = initial;
          save();
        }
      }
    } catch (_) {}
  }

  renderAll();
}

initialize();


window.addEventListener('pageshow',()=>location.reload());
document.addEventListener('visibilitychange',()=>{if(!document.hidden) location.reload();});
