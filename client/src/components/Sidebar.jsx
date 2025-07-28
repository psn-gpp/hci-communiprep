import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({activeMenu, onMenuClick, name, onToggleSidebar }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    onToggleSidebar();
  };

  return (
    <aside
      id="sidebar-wrapper"
      className={`${isSidebarOpen ? "expanded" : "collapsed"}`}

    >

      <div className="sidebar-heading text-center">
        <button
          id="toggleMenuButton"
          className="btn"
          onClick={toggleSidebar}
        >
          <i className="bi bi-list"></i>
        </button>

        <div
          className="avatar mx-auto"

        >
          <img
            src="/user.svg"
            alt="User Avatar"
          />
        </div>

        <p id="username"> {isSidebarOpen ? name : ''}</p>
      </div>

      <div className="list-group list-group-flush">
        <Link
          to="/"
          className={`list-group-item list-group-item-action ${activeMenu === "/" ? "active" : ""}`}
          onClick={() => onMenuClick("/")}
        >
          <i className="bi bi-house-door me-2"></i>
          {isSidebarOpen && "Homepage"}
        </Link>
        <Link
          to="/my-interviews"
          className={`list-group-item list-group-item-action ${activeMenu === "/my-interviews" ? "active" : ""}`}
          onClick={() => onMenuClick("/my-interviews")}
        >
          <i className="bi bi-journal-text me-2"></i>
          {isSidebarOpen && "My Interviews"}
        </Link>
        <Link
          to="/contribution"
          className={`list-group-item list-group-item-action ${activeMenu === "/contribution" ? "active" : ""}`}
          onClick={() => onMenuClick("/contribution")}
        >
          <i className="bi bi-person-lines-fill me-2"></i>
          {isSidebarOpen && "Contribution"}
        </Link>
      </div>
    </aside>

  );
};


export default Sidebar;
