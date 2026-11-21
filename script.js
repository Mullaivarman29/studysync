
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const subjectInput = document.getElementById("subjectInput");
const deadlineInput = document.getElementById("deadlineInput");
const taskList = document.getElementById("taskList");

let tasks = JSON.parse(localStorage.getItem("studysyncTasks")) || [];

document.getElementById("today").textContent =
  new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

function saveTasks() {
  localStorage.setItem("studysyncTasks", JSON.stringify(tasks));
}

function updateDashboard() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("pendingTasks").textContent = pending;
  document.getElementById("completionRate").textContent = rate + "%";
  document.getElementById("progressText").textContent = rate + "% completed";
  document.getElementById("progressBar").style.width = rate + "%";
}

function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <h3>Your study space is ready.</h3>
        <p>Add your first task to get started.</p>
      </div>`;
    updateDashboard();
    return;
  }

  tasks.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item ${task.completed ? "completed" : ""}`;

    const info = document.createElement("div");
    info.className = "task-info";

    const heading = document.createElement("h3");
    heading.textContent = task.title;

    const details = document.createElement("p");
    details.textContent = `${task.subject} · Deadline: ${task.deadline}`;

    info.append(heading, details);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const completeButton = document.createElement("button");
    completeButton.textContent = task.completed ? "Undo" : "Complete";
    completeButton.addEventListener("click", () => {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-btn";
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    actions.append(completeButton, deleteButton);
    item.append(info, actions);
    taskList.appendChild(item);
  });

  updateDashboard();
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = taskInput.value.trim();
  const subject = subjectInput.value;
  const deadline = deadlineInput.value;

  if (!title || !subject || !deadline) {
    alert("Please complete all task details.");
    return;
  }

  tasks.push({
    id: Date.now(),
    title,
    subject,
    deadline,
    completed: false
  });

  saveTasks();
  renderTasks();
  taskForm.reset();
});

renderTasks();
