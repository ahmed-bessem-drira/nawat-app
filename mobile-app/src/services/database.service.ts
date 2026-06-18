import * as SQLite from 'expo-sqlite';
import { SQL_SCHEMA, INIT_DB } from '../database/schema';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('nawat_focus.db');
      await this.db.execAsync(INIT_DB);
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  async insert(table: string, data: any): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data) as any[];
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    await this.db!.runAsync(sql, values);
  }

  async update(table: string, data: any, where: string, whereParams: any[] = []): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    const setClause = Object.keys(data).map((key) => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...whereParams] as any[];
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    await this.db!.runAsync(sql, values);
  }

  async query(table: string, where: string = '', params: any[] = []): Promise<any[]> {
    if (!this.db) {
      await this.init();
    }
    const sql = `SELECT * FROM ${table}${where ? ` WHERE ${where}` : ''}`;
    const result = await this.db!.getAllAsync(sql, params as any[]);
    return result;
  }

  async delete(table: string, where: string, params: any[] = []): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    await this.db!.runAsync(sql, params as any[]);
  }
}

export const databaseService = new DatabaseService();
