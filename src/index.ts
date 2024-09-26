import { EventManager } from './eventManager';
import { logger } from './logger';
import { processUserInput, confirmEvents } from './llmHelper';
import readline from 'readline';
import { CalendarEvent } from './eventSchema';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptUser(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function getLLMAssistedEvents(): Promise<CalendarEvent[] | null> {
  const userInput = await promptUser("What would you like on your schedule today? ");
  const events = await processUserInput(userInput);
  const confirmed = await confirmEvents(events);
  
  if (confirmed) {
    return events;
  } else {
    logger.info("Events not confirmed. Please try again or use manual input.");
    return null;
  }
}

async function getManualEvents(): Promise<CalendarEvent[]> {
  return [

  ];
}

async function main() {
  try {
    logger.info('Starting the CalDAV script');

    const choice = await promptUser("Do you want to use LLM-assisted event creation? (yes/no) ");
    
    let events: CalendarEvent[];
    if (choice.toLowerCase() === 'yes') {
      events = await getLLMAssistedEvents() || await getManualEvents();
    } else {
      events = await getManualEvents();
    }

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
  } finally {
    rl.close();
  }
}

main();
