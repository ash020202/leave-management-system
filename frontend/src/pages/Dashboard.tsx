import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/utils/auth";
import Layout from "@/components/Layout";
import LeaveRequestForm from "@/components/LeaveRequestForm";
import LeaveBalanceCard from "@/components/LeaveBalanceCard";
import LeaveList from "@/components/LeaveList";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Redirect managers to manager dashboard
  // useEffect(() => {
  //   if (user && (user.role === "MANAGER" || user.role === "SENIOR_MANAGER")) {
  //     navigate("/manager-dashboard");
  //   }
  // }, [user]);

  const handleLeaveRequestSuccess = () => {
    // Refresh leave list when a new request is submitted
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome, <Link to="/profile">{user?.emp_name}</Link>
          </h1>
          <p className="text-muted-foreground font-semibold">
            Employee ID: {user?.empId}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex gap-3 justify-between items-start">
            <LeaveRequestForm onSuccess={handleLeaveRequestSuccess} />
            <LeaveBalanceCard />
          </div>

          <div>
            <LeaveList onUpdate={handleLeaveRequestSuccess} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
