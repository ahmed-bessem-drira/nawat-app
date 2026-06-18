import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { SQL_SCHEMA, INIT_DB } from '../database/schema';

function matchRow(row: any, whereClause: string, params: any[]): boolean {
  if (!whereClause) return true;
  const cleaned = whereClause.trim().replace(/\s+/g, ' ');
  
  if (cleaned.toLowerCase() === 'synced = 0') {
    return !row.synced || row.synced === 0 || row.synced === '0';
  }
  
  const match = cleaned.match(/^([a-zA-Z_0-9]+)\s*=\s*\?$/);
  if (match) {
    const column = match[1];
    const val = params[0];
    const camelColumn = column.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    const rowVal = row[column] !== undefined ? row[column] : row[camelColumn];
    return String(rowVal) === String(val);
  }
  
  return true;
}

class WebStorage {
  private async getTable(table: string): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(`nawat_db_${table}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async saveTable(table: string, data: any[]): Promise<void> {
    await AsyncStorage.setItem(`nawat_db_${table}`, JSON.stringify(data));
  }

  async insert(table: string, data: any): Promise<void> {
    const rows = await this.getTable(table);
    rows.push(data);
    await this.saveTable(table, rows);
  }

  async update(table: string, data: any, where: string, whereParams: any[] = []): Promise<void> {
    const rows = await this.getTable(table);
    const updated = rows.map((row) => {
      if (matchRow(row, where, whereParams)) {
        return { ...row, ...data };
      }
      return row;
    });
    await this.saveTable(table, updated);
  }

  async query(table: string, where: string = '', params: any[] = []): Promise<any[]> {
    const rows = await this.getTable(table);
    return rows.filter((row) => matchRow(row, where, params));
  }

  async delete(table: string, where: string, params: any[] = []): Promise<void> {
    const rows = await this.getTable(table);
    const filtered = rows.filter((row) => !matchRow(row, where, params));
    await this.saveTable(table, filtered);
  }
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isWeb = Platform.OS === 'web';
  private webDb = new WebStorage();

  async init(): Promise<void> {
    if (this.isWeb) {
      console.log('Web environment detected: using AsyncStorage fallback for SQLite');
      return;
    }
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
    if (this.isWeb) {
      return this.webDb.insert(table, data);
    }
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
    if (this.isWeb) {
      return this.webDb.update(table, data, where, whereParams);
    }
    if (!this.db) {
      await this.init();
    }
    const setClause = Object.keys(data).map((key) => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...whereParams] as any[];
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    await this.db!.runAsync(sql, values);
  }

  async query(table: string, where: string = '', params: any[] = []): Promise<any[]> {
    if (this.isWeb) {
      return this.webDb.query(table, where, params);
    }
    if (!this.db) {
      await this.init();
    }
    const sql = `SELECT * FROM ${table}${where ? ` WHERE ${where}` : ''}`;
    const result = await this.db!.getAllAsync(sql, params as any[]);
    return result;
  }

  async delete(table: string, where: string, params: any[] = []): Promise<void> {
    if (this.isWeb) {
      return this.webDb.delete(table, where, params);
    }
    if (!this.db) {
      await this.init();
    }
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    await this.db!.runAsync(sql, params as any[]);
  }
}

export const databaseService = new DatabaseService();

