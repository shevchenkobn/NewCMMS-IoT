import * as config from 'config';

const token = config.get<string>('token');
export function getProtectedData(tag: any) {
  return tag.uid.startsWith('08:') ? token : null;
}
