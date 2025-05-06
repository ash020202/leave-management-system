import { useState, useEffect, useMemo } from "react";
import { format, parseISO, eachDayOfInterval, isSameDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { getManagerLeaves, LeaveRequest } from "@/services/api";
import { getCurrentUser } from "@/utils/auth";
import { cn } from "@/lib/utils";

import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { DayProps } from "react-day-picker";

const LeaveCalendar = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const user = getCurrentUser();

  useEffect(() => {
    const fetchLeaves = async () => {
      if (user?.empId) {
        setIsLoading(true);
        try {
          const data = await getManagerLeaves(user.empId);
          console.log(data);

          // Filter only approved leaves
          const approvedLeaves = data.filter(
            (leave) => leave.status === "APPROVED"
          );
          setLeaves(data);
        } catch (error) {
          console.error("Error fetching leaves for calendar:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchLeaves();
  }, [user?.empId]);

  // Process leaves to get dates with leaves
  console.log(leaves);

  const leaveDays = leaves.flatMap((leave) => {
    console.log(leave);

    const start = parseISO(leave.from_date);
    const end = parseISO(leave.to_date);

    return eachDayOfInterval({ start, end }).map((day) => ({
      date: day,
      leave,
    }));
  });

  // Group leaves by date for hover card display
  const getLeavesForDay = (day: Date) => {
    // console.log(leaveDays);

    return leaveDays.filter((leaveDay) => isSameDay(leaveDay.date, day));
  };

  const getLeaveClassForDay = (day: Date) => {
    const dayLeaves = getLeavesForDay(day);
    console.log(dayLeaves);

    if (dayLeaves.length === 0) return "";

    // If multiple leave types on same day, prioritize certain types
    const leaveTypes = dayLeaves.map((d) => d.leave.leave_type);
    console.log(leaveTypes);

    if (leaveTypes.includes("loss_of_pay")) return "leave-loss-pay";
    if (leaveTypes.includes("sick_leave")) return "leave-sick";
    if (leaveTypes.includes("earned_leave")) return "leave-earned";
    if (leaveTypes.includes("floater_leave")) return "leave-floater";

    return "";
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5" />
          Team Leave Calendar
        </CardTitle>
        <CardDescription>
          Overview of your team's approved leaves
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-80">
            <p>Loading calendar...</p>
          </div>
        ) : (
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            components={{
              Day: (props: DayProps) => {
                const dayDate = props.date;
                const dayLeaves = getLeavesForDay(dayDate);
                const leaveClass = getLeaveClassForDay(dayDate);

                // Filter out any non-DOM props
                const { displayMonth, ...buttonProps } = props as any;
                // console.log(dayLeaves);

                return (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <button
                        {...buttonProps}
                        className={`${cn(
                          buttonProps.className,
                          dayLeaves.length > 0 ? leaveClass : ""
                        )} overall-calendar-sty`}
                      >
                        {format(dayDate, "d")}
                        {dayLeaves.length > 0 && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />
                        )}
                      </button>
                    </HoverCardTrigger>

                    {dayLeaves.length > 0 && (
                      <HoverCardContent className="w-90 max-h-56 overflow-y-auto">
                        <div className=" flex flex-col">
                          {/* <h4 className="font-medium">
                            {format(dayDate, "MMMM d, yyyy")}
                          </h4> */}
                          <div className="">
                            {dayLeaves.map((leaveDay, idx) => (
                              <div
                                key={`${leaveDay.leave.leave_req_id}-${idx}`}
                                className="py-2 flex flex-col gap-2"
                              >
                                <h4>
                                  Posted at:{" "}
                                  {format(
                                    leaveDay.leave.created_at,
                                    "MMMM d, yyyy, hh:mm a"
                                  )}
                                </h4>

                                <div className="flex gap-3 items-center justify-between">
                                  <p className="font-medium">
                                    {leaveDay.leave.emp_name}
                                  </p>

                                  <Badge
                                    className={`${
                                      leaveDay.leave.status == "APPROVED"
                                        ? "bg-green-100 text-green-800 "
                                        : leaveDay.leave.status === "PENDING"
                                        ? "bg-orange-100 border-amber-500 text-amber-500 "
                                        : leaveDay.leave.status === "REJECTED"
                                        ? "border-red-500 bg-red-100 text-red-500"
                                        : "text-red-500"
                                    }} `}
                                  >
                                    {leaveDay.leave.status}
                                  </Badge>
                                  {getLeaveTypeBadge(leaveDay.leave.leave_type)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(
                                    parseISO(leaveDay.leave.from_date),
                                    "MMM d"
                                  )}{" "}
                                  -{" "}
                                  {format(
                                    parseISO(leaveDay.leave.to_date),
                                    "MMM d, yyyy"
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </HoverCardContent>
                    )}
                  </HoverCard>
                );
              },
            }}
          />
        )}

        <div className="flex flex-wrap gap-2 mt-6">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm leave-sick mr-1"></div>
            <span className="text-xs">Sick Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm leave-earned mr-1"></div>
            <span className="text-xs">Earned Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm leave-floater mr-1"></div>
            <span className="text-xs">Floater Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm leave-loss-pay mr-1"></div>
            <span className="text-xs">Loss of Pay</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveCalendar;
