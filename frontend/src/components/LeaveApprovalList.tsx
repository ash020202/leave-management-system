/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  LeaveRequest,
  trackLeaveHistory,
  getManagerApprovedRejLeaves,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Loader from "./Loader";
import LeaveHistoryTracker from "./LeaveHistoryTracker";

const LeaveApprovalList = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedLeaveHistory, setSelectedLeaveHistory] = useState<any[]>([]);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const user = getCurrentUser();
  console.log("user", typeof user.empId);

  const fetchLeaves = async () => {
    if (!user?.empId) return;

    setIsLoading(true);
    try {
      const data = await getManagerApprovedRejLeaves(user.empId);
      setLeaves(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching team leaves:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleTrack = async (leave_req_id: string) => {
    try {
      const data = await trackLeaveHistory(leave_req_id);
      // console.log(data);
      setSelectedLeaveHistory(data);
      setSelectedEmployeeName(user.emp_name);
      setIsHistoryOpen(true);
    } catch (error) {
      console.log(error);
    }
  };

  const filteredLeaves = Array.isArray(leaves)
    ? leaves.filter((leave) => {
        if (filter === "all") return true;
        if (filter === "pending") return leave?.status === "PENDING";
        if (filter === "approved") return leave?.status === "APPROVED";
        if (filter === "rejected") return leave?.status === "REJECTED";
        return true;
      })
    : [];

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
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const getLeaveTypeBadge = (leaveType: string) => {
    switch (leaveType) {
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>My Team Leave Requests</CardTitle>
            <CardDescription>Manage your team's leave requests</CardDescription>
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
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader />
          ) : filteredLeaves.length === 0 ? (
            <div className="flex justify-center py-6">
              <p className="text-muted-foreground">No leave requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Track Leave</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaves.map((leave) => (
                  <TableRow key={leave.leave_req_id}>
                    <TableCell className="font-medium">
                      {leave.emp_name}
                    </TableCell>
                    <TableCell>{getLeaveTypeBadge(leave.leave_type)}</TableCell>
                    <TableCell>
                      {format(parseISO(leave.from_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(leave.to_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] truncate"
                      title={leave.reason}
                    >
                      {leave.reason}
                    </TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>

                    <TableCell>
                      <button
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        onClick={() => handleTrack(leave.leave_req_id)}
                      >
                        track
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <LeaveHistoryTracker
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        leaveHistory={selectedLeaveHistory}
        employeeName={selectedEmployeeName}
      />
    </>
  );
};

export default LeaveApprovalList;
