import { getCurrentUser } from "@/utils/auth";
import Layout from "@/components/Layout";
import LeaveRequestForm from "@/components/LeaveRequestForm";

const ManagerDashboard = () => {
  const user = getCurrentUser();

  const handleLeaveUpdate = () => {
    // Refresh components when a leave status is updated
  };

  return (
    <Layout>
      <div className="space-y-6 ">
        <LeaveRequestForm onSuccess={handleLeaveUpdate} />
      </div>
    </Layout>
  );
};

export default ManagerDashboard;
