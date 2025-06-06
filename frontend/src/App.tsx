import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import CalendarView from "./pages/CalendarView";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import LeaveApprovalList from "./components/LeaveApprovalList";
import LeaveList from "./components/LeaveList";
import Layout from "./components/Layout";

const queryClient = new QueryClient();
const handleLeaveRequestSuccess = () => {
  // Refresh leave list when a new request is submitted
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* <Route path="/" element={<Index />} /> */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute requiredRoles={["MANAGER", "SENIOR_MANAGER"]}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute requiredRoles={["MANAGER", "SENIOR_MANAGER"]}>
                <CalendarView />
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/my-team-leaves"
            element={
              <ProtectedRoute requiredRoles={["MANAGER", "SENIOR_MANAGER"]}>
                <Layout>
                  <LeaveApprovalList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="leave-history"
            element={
              <Layout>
                <LeaveList onUpdate={handleLeaveRequestSuccess} />
              </Layout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
