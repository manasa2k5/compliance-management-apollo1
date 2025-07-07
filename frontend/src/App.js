import { FaTrash, FaCheck } from "react-icons/fa";
import React, { useState, useEffect, useRef } from "react";



import { Routes, Route } from "react-router-dom";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import "./App.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentTab, setCurrentTab] = useState("dashboard");
const bellRef = useRef();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [department, setDepartment] = useState("Finance");
  const [category, setCategory] = useState("Internal");
  const [dueDate, setDueDate] = useState("");
  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [roleChanges, setRoleChanges] = useState({});
const [userDeptFilter, setUserDeptFilter] = useState("All");
const [searchQuery, setSearchQuery] = useState("");
const [deptFilter, setDeptFilter] = useState("All");
const [catFilter, setCatFilter] = useState("All");
const [filterFromDate, setFilterFromDate] = useState("");
const [filterToDate, setFilterToDate] = useState("");
const [dueDateFrom, setDueDateFrom] = useState("");
const [dueDateTo, setDueDateTo] = useState("");
const [name, setName] = useState("");
const [role, setRole] = useState("Department Member"); 
const [showDropdown, setShowDropdown] = useState(false);

const [userInfo, setUserInfo] = useState(null); // if needed
const [overdueTasks, setOverdueTasks] = useState([]);
const [file, setFile] = useState(null);
const [auditLogs, setAuditLogs] = useState([]);

const [reportDept, setReportDept] = useState("All");

  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDayTasks, setSelectedDayTasks] = useState([]);
const handleLogin = async () => {
  try {
    const res = await axios.post("https://apollo-backend-8hp4.onrender.com/api/auth/login", { email, password });
console.log("✅ Login Response:", res.data);
    localStorage.setItem("token", res.data.token);
    setUserInfo(res.data.user);
    setLoggedIn(true);
    setCurrentTab("dashboard");
    fetchTasks();
    fetchUsers();
    toast.success("Login successful");

  } catch (err) {
console.error("❌ Login Error:", err.response?.data || err.message);
  toast.error(err.response?.data?.message || "Login failed, please try again");
}
};

  const userRole = userInfo?.role; // e.g., "super_admin", "dept_admin", "executive"
const userDept = userInfo?.department;
const userId = userInfo?._id;


 


  const fetchTasks = async () => {
    try {
    const res = await axios.get("https://apollo-backend-8hp4.onrender.com/api/tasks", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}` // ✅ add this
  },
});

       setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
  if (currentTab === "dashboard" || currentTab === "settings") {
    fetchUsers();
  }
}, [currentTab]);


useEffect(() => {
  if (currentTab === "dashboard" && overdueTasks.length > 0) {
    toast.warn(`⚠️ You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}.`, {
      position: "top-right",
      autoClose: 4000,
    });
  }
}, [currentTab, overdueTasks]);



  const fetchUsers = async () => {
    try {
      const res = await axios.get("https://apollo-backend-8hp4.onrender.com/api/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const updateUserRole = async (userId) => {
    const newRole = roleChanges[userId];
    if (!newRole) return alert("Please select a role");

    try {
      await axios.put(`https://apollo-backend-8hp4.onrender.com/api/users/${userId}/role`, {
        role: newRole,
      });
      toast.success("Role updated successfully!");
      fetchUsers();
    } catch (err) {
      console.error("Error updating role:", err);
      toast.error("Failed to update role.");
    }
  };
const getStatusClass = (status, dueDate) => {
  if (status === "completed") return "completed";

  const today = new Date().setHours(0, 0, 0, 0);
  const taskDate = new Date(dueDate).setHours(0, 0, 0, 0);

  if (status === "pending" && taskDate < today) return "overdue";
  return "pending";
};
  
  const handleDateClick = (date) => {
    setSelectedDate(date);
    const formatted = date.toLocaleDateString("en-CA");
    const tasksForDate = tasks.filter(t => new Date(t.due_date).toLocaleDateString("en-CA") === formatted);
    setSelectedDayTasks(tasksForDate);
  };

  const reportTasks = reportDept === "All" ? tasks : tasks.filter(t => t.department === reportDept);
const filteredTasks = tasks
  .filter((task) => {
    // Super Admin: can see all tasks
    if (userInfo?.role === "super_admin") return true;

    // Dept Admin: see tasks from their department only
    if (userInfo?.role === "dept_admin") {
      return task.department === userInfo.department;
    }

    // Executive: see only tasks assigned to them
    if (userInfo?.role === "executive") {
      return task.assignedTo?._id === userInfo._id;
    }

    return false; // fallback for safety
  })
  .filter((task) => {
    // Existing filters: search, dept, category, date
    const titleMatch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    const deptMatch = deptFilter === "All" || task.department === deptFilter;
    const catMatch = catFilter === "All" || task.category === catFilter;

    const taskDate = new Date(task.dueDate);
    const fromDate = dueDateFrom ? new Date(dueDateFrom) : null;
    const toDate = dueDateTo ? new Date(dueDateTo) : null;

    const fromMatch = !fromDate || taskDate >= fromDate;
    const toMatch = !toDate || taskDate <= toDate;

    return titleMatch && deptMatch && catMatch && fromMatch && toMatch;
  });


  const downloadReport = () => {
    const reportElement = document.getElementById("report-section");
    html2canvas(reportElement).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Report_${reportDept}.pdf`);
    });
  };
const getStatusLabel = (status, dueDate) => {
  if (status === "completed") return "Completed";

  const today = new Date().setHours(0, 0, 0, 0);
  const taskDate = new Date(dueDate).setHours(0, 0, 0, 0);

  if (status === "pending" && taskDate < today) return "Overdue";
  return "Pending";
};

const fetchOverdueTasks = async () => {
  try {
   const res = await axios.get("https://apollo-backend-8hp4.onrender.com/api/tasks/overdue", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}` // ✅ add this
  },
});

    setOverdueTasks(res.data);
  } catch (err) {
    console.error("Failed to fetch overdue tasks:", err);
  }
};

useEffect(() => {
  const handleClickOutside = (event) => {
    if (bellRef.current && !bellRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);



// Call this during component load
useEffect(() => {
  fetchOverdueTasks();
}, []);

const fetchAuditLogs = async () => {
  try {
    const res = await axios.get("https://apollo-backend-8hp4.onrender.com/api/auditlogs");
    setAuditLogs(res.data);
  } catch (err) {
    console.error("❌ Failed to fetch audit logs", err);
  }
};

useEffect(() => {
  if (currentTab === "settings") {
    fetchAuditLogs();
  }
}, [currentTab]);




const handleCreateUser = async () => {
  const newUser = {
    name,
    email,
    password,
    department,
    role,
  };



  try {
    await axios.post( "https://apollo-backend-8hp4.onrender.com/api/auth/register", newUser);
    toast.success("User created successfully!");
    fetchUsers(); // If you're displaying the user list
    // Clear form fields if needed
    setName("");
    setEmail("");
    setPassword("");
    setDepartment("");
    setRole("");
  } catch (error) {
    console.error("❌ Error creating user:", error);
    toast.error("Failed to create user");
  }
};


  if (!loggedIn) {
  return (
    <div className="login-container">
      <div className="login-box">
        <img
  src="https://apollouniversity.edu.in/wp-content/uploads/2022/10/logo.png"
  alt="Apollo University Logo"
  onError={(e) => { e.target.style.display = "none"; }}
  style={{
    width: "160px",
    marginBottom: "20px",
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  }}
/>

        <h2 style={{ textAlign: "center", color: "#4c1d95", marginBottom: "12px" }}>
          Welcome to Apollo Complaince System
        </h2>
        <p style={{
  fontSize: "0.95rem",
  color: "#6b7280",
  marginTop: "-10px",
  marginBottom: "20px"
}}>
  Empowering Compliance Through Technology
</p>


        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin}>Login</button>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
      <footer className="formal-footer">
  <p>© 2025 The Apollo University | Compliance Division</p>
</footer>

    </div>
  );
}

  return (
   
  
    
  <div className="container formal-theme" style={{ position: "relative" }}>

      <h1 className="app-title formal-title">The Apollo University – Compliance Management System</h1>
      <div className="navbar formal-navbar">

        <button className={currentTab === "dashboard" ? "tab active formal-tab" : "tab formal-tab"} onClick={() => setCurrentTab("dashboard")}>📋 Dashboard</button>
        <button className={currentTab === "calendar" ? "tab active formal-tab" : "tab formal-tab"} onClick={() => setCurrentTab("calendar")}>📅 Calendar</button>
        <button className={currentTab === "reports" ? "tab active formal-tab" : "tab formal-tab"} onClick={() => setCurrentTab("reports")}>📊 Reports</button>
        {(userInfo?.role === "super_admin" || userInfo?.role === "dept_admin") && (
  <button
    className={currentTab === "settings" ? "tab active formal-tab" : "tab formal-tab"}
    onClick={() => setCurrentTab("settings")}
  >
    ⚙️ Settings
  </button>
)}

      </div>

      {userInfo && (
  <div style={{ position: "absolute", top: 20, right: 100, display: "flex", alignItems: "center", gap: "12px" }}>
    <button
      onClick={() => {
        localStorage.removeItem("token");
        setUserInfo(null);
        setLoggedIn(false);
        toast.info("Logged out successfully");
      }}
      className="logout-button"
    >
      🚪 Logout
    </button>
  </div>
)}






{userInfo && (
  <div ref={bellRef} style={{ position: "absolute", top: 20, right: 30, zIndex: 1000 }}>
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowDropdown(prev => !prev)}
        className={`bell-button ${overdueTasks.length > 0 ? "pulse" : ""}`}
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "24px"
        }}
      >
        🔔
        {overdueTasks.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              background: "#ef4444",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {overdueTasks.length}
          </span>
        )}
      </button>

      {showDropdown && overdueTasks.length > 0 && (
        <div className="notification-dropdown">
          <h4>⚠️ Overdue Tasks</h4>
          <ul>
            {overdueTasks.slice(0, 5).map((task, idx) => (
              <li key={idx}>{task.title}</li>
            ))}
          </ul>
          {overdueTasks.length > 5 && (
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>
              +{overdueTasks.length - 5} more...
            </p>
          )}
          <button
            onClick={() => {
              setCurrentTab("calendar");
              setShowDropdown(false);
            }}
            className="formal-btn small-btn"
            style={{ marginTop: "8px", padding: "6px 12px" }}
          >
            View in Calendar
          </button>
        </div>
      )}

     

    </div>
  </div>
)}





      {currentTab === "dashboard" && (
        <div className="dashboard-section formal-section">
          <h2>📋 Dashboard</h2>
<p>This section will display all your department’s tasks, task creation form, and task status management. You can add a task, mark it completed, or delete it.</p>
{(userInfo?.role === "super_admin" || userInfo?.role === "dept_admin") && (
<div className="task-form">

  <h3>Add New Task</h3>
  <input
    type="text"
    placeholder="Title"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
  />
  <input
    type="text"
    placeholder="Description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
  />
  <input
  type="file"
  onChange={(e) => setFile(e.target.files[0])}
  className="formal-input"
/>

  <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
    <option value="">Select a User</option>
    {users.map(user => (
      <option key={user._id} value={user._id}>
        {user.name} ({user.department})
      </option>
    ))}
  </select>
  <select value={department} onChange={(e) => setDepartment(e.target.value)}>
    <option value="Finance">Finance</option>
    <option value="IT">IT</option>
    <option value="Admin">Admin</option>
  </select>
  <select value={category} onChange={(e) => setCategory(e.target.value)}>
    <option value="Internal">Internal</option>
    <option value="External">External</option>
  </select>
  <input
    type="date"
    value={dueDate}
    onChange={(e) => setDueDate(e.target.value)}
  />
  <button
    onClick={async () => {
      if (!title || !description || !assignedTo || !dueDate) {
        toast.error("Please fill all fields");
        return;
      }
      try {
       const formData = new FormData();
formData.append("title", title);
formData.append("description", description);
formData.append("department", department);
formData.append("category", category);
formData.append("dueDate", dueDate);
formData.append("assignedTo", assignedTo);
formData.append("createdBy", userInfo._id);  // ✅ NEW

if (file) formData.append("file", file);
await axios.post("https://apollo-backend-8hp4.onrender.com/api/tasks", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${localStorage.getItem("token")}` // ✅ add this line
  },
});


        setTitle("");
        setDescription("");
        setAssignedTo("");
        setDepartment("Finance");
        setCategory("Internal");
        setDueDate("");
        fetchTasks();
        toast.success("Task added successfully!");
      } catch (err) {
        toast.error("Failed to add task");
      }
    }}
  >
    Add Task
  </button>
</div>
)}




          <div className="task-list">
            <h3>Task List</h3>
           


<div className="filter-bar">
  <label>
    🔍 Search:
    <input
      type="text"
      placeholder="Enter title or description"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </label>

  <label>
    🏢 Department:
    <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
      <option value="All">All</option>
      <option value="Finance">Finance</option>
      <option value="IT">IT</option>
      <option value="Admin">Admin</option>
    </select>
  </label>

  <label>
    🗂️ Category:
    <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
      <option value="All">All</option>
      <option value="Internal">Internal</option>
      <option value="External">External</option>
    </select>
  </label>

  <label>
    📅 Due Date From:
    <input
      type="date"
      value={dueDateFrom}
      onChange={(e) => setDueDateFrom(e.target.value)}
    />
  </label>

  <label>
    📅 To:
    <input
      type="date"
      value={dueDateTo}
      onChange={(e) => setDueDateTo(e.target.value)}
    />
  </label>
</div>
 <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Assigned To</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th>Due Date</th>
                 
                  <th>Status</th>
                   <th>Attachment</th>
                  
                  <th>Actions</th>
                  

                </tr>
              </thead>


   
          <tbody>
  
    
   {filteredTasks.map((task) => (
      <tr key={task._id}>
        <td>{task.title}</td>
        <td>{task.description}</td>
        <td>{task.assignedTo?.name || "—"}</td>
        <td>{task.department}</td>
        <td>{task.category}</td>
        <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN") : "—"}</td>
        <td>
          <span className={`status ${getStatusClass(task.status, task.dueDate)}`}>
            {getStatusLabel(task.status, task.dueDate)}
          </span>
        </td>
        <td>
  {task.file ? (
    <a
      href={`https://apollo-backend-8hp4.onrender.com/uploads/${task.file}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#4c1d95", fontWeight: 500 }}
    >
      📎 Download
    </a>
  ) : (
    "—"
  )}
</td>

        <td>
          {task.status !== "completed" && (
            userInfo?.role === "super_admin" || userInfo?.role === "dept_admin") && (
            <button
              className="complete-btn"
              onClick={async () => {
                try {
                 await axios.put(`https://apollo-backend-8hp4.onrender.com/api/tasks/${task._id}/status`, {
  status: "completed",
  updatedBy: userInfo._id,  // ✅ Add this
}, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
});
                  fetchTasks();
                  toast.success("Task marked as completed!");
                } catch (err) {
                  toast.error("Failed to update status");
                }
              }}
            >
              ✅ Complete
            </button>
          )}
          {userInfo?.role === "super_admin" && (
          <button
            className="delete-btn"
            onClick={async () => {
              if (!window.confirm("Are you sure you want to delete this task?")) return;
              try {
                await axios.delete(`https://apollo-backend-8hp4.onrender.com/api/tasks/${task._id}`, {
  data: { performedBy: userInfo._id },  // ✅ Add this
headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
});

                fetchTasks();
                toast.success("Task deleted!");
              } catch (err) {
                toast.error("Failed to delete task");
              }
            }}
          >
            🗑️ Delete
          </button>
          )}
        </td>
      </tr>
    ))}
</tbody>


            </table>
          </div>
          
        </div>
      )}
{currentTab === "calendar" && (
  <div className="calendar-section formal-section">
    <h2>📅 Calendar</h2>

    <Calendar
      value={selectedDate}
      onChange={(date) => {
        setSelectedDate(date);

        const selected = date.toLocaleDateString("en-CA");
        const filtered = tasks.filter(
          (t) => new Date(t.dueDate).toLocaleDateString("en-CA") === selected
        );
        setSelectedDayTasks(filtered);
      }}
      tileContent={({ date }) => {
        const formatted = date.toLocaleDateString("en-CA");
        const tasksForDate = tasks.filter(
          (task) =>
            new Date(task.dueDate).toLocaleDateString("en-CA") === formatted
        );

        if (tasksForDate.length === 0) return null;

        return (
          <div>
            {tasksForDate.slice(0, 2).map((task, i) => (
              <div
                key={i}
                className={`calendar-task-label ${getStatusClass(task.status, task.dueDate)}`}
                title={task.title}
              >
                {task.title.length > 12 ? task.title.slice(0, 12) + "..." : task.title}
              </div>
            ))}
            {tasksForDate.length > 2 && (
              <div className="calendar-task-label">+{tasksForDate.length - 2} more</div>
            )}
          </div>
        );
      }}
      className="custom-calendar"
    />

    {selectedDayTasks.length > 0 && (
      <div className="day-task-list">
        <h3>Tasks for {selectedDate.toDateString()}</h3>
        <ul>
          {selectedDayTasks.map((task, index) => (
            <li key={index} className={getStatusClass(task.status, task.dueDate)}>
              <strong>{task.title}</strong> ({getStatusLabel(task.status, task.dueDate)})
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}



{currentTab === "reports" && (
  <div className="reports-section formal-section">
    <h2 className="formal-heading">📊 Reports</h2>

    <div style={{ marginBottom: "18px", display: "flex", alignItems: "center", gap: "20px" }}>
      <label className="formal-label">
        Department:
        <select
          value={reportDept}
          onChange={(e) => setReportDept(e.target.value)}
          className="formal-input"
          style={{ marginLeft: "8px" }}
        >
          <option value="All">All</option>
          <option value="Finance">Finance</option>
          <option value="IT">IT</option>
          <option value="Admin">Admin</option>
        </select>
      </label>
      <button onClick={downloadReport} className="formal-btn">Download Report</button>
    </div>

    <div id="report-section">
      <div className="report-cards">
        <div className="report-card">📋 Total: {reportTasks.length}</div>
        <div className="report-card" style={{ borderLeftColor: "#10b981" }}>
          ✅ Completed: {reportTasks.filter(t => t.status === "completed").length}
        </div>
      <div className="report-card" style={{ borderLeftColor: "#f59e0b" }}>
  ⏳ Pending: {
    reportTasks.filter(t => {
      const today = new Date().setHours(0, 0, 0, 0);
      return t.status === "pending" && new Date(t.dueDate).setHours(0, 0, 0, 0) >= today;
    }).length
  }
</div>

<div className="report-card" style={{ borderLeftColor: "#ef4444" }}>
  ⚠️ Overdue: {
    reportTasks.filter(t => {
      const today = new Date().setHours(0, 0, 0, 0);
      return t.status === "pending" && new Date(t.dueDate).setHours(0, 0, 0, 0) < today;
    }).length
  }
</div>

      </div>

      <div className="formal-card" style={{ marginBottom: "24px" }}>
        <h4 style={{ color: "#4c1d95" }}>📊 Task Status Overview</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
           <Pie data={[
  {
    name: "Completed",
    value: reportTasks.filter(t => t.status === "completed").length
  },
  {
    name: "Pending",
    value: reportTasks.filter(t => {
      const today = new Date().setHours(0, 0, 0, 0);
      return t.status === "pending" && new Date(t.dueDate).setHours(0, 0, 0, 0) >= today;
    }).length
  },
  {
    name: "Overdue",
    value: reportTasks.filter(t => {
      const today = new Date().setHours(0, 0, 0, 0);
      return t.status === "pending" && new Date(t.dueDate).setHours(0, 0, 0, 0) < today;
    }).length
  }
]} cx="50%" cy="50%" outerRadius={80} label dataKey="value">
  <Cell fill="#10b981" />
  <Cell fill="#f59e0b" />
  <Cell fill="#ef4444" />
</Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="formal-card">
        <h4 style={{ color: "#4c1d95" }}>🏢 Department-wise Task Count</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              { name: "Finance", value: tasks.filter(t => t.department === "Finance").length },
              { name: "IT", value: tasks.filter(t => t.department === "IT").length },
              { name: "Admin", value: tasks.filter(t => t.department === "Admin").length }
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
)}

      

     {currentTab === "settings" && (userInfo?.role === "super_admin" || userInfo?.role === "dept_admin") && (
  <div className="settings-section formal-section">
          <h2 className="formal-heading">⚙️ Settings</h2>

          <div className="formal-card" style={{ marginBottom: "24px" }}>
            <h3 className="formal-subheading">Create New User</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!email || !password || !department || !roleChanges["newUser"] || !title) {
                  toast.error("Please fill all fields");
                  return;
                }
                try {
                  await axios.post("https://apollo-backend-8hp4.onrender.com/api/users", {

                    name: title,
                    email,
                    password,
                    department,
                    role: roleChanges["newUser"],
                  });
                  setTitle("");
                  setEmail("");
                  setPassword("");
                  setDepartment("Finance");
                  setRoleChanges({ ...roleChanges, newUser: "" });
                  fetchUsers();
                  toast.success("User created successfully!");
                } catch (error) {
                  console.log("❌ Error creating user:", error.response?.data || error.message);
  toast.error(error.response?.data?.message || "Failed to create user");
}
              }}
              style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}
            >
              <input
                type="text"
                placeholder="Name"
                value={title}
                className="formal-input"
                onChange={(e) => setTitle(e.target.value)}
                style={{ minWidth: "120px" }}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                className="formal-input"
                onChange={(e) => setEmail(e.target.value)}
                style={{ minWidth: "180px" }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                className="formal-input"
                onChange={(e) => setPassword(e.target.value)}
                style={{ minWidth: "120px" }}
              />
              <select
                value={department}
                className="formal-input"
                onChange={(e) => setDepartment(e.target.value)}
                style={{ minWidth: "110px" }}
              >
                <option value="Finance">Finance</option>
                <option value="IT">IT</option>
                <option value="Admin">Admin</option>
              </select>
              <select
                value={roleChanges["newUser"] || ""}
                className="formal-input"
                onChange={(e) =>
                  setRoleChanges({
                    ...roleChanges,
                    newUser: e.target.value,
                  })
                }
                style={{ minWidth: "120px" }}
              >
                <option value="">Select Role</option>
                <option value="super_admin">Super Admin</option>
                <option value="dept_admin">Dept Admin</option>
                <option value="executive">Executive</option>
              </select>
              <button type="submit" className="formal-btn">Create User</button>
            </form>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="dept-filter" className="formal-label"><strong>Filter by Department:</strong> </label>
            <select
              id="dept-filter"
              value={userDeptFilter}
              className="formal-input"
              onChange={(e) => setUserDeptFilter(e.target.value)}
              style={{ marginLeft: "10px", padding: "6px", borderRadius: "6px", border: "1px solid #ccc" }}
            >
              <option value="All">All</option>
              <option value="Finance">Finance</option>
              <option value="IT">IT</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <h3 className="formal-subheading">User Role Management</h3>
          <table className="settings-table formal-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Current Role</th>
                <th>Change Role</th>
                <th>Save</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(user => userDeptFilter === "All" || user.department === userDeptFilter)
                .map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.department}</td>
                    <td>{user.role}</td>
                    <td>
                      <select
                        value={roleChanges[user._id] || user.role}
                        className="formal-input"
                        onChange={(e) =>
                          setRoleChanges({
                            ...roleChanges,
                            [user._id]: e.target.value,
                          })
                        }
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="dept_admin">Dept Admin</option>
                        <option value="executive">Executive</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="formal-btn"
                        onClick={() => updateUserRole(user._id)}
                      >
                        Save
                      </button>
                    </td>
                    <td>
                      {user.role !== "super_admin" ? (
                        <button
                          className="formal-delete-btn"
                          onClick={async () => {
                            if (!window.confirm("Are you sure you want to delete this user?")) return;
                            try {
                              await axios.delete(`https://apollo-backend-8hp4.onrender.com/api/users/${user._id}`);
                              fetchUsers();
                              toast.success("User deleted!");
                            } catch (err) {
                              toast.error("Failed to delete user");
                            }
                          }}
                        >
                          Delete
                        </button>
                      ) : (
                        <span style={{ color: "#a1a1aa", fontWeight: 500 }}>Not allowed</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
           <h3 className="formal-subheading">📝 Audit Logs</h3>
  <table className="formal-table">
    <thead>
      <tr>
        <th>Time</th>
        <th>Action</th>
        <th>Performed By</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      {auditLogs.map((log) => (
        <tr key={log._id}>
          <td>{new Date(log.timestamp).toLocaleString()}</td>
          <td>{log.action}</td>
         <td>{log.performedBy?.name || "Unknown"}</td>

          <td>{log.details}</td>
        </tr>
      ))}
    </tbody>
  </table>
        </div>
        
      )}

      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        .formal-theme {
          background: linear-gradient(135deg, #f5f7fa 0%, #e0e7ff 100%);
          min-height: 100vh;
          font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
        }
        .formal-title {
          color: #4c1d95;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 18px;
          text-align: center;
        }
        .formal-navbar {
          display: flex;
          justify-content: center;
          gap: 18px;
          margin-bottom: 32px;
        }
        .formal-tab {
          background: #ede9fe;
          color: #4c1d95;
          border: none;
          padding: 10px 28px;
          border-radius: 8px 8px 0 0;
          font-weight: 500;
          font-size: 1rem;
          transition: background 0.2s, color 0.2s;
        }
        .formal-tab.active, .formal-tab:hover {
          background: #7c3aed;
          color: #fff;
        }
        .formal-section {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 16px 0 #c7d2fe33;
          padding: 32px 24px;
          margin-bottom: 32px;
        }
        .formal-card {
          background: #f1f5f9;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 1px 6px 0 #c7d2fe22;
        }
        .formal-heading {
          color: #4c1d95;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .formal-subheading {
          color: #7c3aed;
          font-weight: 500;
          margin-bottom: 10px;
        }
        .formal-desc {
          color: #334155;
          margin-bottom: 18px;
        }
        .formal-input {
          border: 1px solid #a5b4fc;
          border-radius: 6px;
          padding: 8px 12px;
          margin-right: 8px;
          margin-bottom: 8px;
          font-size: 1rem;
          background: #fff;
          color: #3730a3;
          outline: none;
          transition: border 0.2s;
        }
        .formal-input:focus {
          border: 1.5px solid #7c3aed;
        }
        .formal-btn {
          background: linear-gradient(90deg, #7c3aed 60%, #38bdf8 100%);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 8px 18px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          margin-right: 6px;
          transition: background 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 4px 0 #7c3aed22;
        }
        .formal-btn:hover {
          background: linear-gradient(90deg, #4c1d95 60%, #0ea5e9 100%);
        }
        .formal-delete-btn {
          background: #ef4444 !important;
          color: #fff !important;
          border: none;
          margin-left: 6px;
          padding: 8px 18px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .formal-delete-btn:hover {
          background: #b91c1c !important;
        }
        .formal-table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
        }
        .formal-table th, .formal-table td {
          border: 1px solid #e0e7ff;
          padding: 10px 8px;
          text-align: left;
        }
        .formal-table th {
          background: #ede9fe;
          color: #4c1d95;
          font-weight: 600;
        }
        .formal-table tr:nth-child(even) {
          background: #f3f4f6;
        }
        .status.completed {
          color: #10b981;
          font-weight: 600;
        }
        .status.pending {
          color: #7c3aed;
          font-weight: 600;
        }
        .status.overdue {
          color: #ef4444;
          font-weight: 600;
        }
        .formal-label {
          color: #4c1d95;
          font-weight: 500;
          margin-right: 8px;
        }
        .formal-calendar {
          border-radius: 10px;
          border: 1px solid #a5b4fc;
          box-shadow: 0 1px 8px 0 #7c3aed22;
          margin-bottom: 18px;
        }
        .calendar-task-label {
          font-size: 0.8em;
          margin-top: 2px;
          padding: 2px 6px;
          border-radius: 4px;
          background: #ede9fe;
          color: #4c1d95;
        }
        .calendar-task-label.completed {
          background: #d1fae5;
          color: #065f46;
        }
        .calendar-task-label.overdue {
          background: #fee2e2;
          color: #b91c1c;
        }
        .calendar-task-label.pending {
          background: #ede9fe;
          color: #4c1d95;
        }
        @media (max-width: 900px) {
          .formal-section, .formal-card {
            padding: 16px 6px;
          }
          .formal-table th, .formal-table td {
            padding: 6px 4px;
          }
        }
      `}</style>
    </div>
  );
}

export default App;

