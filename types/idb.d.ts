declare module "idb" {
  export interface IDBPDatabase<T> {
    createObjectStore(
      name: string,
      options?: IDBObjectStoreParameters
    ): IDBPObjectStore<T>;
    transaction<K extends keyof T>(
      storeNames: K | K[],
      mode?: IDBTransactionMode
    ): IDBPTransaction<T, K>;
    close(): void;
    objectStoreNames: DOMStringList;
  }

  export interface IDBPObjectStore<T> {
    put(value: any): Promise<any>;
    getAll(): Promise<any[]>;
    getAllKeys(): Promise<IDBValidKey[]>;
    clear(): Promise<void>;
    delete(key: IDBValidKey): Promise<void>;
  }

  export interface IDBPTransaction<T, K extends keyof T = keyof T> {
    objectStore(name: K): IDBPObjectStore<T[K]>;
    done: Promise<void>;
  }

  export function openDB<T>(
    name: string,
    version: number,
    {
      upgrade,
    }: {
      upgrade?: (db: IDBPDatabase<T>) => void;
    }
  ): Promise<IDBPDatabase<T>>;
}
