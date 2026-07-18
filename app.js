/* ==========================================================================
   Aether Library System - Application Core
   ========================================================================== */

// --- Application State ---
const State = {
  currentRole: 'student', // 'student' or 'librarian'
  currentUser: {
    id: 'student_alex',
    name: 'Alex Mercer',
    avatar: '👤'
  },
  activeView: 'catalog', // 'catalog', 'requests', 'admin-requests', 'manage-catalog', 'reports'
  books: [],
  borrowRequests: [],
  logs: []
};

// --- Mock Database Initial Data ---
const DEFAULT_BOOKS = [
  {
    id: 'book_1',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    isbn: '978-1449373320',
    category: 'Computer Science',
    status: 'Available',
    borrowCount: 15,
    addedDate: '2026-01-10T10:00:00Z'
  },
  {
    id: 'book_2',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    category: 'Computer Science',
    status: 'Available',
    borrowCount: 22,
    addedDate: '2026-01-15T11:30:00Z'
  },
  {
    id: 'book_3',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    isbn: '978-0547928227',
    category: 'Fiction',
    status: 'Borrowed',
    borrowCount: 30,
    addedDate: '2026-02-01T09:00:00Z'
  },
  {
    id: 'book_4',
    title: 'Steve Jobs',
    author: 'Walter Isaacson',
    isbn: '978-1451648539',
    category: 'Biography',
    status: 'Available',
    borrowCount: 8,
    addedDate: '2026-02-10T14:20:00Z'
  },
  {
    id: 'book_5',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    isbn: '978-0553380163',
    category: 'Science',
    status: 'Available',
    borrowCount: 12,
    addedDate: '2026-02-15T16:45:00Z'
  }
];

const DEFAULT_REQUESTS = [
  {
    id: 'req_1',
    bookId: 'book_3',
    bookTitle: 'The Hobbit',
    studentId: 'student_alex',
    studentName: 'Alex Mercer',
    requestDate: '2026-07-10T10:30:00Z',
    status: 'Approved',
    actionDate: '2026-07-10T11:00:00Z',
    returnDueDate: '2026-07-24T11:00:00Z'
  },
  {
    id: 'req_2',
    bookId: 'book_1',
    bookTitle: 'Designing Data-Intensive Applications',
    studentId: 'student_sarah',
    studentName: 'Sarah Jenkins',
    requestDate: '2026-07-12T09:15:00Z',
    status: 'Returned',
    actionDate: '2026-07-13T10:00:00Z',
    returnDueDate: '2026-07-26T09:15:00Z'
  },
  {
    id: 'req_3',
    bookId: 'book_2',
    bookTitle: 'Clean Code',
    studentId: 'student_jake',
    studentName: 'Jake Harper',
    requestDate: '2026-07-17T14:00:00Z',
    status: 'Pending',
    actionDate: null,
    returnDueDate: null
  }
];

// --- Access Control Lists (ACL) Policy Config ---
const ACL_POLICIES = {
  student: {
    allowedViews: ['catalog', 'requests'],
    permissions: {
      'book.read': true,
      'book.create': false,
      'book.update': false,
      'book.delete': false,
      'request.create': true,
      'request.read_own': true,
      'request.read_all': false,
      'request.approve': false,
      'request.reject': false,
      'request.return': false,
      'reports.view': false
    }
  },
  librarian: {
    allowedViews: ['catalog', 'admin-requests', 'manage-catalog', 'reports'],
    permissions: {
      'book.read': true,
      'book.create': true,
      'book.update': true,
      'book.delete': true,
      'request.create': false,
      'request.read_own': false, // Librarians view "all", no concept of "own requests"
      'request.read_all': true,
      'request.approve': true,
      'request.reject': true,
      'request.return': true,
      'reports.view': true
    }
  }
};

// --- Logger Utility ---
function systemLog(type, message) {
  const timestamp = new Date().toLocaleTimeString();
  let prefix = '[SYSTEM]';
  let cssClass = 'log-system';

  if (type === 'ACL_OK') {
    prefix = '[ACL GRANTED]';
    cssClass = 'log-acl-ok';
  } else if (type === 'ACL_BLOCK') {
    prefix = '[ACL BLOCKED]';
    cssClass = 'log-acl-block';
  } else if (type === 'WORKFLOW') {
    prefix = '[WORKFLOW]';
    cssClass = 'log-workflow';
  } else if (type === 'ERROR') {
    prefix = '[ERROR]';
    cssClass = 'log-error';
  }

  const logHTML = `<div class="log-line ${cssClass}">
    <span style="opacity: 0.5;">[${timestamp}]</span> <strong>${prefix}</strong> ${message}
  </div>`;

  const container = document.getElementById('log-output-container');
  if (container) {
    container.insertAdjacentHTML('beforeend', logHTML);
    container.scrollTop = container.scrollHeight;
  }
  
  State.logs.push({ timestamp, type, message });
}

// --- Access Control Guard ---
function checkPermission(operation) {
  const role = State.currentRole;
  const isAllowed = ACL_POLICIES[role]?.permissions[operation] || false;

  if (isAllowed) {
    systemLog('ACL_OK', `Role: ${role} -> Operation: '${operation}' authorized.`);
    return true;
  } else {
    systemLog('ACL_BLOCK', `Role: ${role} -> Operation: '${operation}' DENIED.`);
    return false;
  }
}

// --- Database Engine (localStorage Wrapper) ---
function loadDatabase() {
  try {
    const localBooks = localStorage.getItem('ae_books');
    const localRequests = localStorage.getItem('ae_requests');

    if (localBooks) {
      State.books = JSON.parse(localBooks);
    } else {
      State.books = [...DEFAULT_BOOKS];
      saveBooksToLocal();
    }

    if (localRequests) {
      State.borrowRequests = JSON.parse(localRequests);
    } else {
      State.borrowRequests = [...DEFAULT_REQUESTS];
      saveRequestsToLocal();
    }
    
    systemLog('SYSTEM', 'Database loaded and synchronized.');
  } catch (err) {
    systemLog('ERROR', 'Failed to load database from localStorage. Resetting to defaults.');
    State.books = [...DEFAULT_BOOKS];
    State.borrowRequests = [...DEFAULT_REQUESTS];
  }
}

function saveBooksToLocal() {
  localStorage.setItem('ae_books', JSON.stringify(State.books));
}

function saveRequestsToLocal() {
  localStorage.setItem('ae_requests', JSON.stringify(State.borrowRequests));
}

// --- Workflows & Transactions ---

// 1. Submit Request (Student Workflow)
function executeRequestBookWorkflow(bookId) {
  if (!checkPermission('request.create')) return false;

  const book = State.books.find(b => b.id === bookId);
  if (!book) {
    systemLog('ERROR', `Book ID '${bookId}' not found.`);
    return false;
  }

  if (book.status !== 'Available') {
    systemLog('ERROR', `Cannot request '${book.title}'. Status is currently: ${book.status}`);
    return false;
  }

  // Check if student already has a pending or active request for this book
  const activeRequest = State.borrowRequests.find(r => 
    r.bookId === bookId && 
    r.studentId === State.currentUser.id && 
    (r.status === 'Pending' || r.status === 'Approved')
  );

  if (activeRequest) {
    systemLog('ERROR', `Student already has an active status '${activeRequest.status}' transaction for '${book.title}'.`);
    alert(`You already have an active request/loan for this book (${activeRequest.status}).`);
    return false;
  }

  // Transaction execution
  const newRequest = {
    id: 'req_' + Math.random().toString(36).substr(2, 9),
    bookId: book.id,
    bookTitle: book.title,
    studentId: State.currentUser.id,
    studentName: State.currentUser.name,
    requestDate: new Date().toISOString(),
    status: 'Pending',
    actionDate: null,
    returnDueDate: null
  };

  State.borrowRequests.push(newRequest);
  saveRequestsToLocal();

  systemLog('WORKFLOW', `Request '${newRequest.id}' created by student for Book: '${book.title}'. Request set to PENDING.`);
  renderUI();
  return true;
}

// 2. Approve Request (Librarian Workflow)
function executeApproveRequestWorkflow(requestId) {
  if (!checkPermission('request.approve')) return false;

  const request = State.borrowRequests.find(r => r.id === requestId);
  if (!request) {
    systemLog('ERROR', `Request ID '${requestId}' not found.`);
    return false;
  }

  if (request.status !== 'Pending') {
    systemLog('ERROR', `Cannot approve Request '${requestId}'. Current status is '${request.status}' (expected PENDING).`);
    return false;
  }

  const book = State.books.find(b => b.id === request.bookId);
  if (!book) {
    systemLog('ERROR', `Referenced Book ID '${request.bookId}' does not exist.`);
    return false;
  }

  if (book.status !== 'Available') {
    systemLog('ERROR', `Cannot approve request. Book '${book.title}' is currently ${book.status}.`);
    alert(`This book is already loaned out or reserved. You may reject the request instead.`);
    return false;
  }

  // Atomic state updates
  request.status = 'Approved';
  request.actionDate = new Date().toISOString();
  
  // Calculate return date (14 days from now)
  const returnDueDate = new Date();
  returnDueDate.setDate(returnDueDate.getDate() + 14);
  request.returnDueDate = returnDueDate.toISOString();

  // Update book status
  book.status = 'Borrowed';
  book.borrowCount += 1;

  // Auto-reject other pending requests for the same book (Workflow automation check)
  State.borrowRequests.forEach(r => {
    if (r.id !== request.id && r.bookId === book.id && r.status === 'Pending') {
      r.status = 'Rejected';
      r.actionDate = new Date().toISOString();
      systemLog('WORKFLOW', `Auto-Workflow: Request '${r.id}' auto-REJECTED due to inventory allocation lock.`);
    }
  });

  saveBooksToLocal();
  saveRequestsToLocal();

  systemLog('WORKFLOW', `Request '${request.id}' APPROVED. Book status updated: AVAILABLE -> BORROWED. Due: ${returnDueDate.toLocaleDateString()}`);
  renderUI();
  return true;
}

// 3. Reject Request (Librarian Workflow)
function executeRejectRequestWorkflow(requestId) {
  if (!checkPermission('request.reject')) return false;

  const request = State.borrowRequests.find(r => r.id === requestId);
  if (!request) {
    systemLog('ERROR', `Request ID '${requestId}' not found.`);
    return false;
  }

  if (request.status !== 'Pending') {
    systemLog('ERROR', `Cannot reject Request '${requestId}'. Status is '${request.status}'.`);
    return false;
  }

  request.status = 'Rejected';
  request.actionDate = new Date().toISOString();

  saveRequestsToLocal();

  systemLog('WORKFLOW', `Request '${request.id}' REJECTED by Librarian.`);
  renderUI();
  return true;
}

// 4. Return Book (Librarian Workflow)
function executeReturnBookWorkflow(requestId) {
  if (!checkPermission('request.return')) return false;

  const request = State.borrowRequests.find(r => r.id === requestId);
  if (!request) {
    systemLog('ERROR', `Request ID '${requestId}' not found.`);
    return false;
  }

  if (request.status !== 'Approved') {
    systemLog('ERROR', `Cannot return request '${requestId}'. Status must be APPROVED.`);
    return false;
  }

  const book = State.books.find(b => b.id === request.bookId);
  if (!book) {
    systemLog('ERROR', `Book ID '${request.bookId}' not found.`);
    return false;
  }

  // Atomic state updates
  request.status = 'Returned';
  request.actionDate = new Date().toISOString();

  book.status = 'Available';

  saveBooksToLocal();
  saveRequestsToLocal();

  systemLog('WORKFLOW', `Book '${book.title}' successfully RETURNED. Book status updated: BORROWED -> AVAILABLE.`);
  renderUI();
  return true;
}

// --- Librarian Book Inventory CRUD Management ---
function executeAddBook(title, author, isbn, category) {
  if (!checkPermission('book.create')) return false;

  const newBook = {
    id: 'book_' + Math.random().toString(36).substr(2, 9),
    title,
    author,
    isbn,
    category,
    status: 'Available',
    borrowCount: 0,
    addedDate: new Date().toISOString()
  };

  State.books.push(newBook);
  saveBooksToLocal();

  systemLog('WORKFLOW', `Book Inventory: Added new book ID '${newBook.id}' - '${newBook.title}'.`);
  renderUI();
  return true;
}

function executeEditBook(bookId, title, author, isbn, category) {
  if (!checkPermission('book.update')) return false;

  const book = State.books.find(b => b.id === bookId);
  if (!book) return false;

  book.title = title;
  book.author = author;
  book.isbn = isbn;
  book.category = category;

  saveBooksToLocal();

  systemLog('WORKFLOW', `Book Inventory: Updated book ID '${bookId}' details.`);
  renderUI();
  return true;
}

function executeDeleteBook(bookId) {
  if (!checkPermission('book.delete')) return false;

  const bookIndex = State.books.findIndex(b => b.id === bookId);
  if (bookIndex === -1) return false;

  const book = State.books[bookIndex];
  if (book.status === 'Borrowed') {
    systemLog('ERROR', `Cannot delete '${book.title}'. It is currently loaned out.`);
    alert(`This book is currently borrowed. You must wait for it to be returned before removing it from inventory.`);
    return false;
  }

  State.books.splice(bookIndex, 1);
  saveBooksToLocal();

  systemLog('WORKFLOW', `Book Inventory: Removed book ID '${bookId}' - '${book.title}' from inventory.`);
  renderUI();
  return true;
}

// --- UI Rendering Engine ---

function renderUI() {
  renderSidebarAndNavigation();
  renderStatsBar();
  renderCatalogView();
  renderStudentRequestsView();
  renderLibrarianApprovalsView();
  renderInventoryManagementView();
  renderReportsView();
}

function renderSidebarAndNavigation() {
  const isLibrarian = State.currentRole === 'librarian';
  
  // Set Body styling for conditional css rule visibility
  const body = document.body;
  if (isLibrarian) {
    body.classList.add('role-librarian-active');
    document.getElementById('user-name').innerText = 'Chief Librarian';
    document.getElementById('user-badge').innerText = 'Librarian Role';
    document.getElementById('user-badge').className = 'badge badge-librarian';
    document.getElementById('user-avatar').innerText = '🧙‍♂️';
  } else {
    body.classList.remove('role-librarian-active');
    document.getElementById('user-name').innerText = 'Alex Mercer';
    document.getElementById('user-badge').innerText = 'Student Role';
    document.getElementById('user-badge').className = 'badge badge-student';
    document.getElementById('user-avatar').innerText = '👤';
  }

  // Update navbar active button
  const buttons = document.querySelectorAll('.nav-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-view') === State.activeView) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Dynamic text based on role/view
  const viewTitle = document.getElementById('view-title');
  const viewDesc = document.getElementById('view-desc');
  
  if (State.activeView === 'catalog') {
    viewTitle.innerText = 'Book Catalog';
    viewDesc.innerText = 'Explore and request available books from the digital shelves.';
  } else if (State.activeView === 'requests') {
    viewTitle.innerText = 'My Borrowing Transactions';
    viewDesc.innerText = 'Track your active borrow request approvals and return deadlines.';
  } else if (State.activeView === 'admin-requests') {
    viewTitle.innerText = 'Librarian Approvals Queue';
    viewDesc.innerText = 'Review, approve, or reject student book allocation requests.';
  } else if (State.activeView === 'manage-catalog') {
    viewTitle.innerText = 'Manage Library Catalog';
    viewDesc.innerText = 'Maintain database records, add new items, or retire outdated entries.';
  } else if (State.activeView === 'reports') {
    viewTitle.innerText = 'Analytics & Reports Dashboard';
    viewDesc.innerText = 'System usage trends, popular borrows, and lifecycle metrics.';
  }

  // Toggle active view panel
  const panels = document.querySelectorAll('.view-panel');
  panels.forEach(panel => {
    if (panel.id === `view-${State.activeView}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Update Pending approvals counter in menu
  const pendingRequests = State.borrowRequests.filter(r => r.status === 'Pending').length;
  document.getElementById('requests-count').innerText = pendingRequests;
}

function renderStatsBar() {
  const total = State.books.length;
  const available = State.books.filter(b => b.status === 'Available').length;
  const borrowed = State.books.filter(b => b.status === 'Borrowed').length;

  document.getElementById('stat-total-books').innerText = total;
  document.getElementById('stat-available-books').innerText = available;
  document.getElementById('stat-active-borrows').innerText = borrowed;
}

function renderCatalogView() {
  const container = document.getElementById('books-grid-container');
  if (!container) return;

  const searchQuery = document.getElementById('catalog-search').value.toLowerCase();
  const categoryFilter = document.getElementById('catalog-category-filter').value;

  const filteredBooks = State.books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery) ||
      book.author.toLowerCase().includes(searchQuery) ||
      book.isbn.includes(searchQuery) ||
      book.category.toLowerCase().includes(searchQuery);

    const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (filteredBooks.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        <span style="font-size: 2rem;">📭</span>
        <p style="margin-top: 10px;">No books matched your criteria.</p>
      </div>`;
    return;
  }

  container.innerHTML = filteredBooks.map(book => {
    const isStudent = State.currentRole === 'student';
    const isAvailable = book.status === 'Available';
    let btnText = isAvailable ? 'Request Borrow' : 'Unavailable';
    let btnClass = 'btn-primary';
    let isDisabled = false;

    if (!isAvailable) {
      btnClass = 'btn-secondary';
      isDisabled = true;
    }

    if (!isStudent) {
      btnText = 'Librarian Mode';
      btnClass = 'btn-secondary';
      isDisabled = true;
    }

    let badgeClass = 'badge-available';
    if (book.status === 'Borrowed') badgeClass = 'badge-borrowed';
    if (book.status === 'Reserved') badgeClass = 'badge-reserved';

    // Cover SVG or abstract styling based on title/category
    const emojiMap = {
      'Computer Science': '💻',
      'Fiction': '🧙‍♂️',
      'Biography': '👤',
      'Science': '🔬'
    };
    const coverEmoji = emojiMap[book.category] || '📘';

    return `
      <div class="book-card">
        <div class="book-cover">
          <span class="cover-badge badge ${badgeClass}">${book.status}</span>
          <span class="book-icon-glow">${coverEmoji}</span>
        </div>
        <div class="book-details">
          <span class="book-category">${book.category}</span>
          <h3 class="book-title">${book.title}</h3>
          <span class="book-author">by ${book.author}</span>
          <div class="book-footer">
            <span>ISBN: ${book.isbn}</span>
            <span>Reads: ${book.borrowCount}</span>
          </div>
          <div class="book-actions">
            <button class="btn ${btnClass} btn-sm" 
                    onclick="executeRequestBookWorkflow('${book.id}')" 
                    ${isDisabled ? 'disabled' : ''}>
              ${btnText}
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderStudentRequestsView() {
  const tbody = document.getElementById('student-requests-body');
  if (!tbody) return;

  // Filter requests belonging to current student
  const myRequests = State.borrowRequests.filter(r => r.studentId === State.currentUser.id);

  if (myRequests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">
          You have not submitted any borrow requests yet.
        </td>
      </tr>`;
    return;
  }

  // Sort: pending/approved first
  myRequests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

  tbody.innerHTML = myRequests.map(req => {
    let statusClass = 'badge-pending';
    if (req.status === 'Approved') statusClass = 'badge-approved';
    if (req.status === 'Rejected') statusClass = 'badge-rejected';
    if (req.status === 'Returned') statusClass = 'badge-returned';

    const reqDate = new Date(req.requestDate).toLocaleDateString();
    
    let actionInfo = '-';
    if (req.status === 'Approved' && req.returnDueDate) {
      const due = new Date(req.returnDueDate);
      const isOverdue = due < new Date();
      actionInfo = `<span style="color: ${isOverdue ? 'var(--color-danger)' : 'var(--color-info)'}; font-weight: 600;">
        Due: ${due.toLocaleDateString()} ${isOverdue ? '(OVERDUE)' : ''}
      </span>`;
    } else if (req.status === 'Rejected' || req.status === 'Returned') {
      actionInfo = `Actioned: ${new Date(req.actionDate).toLocaleDateString()}`;
    }

    return `
      <tr>
        <td><code>${req.id}</code></td>
        <td>
          <div class="table-book-info">
            <h4>${req.bookTitle}</h4>
            <span>Book ID: ${req.bookId}</span>
          </div>
        </td>
        <td>${reqDate}</td>
        <td><span class="badge ${statusClass}">${req.status}</span></td>
        <td>${actionInfo}</td>
        <td>
          <button class="btn btn-secondary btn-sm" disabled>Cancel</button>
        </td>
      </tr>`;
  }).join('');
}

function renderLibrarianApprovalsView() {
  const tbody = document.getElementById('librarian-requests-body');
  if (!tbody) return;

  // Show only pending borrow requests for the approval queue
  const pendingRequests = State.borrowRequests.filter(r => r.status === 'Pending');

  if (pendingRequests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">
          🎉 No pending borrow requests to approve.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = pendingRequests.map(req => {
    const reqDate = new Date(req.requestDate).toLocaleString();

    return `
      <tr>
        <td><code>${req.id}</code></td>
        <td>
          <strong>${req.studentName}</strong><br>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${req.studentId}</span>
        </td>
        <td>
          <div class="table-book-info">
            <h4>${req.bookTitle}</h4>
            <span>Book ID: ${req.bookId}</span>
          </div>
        </td>
        <td>${reqDate}</td>
        <td><span class="badge badge-pending">${req.status}</span></td>
        <td>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary btn-sm" onclick="executeApproveRequestWorkflow('${req.id}')">Approve</button>
            <button class="btn btn-danger btn-sm" onclick="executeRejectRequestWorkflow('${req.id}')">Reject</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function renderInventoryManagementView() {
  const tbody = document.getElementById('catalog-manage-body');
  if (!tbody) return;

  tbody.innerHTML = State.books.map(book => {
    let badgeClass = 'badge-available';
    if (book.status === 'Borrowed') badgeClass = 'badge-borrowed';
    if (book.status === 'Reserved') badgeClass = 'badge-reserved';

    // Find if book is currently borrowed, get request ID to process returns
    const activeRequest = State.borrowRequests.find(r => r.bookId === book.id && r.status === 'Approved');
    let returnButtonHTML = '';
    
    if (book.status === 'Borrowed' && activeRequest) {
      returnButtonHTML = `<button class="btn btn-primary btn-sm" onclick="executeReturnBookWorkflow('${activeRequest.id}')">↩️ Return Book</button>`;
    }

    return `
      <tr>
        <td><code>${book.id}</code></td>
        <td><strong>${book.title}</strong></td>
        <td>${book.author}</td>
        <td><code>${book.isbn}</code></td>
        <td>${book.category}</td>
        <td><span class="badge ${badgeClass}">${book.status}</span></td>
        <td>
          <div style="display: flex; gap: 8px;">
            ${returnButtonHTML}
            <button class="btn btn-secondary btn-sm" onclick="openEditBookModal('${book.id}')">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="executeDeleteBook('${book.id}')">🗑️ Delete</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function renderReportsView() {
  const chartContainer = document.getElementById('most-borrowed-chart');
  if (!chartContainer) return;

  // 1. Most Borrowed Books Chart
  // Sort books by borrowCount desc and take top 5
  const topBooks = [...State.books]
    .sort((a, b) => b.borrowCount - a.borrowCount)
    .slice(0, 5);

  const maxBorrows = Math.max(...topBooks.map(b => b.borrowCount), 1); // Avoid division by zero

  chartContainer.innerHTML = topBooks.map(book => {
    const percentage = (book.borrowCount / maxBorrows) * 100;
    return `
      <div class="chart-bar-wrapper">
        <div class="chart-bar" style="height: ${percentage}%;" title="${book.title} (${book.borrowCount} borrows)">
          <span class="chart-bar-value">${book.borrowCount}</span>
        </div>
        <span class="chart-bar-label">${book.title}</span>
      </div>`;
  }).join('');

  // 2. Transaction Stats Calculations
  const totalTx = State.borrowRequests.length;
  const approved = State.borrowRequests.filter(r => r.status === 'Approved' || r.status === 'Returned').length;
  const rejected = State.borrowRequests.filter(r => r.status === 'Rejected').length;
  
  const approvalRate = totalTx > 0 ? Math.round((approved / (approved + rejected || 1)) * 100) : 0;
  const activeLoans = State.borrowRequests.filter(r => r.status === 'Approved').length;
  
  const returned = State.borrowRequests.filter(r => r.status === 'Returned').length;
  const completedRate = approved > 0 ? Math.round((returned / approved) * 100) : 0;

  document.getElementById('analytics-total-tx').innerText = totalTx;
  document.getElementById('analytics-approval-rate').innerText = `${approvalRate}%`;
  document.getElementById('analytics-active-loans').innerText = activeLoans;
  document.getElementById('analytics-return-rate').innerText = `${completedRate}%`;
}

// --- Modals Handlers ---
function openAddBookModal() {
  if (!checkPermission('book.create')) return;
  
  document.getElementById('modal-title').innerText = 'Add New Book';
  document.getElementById('edit-book-id').value = '';
  document.getElementById('book-form').reset();
  
  document.getElementById('book-modal').classList.add('active');
}

function openEditBookModal(bookId) {
  if (!checkPermission('book.update')) return;

  const book = State.books.find(b => b.id === bookId);
  if (!book) return;

  document.getElementById('modal-title').innerText = 'Edit Book Details';
  document.getElementById('edit-book-id').value = book.id;
  document.getElementById('book-title-input').value = book.title;
  document.getElementById('book-author-input').value = book.author;
  document.getElementById('book-isbn-input').value = book.isbn;
  document.getElementById('book-category-input').value = book.category;

  document.getElementById('book-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('book-modal').classList.remove('active');
}

function handleBookFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('edit-book-id').value;
  const title = document.getElementById('book-title-input').value;
  const author = document.getElementById('book-author-input').value;
  const isbn = document.getElementById('book-isbn-input').value;
  const category = document.getElementById('book-category-input').value;

  let success = false;
  if (id) {
    // Edit Mode
    success = executeEditBook(id, title, author, isbn, category);
  } else {
    // Add Mode
    success = executeAddBook(title, author, isbn, category);
  }

  if (success) {
    closeModal();
  }
}

// --- Event Listeners Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Init database
  loadDatabase();

  // Navigation Links
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.getAttribute('data-view');
      
      // ACL view navigation checks
      const allowedViews = ACL_POLICIES[State.currentRole].allowedViews;
      if (allowedViews.includes(view)) {
        State.activeView = view;
        renderUI();
      } else {
        systemLog('ACL_BLOCK', `Navigation to '${view}' view BLOCKED for current role (${State.currentRole}).`);
        alert('Access Denied. You do not have permissions to access this view.');
      }
    });
  });

  // Role Toggles
  document.getElementById('toggle-student').addEventListener('click', (e) => {
    State.currentRole = 'student';
    State.currentUser = {
      id: 'student_alex',
      name: 'Alex Mercer',
      avatar: '👤'
    };
    State.activeView = 'catalog'; // Reset to base view
    
    // Manage active states
    document.getElementById('toggle-student').classList.add('active');
    document.getElementById('toggle-librarian').classList.remove('active');
    
    systemLog('SYSTEM', 'Switched security context to Student role.');
    renderUI();
  });

  document.getElementById('toggle-librarian').addEventListener('click', (e) => {
    State.currentRole = 'librarian';
    State.currentUser = {
      id: 'librarian_admin',
      name: 'Chief Librarian',
      avatar: '🧙‍♂️'
    };
    State.activeView = 'catalog'; // Reset to base view
    
    // Manage active states
    document.getElementById('toggle-student').classList.remove('active');
    document.getElementById('toggle-librarian').classList.add('active');
    
    systemLog('SYSTEM', 'Switched security context to Librarian role.');
    renderUI();
  });

  // Search/Filter catalogs
  document.getElementById('catalog-search').addEventListener('input', renderCatalogView);
  document.getElementById('catalog-category-filter').addEventListener('change', renderCatalogView);

  // Clear log console
  document.getElementById('btn-clear-logs').addEventListener('click', () => {
    document.getElementById('log-output-container').innerHTML = '';
    systemLog('SYSTEM', 'Inspector Log buffer cleared.');
  });

  // Modals operations
  document.getElementById('btn-open-add-book-modal').addEventListener('click', openAddBookModal);
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('book-form').addEventListener('submit', handleBookFormSubmit);

  // Console Tabs Switcher
  const tabBtnLogs = document.getElementById('tab-btn-logs');
  const tabBtnTests = document.getElementById('tab-btn-tests');
  const panelLogs = document.getElementById('console-logs-panel');
  const panelTests = document.getElementById('console-tests-panel');

  tabBtnLogs.addEventListener('click', () => {
    tabBtnLogs.classList.add('active');
    tabBtnTests.classList.remove('active');
    panelLogs.classList.add('active');
    panelTests.classList.remove('active');
  });

  tabBtnTests.addEventListener('click', () => {
    tabBtnTests.classList.add('active');
    tabBtnLogs.classList.remove('active');
    panelTests.classList.add('active');
    panelLogs.classList.remove('active');
  });

  // Render initial GUI
  renderUI();
});
