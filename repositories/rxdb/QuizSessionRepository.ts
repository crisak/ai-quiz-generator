import { nanoid } from 'nanoid';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { AppDatabase } from '../../db/database';
import { QuizSessionSchema } from '../schemas';
import type {
  IQuizSessionRepository,
  QuizSession,
  CreateQuizSessionInput,
  QuizSessionFilters,
} from '../interfaces';

export class RxDBQuizSessionRepository implements IQuizSessionRepository {
  constructor(private db: AppDatabase) {}

  async create(data: CreateQuizSessionInput): Promise<QuizSession> {
    const doc = {
      id: nanoid(),
      userId: data.userId,
      projectId: data.projectId ?? '',
      topic: data.topic,
      questionCount: data.questionCount,
      questionTypes: data.questionTypes,
      tags: data.tags ?? [],
      questions: data.questions ?? [],
      results: data.results ?? [],
      refinementAnswers: data.refinementAnswers ?? {},
      score: data.score ?? null,
      ankiCards: data.ankiCards ?? [],
      chatHistories: data.chatHistories ?? {},
      startedAt: new Date().toISOString(),
      completedAt: '',
      isCompleted: false,
    };
    await this.db.quizsessions.insert(doc);
    return QuizSessionSchema.parse(doc);
  }

  async findAll(userId: string, filters?: QuizSessionFilters): Promise<QuizSession[]> {
    const selector: Record<string, unknown> = { userId };
    if (filters?.projectId) selector.projectId = filters.projectId;
    if (filters?.isCompleted !== undefined) selector.isCompleted = filters.isCompleted;

    const docs = await this.db.quizsessions.find({ selector }).exec();
    let sessions = docs.map(d => QuizSessionSchema.parse(d.toJSON()));

    if (filters?.tags && filters.tags.length > 0) {
      sessions = sessions.filter(s =>
        filters.tags!.every(tag => s.tags.includes(tag))
      );
    }

    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      sessions = sessions.filter(s => s.topic.toLowerCase().includes(q));
    }

    return sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async findById(id: string): Promise<QuizSession | null> {
    const doc = await this.db.quizsessions.findOne(id).exec();
    if (!doc) return null;
    return QuizSessionSchema.parse(doc.toJSON());
  }

  async update(id: string, data: Partial<QuizSession>): Promise<void> {
    const doc = await this.db.quizsessions.findOne(id).exec();
    if (doc) await doc.patch(data);
  }

  async delete(id: string): Promise<void> {
    const doc = await this.db.quizsessions.findOne(id).exec();
    if (doc) await doc.remove();
  }

  observe(userId: string, filters?: QuizSessionFilters): Observable<QuizSession[]> {
    const selector: Record<string, unknown> = { userId };
    if (filters?.projectId) selector.projectId = filters.projectId;
    if (filters?.isCompleted !== undefined) selector.isCompleted = filters.isCompleted;

    return this.db.quizsessions
      .find({ selector })
      .$.pipe(
        map(docs => {
          let sessions = docs.map(d => QuizSessionSchema.parse(d.toJSON()));

          if (filters?.tags && filters.tags.length > 0) {
            sessions = sessions.filter(s =>
              filters.tags!.every(tag => s.tags.includes(tag))
            );
          }

          if (filters?.searchQuery) {
            const q = filters.searchQuery.toLowerCase();
            sessions = sessions.filter(s => s.topic.toLowerCase().includes(q));
          }

          return sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
        })
      );
  }
}
