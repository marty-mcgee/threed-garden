export interface FarmBotMqttCredentialMetadata {
  mqttHost: string;
  mqttWsUrl: string;
  brokerDeviceId: string;
  vhost: string;
  tokenIssuedAt: Date;
  tokenExpiresAt: Date;
}

export type FarmBotMqttReadinessIssue =
  | 'credential_not_configured'
  | 'identity_not_verified'
  | 'identity_mismatch'
  | 'token_expired'
  | 'snapshot_missing'
  | 'snapshot_outdated'
  | 'rest_verification_required';

export interface FarmBotMqttReadinessSnapshot {
  mqttHost: string;
  mqttWsUrl: string;
  brokerDeviceId: string;
  vhost: string;
  tokenIssuedAt: Date;
  tokenExpiresAt: Date;
  restVerifiedAt: Date | null;
}

export interface FarmBotMqttReadiness {
  ready: boolean;
  checkedAt: Date;
  farmbotDeviceId: number | null;
  brokerDeviceId: string | null;
  mqttHost: string | null;
  mqttWsUrl: string | null;
  tokenExpiresAt: Date | null;
  restVerifiedAt: Date | null;
  issues: FarmBotMqttReadinessIssue[];
}

function sameDate(left: Date, right: Date): boolean {
  return left.getTime() === right.getTime();
}

export function evaluateFarmBotMqttReadiness(input: {
  checkedAt: Date;
  credentialMetadata: FarmBotMqttCredentialMetadata | null;
  farmbotDeviceId: number | null;
  brokerDeviceId: string | null;
  snapshot: FarmBotMqttReadinessSnapshot | null;
}): FarmBotMqttReadiness {
  const issues: FarmBotMqttReadinessIssue[] = [];
  const { checkedAt, credentialMetadata, farmbotDeviceId, brokerDeviceId, snapshot } = input;

  if (!credentialMetadata) issues.push('credential_not_configured');
  if (farmbotDeviceId === null || brokerDeviceId === null) {
    issues.push('identity_not_verified');
  } else if (brokerDeviceId !== `device_${farmbotDeviceId}`
    || credentialMetadata?.brokerDeviceId !== brokerDeviceId) {
    issues.push('identity_mismatch');
  }

  if (credentialMetadata && credentialMetadata.tokenExpiresAt <= checkedAt) {
    issues.push('token_expired');
  }
  if (!snapshot) {
    issues.push('snapshot_missing');
  } else {
    if (!credentialMetadata
      || snapshot.mqttHost !== credentialMetadata.mqttHost
      || snapshot.mqttWsUrl !== credentialMetadata.mqttWsUrl
      || snapshot.brokerDeviceId !== credentialMetadata.brokerDeviceId
      || snapshot.vhost !== credentialMetadata.vhost
      || !sameDate(snapshot.tokenIssuedAt, credentialMetadata.tokenIssuedAt)
      || !sameDate(snapshot.tokenExpiresAt, credentialMetadata.tokenExpiresAt)) {
      issues.push('snapshot_outdated');
    }
    if (!snapshot.restVerifiedAt) issues.push('rest_verification_required');
  }

  return {
    ready: issues.length === 0,
    checkedAt,
    farmbotDeviceId,
    brokerDeviceId,
    mqttHost: snapshot?.mqttHost ?? credentialMetadata?.mqttHost ?? null,
    mqttWsUrl: snapshot?.mqttWsUrl ?? credentialMetadata?.mqttWsUrl ?? null,
    tokenExpiresAt: credentialMetadata?.tokenExpiresAt ?? null,
    restVerifiedAt: snapshot?.restVerifiedAt ?? null,
    issues,
  };
}
