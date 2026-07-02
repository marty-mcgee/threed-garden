// lib/schema/index.ts
// ============================================
// SCHEMA INDEX - Central export point
// ============================================

// Export all schemas
export * from './auth';
export * from './settings';
export * from './projects'; 
export * from './threed';
export * from './traffic';
export * from './music';

// ============================================
// AUTH TABLES
// ============================================

export {
  user,
  userAccounts,
  userSessions,
  userVerifications,
  userSettingsOverrides,
  userApiKeys,
  userAuditLogs,
} from './auth';

export type {
  User,
  NewUser,
  UserAccount,
  NewUserAccount,
  UserSession,
  NewUserSession,
  UserVerification,
  NewUserVerification,
  UserSettingOverride,
  NewUserSettingOverride,
  UserApiKey,
  NewUserApiKey,
  UserAuditLog,
  NewUserAuditLog,
} from './auth';

// ============================================
// SETTINGS TABLES
// ============================================

export {
  settings,
  settingsUserOverrides,
  settingsDeployment,
  settingsDeploymentHistory,
  settingsAuditLogs,
} from './settings';

export type {
  Setting,
  NewSetting,
  SettingUserOverride,
  NewSettingUserOverride,
  SettingDeployment,
  NewSettingDeployment,
  SettingDeploymentHistory,
  NewSettingDeploymentHistory,
  SettingAuditLog,
  NewSettingAuditLog,
} from './settings';

// ============================================
// PROJECTS TABLE
// ============================================

// Projects
export {
  projects,
} from './projects';

export type {
  Project,
  NewProject,
} from './projects';



// ============================================
// ### OLD CODE: NOTES
// ============================================

// // Threed module exports
// // export * from './threed/layers';
// // export * from './threed/markers';

// // Re-export for convenience
// // export { layers, markers, layerPresets, markerRelationships } from './threed';