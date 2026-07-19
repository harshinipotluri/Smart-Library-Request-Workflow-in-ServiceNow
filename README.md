# 📚 Smart Library Request Workflow in ServiceNow

## 👩‍💻 Developed By

- Dandu Manasa
- Dunnapothula Ravi Kiran
- Duvvu Rajesh
- Harshini Potluri
- Jonnalagadda Venkat Kiran

## 📖 Project Overview

The **Smart Library Request Workflow** is a ServiceNow application developed to simplify and automate library management. It allows students to search and request books while enabling librarians to manage books, review requests, and approve or reject them. The application also updates book availability automatically and generates reports for library analysis.

---

## 🎯 Project Objectives

- Manage library books efficiently.
- Allow students to request books online.
- Enable librarians to approve or reject book requests.
- Automate the borrowing process using Flow Designer.
- Control access using roles and ACLs.
- Maintain accurate book availability.
- Generate reports for library analysis.

---

## 👥 User Roles

### 🎓 Student
- View available books.
- Submit book borrowing requests.
- Check request status.

### 📚 Librarian
- Add new books.
- Update and manage book records.
- Approve or reject borrowing requests.
- Monitor book availability.

---

## 🗂️ Tables Created

### Library Book
Stores book information such as:
- Book ID
- Title
- Author
- Category
- Availability Status
- Total Copies

### Book Request
Stores borrowing request details such as:
- Requested Book
- Requested By
- Request Status
- Request Date
- Return Date

---

## 🔐 Access Control (ACL)

### Student Permissions
- View available books.
- Create book requests.
- View their own requests.

### Librarian Permissions
- Create, update, and manage books.
- Approve or reject requests.
- Update book availability.

---

## 🔄 Workflow

The application uses **Flow Designer** to automate the borrowing process.

1. Student submits a book request.
2. Request status changes to **Pending**.
3. The request is sent to the librarian.
4. The librarian approves or rejects the request.
5. If approved:
   - Request status changes to **Approved**.
   - Book availability changes to **Issued**.
6. If rejected:
   - Request status changes to **Rejected**.

---

## 📖 Borrowing and Availability

- Students can request available books.
- Approved requests automatically update the book status.
- Returned books are marked as **Available**.
- Book availability is updated automatically.

---

## ✅ Approval Process

- Student submits a request.
- Librarian reviews the request.
- Request is approved or rejected.
- The system automatically updates the request status and book availability.

---

## 📊 Reports Created

The following reports were created:

- Most Borrowed Books
- Active Book Requests

These reports help librarians analyze library activities.

---

## 🧪 Testing

The application was tested by impersonating different users.

### Student Testing
- Viewed available books.
- Submitted book requests.

### Librarian Testing
- Reviewed requests.
- Approved and rejected requests.
- Verified automatic updates.

---

## 🛠️ Technologies Used

- ServiceNow
- Flow Designer
- Access Control Rules (ACL)
- Reports
- Custom Tables


## 📌 Project Outcome

The Smart Library Request Workflow successfully manages library books and borrowing requests through automation. It improves efficiency, reduces manual work, provides secure role-based access, and maintains accurate book availability using ServiceNow.

---
