import { useState, useEffect } from "react";
import {
  format,
  parseISO,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isToday,
  isSameMonth,
  isWeekend,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
} from "lucide-react";
import {
  getHolidays,
  getManagerApprovedRejLeaves,
  LeaveRequest,
} from "@/services/api";
import { getCurrentUser } from "@/utils/auth";
import { cn } from "@/lib/utils";

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
import { Button } from "@/components/ui/button";
import Loader from "./Loader";

const LeaveCalendar = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [holidays, setHolidays] = useState<
    { name: string; date: { iso: string } }[]
  >([]);

  const user = getCurrentUser();

  useEffect(() => {
    const fetchLeaves = async () => {
      if (user?.empId) {
        setIsLoading(true);
        try {
          const [leaveData, holidayData] = await Promise.all([
            getManagerApprovedRejLeaves(user.empId),
            getHolidays(),
          ]);
          console.log(leaveData);

          setLeaves(Array.isArray(leaveData) ? leaveData : []);
          setHolidays(Array.isArray(holidayData) ? holidayData : []);
        } catch (error) {
          console.error("Error fetching leaves for calendar:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchLeaves();
  }, [user?.empId]);

  // Get the current week dates (Monday to Sunday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // Sunday end
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getHolidayForDay = (day: Date) => {
    return holidays.find((holiday) =>
      isSameDay(parseISO(holiday.date.iso), day)
    );
  };

  // Time slots for the calendar (9 AM to 6 PM)
  const timeSlots = [
    "9 AM",
    "10 AM",
    "11 AM",
    "12 PM",
    "1 PM",
    "2 PM",
    "3 PM",
    "4 PM",
    "5 PM",
    "6 PM",
  ];

  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const goToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if leave spans over a weekend
  const doesLeaveSpanWeekend = (leave: LeaveRequest) => {
    const leaveStart = parseISO(leave.from_date);
    const leaveEnd = parseISO(leave.to_date);

    const allDaysInRange = eachDayOfInterval({
      start: leaveStart,
      end: leaveEnd,
    });
    return allDaysInRange.some((day) => isWeekend(day));
  };

  // Get leaves for a specific day with weekend logic
  const getLeavesForDay = (day: Date) => {
    return leaves.filter((leave) => {
      const leaveStart = parseISO(leave.from_date);
      const leaveEnd = parseISO(leave.to_date);

      // Check if leave spans weekend
      const spansWeekend = doesLeaveSpanWeekend(leave);

      if (spansWeekend && isWeekend(day)) {
        // For weekend days, only show if it's exactly the from_date or to_date
        return isSameDay(leaveStart, day) || isSameDay(leaveEnd, day);
      } else if (spansWeekend && !isWeekend(day)) {
        // For weekdays when leave spans weekend, only show on from_date and to_date
        return isSameDay(leaveStart, day) || isSameDay(leaveEnd, day);
      } else {
        // Normal case - show for all days in the range
        return eachDayOfInterval({ start: leaveStart, end: leaveEnd }).some(
          (leaveDay) => isSameDay(leaveDay, day)
        );
      }
    });
  };

  // Safe getter for leave type with fallback
  const getLeaveType = (leave: LeaveRequest) => {
    return leave.leave_type || "general"; // fallback to 'general' if undefined
  };

  const getLeaveTypeColor = (leaveType: string) => {
    switch (leaveType) {
      case "sick_leave":
        return "bg-red-100 border-red-300 text-red-800";
      case "earned_leave":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "floater_leave":
        return "bg-green-100 border-green-300 text-green-800";
      case "loss_of_pay":
        return "bg-gray-100 border-gray-300 text-gray-800";
      default:
        return "bg-purple-100 border-purple-300 text-purple-800";
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "sick_leave":
        return "Sick Leave";
      case "earned_leave":
        return "Earned Leave";
      case "floater_leave":
        return "Floater Leave";
      case "loss_of_pay":
        return "Loss of Pay";
      default:
        return "Leave"; // Generic fallback
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="border-b bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <CardTitle>Team Leave Calendar</CardTitle>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                <Clock className="h-4 w-4 mr-1" />
                Today
              </Button>
              <div className="flex items-center space-x-1">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Week Range Display */}
          <div className="text-lg font-medium">
            {format(weekStart, "MMM d")} – {format(weekEnd, "d, yyyy")}
          </div>
        </div>
        <CardDescription>
          Overview of your team's approved leaves
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <Loader />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Calendar Header - Days of Week */}
            <div className="grid grid-cols-7 border-b bg-slate-50">
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-3 text-center border-r last:border-r-0",
                    isToday(day) && "bg-blue-50",
                    isWeekend(day) && "bg-slate-100" // Different background for weekends
                  )}
                >
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={cn(
                      "text-2xl font-medium mt-1",
                      isToday(day) ? "text-blue-600" : "text-foreground",
                      !isSameMonth(day, currentDate) && "text-muted-foreground",
                      isWeekend(day) && "text-slate-500" // Muted text for weekends
                    )}
                  >
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Body - Time Grid */}
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-7 min-h-full">
                {/* Day Columns */}
                {weekDays.map((day) => {
                  const dayLeaves = getLeavesForDay(day);
                  const holiday = getHolidayForDay(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "border-r last:border-r-0 relative",
                        isToday(day) && "bg-blue-50/30",
                        holiday && "bg-yellow-100/50",
                        isWeekend(day) && "bg-slate-50/50" // Different background for weekends
                      )}
                    >
                      {/* Time slots grid */}
                      {timeSlots.map((time, index) => (
                        <div
                          key={`${day.toISOString()}-${time}`}
                          className="h-16"
                        />
                      ))}

                      {holiday && (
                        <div className="absolute top-0 left-0 right-0 p-1 text-center text-xs font-medium text-yellow-800 bg-yellow-200 border-b border-yellow-300 z-10">
                          🎉 {holiday.name}
                        </div>
                      )}

                      {/* Weekend label */}
                      {isWeekend(day) && !holiday && (
                        <div className="absolute top-0 left-0 right-0 p-1 text-center text-xs font-medium text-slate-600 bg-slate-100 border-b border-slate-200 z-10">
                          Weekend
                        </div>
                      )}

                      {/* Leave Events */}
                      {dayLeaves.length > 0 && (
                        <div className="absolute inset-0 p-1 pointer-events-none">
                          <div className="flex flex-col gap-1 h-full justify-start pt-2">
                            {dayLeaves.slice(0, 3).map((leave, index) => {
                              const leaveType = getLeaveType(leave);
                              return (
                                <HoverCard
                                  key={`${leave.leave_req_id}-${index}`}
                                >
                                  <HoverCardTrigger asChild>
                                    <div
                                      className={cn(
                                        "rounded-md mt-4 border-l-4 p-2 text-xs font-medium pointer-events-auto cursor-pointer shadow-sm",
                                        getLeaveTypeColor(leaveType),
                                        "min-h-[2rem] flex flex-col justify-center"
                                      )}
                                    >
                                      <div className="truncate font-medium">
                                        {leave.emp_name}
                                      </div>
                                      <div className="text-[10px] opacity-75 truncate">
                                        {getLeaveTypeLabel(leaveType)}
                                      </div>
                                    </div>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium flex items-center gap-2">
                                          <Users className="h-4 w-4" />
                                          {leave.emp_name}
                                        </h4>
                                        <Badge
                                          className={cn(
                                            "text-xs",
                                            leave.status === "APPROVED"
                                              ? "bg-green-100 text-green-800"
                                              : "bg-orange-100 text-orange-800"
                                          )}
                                        >
                                          {leave.status}
                                        </Badge>
                                      </div>

                                      <div className="space-y-1">
                                        <p className="text-sm">
                                          <span className="font-medium">
                                            Type:
                                          </span>{" "}
                                          {getLeaveTypeLabel(leaveType)}
                                        </p>
                                        <p className="text-sm">
                                          <span className="font-medium">
                                            Duration:
                                          </span>{" "}
                                          {format(
                                            parseISO(leave.from_date),
                                            "MMM d"
                                          )}{" "}
                                          -{" "}
                                          {format(
                                            parseISO(leave.to_date),
                                            "MMM d, yyyy"
                                          )}
                                        </p>
                                        {leave.approved_at && (
                                          <p className="text-xs text-muted-foreground">
                                            Approved:{" "}
                                            {format(
                                              parseISO(leave.approved_at),
                                              "MMM d, yyyy 'at' h:mm a"
                                            )}
                                          </p>
                                        )}
                                        {leave.reason && (
                                          <p className="text-xs text-muted-foreground">
                                            Reason: {leave.reason}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              );
                            })}

                            {dayLeaves.length > 3 && (
                              <div className="text-[10px] text-muted-foreground px-2 py-1 bg-muted rounded-md pointer-events-auto">
                                +{dayLeaves.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="p-4 bg-slate-50 border-t">
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-100 border-l-4 border-red-300"></div>
              <span className="text-xs">Sick Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-100 border-l-4 border-blue-300"></div>
              <span className="text-xs">Earned Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-100 border-l-4 border-green-300"></div>
              <span className="text-xs">Floater Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-gray-100 border-l-4 border-gray-300"></div>
              <span className="text-xs">Loss of Pay</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveCalendar;
