// =======================
// DEPLOYING THE CONTENTS INTO JUDGE SIDE
// =======================
document.addEventListener('DOMContentLoaded', () => {
  const judgeContainer = document.getElementById('judgeContainer');
  if (!judgeContainer) return console.error('❌ judgeContainer element not found in DOM');

  let lastRenderedDeployTime = null;

  renderJudgeDashboard(judgeContainer);

  window.addEventListener('storage', (event) => {
    if (event.key === 'lastDeployTime') {
      const newDeployTime = localStorage.getItem('lastDeployTime');
      if (newDeployTime && newDeployTime !== lastRenderedDeployTime) {
        lastRenderedDeployTime = newDeployTime;
        renderJudgeDashboard(judgeContainer);
      }
    }
  });

  // =======================
  // JUDGE USER DROPDOWN & LOGOUT
  // =======================
  const judgeUserIconContainer = document.getElementById('judgeUserIconContainer');
  const judgeDropdown = document.getElementById('judgeDropdown');
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const confirmLogout = document.getElementById('confirmLogout');
  const cancelLogout = document.getElementById('cancelLogout');

  const currentUser = localStorage.getItem('currentUser');
  const currentRole = localStorage.getItem('currentRole');
  if (currentUser && currentRole) {
    const usernameEl = judgeDropdown.querySelector('.judge-username');
    const roleEl = judgeDropdown.querySelector('.judge-role');
    if (usernameEl) usernameEl.textContent = currentUser;
    if (roleEl) roleEl.textContent = currentRole;
  }

  judgeUserIconContainer.addEventListener('click', (e) => {
    e.stopPropagation();
    judgeDropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => judgeDropdown.classList.remove('show'));
  logoutBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    logoutModal.classList.add('show');
  });
  cancelLogout.addEventListener('click', () => logoutModal.classList.remove('show'));
  confirmLogout.addEventListener('click', () => {
    ['currentUser', 'currentRole', 'roundsData', 'processHTML', 'lastDeployTime']
      .forEach(key => localStorage.removeItem(key));
    window.location.href = 'default.html';
  });
  logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) logoutModal.classList.remove('show');
  });

  // =======================
  // MAIN RENDER FUNCTION
  // =======================
  function renderJudgeDashboard(container) {
    const processHTML = localStorage.getItem('processHTML');
    const roundsData = JSON.parse(localStorage.getItem('roundsData') || '[]');
    const lastDeployTime = localStorage.getItem('lastDeployTime');
    const adminRunning = localStorage.getItem('adminRunning');

    if (adminRunning !== 'true' || !lastDeployTime || (!processHTML && roundsData.length === 0)) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center mt-20 text-gray-500">
          <p class="text-lg font-semibold mb-4">No deployed rounds yet</p>
          <p class="text-sm mb-6">Please wait until the admin deploys content</p>
          <div class="loader-dots"><div></div><div></div><div></div></div>
        </div>
      `;
      lastRenderedDeployTime = null;
      return;
    }

    lastRenderedDeployTime = lastDeployTime;
    container.innerHTML = processHTML;

    // Optional extra gallery
    if (roundsData.length > 0) {
      const roundsWrapper = document.createElement('div');
      roundsWrapper.className = 'mt-10';
      roundsData.forEach(round => {
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-2 md:grid-cols-3 gap-6';
        Object.entries(round.savedImages || {}).forEach(([id, imageUrl]) => {
          const card = document.createElement('div');
          card.className = 'bg-white shadow rounded p-4 text-center contestant-card';
          card.innerHTML = `
            <img src="${imageUrl}" alt="Contestant ${id}" />
            <p class="font-medium">Contestant ${id}</p>
          `;
          grid.appendChild(card);
        });
        roundsWrapper.appendChild(grid);
      });
      container.appendChild(roundsWrapper);
    }

    // Activate help icons
    bindCriteriaModal(container);
  }

  // UPDATED CODE=======================
  // ACTIVATE HELP ICONS (CLEAN VERSION - NO ROUND NUMBER)
  // =======================
  function bindCriteriaModal(container) {
    const criteriaModal = document.getElementById('criteriaModal');
    const criteriaContent = document.getElementById('criteriaContent');
    const closeBtn = document.getElementById('closeCriteriaModal');

    if (!criteriaModal || !criteriaContent || !closeBtn) return;

    // Global Close logic (only bind once)
    if (!criteriaModal.dataset.bound) {
      closeBtn.addEventListener('click', () => {
        criteriaModal.classList.add('hidden');
        criteriaModal.classList.remove('flex');
      });
      criteriaModal.addEventListener('click', (evt) => {
        if (evt.target === criteriaModal) {
          criteriaModal.classList.add('hidden');
          criteriaModal.classList.remove('flex');
        }
      });
      criteriaModal.dataset.bound = 'true';
    }

    // Click listener for the blue "?" icons
    container.addEventListener('click', (e) => {
      const icon = e.target.closest('.help-icon');
      if (!icon) return;

      const roundsData = JSON.parse(localStorage.getItem('roundsData') || '[]');
      const roundNumber = parseInt(icon.dataset.round, 10);
      const round = roundsData.find(r => r.roundNumber === roundNumber);

      criteriaContent.innerHTML = '';

      if (round && round.criteria) {
        // ✅ HEADER WITHOUT ROUND NUMBER
        const modalHeader = document.createElement('h2');
        modalHeader.className = 'text-2xl font-bold text-indigo-600 mb-6 text-center';
        modalHeader.textContent = 'Criteria for Judging';
        criteriaContent.appendChild(modalHeader);

        // Render each criteria
        round.criteria.forEach(c => {
          const section = document.createElement('section');
          section.className = 'mb-6';

          // ✅ TITLE WITHOUT MAX POINTS
          const title = document.createElement('h3');
          title.className = 'text-indigo-600 font-bold text-lg mb-2';
          title.textContent = c.name;

          const list = document.createElement('div');
          list.className = 'ml-4 space-y-1';

          (c.items || []).forEach(itemText => {
            const item = document.createElement('p');
            item.className = 'text-gray-700 text-sm';
            item.textContent = itemText;
            list.appendChild(item);
          });

          section.appendChild(title);
          section.appendChild(list);
          criteriaContent.appendChild(section);
        });
      } else {
        criteriaContent.innerHTML = `<p class="text-center text-gray-400 py-10">No criteria available.</p>`;
      }

      // Show the modal
      criteriaModal.classList.remove('hidden');
      criteriaModal.classList.add('flex');
    });
  }

  // =======================
  // REFRESH DASHBOARD FUNCTION
  // =======================
  async function refreshJudgeDashboard() {
    try {
      const data = await loadFromDB();
      if (data) {
        const roundsContainer = document.getElementById('roundsContainer');
        if (roundsContainer) {
          roundsContainer.innerHTML = data.html;
        }
        if (typeof updateGallery === 'function') updateGallery(data.rounds);
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    }
  }

  // Listen for database updates
  window.addEventListener('storage', (e) => {
    if (e.key === 'db_update_signal') {
      refreshJudgeDashboard();
    }
  });
});

// =======================
// DEPLOY TO JUDGE FUNCTION
// =======================
function deployToJudge() {
  try {
    const adminDashboardContainer = document.getElementById('adminDashboardContainer');
    if (!adminDashboardContainer) {
      alert("❌ Admin dashboard container not found!");
      return;
    }

    const dashboardHTML = adminDashboardContainer.innerHTML;
    const roundsData = JSON.parse(localStorage.getItem('roundsData') || '[]');

    // Clear storage first to prevent quota errors
    localStorage.removeItem('processHTML');
    localStorage.removeItem('roundsData');

    // Save new data
    localStorage.setItem('processHTML', dashboardHTML);
    localStorage.setItem('roundsData', JSON.stringify(roundsData));
    localStorage.setItem('lastDeployTime', Date.now().toString());
    localStorage.setItem('adminRunning', 'true');

    alert("✅ Deployment Successful!");
  } catch (error) {
    console.error("Storage Error:", error);
    if (error.name === 'QuotaExceededError') {
      alert("❌ Deployment Failed: Memory Full! Images are too large. Please use smaller files.");
    } else {
      alert("❌ Deployment Failed: " + error.message);
    }
  }
}

// =======================
// LOAD FROM DATABASE FUNCTION
// =======================
async function loadFromDB() {
  return new Promise((resolve, reject) => {
    try {
      const processHTML = localStorage.getItem('processHTML');
      const roundsData = JSON.parse(localStorage.getItem('roundsData') || '[]');
      
      if (processHTML && roundsData.length > 0) {
        resolve({ html: processHTML, rounds: roundsData });
      } else {
        resolve(null);
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Load dashboard on page load
window.onload = () => {
  const judgeContainer = document.getElementById('judgeContainer');
  if (judgeContainer) {
    loadFromDB().then(data => {
      if (data) {
        judgeContainer.innerHTML = data.html;
      }
    }).catch(error => {
      console.error("Failed to load dashboard:", error);
    });
  }
};
