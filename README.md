# Aether Library System

A premium, fully client-side Library Management System demonstration showcasing relational state synchronization, access control lists (ACLs), automated request lifecycles, and visual analytics reports.

## Key Features

### 1. Multi-Role Context & Switcher
Swap between the **Student** (Alex Mercer) and **Chief Librarian** roles using the switcher in the left sidebar. Notice how the navigation menu and statistics update instantly based on the active role's clearance.

### 2. Transaction Workflows & State Sync
- **Requesting a book**: A student requests an available book. A `Pending` request is created.
- **Approving/Rejecting**: A librarian views the pending request queue, and can approve or reject the request. Approving automatically sets the book status to `Borrowed`, marks a 14-day deadline, and increments the read count.
- **Returning**: Librarians can click **Return Book** from the inventory manager. This transitions the request state to `Returned` and frees up the book back to `Available`.

### 3. Access Control (ACL) Enforcement
Every action (navigation, workflow triggers, catalog modifications) passes through the `checkPermission()` guard. Unauthorized requests are blocked, and both allowed and blocked operations are logged in real-time in the **Security & Workflow Guard** tab of the right console.

### 4. Interactive Reports & Trend Analytics
Librarians have exclusive access to the **Reports & Insights** panel, which aggregates:
- **Most Borrowed Books**: A dynamically rendering CSS-grid chart listing the top 5 books.
- **Transaction stats**: Calculates active loans, approval rates, and return ratios in real-time.

### 5. In-Browser Test Suite
Open the **Automated Tests** tab in the right console and click **Run Tests** to verify system logic. It performs transactions on isolated test-states and reports passing checks.

## How to Run

Since the application uses pure vanilla HTML/CSS/JS with no dependencies, it can be run in two ways:

### Option A: Open Directly in Browser (Easiest)
Locate the `index.html` file on your filesystem and open it in any web browser:
`C:\Users\new\.gemini\antigravity\scratch\library-system\index.html`

### Option B: Run a Local Dev Server
If you have node installed, you can serve the directory:
```bash

npx http-server .
```
Or if you have Python:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your web browser.
