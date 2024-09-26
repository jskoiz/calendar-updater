import Joi from 'joi';

export interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
}

export const eventSchema = Joi.object({
  summary: Joi.string().required(),
  start: Joi.string().isoDate().required(),
  end: Joi.string().isoDate().required(),
});
