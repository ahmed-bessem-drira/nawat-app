import { databaseService } from './database.service';
import { useSyncStore } from '@/stores/syncStore';
import { useChildStore } from '@/stores/childStore';

const API_URL = 'http://localhost:3001'; // Change to your backend URL

class SyncService {
  async syncData(): Promise<void> {
    const { isOnline, incrementPendingSync, decrementPendingSync } = useSyncStore.getState();
    
    if (!isOnline) {
      console.log('Offline - skipping sync');
      return;
    }

    try {
      incrementPendingSync();

      // Get unsynced sessions
      const sessions = await databaseService.query('session', 'synced = 0');
      
      // Get unsynced metrics
      const metrics = await databaseService.query('game_metrics', 'synced = 0');
      
      // Get unsynced moods
      const moods = await databaseService.query('mood_entry', 'synced = 0');

      if (sessions.length === 0 && metrics.length === 0 && moods.length === 0) {
        console.log('No data to sync');
        decrementPendingSync();
        return;
      }

      const response = await fetch(`${API_URL}/sync/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessions, metrics, moods }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Mark as synced
        for (const session of sessions) {
          await databaseService.update('session', { synced: 1 }, 'id = ?', [session.id]);
        }
        
        for (const metric of metrics) {
          await databaseService.update('game_metrics', { synced: 1 }, 'id = ?', [metric.id]);
        }
        
        for (const mood of moods) {
          await databaseService.update('mood_entry', { synced: 1 }, 'id = ?', [mood.id]);
        }

        // Cache recommendations
        for (const recommendation of result.recommendations) {
          await databaseService.insert('recommendation', {
            id: recommendation.id,
            child_id: recommendation.childId,
            content: recommendation.content,
            encouragement: recommendation.encouragement,
            suggested_activity: recommendation.suggestedActivity,
            created_at: new Date(recommendation.createdAt).getTime(),
          });
        }

        console.log(`Synced ${result.synced} records`);
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      decrementPendingSync();
    }
  }

  async getLocalRecommendations(childId: string): Promise<any[]> {
    return databaseService.query('recommendation', 'child_id = ?', [childId]);
  }
}

export const syncService = new SyncService();
