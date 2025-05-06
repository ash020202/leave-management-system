import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, getCurrentUser } from "@/utils/auth";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CheckIcon } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      console.log(user.role);

      if (user) {
        if (user.role === "MANAGER" || user.role === "SENIOR_MANAGER") {
          navigate("/manager-dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    }
  }, [navigate]);

  const features = [
    {
      title: "Easy Leave Management",
      description:
        "Request leaves with just a few clicks. Specify leave type, duration, and reason all in one place.",
    },
    {
      title: "Real-time Leave Tracking",
      description:
        "Track your leave balances and history with real-time updates.",
    },
    {
      title: "Efficient Approval Process",
      description:
        "Managers can easily approve or reject leave requests with notifications to employees.",
    },
    {
      title: "Visual Calendar View",
      description:
        "See your team's leaves in an intuitive color-coded calendar view.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section */}
      <header className="bg-primary text-white">
        <div className="container mx-auto py-12 px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold">
                Leave Management System
              </h1>
              <p className="text-xl opacity-90">
                Simplify your organization's leave management with our intuitive
                system. Request, approve, and track leaves with ease.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Link to="/">Log In</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary"
                >
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            </div>
            <div className="w-full max-w-md">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
                <div className="flex items-center gap-4 mb-6">
                  <CalendarIcon className="h-10 w-10" />
                  <div>
                    <h3 className="text-xl font-bold">Leave Calendar</h3>
                    <p className="opacity-90">
                      Color-coded for quick visibility
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 28 }).map((_, i) => {
                    // Randomly assign leave classes to some days
                    const leaveClasses = [
                      "bg-[#F2FCE2] border-green-200",
                      "bg-[#D3E4FD] border-blue-200",
                      "bg-[#E5DEFF] border-purple-200",
                      "bg-red-50 border-red-200",
                    ];
                    const hasLeave = Math.random() > 0.7;
                    const leaveClass = hasLeave
                      ? leaveClasses[
                          Math.floor(Math.random() * leaveClasses.length)
                        ]
                      : "bg-white/20";

                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-md text-center flex items-center justify-center border ${leaveClass}`}
                      >
                        <span className={hasLeave ? "text-black" : ""}>
                          {i + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-lg p-6 border border-slate-100"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <CheckIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">
            Ready to simplify leave management?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of organizations that use our system to manage
            employee leaves efficiently.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/">Log In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-900 text-white mt-auto">
        <div className="container mx-auto text-center">
          <p className="text-slate-400">
            &copy; {new Date().getFullYear()} Leave Management System. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
