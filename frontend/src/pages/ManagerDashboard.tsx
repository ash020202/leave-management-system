import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/utils/auth";
import Layout from "@/components/Layout";
import LeaveApprovalList from "@/components/LeaveApprovalList";
import LeaveCalendar from "@/components/LeaveCalendar";
import LeaveRequestForm from "@/components/LeaveRequestForm";
import LeaveBalanceCard from "@/components/LeaveBalanceCard";
import LeaveList from "@/components/LeaveList";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Redirect non-managers to employee dashboard
  // useEffect(() => {
  //   if (user && !(user.role === "MANAGER" || user.role === "SENIOR_MANAGER")) {
  //     navigate("/dashboard");
  //   }
  // }, [user, navigate]);

  const handleLeaveUpdate = () => {
    // Refresh components when a leave status is updated
  };

  return (
    <Layout>
      <div className="space-y-6 ">
        <div>
          <h1 className="text-3xl font-bold flex gap-1">
            Welcome,{" "}
            <Link to="/profile">
              <p className="">{user?.emp_name}</p>
            </Link>
          </h1>
          {/* <div className="flex gap-2">
            <p className="text-muted-foreground">
              Employee ID:
              <b> {user?.empId}</b>
            </p>
            <p className="text-muted-foreground">
              Role:
              <b> {user?.role}</b>
            </p>
          </div> */}
        </div>
        <div>
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your team's leave requests
          </p>
        </div>

        <div className="flex flex-col justify-start p-2 gap-6">
          <div className="flex items-start gap-2">
            <LeaveRequestForm onSuccess={handleLeaveUpdate} />
            <LeaveBalanceCard />
          </div>
          <LeaveApprovalList onUpdate={handleLeaveUpdate} />
          <LeaveList />
          {/* <LeaveCalendar /> */}
        </div>
      </div>
    </Layout>
  );
};

export default ManagerDashboard;
