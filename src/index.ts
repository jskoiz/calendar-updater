import { EventManager } from './eventManager';
import { logger } from './logger';

async function main() {
  try {
    logger.info('Starting the CalDAV script');
    logger.warn('This is a test warning message');
    logger.error('This is a test error message');

    const events = [
      {
        summary: 'Wake up, get ready, make lunch',
        start: '2024-10-25T07:00:00',
        end: '2024-10-25T07:30:00',
      },
      {
        summary: 'Take Ava to school',
        start: '2024-10-25T07:30:00',
        end: '2024-10-25T08:00:00',
      },
      {
        summary: 'Return home, breakfast for Mila',
        start: '2024-10-25T08:00:00',
        end: '2024-10-25T08:30:00',
      },
      {
        summary: 'Make schedule',
        start: '2024-10-25T08:30:00',
        end: '2024-10-25T09:00:00',
      },
    ];

    logger.info(`Processing ${events.length} events`);

    const eventManager = new EventManager(events);
    await eventManager.addEventsToCalendar();

    logger.info('All events have been processed');
    logger.info('Script execution completed successfully');
  } catch (error: any) {
    logger.error(`An error occurred: ${error.message}`);
    if (error.stack) {
      logger.error(error.stack);
    }
  }
}

main();
