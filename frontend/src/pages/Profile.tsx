import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/utils/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CalendarIcon, UserRoundIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type UserInfo = {
  emp_id: number;
  emp_name: string;
  department: string;
  sick_leave: number;
  loss_of_pay: number;
  floater_leave: number;
  earned_leave: number;
  total_leave_balance: number;
  manager_name: string;
  sr_manager_name: string;
};

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  useEffect(() => {
    setUserInfo(JSON.parse(localStorage.getItem("user-info")));
  }, []);
  //   console.log(userInfo);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // In a real application, you would make an API call here to update the user profile
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
    setIsEditing(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "MANAGER":
        return <Badge className="bg-blue-500">Manager</Badge>;
      case "SENIOR_MANAGER":
        return <Badge className="bg-purple-500">Senior Manager</Badge>;
      case "EMPLOYEE":
        return <Badge className="bg-green-500">Employee</Badge>;
      case "INTERN":
        return <Badge className="bg-yellow-500">Intern</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            View and manage your profile information
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-2  h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserRoundIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Profile Information</CardTitle>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button type="submit">Save Changes</Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4 ">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Full Name
                      </h3>
                      <p className="mt-1 text-base">{userInfo?.emp_name}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Department
                      </h3>
                      <p className="mt-1 text-base">{userInfo?.department}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Employee ID
                      </h3>
                      <p className="mt-1 text-base">{userInfo?.emp_id}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Role
                      </h3>
                      <div className="mt-1">
                        {getRoleBadge(user?.role || "")}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Manager Name
                      </h3>
                      <div className="mt-1">{userInfo?.manager_name}</div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Senior Manager Name
                      </h3>
                      <div className="mt-1">{userInfo?.sr_manager_name}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className=" h-[330px] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <CardTitle>Leave Summary</CardTitle>
              </div>
              <CardDescription>Your current leave Balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Sick Leave
                  </h3>
                  <div className="mt-1 flex justify-between items-center">
                    <span className="text-2xl font-semibold">
                      {userInfo?.sick_leave}
                    </span>
                    <div className="leave-sick rounded-md w-3 h-3"></div>
                  </div>
                  <Separator className="my-2" />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Earned Leave
                  </h3>
                  <div className="mt-1 flex justify-between items-center">
                    <span className="text-2xl font-semibold">
                      {userInfo?.earned_leave}
                    </span>
                    <div className="leave-earned rounded-md w-3 h-3"></div>
                  </div>
                  <Separator className="my-2" />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Floater Leave
                  </h3>
                  <div className="mt-1 flex justify-between items-center">
                    <span className="text-2xl font-semibold">
                      {userInfo?.floater_leave}
                    </span>
                    <div className="leave-floater rounded-md w-3 h-3"></div>
                  </div>
                  <Separator className="my-2" />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Loss of Pay
                  </h3>
                  <div className="mt-1 flex justify-between items-center">
                    <span className="text-2xl font-semibold">
                      {userInfo?.loss_of_pay}
                    </span>
                    <div className="leave-loss-pay rounded-md w-3 h-3"></div>
                  </div>
                </div>
                <div className=" text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Total Leave Balance
                  </h3>

                  <p className="text-2xl font-semibold text-center">
                    {userInfo?.total_leave_balance}
                  </p>
                </div>
                {user.role === "MANAGER" ||
                  (user.role === "SENIOR_MANAGER" && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => navigate("/calendar")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      View Calendar
                    </Button>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
