import type { SessionCookiePayload } from '@/lib/auth-session';
import type { AutomobileStationAccount } from '@/types/automobiles';

// Local-only auth bypass. Enabled with NEXT_PUBLIC_AUTH_BYPASS=1; production builds
// ignore it because NODE_ENV is inlined as "production" there.
export const AUTH_BYPASS =
  process.env.NEXT_PUBLIC_AUTH_BYPASS === '1' && process.env.NODE_ENV !== 'production';

export const DEV_SESSION: SessionCookiePayload & {
  uid: string;
  openSpaceId: string;
  openSpaceName: string;
} = {
  id: 'dev-admin',
  name: 'Dev Admin',
  email: 'dev@sanchay.local',
  role: 'ADMIN',
  uid: 'dev-space',
  openSpaceId: 'dev-space',
  openSpaceName: 'Demo Space',
};

export const DEV_STATION_ACCOUNT: AutomobileStationAccount = {
  uid: 'dev-station',
  email: 'dev@sanchay.local',
  stationId: 'dev-station',
  stationName: 'Demo Station',
  role: 'ADMIN',
};
