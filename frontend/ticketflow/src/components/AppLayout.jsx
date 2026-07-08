import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("mobile-nav-open", isSidebarOpen);
    return () => document.body.classList.remove("mobile-nav-open");
  }, [isSidebarOpen]);

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className={`dashboard-shell ticket-module-shell${isSidebarOpen ? " sidebar-drawer-open" : ""}`}>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} onNavigate={closeSidebar} />
      <button className="sidebar-overlay" type="button" aria-label="Close navigation menu" onClick={closeSidebar} />
      <div className="dashboard-main">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="dashboard-content ticket-module-content">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
