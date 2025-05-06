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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LeaveListProps {
  onUpdate?: () => void;
}

const LeaveList = ({ onUpdate }: LeaveListProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([
    // {
    //   leave_req_id: "1",
    //   emp_id: "EMP001",
    //   leave_type: "sick_leave",
    //   from_date: "2025-05-01",
    //   to_date: "2025-05-02",
    //   reason: "Fever",
    //   status: "PENDING",
    //   created_at: "2025-04-25T10:00:00Z",
    //   emp_name: "Vimal",
    // },
    // {
    //   leave_req_id: "2",
    //   emp_id: "EMP001",
    //   leave_type: "earned_leave",
    //   from_date: "2025-04-10",
    //   to_date: "2025-04-12",
    //   reason: "Family function",
    //   status: "APPROVED",
    //   created_at: "2025-04-01T10:00:00Z",
    //   emp_name: "Vimal",
    // },
    // {
    //   leave_req_id: "3",
    //   emp_id: "EMP001",
    //   leave_type: "floater_leave",
    //   from_date: "2025-03-15",
    //   to_date: "2025-03-15",
    //   reason: "Festival",
    //   status: "REJECTED",
    //   rejection_reason: "Insufficient balance",
    //   created_at: "2025-03-10T10:00:00Z",
    //   emp_name: "Vimal",
    // },
    // {
    //   leave_req_id: "4",
    //   emp_id: "EMP001",
    //   leave_type: "loss_of_pay",
    //   from_date: "2025-02-01",
    //   to_date: "2025-02-03",
    //   reason: "Emergency leave",
    //   status: "CANCELLED",
    //   created_at: "2025-01-30T10:00:00Z",
    //   emp_name: "Vimal",
    // },
    // {
    //   leave_req_id: "4",
    //   emp_id: "EMP001",
    //   leave_type: "loss_of_pay",
    //   from_date: "2025-02-01",
    //   to_date: "2025-02-03",
    //   reason: "Emergency leave",
    //   status: "CANCELLED",
    //   created_at: "2025-01-30T10:00:00Z",
    //   emp_name: "Vimal",
    // },
    // {
    //   leave_req_id: "4",
    //   emp_id: "EMP001",
    //   leave_type: "loss_of_pay",
    //   from_date: "2025-02-01",
    //   to_date: "2025-02-03",
    //   reason: "Emergency leave",
    //   status: "CANCELLED",
    //   created_at: "2025-01-30T10:00:00Z",
    //   emp_name: "Vimal",
    // },
    // {
    //   leave_req_id: "4",
    //   emp_id: "EMP001",
    //   leave_type: "loss_of_pay",
    //   from_date: "2025-02-01",
    //   to_date: "2025-02-03",
    //   reason: "Emergency leave",
    //   status: "CANCELLED",
    //   created_at: "2025-01-30T10:00:00Z",
    //   emp_name: "Vimal",
    // },
    // {
    //   leave_req_id: "4",
    //   emp_id: "EMP001",
    //   leave_type: "loss_of_pay",
    //   from_date: "2025-02-01",
    //   to_date: "2025-02-03",
    //   reason: "Emergency leave",
    //   status: "CANCELLED",
    //   created_at: "2025-01-30T10:00:00Z",
    //   emp_name: "Vimal",
    // },
    // {
    //   leave_req_id: "4",
    //   emp_id: "EMP001",
    //   leave_type: "loss_of_pay",
    //   from_date: "2025-02-01",
    //   to_date: "2025-02-03",
    //   reason: "Emergency leave",
    //   status: "CANCELLED",
    //   created_at: "2025-01-30T10:00:00Z",
    //   emp_name: "Vimal",
    // },
  ]);
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
          <div className="flex justify-center py-6">
            <p>Loading leave history...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="flex justify-center py-6">
            <p className="text-muted-foreground">No leave records found</p>
          </div>
        ) : (
          // <div className=" h-[300px] overflow-y-auto w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className=" max-h-[300px] overflow-y-auto w-full">
              {filteredLeaves.map((leave) => (
                <TableRow key={leave.leave_req_id}>
                  <TableCell>{getLeaveTypeBadge(leave.leave_type)}</TableCell>
                  <TableCell>
                    {format(parseISO(leave.from_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(leave.to_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>{getStatusBadge(leave.status)}</TableCell>
                  <TableCell>
                    {leave &&
                      (leave.status === "CANCELLED" ||
                        leave.status === "PENDING") && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={leave.status === "CANCELLED"}
                          className={`${
                            leave.status === "CANCELLED" ? "bg-gray-500" : ""
                          }`}
                          onClick={() => handleCancelLeave(leave?.leave_req_id)}
                        >
                          Cancel
                        </Button>
                      )}
                    {leave.status === "REJECTED" && leave.rejection_reason && (
                      <span className="text-sm text-muted-foreground">
                        Reason: {leave.rejection_reason}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          // </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveList;
