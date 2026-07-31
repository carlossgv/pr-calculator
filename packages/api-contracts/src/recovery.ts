export type RecoveryStatusResponse = {
  configured: boolean;
  recoveryId: string | null;
};

export type RecoveryCredentialSetupRequest = {
  recoveryId: string;
  password: string;
};

export type RecoveryIdChangeRequest = {
  recoveryId: string;
};

export type RecoveryPasswordChangeRequest = {
  password: string;
};

export type RecoveryDeviceAttachRequest = {
  deviceId: string;
  deviceToken: string;
  recoveryId: string;
  password: string;
  replaceLocalData?: boolean;
};

export type RecoveryDeviceAttachResponse = {
  accountId: string;
  recoveryId: string;
};
