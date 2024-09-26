import { CalendarEvent, eventSchema } from './eventSchema';
import { logger } from './logger';
import { createICalEvent } from './icalHelper';
import { CalDavClient } from './caldavClient';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from './config';
import { DateTime } from 'luxon';
import ical from 'ical-generator';

export class EventManager {
  private events: CalendarEvent[];
  private caldavClient: CalDavClient;

  constructor(events: CalendarEvent[]) {
    this.events = events;
    this.caldavClient = new CalDavClient();
  }

  validateEvents(): CalendarEvent[] {
    const validEvents: CalendarEvent[] = [];
    for (const event of this.events) {
      const { error } = eventSchema.validate(event);
      if (error) {
        logger.error(`Invalid event data for '${event.summary}': ${error.message}`);
        continue;
      }
      validEvents.push(event);
    }
    return validEvents;
  }

  async addEventsToCalendar(): Promise<void> {
    const validEvents = this.validateEvents();
    if (validEvents.length === 0) {
      logger.error('No valid events to process');
      return;
    }

    await this.caldavClient.init();

    for (const event of validEvents) {
      const icalCal = createICalEvent(event);
      const icsData = icalCal.toString();
      const startString = this.ensureDateTime(event.start).toISO() || '';
      const filename = `${startString.replace(/[:.-]/g, '')}-${event.summary.replace(/\s+/g, '-')}.ics`;

      try {
        await this.caldavClient.addEventToCalendar(icsData, filename);
      } catch (error: any) {
        logger.error(`Failed to add event '${event.summary}': ${error.message}`);
      }
    }

    await this.generateIcsFile(validEvents);
  }

  private ensureDateTime(date: string | Date): DateTime {
    return date instanceof Date ? DateTime.fromJSDate(date) : DateTime.fromISO(date);
  }

  async generateIcsFile(events: CalendarEvent[]): Promise<void> {
    const cal = ical({
      prodId: '//Your Company//Your Product//EN',
      timezone: config.timezone,
    });

    for (const event of events) {
      const startTime = this.ensureDateTime(event.start).setZone(config.timezone);
      const endTime = this.ensureDateTime(event.end).setZone(config.timezone);

      cal.createEvent({
        start: startTime.toJSDate(),
        end: endTime.toJSDate(),
        summary: event.summary,
      });
    }

    const icsContent = cal.toString();
    const filePath = path.resolve(__dirname, '../events.ics');

    try {
      await fs.writeFile(filePath, icsContent);
      logger.info(`ICS file generated successfully: ${filePath}`);
    } catch (error: any) {
      logger.error(`Error writing ICS file: ${error.message}`);
    }
  }
}
