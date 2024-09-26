import { createDAVClient, DAVClient, DAVCalendar } from 'tsdav';
import { logger } from './logger';
import { config } from './config';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

interface CustomDAVClient extends Pick<DAVClient, 'fetchCalendars'> {
}

export class CalDavClient {
  private client: CustomDAVClient | null = null;
  private calendars: DAVCalendar[] = [];

  async init() {
    logger.info('Initializing CalDAV client...');
    this.client = await createDAVClient({
      serverUrl: config.caldavUrl,
      credentials: {
        username: config.username,
        password: config.password,
      },
      authMethod: 'Basic' as const,
      defaultAccountType: 'caldav' as const,
    }) as CustomDAVClient;
    logger.info('CalDAV client initialized.');

    logger.info('Fetching calendars...');
    if (this.client) {
      this.calendars = await this.client.fetchCalendars();
      logger.info(`Fetched ${this.calendars.length} calendars.`);
    } else {
      throw new Error('Failed to initialize CalDAV client.');
    }
  }

  getCalendar(): DAVCalendar {
    if (!this.client || this.calendars.length === 0) {
      throw new Error('CalDAV client not initialized or calendars not fetched.');
    }

    const calendar = this.calendars.find(
      (cal) => cal.displayName === config.calendarName
    );

    if (!calendar) {
      throw new Error(`Calendar '${config.calendarName}' not found.`);
    }

    logger.info(`Selected calendar: ${calendar.displayName}`);
    return calendar;
  }

  async addEventToCalendar(icsData: string, filename: string): Promise<void> {
    if (!this.client) {
      throw new Error('CalDAV client not initialized.');
    }

    const calendar = this.getCalendar();
    const eventUid = uuidv4();

    try {
      logger.info(`Attempting to add event with filename: ${filename}`);
      logger.debug(`Event data: ${icsData}`);

      const url = `${calendar.url}${eventUid}.ics`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Authorization': 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64'),
        },
        body: icsData,
      });

      logger.info(`Server response status: ${response.status}`);
      const responseText = await response.text();
      logger.debug(`Server response: ${responseText}`);

      if (response.ok) {
        logger.info(`Event successfully added with UID: ${eventUid}`);
      } else {
        logger.warn(`Unexpected response status ${response.status} when adding event: ${filename}`);
      }
    } catch (error: any) {
      logger.error(`Error adding event with filename '${filename}': ${error.message}`);
      logger.debug(`Error details: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
