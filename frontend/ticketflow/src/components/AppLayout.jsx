import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout({ children }) {
  return (
    <div className="dashboard-shell ticket-module-shell">
      <Sidebar />
      <div className="dashboard-main">
        <Topbar />
        <main className="dashboard-content ticket-module-content">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
