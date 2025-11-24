export function getDefaultRouteForRole(role: string): string {
  role = role.toLowerCase().trim();

  switch (role) {
    case "admin":
      return "/dashboard/admindashboard";
    case "superuser":
      return "/dashboard/superuserdashboard";
    case "manager":
      return "/dashboard/managerdashboard";
    case "sales":
      return "/dashboard/salesdashboard";
    case "supervisor":
      return "/dashboard/supervisordashboard";
    case "customer":
      return "/dashboard/customerdashboard";
    default:
      return "/";
  }
}
