import { useQuery } from "@tanstack/react-query";

// Super admin email addresses
const SUPER_ADMIN_EMAILS = [
  "admin@autobidder.org",
  "shielnev11@gmail.com"
];

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isSuperAdmin: user && typeof user === 'object' && 'email' in user && user.email && SUPER_ADMIN_EMAILS.includes(user.email as string),
  };
}