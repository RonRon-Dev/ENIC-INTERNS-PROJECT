export const registrationRejectReasons = [
  'Invalid information',
  'Duplicate account',
  'Not authorized / not part of organization',
  'Missing requirements/documents',
  'Other (contact administrator)',
] as const

export const resetPasswordRejectReasons = [
  'Identity cannot be verified',
  'Request already approved recently',
  'Suspicious activity / security concern',
  'User must contact administrator directly',
  'Other (contact administrator)',
] as const
