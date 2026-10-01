export const TON_PROTOCOL = 'ton://';
export const TONCONNECT_PROTOCOL = 'tc://';
export const TONCONNECT_PROTOCOL_SELF = process.env.TONCONNECT_PROTOCOL_SELF || 'mytonwallet-tc://';
export const SELF_PROTOCOL = process.env.SELF_PROTOCOL || 'mtw://';
export const SELF_UNIVERSAL_URLS = process.env.SELF_UNIVERSAL_URLS
  ? process.env.SELF_UNIVERSAL_URLS.split(' ')
  : ['https://my.tt', 'https://go.mytonwallet.org'];
export const TONCONNECT_UNIVERSAL_URL = process.env.TONCONNECT_UNIVERSAL_URL || 'https://connect.mytonwallet.org';
export const CHECKIN_URL = 'https://checkin.mytonwallet.org';
