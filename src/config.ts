import dotenv from 'dotenv';

dotenv.config();

export const config = {
  caldavUrl: process.env.CALDAV_URL || 'https://caldav.icloud.com/',
  username: process.env.CALDAV_USERNAME || '',
  password: process.env.CALDAV_PASSWORD || '',
  timezone: process.env.TIMEZONE || 'UTC',
  calendarName: process.env.CALENDAR_NAME || 'AVMIL',
  logLevel: process.env.LOG_LEVEL || 'debug',
};
