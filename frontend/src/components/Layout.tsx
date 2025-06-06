import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "@/services/api";
import { getCurrentUser } from "@/utils/auth";
import {
  CalendarIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  UserIcon,
  HistoryIcon,
  MenuIcon,
  XIcon,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isManager = user?.role === "MANAGER" || user?.role === "SENIOR_MANAGER";
  const isEmployee = user?.role === "EMPLOYEE" || user?.role === "INTERN";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Navigation items based on role
  const getNavItems = () => {
    if (isManager) {
      return [
        {
          title: "Dashboard",
          icon: <LayoutDashboardIcon className="h-5 w-5" />,
          href: "/manager-dashboard",
        },
        {
          title: "Calendar",
          icon: <CalendarIcon className="h-5 w-5" />,
          href: "/calendar",
        },
        {
          title: "My Leave History",
          icon: <HistoryIcon className="h-5 w-5" />,
          href: "/leave-history",
        },
        {
          title: "My Team Leaves History",
          icon: <HistoryIcon className="h-5 w-5" />,
          href: "/my-team-leaves",
        },
        {
          title: "My team Leave Requests",
          icon: <Clock />,
          href: "/my-team-leave-requests",
        },
      ];
    } else if (isEmployee) {
      return [
        {
          title: "Dashboard",
          icon: <LayoutDashboardIcon className="h-5 w-5" />,
          href: "/dashboard",
        },
        {
          title: "Leave History",
          icon: <HistoryIcon className="h-5 w-5" />,
          href: "/leave-history",
        },
      ];
    }
    return [];
  };

  const navItems = getNavItems();
  const handleLogout = () => {
    logout();
  };

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const dashboardName = isManager
    ? "Manager Dashboard"
    : user?.role === "EMPLOYEE"
    ? "Employee Dashboard"
    : " Intern Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-primary">
              {dashboardName}
            </h2>
          </div>
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <XIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-white">
                {getInitials(user?.emp_name || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium text-gray-900 truncate "
                title={user?.emp_name}
              >
                {user?.emp_name || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role
                  ?.replace("_", " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <Button
                key={item.title}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11 px-4",
                  isActive
                    ? "bg-primary text-white shadow-sm hover:bg-primary/90"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
                onClick={() => {
                  navigate(item.href);
                  setSidebarOpen(false); // Close sidebar on mobile after navigation
                }}
              >
                <span className={cn(isActive ? "text-white" : "text-gray-500")}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.title}</span>
              </Button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-11 px-4"
              >
                <UserIcon className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-700">Account</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.emp_name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600"
                onClick={handleLogout}
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-0">
        {/* Topbar */}
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900 lg:text-2xl">
              Leave Management System
            </h1>
          </div>

          {/* Right side of topbar - you can add additional controls here */}
          <div className="flex items-center gap-2">
            {/* You can add notifications, search, etc. here */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-2">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
