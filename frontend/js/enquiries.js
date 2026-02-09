document.addEventListener("DOMContentLoaded", () => {

  const API = "http://127.0.0.1:5000/api";

  // ===== DOM ELEMENTS =====
  const tableBody = document.getElementById("enquiryTableBody");
  const emptyState = document.getElementById("emptyState");

  const addBtn = document.getElementById("addMemberBtn");
  const modal = document.getElementById("memberModal");
  const cancelBtn = document.getElementById("cancelBtn");
  const closeX = document.getElementById("closeX");
  const form = document.getElementById("memberForm");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");
  const searchInput = document.getElementById("searchInput");

  const studentName = document.getElementById("studentName");
  const email = document.getElementById("email");
  const courseInterest = document.getElementById("courseInterest");
  const dropoutReason = document.getElementById("dropoutReason");

  /* =========================
     🔒 AUTH CHECK
  ========================= */
  fetch(`${API}/protected`, { credentials: "include" })
    .then(res => {
      if (!res.ok) window.location.href = "/";
    });

  /* =========================
     MODAL HANDLING
  ========================= */
  addBtn.onclick = () => modal.classList.remove("hidden");
  cancelBtn.onclick = closeModal;
  closeX.onclick = closeModal;

  function closeModal() {
    modal.classList.add("hidden");
    form.reset();
  }

  /* =========================
     LOAD ENQUIRIES
  ========================= */
  function loadEnquiries() {
    fetch(`${API}/enquiries`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        tableBody.innerHTML = "";

        if (data.length === 0) {
          emptyState.classList.remove("hidden");
          return;
        }
        emptyState.classList.add("hidden");

        data.forEach(e => {
          const tr = document.createElement("tr");
          tr.className = "hover:bg-slate-50 transition group";

          const avatarUrl =
            `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name)}&background=64748b&color=fff`;

          tr.innerHTML = `
            <td class="px-8 py-4">
              <div class="profile-container">
                <img src="${avatarUrl}" class="profile-avatar">
                <div>
                  <div class="profile-name">${e.name}</div>
                  <div class="profile-email">${e.email}</div>
                </div>
              </div>
            </td>

            <td class="px-6 py-4">${e.course}</td>

            <td class="px-6 py-4">
              <span class="badge ${getStatusClass(e.status)}">${e.status}</span>
            </td>

            <td class="px-6 py-4">${e.reason || "-"}</td>

            <td class="px-6 py-4 text-right relative">
              <button class="action-btn">⋮</button>
              <div class="action-menu">
                <span class="menu-opt convert"
                      data-id="${e.id}"
                      data-name="${e.name}">
                  Convert
                </span>
                <span class="menu-opt drop"
                      data-id="${e.id}">
                  Drop
                </span>
              </div>
            </td>
          `;

          tableBody.appendChild(tr);
        });
      });
  }

  loadEnquiries();

  /* =========================
   CSV UPLOAD
========================= */

uploadBtn.onclick = () => {
  fileInput.click();
};

fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  fetch(`${API}/enquiries/upload-csv`,  {
    method: "POST",
    credentials: "include",
    body: formData
  })
  .then(res => res.json())
  .then(() => {
    loadEnquiries();
    fileInput.value = "";
  });
};

  /* =========================
     ACTION MENU HANDLERS
  ========================= */
  document.addEventListener("click", e => {

    // OPEN MENU
    if (e.target.classList.contains("action-btn")) {
      closeAllMenus();
      e.target.nextElementSibling.classList.toggle("show");
      e.stopPropagation();
      return;
    }

    // CONVERT
    const convertBtn = e.target.closest(".convert");
    if (convertBtn) {
      const id = convertBtn.dataset.id;
      const name = convertBtn.dataset.name;

      if (confirm(`Convert ${name} to enrollment?`)) {
        fetch(`${API}/enquiry/convert`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        }).then(loadEnquiries);
      }
      return;
    }

    // DROP
    const dropBtn = e.target.closest(".drop");
    if (dropBtn) {
      const id = dropBtn.dataset.id;

      if (confirm("Drop this enquiry?")) {
        fetch(`${API}/enquiry/drop`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        }).then(loadEnquiries);
      }
      return;
    }

    // CLOSE MENU
    if (!e.target.closest(".action-btn") &&
        !e.target.closest(".action-menu")) {
      closeAllMenus();
    }
  });

  /* =========================
     ADD ENQUIRY
  ========================= */
  form.addEventListener("submit", e => {
  e.preventDefault();

  fetch(`${API}/enquiry/add`, {   // ✅ FIXED URL
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: studentName.value.trim(),
      email: email.value.trim(),
      course: courseInterest.value.trim(),
      reason: dropoutReason.value.trim()
    })
  })
  .then(() => {
    closeModal();
    loadEnquiries();
  });
});

  /* =========================
     SEARCH
  ========================= */
  searchInput.addEventListener("input", () => {
    const val = searchInput.value.toLowerCase();
    document.querySelectorAll("#enquiryTableBody tr").forEach(row => {
      row.style.display =
        row.innerText.toLowerCase().includes(val) ? "" : "none";
    });
  });

  /* =========================
     HELPER FUNCTIONS ✅
  ========================= */
  function closeAllMenus() {
    document
      .querySelectorAll(".action-menu")
      .forEach(m => m.classList.remove("show"));
  }

  function getStatusClass(status) {
    if (status === "Converted") return "badge-enrolled";
    if (status === "Dropped") return "badge-dropped";
    return "badge-new";
  }

});
