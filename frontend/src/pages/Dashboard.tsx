import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/utils/auth";
import Layout from "@/components/Layout";
import LeaveRequestForm from "@/components/LeaveRequestForm";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLeaveRequestSuccess = () => {
    // Refresh leave list when a new request is submitted
  };

  return (
    <Layout>
      <div className="space-y-6">
        <LeaveRequestForm onSuccess={handleLeaveRequestSuccess} />
      </div>
    </Layout>
  );
};

export default Dashboard;
