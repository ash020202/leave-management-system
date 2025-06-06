import React from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  X,
} from "lucide-react";

interface LeaveHistoryRecord {
  id: number;
  status: string;
  remarks: string | null;
  created_at: string;
  approver: {
    emp_id: number;
    emp_name: string;
    department: string;
    role: string;
    total_leave_balance: number;
  };
}

interface LeaveHistoryTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  leaveHistory: LeaveHistoryRecord[];
  employeeName: string;
}

const LeaveHistoryTracker: React.FC<LeaveHistoryTrackerProps> = ({
  isOpen,
  onClose,
  leaveHistory = [],
  employeeName = "",
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === "APPROVED" || status === "APPROVED_BY_SENIOR_MANAGER") {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (status.includes("REJECTED")) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else {
      return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "APPROVED" || status === "APPROVED_BY_SENIOR_MANAGER") {
      return "bg-green-50 border-green-200 text-green-800";
    } else if (status.includes("REJECTED")) {
      return "bg-red-50 border-red-200 text-red-800";
    } else {
      return "bg-yellow-50 border-yellow-200 text-yellow-800";
    }
  };

  const formatStatus = (status: string) => {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "MANAGER":
        return "bg-blue-100 text-blue-800";
      case "SENIOR_MANAGER":
        return "bg-purple-100 text-purple-800";
      case "HR":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">Leave Request History</h2>
          <p className="text-blue-100 text-sm mt-1">
            Tracking for {employeeName}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {leaveHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                No history available for this leave request
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveHistory
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((record, index) => (
                  <div
                    key={record.id}
                    className="relative bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Timeline line */}
                    {index < leaveHistory.length - 1 && (
                      <div className="absolute left-8 top-12 w-0.5 h-8 bg-gray-200"></div>
                    )}

                    <div className="flex items-start space-x-4">
                      {/* Status Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(record.status)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                record.status
                              )}`}
                            >
                              {formatStatus(record.status)}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(record.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Approver Info */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900">
                                {record.approver.emp_name}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                                  record.approver.role
                                )}`}
                              >
                                {record.approver.role.replace("_", " ")}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {record.approver.department}
                            </span>
                          </div>
                        </div>

                        {/* Remarks */}
                        {record.remarks && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-amber-800 mb-1">
                                  Remarks:
                                </p>
                                <p className="text-sm text-amber-700">
                                  {record.remarks}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveHistoryTracker;
