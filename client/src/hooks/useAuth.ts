import { useQuery } from "@tanstack/react-query";

// Super admin email addresses
const SUPER_ADMIN_EMAILS = [
  "admin@autobidder.org",
  "shielnev11@gmail.com"
];

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });
      
      // Return null for 401s instead of throwing
      if (res.status === 401) {
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return res.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    isSuperAdmin: user && typeof user === 'object' && 'email' in user && user.email && SUPER_ADMIN_EMAILS.includes(user.email as string),
  };
}