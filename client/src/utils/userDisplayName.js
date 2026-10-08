import { isAdministrator } from './access';

export function userDisplayName(user, fallback = 'CRM User') {
  const name = String(user?.fullName || '').trim();
  return isAdministrator(user) && name.toLowerCase() === 'administrator'
    ? 'Yashwant Jagtap'
    : name || fallback;
}
