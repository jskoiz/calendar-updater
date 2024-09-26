// __tests__/llmHelper.test.ts

import { processUserInput, confirmEvents } from '../src/llmHelper';
import { Ollama, GenerateResponse } from 'ollama';
import { CalendarEvent } from '../src/eventSchema';
import readline from 'readline';

jest.mock('ollama');
jest.mock('readline');

const mockedOllama = Ollama as jest.MockedClass<typeof Ollama>;
const mockedReadlineInterface = readline.createInterface as jest.Mock;


describe('LLM Helper Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processUserInput', () => {

    it('should parse valid LLM response and return CalendarEvents', async () => {
      const mockLLMResponse: GenerateResponse = {
        model: 'llama3.2',
        created_at: new Date(),
        response: JSON.stringify([
          { summary: 'Meeting', start: '2024-09-25T09:00:00', end: '2024-09-25T10:00:00' },
          { summary: 'Workout', start: '2024-09-25T11:00:00', end: '2024-09-25T12:00:00' },
        ]),
        done: true,
        done_reason: 'stop',
        context: {},
        total_duration: 500,
        load_duration: 100,
        prompt_eval_count: 1, 
      } as GenerateResponse;

      mockedOllama.prototype.generate.mockResolvedValue(mockLLMResponse);

      const input = 'I have a meeting at 9am and workout at 11am';
      const result: CalendarEvent[] = await processUserInput(input);

      expect(result).toEqual([
        { summary: 'Meeting', start: '2024-09-25T09:00:00', end: '2024-09-25T10:00:00' },
        { summary: 'Workout', start: '2024-09-25T11:00:00', end: '2024-09-25T12:00:00' },
      ]);

      expect(mockedOllama.prototype.generate).toHaveBeenCalledTimes(1);
      expect(mockedOllama.prototype.generate).toHaveBeenCalledWith({
        model: 'llama3.2',
        prompt: expect.any(String),
      });
    });

    it('should handle invalid JSON from LLM response', async () => {
      const mockLLMResponse: GenerateResponse = {
        model: 'llama3.2',
        created_at: new Date(),
        response: 'Invalid Response',
        done: true,
        done_reason: 'stop',
        context: {}, 
        total_duration: 500,
        load_duration: 100,
        prompt_eval_count: 1,
      } as GenerateResponse;

      mockedOllama.prototype.generate.mockResolvedValue(mockLLMResponse);

      const input = 'Invalid input';

      await expect(processUserInput(input)).rejects.toThrow('Failed to process events');

      expect(mockedOllama.prototype.generate).toHaveBeenCalledTimes(1);
      expect(mockedOllama.prototype.generate).toHaveBeenCalledWith({
        model: 'llama3.2',
        prompt: expect.any(String),
      });
    });
  });

  describe('confirmEvents', () => {

    it('should confirm events and return true if user says yes', async () => {
      const mockEvents: CalendarEvent[] = [
        { summary: 'Meeting', start: '2024-09-25T09:00:00', end: '2024-09-25T10:00:00' },
        { summary: 'Workout', start: '2024-09-25T11:00:00', end: '2024-09-25T12:00:00' },
      ];
      
      mockedReadlineInterface.mockImplementation(() => ({
        question: (questionText: string, cb: (answer: string) => void) => cb('yes'),
        close: jest.fn(),
      }));

      const result = await confirmEvents(mockEvents);
      
      expect(result).toBe(true);
    });

    it('should return false if user says no to confirmation', async () => {
      const mockEvents: CalendarEvent[] = [
        { summary: 'Meeting', start: '2024-09-25T09:00:00', end: '2024-09-25T10:00:00' },
      ];
      
      mockedReadlineInterface.mockImplementation(() => ({
        question: (questionText: string, cb: (answer: string) => void) => cb('no'),
        close: jest.fn(),
      }));

      const result = await confirmEvents(mockEvents);
      
      expect(result).toBe(false);
    });
  });
});
