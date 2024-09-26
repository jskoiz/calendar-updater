import Joi from 'joi';

export interface CalendarEvent {
  summary: string;
  start: string | Date;
  end: string | Date;
}

export const eventSchema = Joi.object({
  summary: Joi.string().required(),
  start: Joi.string().isoDate().required(),
  end: Joi.string().isoDate().required(),
});
