const EMPLOYEE_ROLES = {
  INTERN: "INTERN",
  EMPLOYEE: "EMPLOYEE",
  MANAGER: "MANAGER",
  SENIOR_MANAGER: "SENIOR_MANAGER",
};

export const EmployeeConstants = {
  EMPLOYEE_ROLES,
  DEFAULT_POLICIES: {
    [EMPLOYEE_ROLES.SENIOR_MANAGER]: {
      monthly_limit: 3,
      annual_limit: 36,
    },
    [EMPLOYEE_ROLES.MANAGER]: {
      monthly_limit: 3,
      annual_limit: 30,
    },
    [EMPLOYEE_ROLES.EMPLOYEE]: {
      monthly_limit: 3,
      annual_limit: 24,
    },
    [EMPLOYEE_ROLES.INTERN]: {
      monthly_limit: 1,
      annual_limit: 12,
    },
  },
};
