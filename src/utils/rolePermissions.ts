/**
 * Role Permission Utilities
 * Centralized role-based permission management
 */

// Roles yang diizinkan untuk create DO
const CREATE_DO_ROLES = ["SUPERVISOR", "MANAGER", "superadmin"];

// Roles yang diizinkan untuk approve DO
const APPROVE_DO_ROLES = ["SUPERVISOR", "MANAGER"];

// Roles yang diizinkan untuk cancel DO
const CANCEL_DO_ROLES = ["SUPERVISOR", "MANAGER", "superadmin"];

/**
 * Check apakah role saat ini memiliki permission untuk create DO
 * @param roleName - Role name dari user yang login
 * @returns boolean - true jika role diizinkan create DO
 */
export const canCreateDO = (roleName: string | null): boolean => {
  if (!roleName) return false;
  return CREATE_DO_ROLES.includes(roleName);
};

/**
 * Check apakah role saat ini memiliki permission untuk approve DO
 * @param roleName - Role name dari user yang login
 * @returns boolean - true jika role diizinkan approve DO
 */
export const canApproveDO = (roleName: string | null): boolean => {
  if (!roleName) return false;
  return APPROVE_DO_ROLES.includes(roleName);
};

/**
 * Check apakah role saat ini memiliki permission untuk cancel DO
 * @param roleName - Role name dari user yang login
 * @returns boolean - true jika role diizinkan cancel DO
 */
export const canCancelDO = (roleName: string | null): boolean => {
  if (!roleName) return false;
  return CANCEL_DO_ROLES.includes(roleName);
};

/**
 * Get current user role from localStorage
 * @returns string | null - Role name atau null jika tidak ada
 */
export const getCurrentRole = (): string | null => {
  return localStorage.getItem("role_name");
};

/**
 * Check apakah role termasuk dalam daftar roles tertentu
 * @param roleName - Role name yang akan dicek
 * @param allowedRoles - Array role yang diizinkan
 * @returns boolean - true jika role termasuk dalam allowedRoles
 */
export const hasRole = (
  roleName: string | null,
  allowedRoles: string[]
): boolean => {
  if (!roleName) return false;
  return allowedRoles.includes(roleName);
};
