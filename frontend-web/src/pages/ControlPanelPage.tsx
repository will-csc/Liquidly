import { Outlet } from "react-router-dom";
import ControlPanelNav from "@/components/ControlPanelNav";

const ControlPanelPage = () => {
  const isWide = true; // Always wide for now based on previous logic

  return (
    <div className="h-screen flex flex-col items-center p-4 bg-background overflow-hidden">
      <div className={`w-full h-full flex flex-col transition-all duration-300 ${isWide ? "max-w-6xl" : "max-w-2xl"}`}>
        <ControlPanelNav />

        {/* Content */}
        <div className="w-full flex-1 overflow-y-auto min-h-0 rounded-xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ControlPanelPage;
