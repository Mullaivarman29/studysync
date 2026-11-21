
const auth = firebase.auth();
const db = firebase.firestore();

// DOM ELEMENTS
const authScreen = document.getElementById("authScreen");
const appContainer = document.getElementById("appContainer");

const authForm = document.getElementById("authForm");
const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");
const authSubmit = document.getElementById("authSubmit");
const authToggle = document.getElementById("authToggle");
const authMessage = document.getElementById("authMessage");

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const subjectInput = document.getElementById("subjectInput");
const deadlineInput = document.getElementById("deadlineInput");
const taskList = document.getElementById("taskList");

const logoutBtn = document.getElementById("logoutBtn");

let isRegisterMode = false;
let currentUser = null;
let unsubscribeTasks = null;
let tasks = [];

// DATE
document.getElementById("today").textContent =
  new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

// AUTHENTICATION MODE
authToggle.addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;

  authTitle.textContent = isRegisterMode
    ? "Create your account"
    : "Welcome back";

  authDescription.textContent = isRegisterMode
    ? "Start organizing your academic journey."
    : "Sign in to continue your learning journey.";

  authName.style.display = isRegisterMode ? "block" : "none";
  authName.required = isRegisterMode;

  authPassword.autocomplete = isRegisterMode
    ? "new-password"
    : "current-password";

  authSubmit.textContent = isRegisterMode
    ? "Create Account"
    : "Sign In";

  authToggle.textContent = isRegisterMode
    ? "Sign in"
    : "Create account";

  authMessage.textContent = "";
});

// AUTHENTICATION
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = authEmail.value.trim();
  const password = authPassword.value;
  const name = authName.value.trim();

  if (isRegisterMode && !name) {
    authMessage.textContent = "Please enter your name.";
    return;
  }

  authSubmit.disabled = true;
  authSubmit.textContent = "Please wait...";
  authMessage.textContent = "";

  try {
    if (isRegisterMode) {
      const result = await auth.createUserWithEmailAndPassword(
        email,
        password
      );

      await result.user.updateProfile({
        displayName: name
      });

      await db.collection("users")
        .doc(result.user.uid)
        .set({
          name: name,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }

  } catch (error) {
    authMessage.textContent = getFriendlyError(error);
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = isRegisterMode
      ? "Create Account"
      : "Sign In";
  }
});

// FRIENDLY ERROR MESSAGES
function getFriendlyError(error) {
  const errors = {
    "auth/email-already-in-use": "This email already has an account. Please sign in.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/user-not-found": "No account found. Please register first.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/network-request-failed": "Network error. Check your internet connection.",
    "permission-denied": "Database permission denied. Check Firestore rules."
  };

  return errors[error.code] ||
    error.message ||
    "Something went wrong. Please try again.";
}

// AUTHENTICATION STATE
auth.onAuthStateChanged(async (user) => {
  if (unsubscribeTasks) {
    unsubscribeTasks();
    unsubscribeTasks = null;
  }

  currentUser = user;
  tasks = [];

  if (user) {
    authScreen.style.display = "none";
    appContainer.style.display = "flex";

    document.getElementById("userDisplayName").textContent =
      user.displayName || "Student";

    document.getElementById("userDisplayEmail").textContent =
      user.email || "";

    await loadTasks(user.uid);

  } else {
    authScreen.style.display = "flex";
    appContainer.style.display = "none";

    taskList.innerHTML = "";
    updateDashboard();
  }
});

// LOAD PERSONAL TASKS FROM FIRESTORE
async function loadTasks(uid) {
  const taskReference = db
    .collection("users")
    .doc(uid)
    .collection("tasks");

  unsubscribeTasks = taskReference
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        renderTasks();
      },
      (error) => {
        console.error("Task loading error:", error);
        taskList.textContent =
          "Unable to load tasks. Please check database permissions.";
      }
    );
}

// ADD TASK
taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) return;

  const title = taskInput.value.trim();
  const subject = subjectInput.value;
  const deadline = deadlineInput.value;

  if (!title || !subject || !deadline) return;

  const addButton = taskForm.querySelector("button");
  addButton.disabled = true;

  try {
    await db.collection("users")
      .doc(currentUser.uid)
      .collection("tasks")
      .add({
        title,
        subject,
        deadline,
        completed: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

    taskForm.reset();

  } catch (error) {
    alert("Unable to save task: " + getFriendlyError(error));
  } finally {
    addButton.disabled = false;
  }
});

// COMPLETE / UNDO TASK
async function toggleTask(id, completed) {
  if (!currentUser) return;

  try {
    await db.collection("users")
      .doc(currentUser.uid)
      .collection("tasks")
      .doc(id)
      .update({
        completed: !completed
      });

  } catch (error) {
    alert("Unable to update task: " + getFriendlyError(error));
  }
}

// DELETE TASK
async function deleteTask(id) {
  if (!currentUser) return;

  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }

  try {
    await db.collection("users")
      .doc(currentUser.uid)
      .collection("tasks")
      .doc(id)
      .delete();

  } catch (error) {
    alert("Unable to delete task: " + getFriendlyError(error));
  }
}

// RENDER TASKS
function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <h3>Your study space is ready.</h3>
        <p>Add your first task to get started.</p>
      </div>
    `;

    updateDashboard();
    return;
  }

  tasks.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item ${task.completed ? "completed" : ""}`;

    const info = document.createElement("div");
    info.className = "task-info";

    const heading = document.createElement("h3");
    heading.textContent = task.title || "Untitled task";

    const details = document.createElement("p");
    details.textContent =
      `${task.subject || "Other"} · Deadline: ${task.deadline || "Not set"}`;

    info.append(heading, details);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const completeButton = document.createElement("button");
    completeButton.textContent = task.completed ? "Undo" : "Complete";

    completeButton.addEventListener("click", () => {
      toggleTask(task.id, Boolean(task.completed));
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-btn";

    deleteButton.addEventListener("click", () => {
      deleteTask(task.id);
    });

    actions.append(completeButton, deleteButton);
    item.append(info, actions);

    taskList.appendChild(item);
  });

  updateDashboard();
}

// DASHBOARD ANALYTICS
function updateDashboard() {
  const total = tasks.length;

  const completed = tasks.filter(
    task => task.completed === true
  ).length;

  const pending = total - completed;

  const rate = total === 0
    ? 0
    : Math.round((completed / total) * 100);

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("pendingTasks").textContent = pending;
  document.getElementById("completionRate").textContent = rate + "%";

  document.getElementById("progressText").textContent =
    rate + "% completed";

  document.getElementById("progressBar").style.width =
    rate + "%";
}

// LOGOUT
logoutBtn.addEventListener("click", async () => {
  try {
    await auth.signOut();
  } catch (error) {
    alert("Unable to sign out: " + getFriendlyError(error));
  }
});
