// lib/config/deployments.ts
import { FeatureFlags, defaultFeatureFlags } from './settings';

export type DeploymentType = 'full' | 'traffic-only' | 'threed-only' | 'music-only' | 'minimal';

export interface DeploymentConfig {
  name: string;
  description: string;
  flags: Partial<FeatureFlags>;
}

export const deploymentConfigs: Record<DeploymentType, DeploymentConfig> = {
  'full': {
    name: 'Full Installation',
    description: 'All modules and services enabled',
    flags: defaultFeatureFlags,
  },
  'traffic-only': {
    name: 'Traffic Only',
    description: 'Only traffic monitoring module',
    flags: {
      modules: {
        traffic: { ...defaultFeatureFlags.modules.traffic },
        threed: { enabled: false, services: defaultFeatureFlags.modules.threed.services },
        music: { enabled: false, services: defaultFeatureFlags.modules.music.services },
      },
    },
  },
  'threed-only': {
    name: 'ThreeD Only',
    description: 'Only garden management module',
    flags: {
      modules: {
        traffic: { enabled: false, services: defaultFeatureFlags.modules.traffic.services },
        threed: { ...defaultFeatureFlags.modules.threed },
        music: { enabled: false, services: defaultFeatureFlags.modules.music.services },
      },
    },
  },
  'music-only': {
    name: 'Music Only',
    description: 'Only music streaming module',
    flags: {
      modules: {
        traffic: { enabled: false, services: defaultFeatureFlags.modules.traffic.services },
        threed: { enabled: false, services: defaultFeatureFlags.modules.threed.services },
        music: { ...defaultFeatureFlags.modules.music },
      },
    },
  },
  'minimal': {
    name: 'Minimal Installation',
    description: 'Core only, no external services',
    flags: {
      modules: {
        traffic: { enabled: false, services: defaultFeatureFlags.modules.traffic.services },
        threed: { enabled: false, services: defaultFeatureFlags.modules.threed.services },
        music: { enabled: false, services: defaultFeatureFlags.modules.music.services },
      },
      features: {
        polling: false,
        cronJobs: false,
        dashboard: true,
        apiDocs: false,
      },
    },
  },
};

/**
 * Get deployment configuration by type
 */
export function getDeploymentConfig(type: DeploymentType): DeploymentConfig {
  return deploymentConfigs[type] || deploymentConfigs['full'];
}

/**
 * Load deployment from environment variable
 */
export function loadDeploymentConfig(): DeploymentConfig {
  const type = process.env.DEPLOYMENT_TYPE as DeploymentType || 'full';
  return getDeploymentConfig(type);
}