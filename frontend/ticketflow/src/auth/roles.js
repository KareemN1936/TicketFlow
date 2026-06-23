const roleAliases = {
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
  agent: "ITSupportAgent",
  "it support agent": "ITSupportAgent",
  itsupportagent: "ITSupportAgent",
};

export function getUserRoles(user) {
  const value = user?.roles ?? user?.role ?? user?.roleName ?? [];
  return (Array.isArray(value) ? value : [value])
    .map((role) => roleAliases[String(role).trim().toLowerCase()])
    .filter(Boolean);
}

export function getPrimaryRole(user) {
  return getUserRoles(user)[0] || "Employee";
}

export function userHasRole(user, role) {
  return getUserRoles(user).includes(role);
}
