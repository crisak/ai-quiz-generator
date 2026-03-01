import React, { createContext, useContext, useEffect, useState } from 'react';
import { initDatabase } from '../db/database';
import { RxDBProjectRepository } from './rxdb/ProjectRepository';
import { RxDBQuizSessionRepository } from './rxdb/QuizSessionRepository';
import type { IProjectRepository, IQuizSessionRepository } from './interfaces';

interface Repositories {
  projects: IProjectRepository;
  quizSessions: IQuizSessionRepository;
}

const RepositoryContext = createContext<Repositories | null>(null);

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repos, setRepos] = useState<Repositories | null>(null);

  useEffect(() => {
    initDatabase().then(db => {
      setRepos({
        projects: new RxDBProjectRepository(db),
        quizSessions: new RxDBQuizSessionRepository(db),
      });
    }).catch(err => {
      console.error('Failed to initialize database:', err);
    });
  }, []);

  if (!repos) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white text-sm">
        Iniciando base de datos local...
      </div>
    );
  }

  return (
    <RepositoryContext.Provider value={repos}>
      {children}
    </RepositoryContext.Provider>
  );
};

export const useRepositories = (): Repositories => {
  const ctx = useContext(RepositoryContext);
  if (!ctx) throw new Error('useRepositories must be used inside RepositoryProvider');
  return ctx;
};
