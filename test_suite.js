/* ==========================================================================
   Aether Library System - Self-Verification Test Suite
   ========================================================================== */

const Tests = [
  {
    name: "Student Add Book Blocking (ACL)",
    desc: "Verify that the ACL Policy blocks users with the 'student' role from inserting books into the catalog.",
    fn: function() {
      // Setup state
      const backupRole = State.currentRole;
      State.currentRole = 'student';
      
      systemLog('SYSTEM', '[TEST RUN] Testing student book creation block...');
      const result = executeAddBook("Test Book Title", "Test Author", "111-222-333", "Science");
      
      // Restore state
      State.currentRole = backupRole;
      
      // Assertion: Should return false (blocked by ACL)
      return result === false;
    }
  },
  {
    name: "Student Approve Request Blocking (ACL)",
    desc: "Verify that the ACL Policy blocks users with the 'student' role from approving borrow requests.",
    fn: function() {
      const backupRole = State.currentRole;
      State.currentRole = 'student';
      
      systemLog('SYSTEM', '[TEST RUN] Testing student request approval block...');
      const result = executeApproveRequestWorkflow("req_3");
      
      State.currentRole = backupRole;
      return result === false;
    }
  },
  {
    name: "Librarian CRUD Catalog Actions (ACL)",
    desc: "Verify that the ACL Policy allows users with the 'librarian' role to add books to the inventory.",
    fn: function() {
      const backupRole = State.currentRole;
      State.currentRole = 'librarian';
      
      const beforeCount = State.books.length;
      systemLog('SYSTEM', '[TEST RUN] Testing librarian book creation...');
      const result = executeAddBook("Test book " + Date.now(), "Author Spec", "999-999-999", "Fiction");
      const afterCount = State.books.length;
      
      State.currentRole = backupRole;
      
      // Cleanup the test book
      if (result) {
        State.books.pop();
        saveBooksToLocal();
      }
      
      return result === true && afterCount === beforeCount + 1;
    }
  },
  {
    name: "Request Creation Workflow",
    desc: "Test if requesting a book sets the request status to PENDING while the book remains AVAILABLE.",
    fn: function() {
      const backupRole = State.currentRole;
      const backupUser = State.currentUser;
      
      State.currentRole = 'student';
      State.currentUser = { id: 'test_student', name: 'Test Student', avatar: '👤' };

      // Find an available book or create one
      let book = State.books.find(b => b.status === 'Available');
      let createdTestBook = false;
      if (!book) {
        book = {
          id: 'test_avail_book',
          title: 'Test Available Book',
          author: 'Tester',
          isbn: '000-000-000',
          category: 'Science',
          status: 'Available',
          borrowCount: 0
        };
        State.books.push(book);
        createdTestBook = true;
      }
      
      const beforeRequestsCount = State.borrowRequests.length;
      systemLog('SYSTEM', '[TEST RUN] Submitting student borrow request...');
      const result = executeRequestBookWorkflow(book.id);
      const afterRequestsCount = State.borrowRequests.length;
      
      // Find the new request
      const newRequest = State.borrowRequests[State.borrowRequests.length - 1];
      const isPending = newRequest && newRequest.status === 'Pending';
      const bookStillAvailable = book.status === 'Available';
      
      // Cleanup
      if (result) {
        State.borrowRequests.pop();
        saveRequestsToLocal();
      }
      if (createdTestBook) {
        State.books.pop();
        saveBooksToLocal();
      }
      
      State.currentRole = backupRole;
      State.currentUser = backupUser;
      
      return result === true && 
             afterRequestsCount === beforeRequestsCount + 1 && 
             isPending && 
             bookStillAvailable;
    }
  },
  {
    name: "Librarian Approval Workflow Sync",
    desc: "Verify that approving a request updates request status to APPROVED and book status to BORROWED.",
    fn: function() {
      const backupRole = State.currentRole;
      State.currentRole = 'librarian';

      // Setup: Need a test book and a pending request
      const testBook = {
        id: 'test_bk_approve',
        title: 'Approve Test Book',
        author: 'Tester',
        isbn: '123-456-789',
        category: 'Fiction',
        status: 'Available',
        borrowCount: 2
      };
      const testRequest = {
        id: 'test_req_approve',
        bookId: 'test_bk_approve',
        bookTitle: 'Approve Test Book',
        studentId: 'student_alex',
        studentName: 'Alex Mercer',
        requestDate: new Date().toISOString(),
        status: 'Pending',
        actionDate: null,
        returnDueDate: null
      };

      State.books.push(testBook);
      State.borrowRequests.push(testRequest);
      
      systemLog('SYSTEM', '[TEST RUN] Approving pending request...');
      const result = executeApproveRequestWorkflow(testRequest.id);
      
      const requestApproved = testRequest.status === 'Approved';
      const bookBorrowed = testBook.status === 'Borrowed';
      const borrowCountIncremented = testBook.borrowCount === 3;
      const dueDateSet = testRequest.returnDueDate !== null;

      // Cleanup
      State.books.pop();
      State.borrowRequests.pop();
      saveBooksToLocal();
      saveRequestsToLocal();

      State.currentRole = backupRole;

      return result === true && 
             requestApproved && 
             bookBorrowed && 
             borrowCountIncremented && 
             dueDateSet;
    }
  },
  {
    name: "Request Reject Workflow Status",
    desc: "Verify that rejecting a request updates status to REJECTED and leaves the book status as AVAILABLE.",
    fn: function() {
      const backupRole = State.currentRole;
      State.currentRole = 'librarian';

      const testBook = {
        id: 'test_bk_reject',
        title: 'Reject Test Book',
        author: 'Tester',
        isbn: '000-111-222',
        category: 'Biography',
        status: 'Available',
        borrowCount: 0
      };
      const testRequest = {
        id: 'test_req_reject',
        bookId: 'test_bk_reject',
        bookTitle: 'Reject Test Book',
        studentId: 'student_alex',
        studentName: 'Alex Mercer',
        requestDate: new Date().toISOString(),
        status: 'Pending',
        actionDate: null,
        returnDueDate: null
      };

      State.books.push(testBook);
      State.borrowRequests.push(testRequest);
      
      systemLog('SYSTEM', '[TEST RUN] Rejecting pending request...');
      const result = executeRejectRequestWorkflow(testRequest.id);
      
      const requestRejected = testRequest.status === 'Rejected';
      const bookAvailable = testBook.status === 'Available';

      // Cleanup
      State.books.pop();
      State.borrowRequests.pop();
      saveBooksToLocal();
      saveRequestsToLocal();

      State.currentRole = backupRole;

      return result === true && requestRejected && bookAvailable;
    }
  },
  {
    name: "Book Return Workflow Synchronization",
    desc: "Verify that returning a borrowed book updates request status to RETURNED and book status to AVAILABLE.",
    fn: function() {
      const backupRole = State.currentRole;
      State.currentRole = 'librarian';

      const testBook = {
        id: 'test_bk_return',
        title: 'Return Test Book',
        author: 'Tester',
        isbn: '555-555-555',
        category: 'Computer Science',
        status: 'Borrowed',
        borrowCount: 1
      };
      const testRequest = {
        id: 'test_req_return',
        bookId: 'test_bk_return',
        bookTitle: 'Return Test Book',
        studentId: 'student_alex',
        studentName: 'Alex Mercer',
        requestDate: new Date().toISOString(),
        status: 'Approved',
        actionDate: new Date().toISOString(),
        returnDueDate: new Date().toISOString()
      };

      State.books.push(testBook);
      State.borrowRequests.push(testRequest);
      
      systemLog('SYSTEM', '[TEST RUN] Executing return book workflow...');
      const result = executeReturnBookWorkflow(testRequest.id);
      
      const requestReturned = testRequest.status === 'Returned';
      const bookAvailable = testBook.status === 'Available';

      // Cleanup
      State.books.pop();
      State.borrowRequests.pop();
      saveBooksToLocal();
      saveRequestsToLocal();

      State.currentRole = backupRole;

      return result === true && requestReturned && bookAvailable;
    }
  }
];

function runTests() {
  systemLog('SYSTEM', '================================================');
  systemLog('SYSTEM', '🏁 Starting automated verification test suite...');
  systemLog('SYSTEM', '================================================');
  
  const resultsContainer = document.getElementById('test-results-list');
  if (!resultsContainer) return;
  
  resultsContainer.innerHTML = '';
  let passedCount = 0;
  
  Tests.forEach((test, idx) => {
    let passed = false;
    let errorMsg = "";
    
    try {
      passed = test.fn();
    } catch (err) {
      passed = false;
      errorMsg = err.message;
      systemLog('ERROR', `Test '${test.name}' crashed: ${errorMsg}`);
    }
    
    if (passed) {
      passedCount++;
      systemLog('SYSTEM', `✅ Test passed: ${test.name}`);
    } else {
      systemLog('ERROR', `❌ Test FAILED: ${test.name} ${errorMsg ? '(' + errorMsg + ')' : ''}`);
    }
    
    const statusClass = passed ? 'pass' : 'fail';
    const statusIcon = passed ? '✅' : '❌';
    
    const itemHTML = `
      <div class="test-item ${statusClass}">
        <span class="test-indicator">${statusIcon}</span>
        <div class="test-info-block">
          <span class="test-name">${test.name}</span>
          <span class="test-desc">${test.desc}</span>
        </div>
      </div>`;
      
    resultsContainer.insertAdjacentHTML('beforeend', itemHTML);
  });
  
  systemLog('SYSTEM', '================================================');
  systemLog('SYSTEM', `🏁 Test suite finished. Passed: ${passedCount} / ${Tests.length}`);
  systemLog('SYSTEM', '================================================');
  
  // Rerender main UI to ensure state modifications in tests (though cleaned up) didn't visual-break active view
  renderUI();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-run-tests').addEventListener('click', runTests);
  
  // Render initial test list (without run statuses)
  const resultsContainer = document.getElementById('test-results-list');
  if (resultsContainer) {
    resultsContainer.innerHTML = Tests.map(test => `
      <div class="test-item">
        <span class="test-indicator">⏳</span>
        <div class="test-info-block">
          <span class="test-name" style="color: var(--text-secondary);">${test.name}</span>
          <span class="test-desc">${test.desc}</span>
        </div>
      </div>`).join('');
  }
});
