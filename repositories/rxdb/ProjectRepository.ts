import { nanoid } from 'nanoid';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { AppDatabase } from '../../db/database';
import { ProjectSchema } from '../schemas';
import type { IProjectRepository, Project, CreateProjectInput } from '../interfaces';

export class RxDBProjectRepository implements IProjectRepository {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreateProjectInput): Promise<Project> {
    const now = new Date().toISOString();
    const doc = {
      id: nanoid(),
      userId,
      name: data.name,
      description: data.description ?? '',
      color: data.color ?? '#3b82f6',
      createdAt: now,
      updatedAt: now,
    };
    await this.db.projects.insert(doc);
    return ProjectSchema.parse(doc);
  }

  async findAll(userId: string): Promise<Project[]> {
    const docs = await this.db.projects
      .find({ selector: { userId } })
      .exec();
    return docs
      .map(d => ProjectSchema.parse(d.toJSON()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async delete(id: string): Promise<void> {
    const doc = await this.db.projects.findOne(id).exec();
    if (doc) await doc.remove();
  }

  observe(userId: string): Observable<Project[]> {
    return this.db.projects
      .find({ selector: { userId } })
      .$.pipe(
        map(docs =>
          docs
            .map(d => ProjectSchema.parse(d.toJSON()))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        )
      );
  }
}
