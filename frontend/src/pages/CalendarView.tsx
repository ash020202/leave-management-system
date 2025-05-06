
import Layout from "@/components/Layout";
import LeaveCalendar from "@/components/LeaveCalendar";

const CalendarView = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leave Calendar</h1>
          <p className="text-muted-foreground">
            View all approved leaves in calendar format
          </p>
        </div>
        
        <LeaveCalendar />
      </div>
    </Layout>
  );
};

export default CalendarView;
