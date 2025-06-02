import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { LeaveRequest, getUserLeaves, cancelLeave } from "@/services/api";
import { getCurrentUser } from "@/utils/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import Loader from "./Loader";

interface LeaveListProps {
  onUpdate?: () => void;
}

const LeaveList = ({ onUpdate }: LeaveListProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  // console.log(leaves);

  const [filter, setFilter] = useState<string>("all");
  const user = getCurrentUser();

  const fetchLeaves = async () => {
    if (user?.empId) {
      setIsLoading(true);
      try {
        const data = await getUserLeaves(user.empId);
        setLeaves(data);
      } catch (error) {
        console.error("Error fetching leaves:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [user?.empId]);

  const handleCancelLeave = async (leaveId: string) => {
    if (!user?.empId) return;

    try {
      console.log(leaveId);
      await cancelLeave(user.empId, leaveId);
      fetchLeaves();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error canceling leave:", error);
    }
  };

  const filteredLeaves = leaves.filter((leave) => {
    if (filter === "all") return true;
    if (filter === "pending") return leave.status === "PENDING";
    if (filter === "approved") return leave.status === "APPROVED";
    if (filter === "rejected") return leave.status === "REJECTED";
    if (filter === "cancelled") return leave.status === "CANCELLED";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Approved
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "PENDING":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500">
            Pending
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const getLeaveTypeBadge = (leaveType: string) => {
    switch (leaveType.toLowerCase()) {
      case "sick_leave":
        return <Badge className="leave-sick">Sick Leave</Badge>;
      case "earned_leave":
        return <Badge className="leave-earned">Earned Leave</Badge>;
      case "floater_leave":
        return <Badge className="leave-floater">Floater Leave</Badge>;
      case "loss_of_pay":
        return <Badge className="leave-loss-pay">Loss of Pay</Badge>;
      default:
        return null;
    }
  };

  const hasRejectedLeave = filteredLeaves.some(
    (leave) => leave.status === "REJECTED" && leave.rejection_reason
  );
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>My Leave History</CardTitle>
          <CardDescription>
            Your leave requests and their status
          </CardDescription>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader />
        ) : filteredLeaves.length === 0 ? (
          <div className="flex justify-center py-6">
            <p className="text-muted-foreground">No leave records found</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Header */}
            <div className="flex font-medium border-b py-2">
              <div className="w-1/6">Type</div>
              <div className="w-1/6">From</div>
              <div className="w-1/6">To</div>
              <div className="w-1/6">Status</div>
              <div className="w-1/6">Approver</div>
              <div className="w-1/6">Actions</div>
            </div>

            {/* Body */}
            <div className="flex flex-col w-full max-h-[350px] overflow-y-auto">
              {filteredLeaves.map((leave) => (
                <div
                  key={leave.leave_req_id}
                  className="flex items-start border-b py-2 text-sm min-h-[80px]"
                >
                  <div className="w-1/6 flex items-center h-full">
                    {getLeaveTypeBadge(leave.leave_type)}
                  </div>

                  <div className="w-1/6 flex items-center h-full">
                    {format(parseISO(leave.from_date), "MMM dd, yyyy")}
                  </div>

                  <div className="w-1/6 flex items-center h-full">
                    {format(parseISO(leave.to_date), "MMM dd, yyyy")}
                  </div>

                  <div className="w-1/6 flex items-center h-full">
                    {getStatusBadge(leave.status)}
                  </div>

                  <div className="w-1/6 flex flex-col justify-center">
                    <p className="text-[10px] font-semibold text-left break-words">
                      {leave.approved_by}
                    </p>
                    {leave.status === "REJECTED" && leave.rejection_reason && (
                      <span className="text-muted-foreground text-xs mt-1 break-words">
                        Reason: {leave.rejection_reason}
                      </span>
                    )}
                  </div>

                  <div className="w-1/6 flex items-center h-full">
                    {(leave.status === "CANCELLED" ||
                      leave.status === "PENDING") && (
                      <button
                        className={`text-white text-xs px-3 py-1 rounded ${
                          leave.status === "CANCELLED"
                            ? "bg-gray-500 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                        disabled={leave.status === "CANCELLED"}
                        onClick={() => handleCancelLeave(leave?.leave_req_id)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveList;
