// src/llmHelper.ts

import { Ollama } from 'ollama';
import { CalendarEvent } from './eventSchema';
import { DateTime } from 'luxon';
import { logger } from './logger';
import readline from 'readline';

const ollama = new Ollama();

function ensureDateTime(date: string | Date): DateTime {
  return date instanceof Date
    ? DateTime.fromJSDate(date)
    : DateTime.fromISO(date);
}

export async function processUserInput(
  input: string,
): Promise<CalendarEvent[]> {
  const today = DateTime.now().toISODate();
  const prompt = `
You are a helpful assistant that creates calendar events based on user input.

Given the following user input about their schedule, create a list of events in JSON format. Each event should have a "summary", "start", and "end" property. The "start" and "end" should be in ISO 8601 format (e.g., "YYYY-MM-DDTHH:MM:SS"). Assume all events are for today (${today}) unless specified otherwise. Set the duration of each event to 1 hour if not specified.

User input: ${input}

Please provide only the JSON array of events, without any additional text.
`;

  logger.debug(`LLM prompt: ${prompt}`);

  const response = await ollama.generate({
    model: 'llama3.2',
    prompt: prompt,
  });

  logger.debug(`Raw LLM response in processUserInput: ${response.response}`);

  let events: CalendarEvent[];
  try {
    logger.debug('Attempting to parse LLM response as JSON');
    events = JSON.parse(response.response);
  } catch (error) {
    if (error instanceof Error) {
      logger.warn(`Initial JSON parse failed: ${error.message}`);
    } else {
      logger.warn('Initial JSON parse failed: Unknown error');
    }

    try {
      const jsonStringMatch = response.response.match(/(\[.*\])/s);
      const jsonString = jsonStringMatch?.[0];
      if (jsonString) {
        logger.debug('Extracted JSON string from LLM response');
        events = JSON.parse(jsonString);
      } else {
        logger.error('No JSON array found in the LLM response');
        throw new Error('No JSON array found in the response');
      }
    } catch (innerError) {
      if (innerError instanceof Error) {
        logger.error(
          'Failed to parse JSON array from LLM response:',
          innerError,
        );
      } else {
        logger.error(
          'Failed to parse JSON array from LLM response: Unknown error',
        );
      }
      logger.debug(
        `LLM response content that failed to parse: ${response.response}`,
      );
      throw new Error('Failed to process events');
    }
  }

  logger.info(`Successfully parsed ${events.length} events from LLM response`);

  return events.map((event) => ({
    summary: event.summary,
    start: event.start
      ? ensureDateTime(event.start).toISO({
          suppressMilliseconds: true,
          includeOffset: false,
        }) || ''
      : '',
    end: event.end
      ? ensureDateTime(event.end).toISO({
          suppressMilliseconds: true,
          includeOffset: false,
        }) || ''
      : '',
  }));
}

export async function confirmEvents(events: CalendarEvent[]): Promise<boolean> {
  const eventList = events
    .map(
      (event) =>
        `${event.summary}: ${ensureDateTime(event.start).toLocaleString(DateTime.DATETIME_SHORT)} - ${ensureDateTime(event.end).toLocaleString(DateTime.DATETIME_SHORT)}`,
    )
    .join('\n');

  logger.info(`\n${colorizeText('=== Events to be Confirmed ===', 'cyan')}
${eventList}
${colorizeText('================================', 'cyan')}`);

  console.log(
    colorizeText(
      '\nThe following events have been generated based on your input:',
      'cyan',
    ),
  );
  console.log(colorizeText(eventList, 'green'));
  console.log(colorizeText('\n================================', 'cyan'));

  const confirmPrompt = await promptUser(
    colorizeText(
      '\nDo you want to add these events to your calendar? (yes/no) ',
      'yellow',
    ),
  );

  return confirmPrompt.trim().toLowerCase() === 'yes';
}

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });
}

function colorizeText(text: string, color: string): string {
  const colors: Record<string, string> = {
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    reset: '\x1b[0m',
  };
  return `${colors[color] || colors['reset']}${text}${colors['reset']}`;
}
