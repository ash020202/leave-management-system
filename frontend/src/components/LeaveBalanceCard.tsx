import { useEffect, useState } from "react";
import { getLeaveBalance, LeaveBalance } from "@/services/api";
import { getCurrentUser } from "@/utils/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Loader from "./Loader";

const LeaveBalanceCard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>();

  const user = getCurrentUser();

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      if (user?.empId) {
        try {
          const data = await getLeaveBalance(user.empId);
          console.log(data);

          setLeaveBalance(data);
        } catch (error) {
          console.error("Error fetching leave balance:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchLeaveBalance();
    // console.log(leaveBalance);
  }, [user?.empId]);
  // console.log(leaveBalance);

  // Maximum leave days for each category (for progress bars)
  const maxLeave = {
    sick_leave: user.role == "INTERN" ? 0 : 3,
    earned_leave: user.role == "INTERN" ? 0 : 3,
    floater_leave: user.role == "INTERN" ? 0 : 3,
    loss_of_pay: user.role == "INTERN" ? 12 : 3,
  };

  // Calculate progress percentage
  const calculateProgress = (used: number, max: number) => {
    return Math.round((used / max) * 100);
  };

  return (
    <Card className="w-[50%]  ">
      <CardHeader>
        <CardTitle>My Leave Balance</CardTitle>
        <CardDescription>Your current leave balances</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <div className="space-y-2 ">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Sick Leave</p>
                <p className="text-sm font-medium">
                  {leaveBalance.sick_leave} / {maxLeave.sick_leave}
                </p>
              </div>
              <Progress
                value={calculateProgress(
                  leaveBalance.sick_leave,
                  maxLeave.sick_leave
                )}
                className="h-2 leave-sick "
                indicatorClassName="bg-green-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Earned Leave</p>
                <p className="text-sm font-medium">
                  {leaveBalance.earned_leave} / {maxLeave.earned_leave}
                </p>
              </div>
              <Progress
                value={calculateProgress(
                  leaveBalance.earned_leave,
                  maxLeave.earned_leave
                )}
                className="h-2 leave-earned "
                indicatorClassName="bg-blue-700"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Floater Leave</p>
                <p className="text-sm font-medium">
                  {leaveBalance.floater_leave} / {maxLeave.floater_leave}
                </p>
              </div>
              <Progress
                value={calculateProgress(
                  leaveBalance.floater_leave,
                  maxLeave.floater_leave
                )}
                className="h-2 leave-floater "
                indicatorClassName="bg-purple-700"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Loss Of Pay Leave</p>
                <p className="text-sm font-medium">
                  {leaveBalance.loss_of_pay} / {maxLeave.loss_of_pay}
                </p>
              </div>
              <Progress
                value={calculateProgress(
                  leaveBalance.loss_of_pay,
                  maxLeave.loss_of_pay
                )}
                className="h-2 leave-loss-pay"
                indicatorClassName="bg-orange-600"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceCard;
