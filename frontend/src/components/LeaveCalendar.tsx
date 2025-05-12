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
import Loader from "./Loader";

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
    if (leaveTypes.includes("sick_leave")) return "leave-sick_leave";
    if (leaveTypes.includes("earned_leave")) return "leave-earned_leave";
    if (leaveTypes.includes("floater_leave")) return "leave-floater_leave";

    return "";
  };

  const getLeaveTypeBadge = (leaveType: string) => {
    switch (leaveType) {
      case "sick_leave_leave":
        return <Badge className="leave-sick_leave">sick_leave Leave</Badge>;
      case "earned_leave_leave":
        return <Badge className="leave-earned_leave">earned_leave Leave</Badge>;
      case "floater_leave_leave":
        return (
          <Badge className="leave-floater_leave">floater_leave Leave</Badge>
        );
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
          <Loader />
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
            <div className="w-4 h-4 rounded-sm leave-sick_leave mr-1"></div>
            <span className="text-xs">sick_leave Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm leave-earned_leave mr-1"></div>
            <span className="text-xs">earned_leave Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm leave-floater_leave mr-1"></div>
            <span className="text-xs">floater_leave Leave</span>
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

// import { useState, useEffect } from "react";
// import {
//   format,
//   parseISO,
//   eachDayOfInterval,
//   isSameDay,
//   addMonths,
//   subMonths,
//   startOfMonth,
//   endOfMonth,
//   startOfWeek,
//   endOfWeek,
// } from "date-fns";
// import {
//   Calendar as CalendarIcon,
//   ChevronLeft,
//   ChevronRight,
//   Smile,
//   UserRound,
// } from "lucide-react";
// import { getManagerLeaves, LeaveRequest } from "@/services/api";
// import { getCurrentUser } from "@/utils/auth";
// import { cn } from "@/lib/utils";

// import { Calendar } from "@/components/ui/calendar";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
//   CardFooter,
// } from "@/components/ui/card";
// import {
//   HoverCard,
//   HoverCardContent,
//   HoverCardTrigger,
// } from "@/components/ui/hover-card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// interface DayComponentProps {
//   date: Date;
//   [key: string]: any;
// }

// const LeaveCalendar = () => {
//   const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [date, setDate] = useState<Date>(new Date());
//   const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
//   const [viewType, setViewType] = useState<"month" | "team">("month");
//   const user = getCurrentUser();

//   useEffect(() => {
//     const fetchLeaves = async () => {
//       if (user?.empId) {
//         setIsLoading(true);
//         try {
//           const data = await getManagerLeaves(user.empId);
//           // Filter only approved leaves
//           const approvedLeaves = data.filter(
//             (leave) => leave.status === "APPROVED"
//           );
//           setLeaves(approvedLeaves);
//         } catch (error) {
//           console.error("Error fetching leaves for calendar:", error);
//         } finally {
//           setIsLoading(false);
//         }
//       }
//     };

//     fetchLeaves();
//   }, [user?.empId]);

//   // Process leaves to get dates with leaves
//   const leaveDays = leaves.flatMap((leave) => {
//     const start = parseISO(leave.from_date);
//     const end = parseISO(leave.to_date);

//     return eachDayOfInterval({ start, end }).map((day) => ({
//       date: day,
//       leave,
//     }));
//   });

//   // Group leaves by date for hover card display
//   const getLeavesForDay = (day: Date) => {
//     return leaveDays.filter((leaveDay) => isSameDay(leaveDay.date, day));
//   };

//   const getLeaveClassForDay = (day: Date) => {
//     const dayLeaves = getLeavesForDay(day);
//     if (dayLeaves.length === 0) return "";

//     // If multiple leave types on same day, prioritize certain types
//     const leaveTypes = dayLeaves.map((d) => d.leave.leave_type);

//     if (leaveTypes.includes("loss_of_pay")) return "leave-loss-pay";
//     if (leaveTypes.includes("sick_leave")) return "leave-sick_leave";
//     if (leaveTypes.includes("earned_leave")) return "leave-earned_leave";
//     if (leaveTypes.includes("floater_leave")) return "leave-floater_leave";

//     return "";
//   };

//   const getLeaveTypeLabel = (type: string) => {
//     switch (type) {
//       case "sick_leave":
//         return "sick_leave Leave";
//       case "earned_leave":
//         return "earned_leave Leave";
//       case "floater_leave":
//         return "floater_leave Leave";
//       case "loss_of_pay":
//         return "Loss of Pay";
//       default:
//         return type;
//     }
//   };

//   const getLeaveTypeBadge = (leaveType: string) => {
//     switch (leaveType) {
//       case "sick_leave":
//         return <Badge className="leave-sick_leave">sick_leave Leave</Badge>;
//       case "earned_leave":
//         return <Badge className="leave-earned_leave">earned_leave Leave</Badge>;
//       case "floater_leave":
//         return (
//           <Badge className="leave-floater_leave">floater_leave Leave</Badge>
//         );
//       case "loss_of_pay":
//         return <Badge className="leave-loss-pay">Loss of Pay</Badge>;
//       default:
//         return null;
//     }
//   };

//   const nextMonth = () => {
//     setDate(addMonths(date, 1));
//   };

//   const previousMonth = () => {
//     setDate(subMonths(date, 1));
//   };

//   // Get all leaves in the current month view
//   const currentMonthLeaves = () => {
//     const monthStart = startOfMonth(date);
//     const monthEnd = endOfMonth(date);
//     const viewStart = startOfWeek(monthStart);
//     const viewEnd = endOfWeek(monthEnd);

//     return leaves.filter((leave) => {
//       const leaveStart = parseISO(leave.from_date);
//       const leaveEnd = parseISO(leave.to_date);

//       return (
//         (leaveStart >= viewStart && leaveStart <= viewEnd) ||
//         (leaveEnd >= viewStart && leaveEnd <= viewEnd) ||
//         (leaveStart <= viewStart && leaveEnd >= viewEnd)
//       );
//     });
//   };

//   return (
//     <Card className="h-full overflow-hidden">
//       <CardHeader className="bg-slate-50 border-b">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-2">
//             <CalendarIcon className="h-5 w-5 text-primary" />
//             <CardTitle>Team Leave Calendar</CardTitle>
//           </div>

//           <div className="flex items-center gap-2">
//             <Tabs
//               defaultValue="calendar"
//               className="w-[200px]"
//               onValueChange={(value) =>
//                 setViewMode(value as "calendar" | "list")
//               }
//             >
//               <TabsList className="grid w-full grid-cols-2">
//                 <TabsTrigger value="calendar">Calendar</TabsTrigger>
//                 <TabsTrigger value="list">List</TabsTrigger>
//               </TabsList>
//             </Tabs>
//           </div>
//         </div>
//         <CardDescription>
//           Overview of your team's approved leaves
//         </CardDescription>
//       </CardHeader>

//       <CardContent className="p-0">
//         <div className="p-4 border-b bg-white sticky top-0 z-10">
//           <div className="flex flex-wrap items-center justify-between gap-4">
//             <div className="flex items-center gap-2">
//               <Button variant="outline" size="sm" onClick={previousMonth}>
//                 <ChevronLeft className="h-4 w-4 mr-1" />
//                 Previous
//               </Button>
//               <h2 className="text-lg font-medium px-2">
//                 {format(date, "MMMM yyyy")}
//               </h2>
//               <Button variant="outline" size="sm" onClick={nextMonth}>
//                 Next
//                 <ChevronRight className="h-4 w-4 ml-1" />
//               </Button>
//             </div>

//             <Select
//               defaultValue="month"
//               onValueChange={(value) => setViewType(value as "month" | "team")}
//             >
//               <SelectTrigger className="w-[180px]">
//                 <SelectValue placeholder="View type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="month">Month View</SelectItem>
//                 <SelectItem value="team">Team View</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         {isLoading ? (
//           <div className="flex justify-center items-center h-80">
//             <div className="flex flex-col items-center gap-2">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//               <p className="text-sm text-muted-foreground">
//                 Loading calendar...
//               </p>
//             </div>
//           </div>
//         ) : viewMode === "calendar" ? (
//           <div className="p-6">
//             <div className="max-w-4xl mx-auto">
//               <Calendar
//                 mode="single"
//                 selected={date}
//                 onSelect={(day) => day && setDate(day)}
//                 className="rounded-md border shadow-sm pointer-events-auto w-full max-w-none"
//                 modifiers={{
//                   hasLeave: (day) => getLeavesForDay(day).length > 0,
//                 }}
//                 modifiersClassNames={{
//                   hasLeave: "font-bold",
//                 }}
//                 components={{
//                   Day: ({ date: dayDate, ...props }: DayComponentProps) => {
//                     const dayLeaves = getLeavesForDay(dayDate);
//                     const leaveClass = getLeaveClassForDay(dayDate);

//                     return (
//                       <HoverCard openDelay={200}>
//                         <HoverCardTrigger asChild>
//                           <button
//                             {...props}
//                             className={cn(
//                               props.className,
//                               dayLeaves.length > 0 ? leaveClass : "",
//                               "relative hover:bg-muted transition-colors h-14 w-14 rounded-md flex flex-col items-center justify-center"
//                             )}
//                           >
//                             <span className="text-sm">
//                               {format(dayDate, "d")}
//                             </span>
//                             {dayLeaves.length > 0 && (
//                               <div className="absolute bottom-1 flex gap-0.5 mt-1">
//                                 {dayLeaves.length > 3 ? (
//                                   <span className="text-[10px] text-muted-foreground">
//                                     +{dayLeaves.length}
//                                   </span>
//                                 ) : (
//                                   Array.from({
//                                     length: Math.min(3, dayLeaves.length),
//                                   }).map((_, i) => (
//                                     <div
//                                       key={i}
//                                       className="w-1 h-1 bg-primary rounded-full"
//                                     />
//                                   ))
//                                 )}
//                               </div>
//                             )}
//                           </button>
//                         </HoverCardTrigger>
//                         {dayLeaves.length > 0 && (
//                           <HoverCardContent className="w-80" side="right">
//                             <div className="space-y-2">
//                               <h4 className="font-medium flex items-center gap-1">
//                                 <CalendarIcon className="h-4 w-4 text-primary" />
//                                 {format(dayDate, "MMMM d, yyyy")}
//                                 <Badge variant="outline" className="ml-2">
//                                   {dayLeaves.length}{" "}
//                                   {dayLeaves.length === 1 ? "person" : "people"}
//                                 </Badge>
//                               </h4>
//                               <div className="divide-y">
//                                 {dayLeaves.map((leaveDay, idx) => (
//                                   <div
//                                     key={`${leaveDay.leave.leave_req_id}-${idx}`}
//                                     className="py-2 group hover:bg-muted/50 -mx-3 px-3 rounded-md transition-colors"
//                                   >
//                                     <div className="flex items-center justify-between">
//                                       <div className="flex items-center gap-2">
//                                         <UserRound className="h-4 w-4 text-muted-foreground" />
//                                         <p className="font-medium">
//                                           {leaveDay.leave.emp_name}
//                                         </p>
//                                       </div>
//                                       {getLeaveTypeBadge(
//                                         leaveDay.leave.leave_type
//                                       )}
//                                     </div>
//                                     <p className="text-sm text-muted-foreground pl-6">
//                                       {format(
//                                         parseISO(leaveDay.leave.from_date),
//                                         "MMM d"
//                                       )}{" "}
//                                       -{" "}
//                                       {format(
//                                         parseISO(leaveDay.leave.to_date),
//                                         "MMM d, yyyy"
//                                       )}
//                                     </p>
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
//                           </HoverCardContent>
//                         )}
//                       </HoverCard>
//                     );
//                   },
//                 }}
//               />
//             </div>
//           </div>
//         ) : (
//           <div className="p-6">
//             <div className="space-y-4 max-w-4xl mx-auto">
//               {currentMonthLeaves().length > 0 ? (
//                 <div className="grid gap-3">
//                   {currentMonthLeaves().map((leave) => (
//                     <div
//                       key={leave.leave_req_id}
//                       className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex flex-wrap md:flex-nowrap gap-3 justify-between items-center"
//                     >
//                       <div className="space-y-1">
//                         <div className="flex items-center gap-2">
//                           <UserRound className="h-4 w-4 text-muted-foreground" />
//                           <h3 className="font-medium">{leave.emp_name}</h3>
//                           {getLeaveTypeBadge(leave.leave_type)}
//                         </div>
//                         <p className="text-sm text-muted-foreground">
//                           {format(parseISO(leave.from_date), "EEE, MMM d")} -{" "}
//                           {format(parseISO(leave.to_date), "EEE, MMM d, yyyy")}
//                         </p>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <Badge variant="outline" className="whitespace-nowrap">
//                           {Math.ceil(
//                             (new Date(leave.to_date).getTime() -
//                               new Date(leave.from_date).getTime()) /
//                               (1000 * 60 * 60 * 24) +
//                               1
//                           )}{" "}
//                           days
//                         </Badge>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-12 border rounded-lg bg-muted/10">
//                   <Smile className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
//                   <p className="text-muted-foreground">
//                     No leaves found for this month
//                   </p>
//                   <p className="text-sm text-muted-foreground/70 mt-1">
//                     Try changing the month or view type
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         <div className="p-6 bg-slate-50 border-t">
//           <div className="flex flex-wrap gap-3 justify-center">
//             <div className="flex items-center">
//               <div className="w-4 h-4 rounded-sm leave-sick_leave mr-2"></div>
//               <span className="text-xs">sick_leave Leave</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 rounded-sm leave-earned_leave mr-2"></div>
//               <span className="text-xs">earned_leave Leave</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 rounded-sm leave-floater_leave mr-2"></div>
//               <span className="text-xs">floater_leave Leave</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 rounded-sm leave-loss-pay mr-2"></div>
//               <span className="text-xs">Loss of Pay</span>
//             </div>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default LeaveCalendar;
