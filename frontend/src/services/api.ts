import { encryptPassword } from "@/utils/auth";
import { toast } from "sonner";

// const API_URL = "http://localhost:5000/api"; // Replace with your actual API URL
const API_URL = "https://leave-management-system-h1jv.onrender.com/api";

// Types
export interface User {
  id: string;
  email: string;
  emp_id: string;
  name: string;
  role: "INTERN" | "EMPLOYEE" | "MANAGER" | "SENIOR_MANAGER";
}

export interface LeaveRequest {
  leave_req_id: string;
  emp_id: string;
  leave_type: "sick_leave" | "earned_leave" | "floater_leave" | "loss_of_pay";
  from_date: string;
  to_date: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  rejection_reason?: string;
  created_at: string;
  emp_name?: string;
}

export interface LeaveBalance {
  sick_leave: number;
  earned_leave: number;
  floater_leave: number;
  loss_of_pay: number;
}

// Auth Functions
export const signUp = async (
  email: string,
  password: string,
  emp_id: string,
  name: string
) => {
  try {
    const response = await fetch(`${API_URL}/auth/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, emp_id, name }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to sign up");
    }

    return data;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An error occurred during signup";
    toast.error(message);
    throw error;
  }
};

export const login = async (email: string, password: string) => {
  const encryptPwd = encryptPassword(password);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password: encryptPwd }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to login");
    }

    // Save token to localStorage
    localStorage.setItem("token", data.token);

    return data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An error occurred during login";
    toast.error(message);
    throw error;
  }
};

export const userProfile = async (emp_id) => {
  try {
    const result = await fetch(`${API_URL}/employees/user-fetch/${emp_id}`);

    const data = await result.json();
    if (!result.ok) {
      throw new Error(data.error || "Failed to cancel leave");
    }

    toast.success("User Profile Loaded");
    return data;
  } catch (error) {
    toast.error("You are not authenticated");
    console.log(error);
    throw error;
  }
};
// userProfile(1);

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user-info");
  window.location.href = "/";
};

// Helper function to get the auth header
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("You are not authenticated");
    logout();
    throw new Error("Not authenticated");
  }
  return { Authorization: `Bearer ${token}` };
};

// Leave Functions
export const getHolidays = async () => {
  try {
    const response = await fetch(`${API_URL}/leave/get-public-holidays`, {
      headers: {
        ...getAuthHeader(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch holidays");
    }

    return data;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An error occurred fetching holidays";
    toast.error(message);
    throw error;
  }
};
export const requestLeave = async (leaveData: {
  emp_id: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  reason: string;
}) => {
  try {
    const response = await fetch(`${API_URL}/leave/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(leaveData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to request leave");
    }

    toast.success(data.message);
    return data;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An error occurred requesting leave";
    toast.error(message);
    throw error;
  }
};

export const cancelLeave = async (emp_id: string, leave_req_id: string) => {
  try {
    const response = await fetch(`${API_URL}/leave/cancel/${emp_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ leave_req_id }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to cancel leave");
    }

    toast.success("Leave cancelled successfully");
    return data;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An error occurred cancelling leave";
    toast.error(message);
    throw error;
  }
};

export const getLeaveBalance = async (emp_id: string) => {
  try {
    // console.log(emp_id);

    const response = await fetch(`${API_URL}/leave/balance/${emp_id}`, {
      headers: {
        ...getAuthHeader(),
      },
    });

    const data = await response.json();
    // console.log(data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch leave balance");
    }

    return data as LeaveBalance;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An error occurred fetching leave balance";
    toast.error(message);
    throw error;
  }
};

export const getUserLeaves = async (emp_id: string) => {
  try {
    const response = await fetch(`${API_URL}/leave/user/${emp_id}`, {
      headers: {
        ...getAuthHeader(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch user leaves");
    }

    return data as LeaveRequest[];
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An error occurred fetching user leaves";
    toast.error(message);
    throw error;
  }
};

export const getManagerLeaves = async (emp_id: string) => {
  try {
    const response = await fetch(`${API_URL}/leave/manager/leaves/${emp_id}`, {
      headers: {
        ...getAuthHeader(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch team leaves");
    }

    return data as LeaveRequest[];
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An error occurred fetching team leaves";
    toast.error(message);
    throw error;
  }
};

export const updateLeaveStatus = async (
  emp_id: string,
  leave_req_id: string,
  newStatus: string,
  rejection_reason?: string
) => {
  try {
    const response = await fetch(`${API_URL}/leave/status/${emp_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        newStatus,
        leave_req_id,
        ...(rejection_reason && { rejection_reason }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update leave status");
    }

    toast.success(`Leave ${newStatus.toLowerCase()} successfully`);
    return data;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An error occurred updating leave";
    toast.error(message);
    throw error;
  }
};
