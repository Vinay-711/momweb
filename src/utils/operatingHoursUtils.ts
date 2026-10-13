import { BusinessSettings, DayOfWeek, DayOperatingSchedule } from '../types';

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';
export const DEFAULT_OPEN_TIME = '00:00';
export const DEFAULT_CLOSE_TIME = '23:59';
export const DEFAULT_CLOSED_EXPLANATION = "We're currently closed. Please check our opening hours.";

export const DAY_ORDER: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

/**
 * Returns default weekly schedule for Padma's Floral:
 * 24/7 operating hours every day.
 */
export function getDefaultOperatingSchedule(
  openTime: string = DEFAULT_OPEN_TIME,
  closeTime: string = DEFAULT_CLOSE_TIME
): DayOperatingSchedule[] {
  return DAY_ORDER.map(day => ({
    day,
    label: DAY_LABELS[day],
    isOpen: true,
    openTime,
    closeTime,
  }));
}

/**
 * Formats a 24-hour time string ("06:00", "21:00") into a human-friendly format ("6:00 AM", "9:00 PM").
 */
export function formatTime12Hour(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24 || '';
  const [hourStr, minStr] = time24.split(':');
  const hours = parseInt(hourStr, 10);
  const minutes = parseInt(minStr, 10);
  if (isNaN(hours)) return time24;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = isNaN(minutes) ? '00' : String(minutes).padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Parses "HH:mm" time string into total minutes since midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export interface StoreOperatingStatus {
  isOpen: boolean;
  statusText: 'Order Now' | 'Currently Closed';
  badgeLabel: 'Open Now' | 'Currently Closed';
  explanation: string;
  todayHoursDisplay: string;
  nextOpenDisplay: string;
  currentDay: DayOfWeek;
  currentDayLabel: string;
  timezone: string;
  currentTimeString: string;
  fullSchedule: DayOperatingSchedule[];
}

/**
 * Extracts the current day, hours, and minutes in the configured timezone.
 */
export function getTimeInTimezone(
  timezone: string = DEFAULT_TIMEZONE,
  referenceDate: Date = new Date()
): {
  dayOfWeek: DayOfWeek;
  currentMinutes: number;
  timeString24: string;
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    const parts = formatter.formatToParts(referenceDate);
    let weekdayStr = '';
    let hourStr = '00';
    let minuteStr = '00';

    for (const part of parts) {
      if (part.type === 'weekday') weekdayStr = part.value.toLowerCase();
      if (part.type === 'hour') hourStr = part.value;
      if (part.type === 'minute') minuteStr = part.value;
    }

    // In case hour is 24 in some ICU runtimes
    let h = parseInt(hourStr, 10) % 24;
    const m = parseInt(minuteStr, 10);
    const dayOfWeek = (DAY_ORDER.includes(weekdayStr as DayOfWeek)
      ? weekdayStr
      : 'monday') as DayOfWeek;

    return {
      dayOfWeek,
      currentMinutes: h * 60 + m,
      timeString24: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    };
  } catch (err) {
    // Fallback to local UTC date if timezone is invalid
    const dayIndex = referenceDate.getDay(); // 0 is Sunday
    const dayMap: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const h = referenceDate.getHours();
    const m = referenceDate.getMinutes();
    return {
      dayOfWeek: dayMap[dayIndex],
      currentMinutes: h * 60 + m,
      timeString24: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    };
  }
}

/**
 * Evaluates whether the store is open authoritatively based on timezone,
 * current time, master open switch, and day-specific hours.
 */
export function getStoreOperatingStatus(
  settings?: Partial<BusinessSettings> | null,
  referenceDate: Date = new Date()
): StoreOperatingStatus {
  const tz = settings?.timezone?.trim() || DEFAULT_TIMEZONE;
  const generalOpen = settings?.opening_time || DEFAULT_OPEN_TIME;
  const generalClose = settings?.closing_time || DEFAULT_CLOSE_TIME;
  const schedule = (settings?.operating_schedule && settings.operating_schedule.length === 7)
    ? settings.operating_schedule
    : getDefaultOperatingSchedule(generalOpen, generalClose);

  const { dayOfWeek, currentMinutes, timeString24 } = getTimeInTimezone(tz, referenceDate);
  const todaySchedule = schedule.find(s => s.day === dayOfWeek) || {
    day: dayOfWeek,
    label: DAY_LABELS[dayOfWeek],
    isOpen: true,
    openTime: generalOpen,
    closeTime: generalClose,
  };

  const masterOpen = settings?.is_store_open !== false;
  let isOpen = false;
  let todayHoursDisplay = '';

  const openMinutes = parseTimeToMinutes(todaySchedule.openTime);
  const closeMinutes = parseTimeToMinutes(todaySchedule.closeTime);

  if (!masterOpen) {
    isOpen = false;
    todayHoursDisplay = 'Temporarily Closed by Store Owner';
  } else if (!todaySchedule.isOpen) {
    isOpen = false;
    todayHoursDisplay = 'Closed Today';
  } else {
    // Check operating window
    const is24Hours = (openMinutes === 0 && (closeMinutes >= 1439 || closeMinutes === 0)) || openMinutes === closeMinutes;
    if (is24Hours) {
      isOpen = true;
      todayHoursDisplay = '24/7';
    } else if (closeMinutes > openMinutes) {
      // Standard same-day window e.g. 06:00 to 21:00
      isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
      todayHoursDisplay = `${formatTime12Hour(todaySchedule.openTime)} – ${formatTime12Hour(todaySchedule.closeTime)}`;
    } else if (closeMinutes < openMinutes) {
      // Overnight window e.g. 18:00 to 02:00
      isOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
      todayHoursDisplay = `${formatTime12Hour(todaySchedule.openTime)} – ${formatTime12Hour(todaySchedule.closeTime)}`;
    } else {
      // 24 hours open
      isOpen = true;
      todayHoursDisplay = '24/7';
    }
  }

  // Calculate next opening time display
  let nextOpenDisplay = '';
  if (!isOpen) {
    if (!masterOpen) {
      nextOpenDisplay = 'Store temporarily closed';
    } else if (todaySchedule.isOpen && currentMinutes < openMinutes) {
      nextOpenDisplay = `Opens today at ${formatTime12Hour(todaySchedule.openTime)}`;
    } else {
      // Find the next open day in the sequence
      const todayIdx = DAY_ORDER.indexOf(dayOfWeek);
      let foundNext = false;
      for (let offset = 1; offset <= 7; offset++) {
        const nextDayIndex = (todayIdx + offset) % 7;
        const nextDayName = DAY_ORDER[nextDayIndex];
        const nextSched = schedule.find(s => s.day === nextDayName);
        if (nextSched && nextSched.isOpen) {
          const dayPrefix = offset === 1 ? 'tomorrow' : `on ${nextSched.label}`;
          nextOpenDisplay = `Opens ${dayPrefix} at ${formatTime12Hour(nextSched.openTime)}`;
          foundNext = true;
          break;
        }
      }
      if (!foundNext) {
        nextOpenDisplay = 'No upcoming opening hours scheduled';
      }
    }
  }

  const explanation = settings?.closed_notice?.trim() || DEFAULT_CLOSED_EXPLANATION;

  return {
    isOpen,
    statusText: isOpen ? 'Order Now' : 'Currently Closed',
    badgeLabel: isOpen ? 'Open Now' : 'Currently Closed',
    explanation,
    todayHoursDisplay,
    nextOpenDisplay,
    currentDay: dayOfWeek,
    currentDayLabel: DAY_LABELS[dayOfWeek],
    timezone: tz,
    currentTimeString: timeString24,
    fullSchedule: schedule,
  };
}
