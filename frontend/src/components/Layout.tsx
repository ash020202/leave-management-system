import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "@/services/api";
import { getCurrentUser } from "@/utils/auth";
import {
  CalendarIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  UserIcon,
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

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isManager = user?.role === "MANAGER" || user?.role === "SENIOR_MANAGER";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const managerNavItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboardIcon className="h-5 w-5" />,
      href: isManager ? "/manager-dashboard" : "/dashboard",
    },
    {
      title: "Calendar",
      icon: <CalendarIcon className="h-5 w-5" />,
      href: "/calendar",
    },
    // {
    //   title: "My Team Leaves",
    //   icon: <CalendarIcon className="h-5 w-5" />,
    //   href: "/my-team-leaves",
    // },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main content */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6">
          <p className="font-semibold md:text-3xl text-sm text-primary">
            <Link to={isManager ? "/manager-dashboard" : "/dashboard"}>
              Leave Management Dashboard
            </Link>
          </p>

          <div className="ml-auto flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(user?.emp_name || "User")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
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
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>

        {/* Bottom Navigation Bar - Fixed and Centered */}
        {isManager && (
          <div className="fixed bottom-4 left-0 w-full flex justify-center z-50">
            <div className="bg-white shadow-lg rounded-full px-2 py-1 flex items-center justify-center border border-gray-200">
              {managerNavItems.map((item) => {
                const isActive = window.location.pathname === item.href;
                return (
                  <Button
                    key={item.title}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
                      isActive
                        ? "bg-primary text-white font-medium hover:bg-primary hover:text-white"
                        : "text-gray-600"
                    )}
                    onClick={() => {
                      navigate(item.href);
                    }}
                  >
                    <span
                      className={cn(
                        "",
                        isActive ? "text-white" : "text-gray-600"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={cn(
                        "",
                        isActive ? "text-white" : "text-gray-600"
                      )}
                    >
                      {item.title}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
