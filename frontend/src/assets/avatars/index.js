import avatar01 from './avatar_01.svg';
import avatar02 from './avatar_02.svg';
import avatar03 from './avatar_03.svg';
import avatar04 from './avatar_04.svg';
import avatar05 from './avatar_05.svg';
import avatar06 from './avatar_06.svg';
import avatar07 from './avatar_07.svg';
import avatar08 from './avatar_08.svg';
import avatar09 from './avatar_09.svg';
import avatar10 from './avatar_10.svg';

export const AVATAR_PRESETS = [
  { id: 'avatar_01', name: 'Civic Leader', src: avatar01 },
  { id: 'avatar_02', name: 'Community Advocate', src: avatar02 },
  { id: 'avatar_03', name: 'Field Specialist', src: avatar03 },
  { id: 'avatar_04', name: 'Senior Advisor', src: avatar04 },
  { id: 'avatar_05', name: 'Tech Citizen', src: avatar05 },
  { id: 'avatar_06', name: 'Community Organizer', src: avatar06 },
  { id: 'avatar_07', name: 'Youth Volunteer', src: avatar07 },
  { id: 'avatar_08', name: 'Public Servant', src: avatar08 },
  { id: 'avatar_09', name: 'Eco Champion', src: avatar09 },
  { id: 'avatar_10', name: 'Active Resident', src: avatar10 }
];

export const DEFAULT_AVATAR_PRESET = 'avatar_01';

const presetMap = {
  avatar_01: avatar01,
  avatar_02: avatar02,
  avatar_03: avatar03,
  avatar_04: avatar04,
  avatar_05: avatar05,
  avatar_06: avatar06,
  avatar_07: avatar07,
  avatar_08: avatar08,
  avatar_09: avatar09,
  avatar_10: avatar10
};

export function getPresetAvatar(presetId) {
  if (!presetId) return avatar01;
  return presetMap[presetId] || avatar01;
}

export default AVATAR_PRESETS;
