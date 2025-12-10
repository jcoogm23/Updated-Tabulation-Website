// =======================
// Basic Navigation & UI Only
// =======================

//  Live Clock
let liveClockInterval = null;
function startLiveClock() {
  const el = document.getElementById("liveDateTime");
  if (!el || liveClockInterval) return;
  liveClockInterval = setInterval(() => {
    el.textContent = new Date().toLocaleString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  }, 1000);
}

//  Show / Hide Page Sections
function showSection(id) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.add("hidden");
    p.style.display = "none";
  });

  const section = document.getElementById(id);
  if (section) {
    section.classList.remove("hidden");
    section.style.display = "block";
  }

  // Trigger live clock if dashboard or scoreboard is shown
  if (id === "dashboard" || id === "scoreboard") startLiveClock();
}

// =======================
// Modal Helpers
// =======================
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("hidden");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("hidden");
}

