import { z } from 'zod';

// ─── Project ─────────────────────────────────────────────────────────────────

export const ProjectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectInputSchema = z.object({
  name: z.string().min(1, 'El nombre no puede estar vacío'),
  description: z.string().optional(),
  color: z.string().optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

// ─── Quiz Session ─────────────────────────────────────────────────────────────

export const QuizSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  projectId: z.string().optional(),
  topic: z.string(),
  questionCount: z.number(),
  questionTypes: z.array(z.string()),
  tags: z.array(z.string()),
  questions: z.array(z.any()),
  results: z.array(z.any()),
  refinementAnswers: z.record(z.string(), z.string()),
  score: z.number().nullable().catch(null),  // catch handles absent field from older docs
  ankiCards: z.array(z.any()),
  chatHistories: z.record(z.string(), z.any()),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  isCompleted: z.boolean(),
});
export type QuizSession = z.infer<typeof QuizSessionSchema>;

export const CreateQuizSessionInputSchema = z.object({
  userId: z.string(),
  projectId: z.string().optional(),
  topic: z.string(),
  questionCount: z.number(),
  questionTypes: z.array(z.string()),
  tags: z.array(z.string()).default([]),
  questions: z.array(z.any()).default([]),
  results: z.array(z.any()).default([]),
  refinementAnswers: z.record(z.string(), z.string()).default({}),
  score: z.number().nullable().default(null),
  ankiCards: z.array(z.any()).default([]),
  chatHistories: z.record(z.string(), z.any()).default({}),
});
export type CreateQuizSessionInput = z.infer<typeof CreateQuizSessionInputSchema>;

export const QuizSessionFiltersSchema = z.object({
  projectId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isCompleted: z.boolean().optional(),
  searchQuery: z.string().optional(),
});
export type QuizSessionFilters = z.infer<typeof QuizSessionFiltersSchema>;
