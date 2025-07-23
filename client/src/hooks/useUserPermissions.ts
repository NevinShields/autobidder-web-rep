import { useAuth } from "./useAuth";

export interface UserPermissions {
  canManageUsers?: boolean;
  canEditFormulas?: boolean;
  canViewLeads?: boolean;
  canManageCalendar?: boolean;
  canAccessDesign?: boolean;
  canViewStats?: boolean;
}

export function useUserPermissions() {
  const { user } = useAuth();

  const permissions: UserPermissions = user?.permissions || {};
  const isOwner = user?.userType === 'owner';
  const isEmployee = user?.userType === 'employee';

  // Owners have all permissions by default
  const effectivePermissions = isOwner 
    ? {
        canManageUsers: true,
        canEditFormulas: true,
        canViewLeads: true,
        canManageCalendar: true,
        canAccessDesign: true,
        canViewStats: true,
        ...permissions
      }
    : permissions;

  return {
    permissions: effectivePermissions,
    isOwner,
    isEmployee,
    canAccess: (permission: keyof UserPermissions) => 
      isOwner || effectivePermissions[permission] === true,
  };
}