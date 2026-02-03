import { useAuth } from "./useAuth";

export interface UserPermissions {
  canManageUsers?: boolean;
  canEditFormulas?: boolean;
  canViewLeads?: boolean;
  canManageLeads?: boolean;
  canManageCalendar?: boolean;
  canAccessDesign?: boolean;
  canViewStats?: boolean;
  canManageSettings?: boolean;
  canCreateWebsites?: boolean;
  canManageWebsites?: boolean;
  canAccessAI?: boolean;
  canUseMeasureMap?: boolean;
  canCreateUpsells?: boolean;
  canAccessZapier?: boolean;
  canManageEmailTemplates?: boolean;
  canViewReports?: boolean;
  canExportData?: boolean;
  canManageTeam?: boolean;
  canManageBilling?: boolean;
  canAccessAPI?: boolean;
  canManageIntegrations?: boolean;
  canCustomizeBranding?: boolean;
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
        canManageLeads: true,
        canManageCalendar: true,
        canAccessDesign: true,
        canViewStats: true,
        canManageSettings: true,
        canCreateWebsites: true,
        canManageWebsites: true,
        canAccessAI: true,
        canUseMeasureMap: true,
        canCreateUpsells: true,
        canAccessZapier: true,
        canManageEmailTemplates: true,
        canViewReports: true,
        canExportData: true,
        canManageTeam: true,
        canManageBilling: true,
        canAccessAPI: true,
        canManageIntegrations: true,
        canCustomizeBranding: true,
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
