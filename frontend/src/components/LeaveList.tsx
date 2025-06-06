/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  LeaveRequest,
  getUserLeaves,
  cancelLeave,
  trackLeaveHistory,
} from "@/services/api";
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
import LeaveHistoryTracker from "./LeaveHistoryTracker";

interface LeaveListProps {
  onUpdate?: () => void;
}

const LeaveList = ({ onUpdate }: LeaveListProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedLeaveHistory, setSelectedLeaveHistory] = useState<any[]>([]);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");

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

  const handleTrack = async (leave_req_id: string) => {
    try {
      const data = await trackLeaveHistory(leave_req_id);
      setSelectedLeaveHistory(data);
      setSelectedEmployeeName(user.emp_name);
      setIsHistoryOpen(true);
    } catch (error) {
      console.log(error);
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
      case "PENDING_SENIOR_MANAGER":
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

  // Check if any leave has rejection reason to show Actions column
  const hasRejectedLeave = filteredLeaves.some(
    (leave) => leave.status === "REJECTED" && leave.rejection_reason
  );

  // Check if any leave can be cancelled to show Cancel button column
  const hasCancellableLeave = filteredLeaves.some(
    (leave) =>
      leave.status === "PENDING" || leave.status === "PENDING_SENIOR_MANAGER"
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
              {hasRejectedLeave && (
                <div className="w-1/6">Rejection Reason</div>
              )}
              {hasCancellableLeave && <div className="w-1/6">Actions</div>}
              <div className="w-1/6">Track Leave</div>
            </div>

            {/* Body */}
            <div className="flex flex-col w-full max-h-[350px] overflow-y-auto">
              {filteredLeaves.map((leave) => (
                <div
                  key={leave.leave_req_id}
                  className="flex items-center border-b py-2 text-sm min-h-[50px]"
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

                  <div className="w-1/6 flex items-center h-full">
                    <p
                      title={leave.approved_by}
                      className="text-[10px] truncate font-semibold text-center break-words"
                    >
                      {leave.approved_by || "-"}
                    </p>
                  </div>

                  {/* Rejection Reason Column - Only show if there are rejected leaves */}
                  {hasRejectedLeave && (
                    <div className="w-1/6 flex items-center h-full">
                      {leave.status === "REJECTED" && leave.rejection_reason ? (
                        <span className="text-muted-foreground text-xs break-words">
                          {leave.rejection_reason}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs text-center ml-7">
                          -
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions Column - Only show if there are cancellable leaves */}
                  {hasCancellableLeave && (
                    <div className="w-1/6 flex items-center h-full">
                      {leave.status === "PENDING" ||
                      leave.status === "PENDING_SENIOR_MANAGER" ? (
                        <button
                          className="text-white text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700"
                          onClick={() => handleCancelLeave(leave?.leave_req_id)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  )}

                  {/* Track Leave Column - Always show */}
                  <div className="w-1/6 flex items-center h-full">
                    <button
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      onClick={() => handleTrack(leave.leave_req_id)}
                    >
                      track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <LeaveHistoryTracker
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        leaveHistory={selectedLeaveHistory}
        employeeName={selectedEmployeeName}
      />
    </Card>
  );
};

export default LeaveList;
