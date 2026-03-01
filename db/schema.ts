import type { RxJsonSchema } from 'rxdb';

export const PROJECT_SCHEMA_VERSION = 0;
export const QUIZ_SESSION_SCHEMA_VERSION = 1; // bumped: score field now allows null

export const projectSchema: RxJsonSchema<any> = {
  title: 'project',
  version: PROJECT_SCHEMA_VERSION,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    userId: { type: 'string', maxLength: 64 },
    name: { type: 'string' },
    description: { type: 'string' },
    color: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
  required: ['id', 'userId', 'name', 'createdAt', 'updatedAt'],
};

export const quizSessionSchema: RxJsonSchema<any> = {
  title: 'quizsession',
  version: QUIZ_SESSION_SCHEMA_VERSION,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    userId: { type: 'string', maxLength: 64 },
    projectId: { type: 'string' },
    topic: { type: 'string' },
    questionCount: { type: 'number' },
    questionTypes: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
    questions: { type: 'array', items: { type: 'object' } },
    results: { type: 'array', items: { type: 'object' } },
    refinementAnswers: { type: 'object' },
    score: {},   // no type constraint — allows number | null | absent
    ankiCards: { type: 'array', items: { type: 'object' } },
    chatHistories: { type: 'object' },
    startedAt: { type: 'string' },
    completedAt: { type: 'string' },
    isCompleted: { type: 'boolean' },
  },
  required: ['id', 'userId', 'topic', 'startedAt', 'isCompleted', 'questionTypes', 'tags'],
};
