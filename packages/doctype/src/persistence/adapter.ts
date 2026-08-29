import type { DocData } from '../types';

export type PersistenceOrderBy = Record<string, 'asc' | 'desc' | Record<string, 'asc' | 'desc'>>;

export type PersistenceListQuery = {
  delegate: string;
  where?: Record<string, unknown>;
  orderBy?: PersistenceOrderBy | PersistenceOrderBy[];
  skip?: number;
  take?: number;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
};

export type PersistenceGetQuery = {
  delegate: string;
  nameField: string;
  name: string;
};

export type PersistenceWriteQuery = {
  delegate: string;
  nameField: string;
  name?: string;
  data: DocData;
};

/**
 * Injected by the app (Prisma, memory, …). Package never imports `@repo/database`.
 */
export interface PersistenceAdapter {
  count(query: PersistenceListQuery): Promise<number>;
  findMany(query: PersistenceListQuery): Promise<DocData[]>;
  findUnique(query: PersistenceGetQuery): Promise<DocData | null>;
  create(query: PersistenceWriteQuery): Promise<DocData>;
  update(query: Required<Pick<PersistenceWriteQuery, 'delegate' | 'nameField' | 'name' | 'data'>>): Promise<DocData>;
  delete(query: PersistenceGetQuery): Promise<void>;
}
