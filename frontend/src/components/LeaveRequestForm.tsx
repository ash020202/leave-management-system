// import { useState, useMemo, useEffect } from "react";
// import { z } from "zod";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { toast } from "sonner";
// import { format } from "date-fns";
// import { CalendarCheck, CalendarIcon } from "lucide-react";
// import { getFloaterHolidays, requestLeave } from "@/services/api";
// import { getCurrentUser } from "@/utils/auth";

// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Calendar } from "@/components/ui/calendar";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "./ui/dialog";

// interface Holiday {
//   date: string;
//   name: string;
// }

// export const leaveTypes = [
//   { id: 1, value: "sick_leave", label: "Sick Leave" },
//   { id: 3, value: "earned_leave", label: "Earned Leave" },
//   { id: 4, value: "floater_leave", label: "Floater Leave" },
//   { id: 2, value: "loss_of_pay", label: "Loss of Pay" },
// ];

// const internLeaveTypes = [{ value: "loss_of_pay", label: "Loss Of Pay" }];

// const formSchema = z
//   .object({
//     leave_type: z.string({
//       required_error: "Please select a leave type",
//     }),
//     from_date: z.date({
//       required_error: "From date is required",
//     }),
//     to_date: z.date({
//       required_error: "To date is required",
//     }),
//     reason: z
//       .string()
//       .min(5, { message: "Reason must be at least 5 characters" })
//       .max(300, { message: "Reason must not exceed 300 characters" }),
//   })
//   .refine((data) => data.to_date >= data.from_date, {
//     message: "End date must be after or equal to start date",
//     path: ["to_date"],
//   });

// type FormValues = z.infer<typeof formSchema>;

// interface LeaveRequestFormProps {
//   onSuccess?: () => void;
// }

// const LeaveRequestForm = ({ onSuccess }: LeaveRequestFormProps) => {
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const user = getCurrentUser();
//   const userInfo = localStorage.getItem("user-info");
//   const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
//   const [holidays, setHolidays] = useState<Holiday[]>([]);
//   const [holidaysLoading, setHolidaysLoading] = useState(false);

//   useEffect(() => {
//     const fetchHolidays = async () => {
//       setHolidaysLoading(true);
//       try {
//         // Replace this with your actual API call
//         const holidayData = await getFloaterHolidays();
//         setHolidays(holidayData);
//       } catch (error) {
//         console.error("Error fetching holidays:", error);
//         toast.error("Failed to load holidays");
//       } finally {
//         setHolidaysLoading(false);
//       }
//     };

//     fetchHolidays();
//   }, []);

//   const formatHolidayDate = (dateString: string) => {
//     const date = new Date(dateString);
//     const options: Intl.DateTimeFormatOptions = {
//       weekday: "short",
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     };
//     return date.toLocaleDateString("en-US", options);
//   };

//   const holidaysByMonth = useMemo(() => {
//     return holidays.reduce((acc, holiday) => {
//       const date = new Date(holiday.date);
//       const monthName = date.toLocaleDateString("en-US", { month: "long" });
//       if (!acc[monthName]) {
//         acc[monthName] = [];
//       }
//       acc[monthName].push(holiday);
//       return acc;
//     }, {} as Record<string, Holiday[]>);
//   }, [holidays]);

//   // Define public holidays (you can customize this list)
//   const publicHolidays = [
//     new Date(2025, 11, 25), // Christmas Day - Dec 25, 2025
//     // new Date(2025, 11, 26), // Boxing Day - Dec 26, 2025
//     new Date(2025, 0, 1), // New Year's Day - Jan 1, 2025
//     new Date(2025, 0, 26), // Republic Day - Jan 26, 2025
//     new Date(2025, 7, 15), // Independence Day - Aug 15, 2025
//     new Date(2025, 9, 2), // Gandhi Jayanti - Oct 2, 2025
//     // Add more holidays as needed
//   ];

//   // Function to check if a date is a weekend (Saturday or Sunday)
//   const isWeekend = (date: Date) => {
//     const day = date.getDay();
//     return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
//   };

//   // Function to check if a date is a public holiday
//   const isPublicHoliday = (date: Date) => {
//     return publicHolidays.some(
//       (holiday) =>
//         holiday.getDate() === date.getDate() &&
//         holiday.getMonth() === date.getMonth() &&
//         holiday.getFullYear() === date.getFullYear()
//     );
//   };

//   // Function to calculate working days between two dates
//   const calculateWorkingDays = (fromDate: Date, toDate: Date) => {
//     if (!fromDate || !toDate) return 0;

//     let workingDays = 0;
//     const currentDate = new Date(fromDate);

//     while (currentDate <= toDate) {
//       if (!isWeekend(currentDate) && !isPublicHoliday(currentDate)) {
//         workingDays++;
//       }
//       currentDate.setDate(currentDate.getDate() + 1);
//     }

//     return workingDays;
//   };

//   // Parse user info and extract leave balances
//   const userLeaveData = useMemo(() => {
//     if (!userInfo) return null;

//     try {
//       const parsedData = JSON.parse(userInfo);
//       return parsedData;
//     } catch (error) {
//       console.error("Error parsing user info:", error);
//       return null;
//     }
//   }, [userInfo]);

//   // Get leave types with balances based on user role
//   const availableLeaveTypes = useMemo(() => {
//     if (!userLeaveData) return [];

//     if (user?.role === "INTERN") {
//       return internLeaveTypes.map((type) => ({
//         ...type,
//         balance: userLeaveData[type.value] || 0,
//       }));
//     } else {
//       return leaveTypes.map((type) => ({
//         ...type,
//         balance: userLeaveData[type.value] || 0,
//       }));
//     }
//   }, [userLeaveData, user?.role]);

//   // console.log("User Info:", userInfo);
//   // console.log("Parsed User Data:", userLeaveData);
//   // console.log("Available Leave Types with Balance:", availableLeaveTypes);

//   const form = useForm<FormValues>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       reason: "",
//     },
//   });

//   const handleFloaterHolidaySelect = (holiday: Holiday) => {
//     const holidayDate = new Date(holiday.date);

//     // Set the leave type to floater leave
//     form.setValue("leave_type", "floater_leave");

//     // Set both from and to date to the holiday date (single day leave)
//     form.setValue("from_date", holidayDate);
//     form.setValue("to_date", holidayDate);

//     // Pre-fill reason with holiday name
//     form.setValue("reason", `Floater leave for ${holiday.name}`);

//     // Close the holiday modal
//     setIsHolidayModalOpen(false);

//     // Show success toast
//     toast.success(`Selected ${holiday.name} for floater leave`);

//     // Trigger form validation
//     form.trigger();
//   };

//   const onSubmit = async (values: FormValues) => {
//     if (!user) {
//       toast.error("You need to be logged in to request leave");
//       return;
//     }
//     // console.log(values);

//     setIsSubmitting(true);
//     try {
//       const selectedLeaveType = leaveTypes.find(
//         (type) => type.value === values.leave_type
//       );
//       if (!selectedLeaveType) {
//         toast.error("Invalid leave type selected");
//         return;
//       }
//       console.log("Submitting leave request with values:", values);
//       console.log("Selected leave type:", selectedLeaveType.id);

//       const leaveData = {
//         emp_id: user.empId,
//         leave_type_id: selectedLeaveType.id,
//         from_date: format(values.from_date, "yyyy-MM-dd"),
//         to_date: format(values.to_date, "yyyy-MM-dd"),
//         reason: values.reason,
//       };

//       await requestLeave(leaveData);
//       form.reset();
//       // toast.info(res);
//       if (onSuccess) onSuccess();
//     } catch (error) {
//       console.error("Error requesting leave:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <Card className="">
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <div>
//             <CardTitle>Request Leave</CardTitle>
//             <CardDescription>
//               Fill in the details to request a leave
//             </CardDescription>
//           </div>

//           {/* Holiday List Button */}
//           <Dialog
//             open={isHolidayModalOpen}
//             onOpenChange={setIsHolidayModalOpen}
//           >
//             {user.role !== "INTERN" && (
//               <DialogTrigger asChild>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="flex items-center gap-2"
//                 >
//                   <CalendarCheck className="h-4 w-4" />
//                   View Floater Holidays
//                 </Button>
//               </DialogTrigger>
//             )}
//             <DialogContent className="max-w-4xl h-[80dvh] overflow-hidden">
//               <DialogHeader>
//                 <DialogTitle className="flex items-center gap-2">
//                   <CalendarCheck className="h-5 w-5 text-blue-600" />
//                   Floater Holiday Calendar 2025
//                 </DialogTitle>
//                 <DialogDescription>
//                   Company holidays and observances
//                 </DialogDescription>
//               </DialogHeader>

//               <div className="overflow-y-auto max-h-[60vh] pr-2">
//                 {holidaysLoading ? (
//                   <div className="flex items-center justify-center py-8">
//                     <div className="text-muted-foreground">
//                       Loading holidays...
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="space-y-6">
//                     {Object.entries(holidaysByMonth).map(
//                       ([month, monthHolidays]) => (
//                         <div key={month}>
//                           <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
//                             <CalendarCheck className="h-5 w-5 text-blue-600" />
//                             {month}
//                           </h3>
//                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
//                             {monthHolidays.map((holiday, index) => (
//                               <div
//                                 key={index}
//                                 onClick={() =>
//                                   handleFloaterHolidaySelect(holiday)
//                                 }
//                                 className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 hover:shadow-md transition-shadow"
//                               >
//                                 <div className="flex items-start justify-between">
//                                   <div className="flex-1">
//                                     <h4 className="font-semibold text-gray-800 mb-1">
//                                       {holiday.name}
//                                     </h4>
//                                     <p className="text-sm text-gray-600">
//                                       {formatHolidayDate(holiday.date)}
//                                     </p>
//                                   </div>
//                                   <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       )
//                     )}
//                   </div>
//                 )}
//               </div>

//               <div className="flex items-center justify-between pt-4 border-t">
//                 <p className="text-sm text-muted-foreground">
//                   Total holidays: {holidays.length}
//                 </p>
//                 <Button onClick={() => setIsHolidayModalOpen(false)}>
//                   Close
//                 </Button>
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//             <FormField
//               control={form.control}
//               name="leave_type"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Leave Type</FormLabel>
//                   <Select
//                     onValueChange={field.onChange}
//                     value={field.value}
//                     disabled={isSubmitting}
//                   >
//                     <FormControl>
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select leave type" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       {availableLeaveTypes.map((type) => (
//                         <SelectItem
//                           key={type.value}
//                           value={type.value}
//                           disabled={type.balance === 0}
//                         >
//                           <div className="flex justify-between items-center w-full">
//                             <span>{type.label}</span>
//                             <span className="text-sm text-muted-foreground ml-2">
//                               {type.balance}{" "}
//                               {type.balance === 1 ? "day" : "days"} available
//                             </span>
//                           </div>
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Custom Date Range Selector */}
//             <div className="space-y-4">
//               <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
//                 <div className="text-left">
//                   <div className="text-sm text-gray-500">From</div>
//                   <div className="font-medium">
//                     {form.watch("from_date")
//                       ? format(form.watch("from_date"), "dd MMM, yyyy")
//                       : "Select date"}
//                   </div>
//                 </div>

//                 {form.watch("from_date") && form.watch("to_date") && (
//                   <div className="flex flex-col items-center px-4 py-2 bg-purple-100 rounded-lg">
//                     <div className="text-lg font-semibold text-purple-700">
//                       {calculateWorkingDays(
//                         form.watch("from_date"),
//                         form.watch("to_date")
//                       )}{" "}
//                       days
//                     </div>
//                   </div>
//                 )}

//                 <div className="text-right">
//                   <div className="text-sm text-gray-500">To</div>
//                   <div className="font-medium">
//                     {form.watch("to_date")
//                       ? format(form.watch("to_date"), "dd MMM, yyyy")
//                       : "Select date"}
//                   </div>
//                 </div>
//               </div>

//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     className="w-fit justify-start text-left font-normal"
//                     disabled={isSubmitting}
//                   >
//                     <CalendarIcon className="mr-2 h-4 w-4" />
//                     {form.watch("from_date") && form.watch("to_date")
//                       ? `${format(
//                           form.watch("from_date"),
//                           "dd MMM"
//                         )} - ${format(form.watch("to_date"), "dd MMM, yyyy")}`
//                       : "Pick date range"}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0" align="start">
//                   <Calendar
//                     mode="range"
//                     selected={{
//                       from: form.watch("from_date"),
//                       to: form.watch("to_date"),
//                     }}
//                     onSelect={(range) => {
//                       if (range?.from) {
//                         form.setValue("from_date", range.from);
//                       }
//                       if (range?.to) {
//                         form.setValue("to_date", range.to);
//                       }
//                     }}
//                     disabled={(date) => date < new Date()}
//                     initialFocus
//                     className="pointer-events-auto"
//                     numberOfMonths={1}
//                   />
//                 </PopoverContent>
//               </Popover>

//               {/* Show working days info */}
//               {form.watch("from_date") && form.watch("to_date") && (
//                 <div className="text-sm text-gray-600 mt-2 ">
//                   <div className="flex gap-2">
//                     <div>
//                       Working days:{" "}
//                       {calculateWorkingDays(
//                         form.watch("from_date"),
//                         form.watch("to_date")
//                       )}
//                     </div>
//                     <div>
//                       Total days:{" "}
//                       {Math.ceil(
//                         (form.watch("to_date").getTime() -
//                           form.watch("from_date").getTime()) /
//                           (1000 * 60 * 60 * 24)
//                       ) + 1}
//                     </div>
//                   </div>

//                   {form.watch("leave_type") && (
//                     <div className="mt-1">
//                       {(() => {
//                         const selectedType = availableLeaveTypes.find(
//                           (t) => t.value === form.watch("leave_type")
//                         );
//                         const workingDays = calculateWorkingDays(
//                           form.watch("from_date"),
//                           form.watch("to_date")
//                         );
//                         const available = selectedType?.balance || 0;

//                         if (workingDays > available) {
//                           return (
//                             <div className="text-red-600 font-medium">
//                               Insufficient balance! Available: {available} days
//                             </div>
//                           );
//                         } else if (workingDays === available) {
//                           return (
//                             <div className="text-orange-600">
//                               Using all available balance
//                             </div>
//                           );
//                         } else {
//                           return (
//                             <div className="text-green-600">
//                               Remaining balance will be:{" "}
//                               {available - workingDays} days <br />
//                               <b className="">
//                                 Note: after approval leave count will be
//                                 deducted
//                               </b>
//                             </div>
//                           );
//                         }
//                       })()}
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Hidden form fields for validation */}
//               <FormField
//                 control={form.control}
//                 name="from_date"
//                 render={() => <FormMessage />}
//               />

//               <FormField
//                 control={form.control}
//                 name="to_date"
//                 render={() => <FormMessage />}
//               />
//             </div>

//             <FormField
//               control={form.control}
//               name="reason"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Reason</FormLabel>
//                   <FormControl>
//                     <Textarea
//                       placeholder="Please provide a reason for your leave request"
//                       className="resize-none"
//                       {...field}
//                       disabled={isSubmitting}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <Button type="submit" disabled={isSubmitting}>
//               {isSubmitting ? "Submitting..." : "Submit Request"}
//             </Button>
//             <p className="text-center ">
//               To Download Leave Policy{" "}
//               <a
//                 download="/public/Leave_Management_System_Policy_Document.pdf"
//                 href="#"
//                 className="text-blue-500 font-semibold"
//               >
//                 click here
//               </a>
//             </p>
//           </form>
//         </Form>
//       </CardContent>
//     </Card>
//   );
// };

// export default LeaveRequestForm;

import { useState, useMemo, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarCheck, CalendarIcon } from "lucide-react";
import { getFloaterHolidays, requestLeave } from "@/services/api";
import { getCurrentUser } from "@/utils/auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface Holiday {
  date: string;
  name: string;
}

export const leaveTypes = [
  { id: 1, value: "sick_leave", label: "Sick Leave" },
  { id: 3, value: "earned_leave", label: "Earned Leave" },
  { id: 4, value: "floater_leave", label: "Floater Leave" },
  { id: 2, value: "loss_of_pay", label: "Loss of Pay" },
];

const internLeaveTypes = [{ value: "loss_of_pay", label: "Loss Of Pay" }];

const formSchema = z
  .object({
    leave_type: z.string({
      required_error: "Please select a leave type",
    }),
    from_date: z.date({
      required_error: "From date is required",
    }),
    to_date: z.date({
      required_error: "To date is required",
    }),
    reason: z
      .string()
      .min(5, { message: "Reason must be at least 5 characters" })
      .max(300, { message: "Reason must not exceed 300 characters" }),
    halfDay: z
      .enum(["none", "full_day", "first_half", "second_half"])
      .optional(),
  })

  .refine((data) => data.to_date >= data.from_date, {
    message: "End date must be after or equal to start date",
    path: ["to_date"],
  })
  .refine(
    (data) =>
      data.from_date.getTime() !== data.to_date.getTime() ||
      data.halfDay !== undefined,
    {
      message: "Please select half-day option",
      path: ["halfDay"],
    }
  );
type FormValues = z.infer<typeof formSchema>;

interface LeaveRequestFormProps {
  onSuccess?: () => void;
}

const LeaveRequestForm = ({ onSuccess }: LeaveRequestFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = getCurrentUser();
  const userInfo = localStorage.getItem("user-info");
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);

  useEffect(() => {
    const fetchHolidays = async () => {
      setHolidaysLoading(true);
      try {
        // Replace this with your actual API call
        const holidayData = await getFloaterHolidays();
        setHolidays(holidayData);
      } catch (error) {
        console.error("Error fetching holidays:", error);
        toast.error("Failed to load holidays");
      } finally {
        setHolidaysLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  const formatHolidayDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  // Helper function to determine holiday status
  const getHolidayStatus = (holidayDate: string) => {
    const today = new Date();
    const holiday = new Date(holidayDate);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const holidayMonth = holiday.getMonth();
    const holidayYear = holiday.getFullYear();

    // Reset time to compare dates only
    today.setHours(0, 0, 0, 0);
    holiday.setHours(0, 0, 0, 0);

    if (holiday < today) {
      return "past";
    } else if (holidayYear === currentYear && holidayMonth === currentMonth) {
      return "current";
    } else {
      return "future";
    }
  };

  // Helper function to get styling classes based on holiday status
  const getHolidayStyles = (status: string) => {
    switch (status) {
      case "past":
        return {
          containerClass:
            "bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 opacity-50 cursor-not-allowed",
          titleClass: "font-semibold text-gray-400 mb-1",
          dateClass: "text-sm text-gray-400",
          indicatorClass: "w-3 h-3 bg-gray-400 rounded-full mt-1 flex-shrink-0",
        };
      case "current":
        return {
          containerClass:
            "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer",
          titleClass: "font-semibold text-green-800 mb-1",
          dateClass: "text-sm text-green-600",
          indicatorClass:
            "w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0",
        };
      case "future":
        return {
          containerClass:
            "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer",
          titleClass: "font-semibold text-gray-800 mb-1",
          dateClass: "text-sm text-gray-600",
          indicatorClass: "w-3 h-3 bg-blue-500 rounded-full mt-1 flex-shrink-0",
        };
      default:
        return {
          containerClass:
            "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer",
          titleClass: "font-semibold text-gray-800 mb-1",
          dateClass: "text-sm text-gray-600",
          indicatorClass: "w-3 h-3 bg-blue-500 rounded-full mt-1 flex-shrink-0",
        };
    }
  };

  const holidaysByMonth = useMemo(() => {
    return holidays.reduce((acc, holiday) => {
      const date = new Date(holiday.date);
      const monthName = date.toLocaleDateString("en-US", { month: "long" });
      if (!acc[monthName]) {
        acc[monthName] = [];
      }
      acc[monthName].push(holiday);
      return acc;
    }, {} as Record<string, Holiday[]>);
  }, [holidays]);

  // Define public holidays (you can customize this list)
  const publicHolidays = [
    new Date(2025, 11, 25), // Christmas Day - Dec 25, 2025
    // new Date(2025, 11, 26), // Boxing Day - Dec 26, 2025
    new Date(2025, 0, 1), // New Year's Day - Jan 1, 2025
    new Date(2025, 0, 26), // Republic Day - Jan 26, 2025
    new Date(2025, 7, 15), // Independence Day - Aug 15, 2025
    new Date(2025, 9, 2), // Gandhi Jayanti - Oct 2, 2025
    // Add more holidays as needed
  ];

  // Function to check if a date is a weekend (Saturday or Sunday)
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  // Function to check if a date is a public holiday
  const isPublicHoliday = (date: Date) => {
    return publicHolidays.some(
      (holiday) =>
        holiday.getDate() === date.getDate() &&
        holiday.getMonth() === date.getMonth() &&
        holiday.getFullYear() === date.getFullYear()
    );
  };

  // Function to calculate working days between two dates
  const calculateWorkingDays = (fromDate: Date, toDate: Date) => {
    if (!fromDate || !toDate) return 0;

    let workingDays = 0;
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      if (!isWeekend(currentDate) && !isPublicHoliday(currentDate)) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  };

  // Parse user info and extract leave balances
  const userLeaveData = useMemo(() => {
    if (!userInfo) return null;

    try {
      const parsedData = JSON.parse(userInfo);
      return parsedData;
    } catch (error) {
      console.error("Error parsing user info:", error);
      return null;
    }
  }, [userInfo]);

  // Get leave types with balances based on user role
  const availableLeaveTypes = useMemo(() => {
    if (!userLeaveData) return [];

    if (user?.role === "INTERN") {
      return internLeaveTypes.map((type) => ({
        ...type,
        balance: userLeaveData[type.value] || 0,
      }));
    } else {
      return leaveTypes.map((type) => ({
        ...type,
        balance: userLeaveData[type.value] || 0,
      }));
    }
  }, [userLeaveData, user?.role]);

  // console.log("User Info:", userInfo);
  // console.log("Parsed User Data:", userLeaveData);
  // console.log("Available Leave Types with Balance:", availableLeaveTypes);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  });

  const handleFloaterHolidaySelect = (holiday: Holiday) => {
    const holidayStatus = getHolidayStatus(holiday.date);

    // Prevent selection of past holidays
    if (holidayStatus === "past") {
      toast.error("Cannot select past holidays for floater leave");
      return;
    }

    const holidayDate = new Date(holiday.date);

    // Set the leave type to floater leave
    form.setValue("leave_type", "floater_leave");

    // Set both from and to date to the holiday date (single day leave)
    form.setValue("from_date", holidayDate);
    form.setValue("to_date", holidayDate);

    // Pre-fill reason with holiday name
    form.setValue("reason", `Floater leave for ${holiday.name}`);

    // Close the holiday modal
    setIsHolidayModalOpen(false);

    // Show success toast
    toast.success(`Selected ${holiday.name} for floater leave`);

    // Trigger form validation
    form.trigger();
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error("You need to be logged in to request leave");
      return;
    }
    // console.log(values);

    setIsSubmitting(true);
    try {
      const selectedLeaveType = leaveTypes.find(
        (type) => type.value === values.leave_type
      );
      if (!selectedLeaveType) {
        toast.error("Invalid leave type selected");
        return;
      }

      console.log("Selected leave type:", selectedLeaveType.id);
      let leaveData;
      let halfDay = values.halfDay;

      // Force full day if leave type is floater
      if (
        values.leave_type === "floater_leave" ||
        values.from_date.toDateString() != values.to_date.toDateString()
      ) {
        halfDay = "none";
      }
      if (values.from_date.toDateString() === values.to_date.toDateString()) {
        leaveData = {
          emp_id: user.empId,
          leave_type_id: selectedLeaveType.id,
          from_date: format(values.from_date, "yyyy-MM-dd"),
          to_date: format(values.to_date, "yyyy-MM-dd"),
          reason: values.reason,
          halfDay,
        };
      } else {
        leaveData = {
          emp_id: user.empId,
          leave_type_id: selectedLeaveType.id,
          from_date: format(values.from_date, "yyyy-MM-dd"),
          to_date: format(values.to_date, "yyyy-MM-dd"),
          reason: values.reason,
          halfDay,
        };
      }
      console.log("Submitting leave request with values:", leaveData);
      await requestLeave(leaveData);
      form.reset();
      // toast.info(res);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error requesting leave:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Request Leave</CardTitle>
            <CardDescription>
              Fill in the details to request a leave
            </CardDescription>
          </div>

          {/* Holiday List Button */}
          <Dialog
            open={isHolidayModalOpen}
            onOpenChange={setIsHolidayModalOpen}
          >
            {user.role !== "INTERN" && (
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <CalendarCheck className="h-4 w-4" />
                  View Floater Holidays
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="max-w-4xl h-[80dvh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-blue-600" />
                  Floater Holiday Calendar 2025
                </DialogTitle>
                <DialogDescription>
                  Company holidays and observances
                  <div className="flex items-center gap-6 mt-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span>Past (Not selectable)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Current Month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Upcoming</span>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-y-auto max-h-[60vh] pr-2">
                {holidaysLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">
                      Loading holidays...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(holidaysByMonth).map(
                      ([month, monthHolidays]) => (
                        <div key={month}>
                          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <CalendarCheck className="h-5 w-5 text-blue-600" />
                            {month}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {monthHolidays.map((holiday, index) => {
                              const status = getHolidayStatus(holiday.date);
                              const styles = getHolidayStyles(status);
                              const isPastHoliday = status === "past";

                              return (
                                <div
                                  key={index}
                                  onClick={() =>
                                    !isPastHoliday &&
                                    handleFloaterHolidaySelect(holiday)
                                  }
                                  className={styles.containerClass}
                                  title={
                                    isPastHoliday
                                      ? "This holiday has already passed"
                                      : "Click to select this holiday"
                                  }
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className={styles.titleClass}>
                                        {holiday.name}
                                        {isPastHoliday && (
                                          <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                            Past
                                          </span>
                                        )}
                                        {status === "current" && (
                                          <span className="ml-2 text-xs bg-green-200 text-green-700 px-2 py-1 rounded">
                                            This Month
                                          </span>
                                        )}
                                      </h4>
                                      <p className={styles.dateClass}>
                                        {formatHolidayDate(holiday.date)}
                                      </p>
                                    </div>
                                    <div
                                      className={styles.indicatorClass}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Total holidays: {holidays.length}
                </p>
                <Button onClick={() => setIsHolidayModalOpen(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="leave_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableLeaveTypes.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          disabled={type.balance === 0}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span>{type.label}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {type.balance}{" "}
                              {type.balance === 1 ? "day" : "days"} available
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Date Range Selector */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="text-left">
                  <div className="text-sm text-gray-500">From</div>
                  <div className="font-medium">
                    {form.watch("from_date")
                      ? format(form.watch("from_date"), "dd MMM, yyyy")
                      : "Select date"}
                  </div>
                </div>

                {form.watch("from_date") && form.watch("to_date") && (
                  <div className="flex flex-col items-center px-4 py-2 bg-purple-100 rounded-lg">
                    <div className="text-lg font-semibold text-purple-700">
                      {calculateWorkingDays(
                        form.watch("from_date"),
                        form.watch("to_date")
                      )}{" "}
                      days
                    </div>
                  </div>
                )}

                <div className="text-right">
                  <div className="text-sm text-gray-500">To</div>
                  <div className="font-medium">
                    {form.watch("to_date")
                      ? format(form.watch("to_date"), "dd MMM, yyyy")
                      : "Select date"}
                  </div>
                </div>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-fit justify-start text-left font-normal"
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("from_date") && form.watch("to_date")
                      ? `${format(
                          form.watch("from_date"),
                          "dd MMM"
                        )} - ${format(form.watch("to_date"), "dd MMM, yyyy")}`
                      : "Pick date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: form.watch("from_date"),
                      to: form.watch("to_date"),
                    }}
                    onSelect={(range) => {
                      if (range?.from) {
                        form.setValue("from_date", range.from);
                      }
                      if (range?.to) {
                        form.setValue("to_date", range.to);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>

              {/* Show working days info */}
              {form.watch("from_date") && form.watch("to_date") && (
                <div className="text-sm text-gray-600 mt-2 ">
                  <div className="flex gap-2">
                    <div>
                      Working days:{" "}
                      {calculateWorkingDays(
                        form.watch("from_date"),
                        form.watch("to_date")
                      )}
                    </div>
                    <div>
                      Total days:{" "}
                      {Math.ceil(
                        (form.watch("to_date").getTime() -
                          form.watch("from_date").getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1}
                    </div>
                  </div>

                  {form.watch("leave_type") && (
                    <div className="mt-1">
                      {(() => {
                        const selectedType = availableLeaveTypes.find(
                          (t) => t.value === form.watch("leave_type")
                        );
                        const workingDays = calculateWorkingDays(
                          form.watch("from_date"),
                          form.watch("to_date")
                        );
                        const available = selectedType?.balance || 0;

                        if (workingDays > available) {
                          return (
                            <div className="text-red-600 font-medium">
                              Insufficient balance! Available: {available} days
                            </div>
                          );
                        } else if (workingDays === available) {
                          return (
                            <div className="text-orange-600">
                              Using all available balance
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-green-600">
                              Remaining balance will be:{" "}
                              {available - workingDays} days <br />
                              <b className="">
                                Note: after approval leave count will be
                                deducted
                              </b>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Hidden form fields for validation */}
              <FormField
                control={form.control}
                name="from_date"
                render={() => <FormMessage />}
              />

              <FormField
                control={form.control}
                name="to_date"
                render={() => <FormMessage />}
              />
            </div>

            <FormField
              control={form.control}
              name="halfDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Half Day Option</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={
                      isSubmitting ||
                      !form.watch("from_date") ||
                      !form.watch("to_date") ||
                      form.watch("leave_type") === "floater_leave" ||
                      form.watch("from_date").toDateString() !==
                        form.watch("to_date").toDateString()
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Half Day Option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="full_day">Full Day</SelectItem>
                      <SelectItem value="first_half">First Half</SelectItem>
                      <SelectItem value="second_half">Second Half</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a reason for your leave request"
                      className="resize-none"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
            <p className="text-center ">
              To Download Leave Policy{" "}
              <a
                download="/public/Leave_Management_System_Policy_Document.pdf"
                href="#"
                className="text-blue-500 font-semibold"
              >
                click here
              </a>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LeaveRequestForm;
