import type { Observable } from 'rxjs';
import type {
  Project,
  CreateProjectInput,
  QuizSession,
  CreateQuizSessionInput,
  QuizSessionFilters,
} from './schemas';

export type { Project, CreateProjectInput, QuizSession, CreateQuizSessionInput, QuizSessionFilters };

export interface IProjectRepository {
  create(userId: string, data: CreateProjectInput): Promise<Project>;
  findAll(userId: string): Promise<Project[]>;
  delete(id: string): Promise<void>;
  observe(userId: string): Observable<Project[]>;
}

export interface IQuizSessionRepository {
  create(data: CreateQuizSessionInput): Promise<QuizSession>;
  findAll(userId: string, filters?: QuizSessionFilters): Promise<QuizSession[]>;
  findById(id: string): Promise<QuizSession | null>;
  update(id: string, data: Partial<QuizSession>): Promise<void>;
  delete(id: string): Promise<void>;
  observe(userId: string, filters?: QuizSessionFilters): Observable<QuizSession[]>;
}
