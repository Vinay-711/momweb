import {
  getStoreOperatingStatus,
  getTimeInTimezone,
  getDefaultOperatingSchedule,
  formatTime12Hour,
  parseTimeToMinutes,
  DEFAULT_TIMEZONE,
  DEFAULT_CLOSED_EXPLANATION,
} from '../src/utils/operatingHoursUtils';
import { BusinessSettings, DayOperatingSchedule } from '../src/types';
import { INITIAL_BUSINESS_SETTINGS } from '../src/data/seedData';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ Passed: ${msg}`);
}

console.log('--- TEST 1: Timezone extraction for Asia/Kolkata ---');
// 2026-09-24T01:35:00+05:30 is 2026-09-23T20:05:00Z
const nightDate = new Date('2026-09-23T20:05:00Z');
const kolkataTime = getTimeInTimezone('Asia/Kolkata', nightDate);
assert(kolkataTime.dayOfWeek === 'thursday', `Expected Thursday in Kolkata, got ${kolkataTime.dayOfWeek}`);
assert(kolkataTime.timeString24 === '01:35', `Expected 01:35 in Kolkata, got ${kolkataTime.timeString24}`);
assert(kolkataTime.currentMinutes === 95, `Expected 95 minutes, got ${kolkataTime.currentMinutes}`);

console.log('--- TEST 2: Status at 01:35 AM IST (Outside 06:00 - 21:00) ---');
const settings: BusinessSettings = {
  ...INITIAL_BUSINESS_SETTINGS,
  opening_time: '06:00',
  closing_time: '21:00',
  timezone: 'Asia/Kolkata',
  operating_schedule: getDefaultOperatingSchedule('06:00', '21:00'),
  closed_notice: DEFAULT_CLOSED_EXPLANATION,
};

const statusNight = getStoreOperatingStatus(settings, nightDate);
assert(statusNight.isOpen === false, 'Store must be closed at 01:35 AM IST');
assert(statusNight.statusText === 'Currently Closed', 'Status text must be "Currently Closed"');
assert(statusNight.badgeLabel === 'Currently Closed', 'Badge label must be "Currently Closed"');
assert(statusNight.explanation === "We're currently closed. Please check our opening hours.", 'Explanation matches requirement');
assert(statusNight.todayHoursDisplay === '6:00 AM – 9:00 PM', 'Today hours formatted correctly');
assert(statusNight.nextOpenDisplay.includes('Opens today at 6:00 AM'), `Next open display correct: ${statusNight.nextOpenDisplay}`);

console.log('--- TEST 3: Status during open hours (10:30 AM IST) ---');
// 10:30 AM IST = 05:00 UTC
const dayDate = new Date('2026-09-24T05:00:00Z');
const statusDay = getStoreOperatingStatus(settings, dayDate);
assert(statusDay.isOpen === true, 'Store must be open at 10:30 AM IST');
assert(statusDay.statusText === 'Order Now', 'Status text must be "Order Now"');
assert(statusDay.badgeLabel === 'Open Now', 'Badge label must be "Open Now"');

console.log('--- TEST 4: Day-specific availability (Thursday closed) ---');
const scheduleWithThursdayClosed: DayOperatingSchedule[] = getDefaultOperatingSchedule('06:00', '21:00').map(s =>
  s.day === 'thursday' ? { ...s, isOpen: false } : s
);
const thursdayClosedSettings: BusinessSettings = {
  ...settings,
  operating_schedule: scheduleWithThursdayClosed,
};
const statusThursdayDay = getStoreOperatingStatus(thursdayClosedSettings, dayDate);
assert(statusThursdayDay.isOpen === false, 'Store must be closed on Thursday when Thursday is disabled');
assert(statusThursdayDay.todayHoursDisplay === 'Closed Today', 'Today hours display shows Closed Today');
assert(statusThursdayDay.statusText === 'Currently Closed', 'Status text must be "Currently Closed"');

console.log('--- TEST 5: Master store toggle (is_store_open = false) ---');
const masterClosedSettings: BusinessSettings = {
  ...settings,
  is_store_open: false,
};
const statusMasterClosed = getStoreOperatingStatus(masterClosedSettings, dayDate);
assert(statusMasterClosed.isOpen === false, 'Master toggle overrides hours and closes store');
assert(statusMasterClosed.statusText === 'Currently Closed', 'Status text is Currently Closed');

console.log('--- TEST 6: Time formatting helper ---');
assert(formatTime12Hour('06:00') === '6:00 AM', '06:00 -> 6:00 AM');
assert(formatTime12Hour('21:00') === '9:00 PM', '21:00 -> 9:00 PM');
assert(formatTime12Hour('12:00') === '12:00 PM', '12:00 -> 12:00 PM');
assert(formatTime12Hour('00:00') === '12:00 AM', '00:00 -> 12:00 AM');

console.log('--- TEST 7: parseTimeToMinutes ---');
assert(parseTimeToMinutes('06:00') === 360, '06:00 is 360 min');
assert(parseTimeToMinutes('21:00') === 1260, '21:00 is 1260 min');

console.log('🎉 ALL OPERATING HOURS TESTS PASSED SUCCESSFULLY!');
