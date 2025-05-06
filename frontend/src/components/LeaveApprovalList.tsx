import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  getManagerLeaves,
  updateLeaveStatus,
  LeaveRequest,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface LeaveApprovalListProps {
  onUpdate?: () => void;
}

const LeaveApprovalList = ({ onUpdate }: LeaveApprovalListProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState<string>("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const user = getCurrentUser();

  const fetchLeaves = async () => {
    if (!user?.empId) return;

    setIsLoading(true);
    try {
      const data = await getManagerLeaves(user.empId);
      setLeaves(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching team leaves:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [user?.empId]);

  const handleApprove = async (leave: LeaveRequest) => {
    if (!user?.empId) return;

    setIsProcessing(true);
    try {
      await updateLeaveStatus(user.empId, leave.leave_req_id, "APPROVED");
      fetchLeaves();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error approving leave:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user?.empId || !selectedLeave) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      await updateLeaveStatus(
        user.empId,
        selectedLeave.leave_req_id,
        "REJECTED",
        rejectionReason
      );
      setIsDialogOpen(false);
      setRejectionReason("");
      setSelectedLeave(null);
      fetchLeaves();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error rejecting leave:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectDialog = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setIsDialogOpen(true);
  };

  // const filteredLeaves = leaves?.filter((leave) => {
  //   if (filter === "all") return true;
  //   if (filter === "pending") return leave?.status === "PENDING";
  //   if (filter === "approved") return leave?.status === "APPROVED";
  //   if (filter === "rejected") return leave?.status === "REJECTED";
  //   return true;
  // });
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
            <div className="flex justify-center py-6">
              <p>Loading leave requests...</p>
            </div>
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
                  <TableHead>Actions</TableHead>
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
                      {leave.status === "PENDING" ? (
                        <div className="flex space-x-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(leave)}
                            disabled={isProcessing}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openRejectDialog(leave)}
                            disabled={isProcessing}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        leave.status === "REJECTED" &&
                        leave.rejection_reason && (
                          <span
                            className="text-sm text-muted-foreground"
                            title={leave.rejection_reason}
                          >
                            Reason:{" "}
                            {leave.rejection_reason.length > 20
                              ? `${leave.rejection_reason.substring(0, 20)}...`
                              : leave.rejection_reason}
                          </span>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter reason for rejection"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="resize-none"
            disabled={isProcessing}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? "Processing..." : "Reject Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeaveApprovalList;
