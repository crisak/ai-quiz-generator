import { createRxDatabase, addRxPlugin, type RxDatabase, type RxCollection } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { projectSchema, quizSessionSchema } from './schema';

// Required for migrationStrategies to work
addRxPlugin(RxDBMigrationSchemaPlugin);

type AppCollections = {
  projects: RxCollection;
  quizsessions: RxCollection;
};

export type AppDatabase = RxDatabase<AppCollections>;

// Store the init promise on `window` so it survives Vite HMR module reloads.
// Module-level variables reset on each HMR cycle; window properties persist for the page's lifetime.
// This prevents both React StrictMode double-invocation and HMR from calling createRxDatabase twice.
declare global {
  interface Window {
    __quizia_dbPromise?: Promise<AppDatabase>;
  }
}

export const initDatabase = (): Promise<AppDatabase> => {
  if (window.__quizia_dbPromise) return window.__quizia_dbPromise;

  window.__quizia_dbPromise = (async () => {
    const db = await createRxDatabase<AppCollections>({
      name: 'quizia_v1',
      storage: getRxStorageDexie(),
    });

    await db.addCollections({
      projects: { schema: projectSchema },
      quizsessions: {
        schema: quizSessionSchema,
        migrationStrategies: {
          1: (oldDoc: any) => oldDoc,
        },
      },
    });

    return db;
  })();

  return window.__quizia_dbPromise;
};
