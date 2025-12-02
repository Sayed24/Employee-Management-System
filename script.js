/*
  Employee Management System (front-end)
  - CRUD operations using localStorage
  - Search, filter, pagination
  - Single-file, vanilla JS
*/

(() => {
  // Config
  const STORAGE_KEY = 'ems_employees_v1';
  const defaultEmployees = [
    // a few sample entries (you can remove)
    { id: 1, fullName: 'Aisha Khan', email: 'aisha@example.com', phone: '+1 555-0123', department: 'Engineering', position: 'Frontend Dev', notes: '' },
    { id: 2, fullName: 'Carlos Rivera', email: 'carlos@example.com', phone: '+1 555-0456', department: 'Design', position: 'UI/UX Designer', notes: '' },
  ];

  // State
  let employees = loadEmployees();
  let filtered = [...employees];
  let page = 1;
  let pageSize = Number(document?.getElementById?.('pageSizeSelect')?.value || 10);
  let searchTerm = '';
  let currentDeptFilter = '';

  // Elements
  const btnAddEmployee = document.getElementById('btnAddEmployee');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalClose = document.getElementById('modalClose');
  const employeeForm = document.getElementById('employeeForm');
  const formCancel = document.getElementById('formCancel');
  const employeeIdInput = document.getElementById('employeeId');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const departmentInput = document.getElementById('department');
  const positionInput = document.getElementById('position');
  const notesInput = document.getElementById('notes');
  const employeeTbody = document.getElementById('employeeTbody');
  const rowTemplate = document.getElementById('rowTemplate');
  const searchInput = document.getElementById('searchInput');
  const filterDept = document.getElementById('filterDept');
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  const paginationEl = document.getElementById('pagination');
  const noData = document.getElementById('noData');
  const btnExport = document.getElementById('btnExport');
  const btnImport = document.getElementById('btnImport');
  const importFile = document.getElementById('importFile');

  // ---------- Initialization ----------
  function init() {
    populateDeptFilter();
    addEventListeners();
    applyFilters();
    render();
  }

  function loadEmployees() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // preload default sample data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultEmployees));
        return defaultEmployees.slice();
      }
      const parsed = JSON.parse(raw);
      // normalize ensure ids are numbers
      return parsed.map(e => ({ ...e, id: Number(e.id) }));
    } catch (e) {
      console.error('Failed to load employees from localStorage', e);
      return [];
    }
  }

  function saveEmployees() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  }

  // ---------- UI helpers ----------
  function openModal(mode = 'add', data = null) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (mode === 'add') {
      modalTitle.textContent = 'Add Employee';
      employeeForm.reset();
      employeeIdInput.value = '';
      departmentInput.value = '';
    } else {
      modalTitle.textContent = 'Edit Employee';
      employeeIdInput.value = data.id;
      fullNameInput.value = data.fullName || '';
      emailInput.value = data.email || '';
      phoneInput.value = data.phone || '';
      departmentInput.value = data.department || '';
      positionInput.value = data.position || '';
      notesInput.value = data.notes || '';
    }
  }
  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  function showNoData(show) {
    noData.style.display = show ? 'block' : 'none';
  }

  // Build department filter options dynamically
  function populateDeptFilter() {
    const depts = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
    // clear
    filterDept.innerHTML = '<option value="">All Departments</option>';
    for (const d of depts.sort()) {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      filterDept.appendChild(opt);
    }
    // Also ensure modal select has those options plus defaults
    // (modal select has static options in HTML; we won't overwrite it to keep simple.)
  }

  // ---------- CRUD ----------
  function addEmployee(data) {
    const id = Date.now();
    employees.unshift({ id, ...data });
    saveEmployees();
    populateDeptFilter();
    applyFilters();
    gotoFirstPage();
    render();
  }

  function updateEmployee(id, data) {
    const idx = employees.findIndex(e => e.id === id);
    if (idx === -1) return false;
    employees[idx] = { id, ...data };
    saveEmployees();
    populateDeptFilter();
    applyFilters();
    render();
    return true;
  }

  function deleteEmployee(id) {
    if (!confirm('Delete this employee? This action cannot be undone.')) return;
    employees = employees.filter(e => e.id !== id);
    saveEmployees();
    populateDeptFilter();
    applyFilters();
    // adjust page if needed
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > totalPages) page = totalPages;
    render();
  }

  // ---------- Filters & Search ----------
  function applyFilters() {
    const st = (searchTerm || '').trim().toLowerCase();
    const dept = currentDeptFilter;
    filtered = employees.filter(e => {
      const matchesSearch =
        !st ||
        (e.fullName && e.fullName.toLowerCase().includes(st)) ||
        (e.email && e.email.toLowerCase().includes(st)) ||
        (e.phone && e.phone.toLowerCase().includes(st)) ||
        (e.position && e.position.toLowerCase().includes(st));
      const matchesDept = !dept || e.department === dept;
      return matchesSearch && matchesDept;
    });
  }

  // ---------- Pagination ----------
  function getPagedData() {
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) page = totalPages;
    const start = (page - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);
    return { pageItems, total, totalPages };
  }

  function gotoFirstPage() {
    page = 1;
  }

  // ---------- Rendering ----------
  function renderTable() {
    employeeTbody.innerHTML = '';
    const { pageItems, total, totalPages } = getPagedData();

    if (total === 0) {
      showNoData(true);
      paginationEl.innerHTML = '';
      return;
    } else {
      showNoData(false);
    }

    for (const emp of pageItems) {
      const tr = rowTemplate.content.firstElementChild.cloneNode(true);
      tr.querySelector('.td-name').textContent = emp.fullName;
      tr.querySelector('.td-email').textContent = emp.email || '';
      tr.querySelector('.td-phone').textContent = emp.phone || '';
      tr.querySelector('.td-dept').textContent = emp.department || '';
      tr.querySelector('.td-pos').textContent = emp.position || '';

      // actions
      const btnEdit = tr.querySelector('.edit');
      const btnDelete = tr.querySelector('.delete');

      btnEdit.addEventListener('click', () => {
        openModal('edit', emp);
      });

      btnDelete.addEventListener('click', () => {
        deleteEmployee(emp.id);
      });

      employeeTbody.appendChild(tr);
    }

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    // clear
    paginationEl.innerHTML = '';
    const createBtn = (label, cls, handler) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.className = 'page-btn' + (cls ? ' ' + cls : '');
      b.addEventListener('click', handler);
      return b;
    };

    // Prev
    paginationEl.appendChild(createBtn('Prev', '', () => {
      if (page > 1) { page--; render(); }
    }));

    // numbers: show up to 7 buttons around current page
    const maxButtons = 7;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let i = start; i <= end; i++) {
      const btn = createBtn(i, i === page ? 'active' : '', () => { page = i; render(); });
      paginationEl.appendChild(btn);
    }

    // Next
    paginationEl.appendChild(createBtn('Next', '', () => {
      if (page < totalPages) { page++; render(); }
    }));
  }

  function render() {
    applyFilters();
    renderTable();
    // update dept filter options in case items changed
    refreshFilterSelection();
  }

  function refreshFilterSelection(){
    // ensure the current dept filter exists in the select list (in case new dept added)
    const allDepts = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
    const existing = Array.from(filterDept.options).map(o => o.value).filter(v => v);
    // add missing
    for (const d of allDepts) {
      if (!existing.includes(d)) {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d;
        filterDept.appendChild(opt);
      }
    }
    // if current filter was removed, reset
    if (currentDeptFilter && !allDepts.includes(currentDeptFilter)) {
      currentDeptFilter = '';
      filterDept.value = '';
    }
  }

  // ---------- Events ----------
  function addEventListeners() {
    // open add modal
    btnAddEmployee.addEventListener('click', () => openModal('add'));

    // modal close
    modalClose.addEventListener('click', closeModal);
    formCancel.addEventListener('click', closeModal);

    // form submit (add or edit)
    employeeForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const idVal = employeeIdInput.value ? Number(employeeIdInput.value) : null;
      const payload = {
        fullName: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        department: departmentInput.value.trim(),
        position: positionInput.value.trim(),
        notes: notesInput.value.trim(),
      };

      // simple validation
      if (!payload.fullName) { alert('Please enter full name'); return; }
      if (!payload.email) { alert('Please enter email'); return; }

      if (idVal) {
        updateEmployee(idVal, payload);
      } else {
        addEmployee(payload);
      }
      closeModal();
    });

    // search input
    let searchTimer = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchTerm = e.target.value;
        gotoFirstPage();
        applyFilters();
        render();
      }, 180);
    });

    // dept filter
    filterDept.addEventListener('change', (e) => {
      currentDeptFilter = e.target.value;
      gotoFirstPage();
      render();
    });

    // page size
    pageSizeSelect.addEventListener('change', (e) => {
      pageSize = Number(e.target.value);
      gotoFirstPage();
      render();
    });

    // export
    btnExport.addEventListener('click', () => {
      const dataStr = JSON.stringify(employees, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

    // import
    btnImport.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (evt) => {
      const file = evt.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (!Array.isArray(parsed)) throw new Error('Invalid file format');
          // coerce ids and append with new unique ids if conflict
          const existingIds = new Set(employees.map(x=>x.id));
          const newItems = parsed.map(it => {
            const parsedId = Number(it.id) || Date.now()+Math.floor(Math.random()*1000);
            let finalId = parsedId;
            while(existingIds.has(finalId)) finalId = Date.now()+Math.floor(Math.random()*100000);
            existingIds.add(finalId);
            return { id: finalId, fullName: it.fullName||'', email: it.email||'', phone: it.phone||'', department: it.department||'', position: it.position||'', notes: it.notes||'' };
          });
          employees = [...newItems, ...employees];
          saveEmployees();
          populateDeptFilter();
          applyFilters();
          render();
          alert('Imported ' + newItems.length + ' employees.');
        } catch (err) {
          alert('Failed to import: ' + err.message);
        }
      };
      reader.readAsText(file);
      // reset input so same file can be chosen later
      importFile.value = '';
    });

    // close modal when clicking outside panel
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // keyboard escape to close
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
    });
  }

  // ---------- Boot ----------
  init();

  // Expose small API to dev console for debugging
  window.ems = {
    getAll: () => employees,
    clearAll: () => { if(confirm('Clear all employees?')) { employees = []; saveEmployees(); render(); } },
    addSample: () => { employees.unshift({ id: Date.now(), fullName: 'New Employee', email: 'new@example.com', phone:'', department:'Support', position:'', notes:'' }); saveEmployees(); render(); }
  };
})();
