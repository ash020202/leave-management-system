import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // console.log(decoded);

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

export const checkOwnership = (req, res, next) => {
  const { emp_id } = req.params;
  const { empId, role } = req.user;

  if (
    parseInt(emp_id) !== empId &&
    (role !== "SENIOR_MANAGER" || role !== "MANAGER")
  ) {
    return res
      .status(403)
      .json({ message: "Access denied: not your resource" });
  }

  next();
};
