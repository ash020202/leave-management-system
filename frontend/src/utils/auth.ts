import { jwtDecode } from "jwt-decode";
import CryptoJS from "crypto-js";
interface DecodedToken {
  emp_name: string;
  department: string;
  email: string;
  empId: string;
  name: string;
  role: "INTERN" | "EMPLOYEE" | "MANAGER" | "SENIOR_MANAGER";
  exp: number;
}

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
      // Token has expired
      localStorage.removeItem("token");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error decoding token:", error);
    localStorage.removeItem("token");
    return false;
  }
};

export const getCurrentUser = (): DecodedToken | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
      // Token has expired
      localStorage.removeItem("token");
      return null;
    }
    // console.log(decoded);

    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error);
    localStorage.removeItem("token");
    return null;
  }
};

export const hasRole = (requiredRoles: string[]): boolean => {
  const user = getCurrentUser();
  if (!user) return false;

  return requiredRoles.includes(user.role);
};

export const encryptPassword = (password: string) => {
  const secretKey = import.meta.env.VITE_PWD_SECRET_KEY;
  // console.log("Secret Key:", secretKey);

  const encryptedPassword = CryptoJS.AES.encrypt(
    password,
    secretKey
  ).toString();
  // console.log(encryptedPassword);

  return encryptedPassword;
};
