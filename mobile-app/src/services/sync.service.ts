import { databaseService } from './database.service';
import { useSyncStore } from '@/stores/syncStore';
import { useChildStore } from '@/stores/childStore';
import { API_URL } from '@/config/env';

const SYNC_URL = `${API_URL}/api/sync`;

class SyncService {
  async syncData(): Promise<void> {
    const { isOnline, incrementPendingSync, decrementPendingSync } = useSyncStore.getState();
    const child = useChildStore.getState().child;

    if (!isOnline) {
      console.log('Offline - skipping sync');
      return;
    }

    if (!child?.uniqueCode) {
      console.log('No uniqueCode - skipping sync');
      return;
    }

    try {
      incrementPendingSync();

      const uniqueCode = child.uniqueCode;

      // Sync unsynced game sessions
      const sessions = await databaseService.query('session', 'synced = 0');
      const metrics = await databaseService.query('game_metrics', 'synced = 0');

      for (const session of sessions) {
        const sessionMetrics = metrics.filter((m: any) => m.session_id === session.id);

        try {
          const response = await fetch(`${SYNC_URL}/game-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uniqueCode,
              gameType: session.game_type,
              duration: session.duration,
              metrics: sessionMetrics.length > 0 ? {
                omissions: sessionMetrics[0].omissions,
                commissions: sessionMetrics[0].commissions,
                reactionTime: sessionMetrics[0].reaction_time,
                reactionTimeVariability: sessionMetrics[0].reaction_time_variability,
                accuracy: sessionMetrics[0].accuracy,
                smoothness: sessionMetrics[0].smoothness,
                completionTime: sessionMetrics[0].completion_time,
                pathDeviation: sessionMetrics[0].path_deviation,
              } : {},
            }),
          });

          if (response.ok) {
            await databaseService.update('session', { synced: 1 }, 'id = ?', [session.id]);
            for (const m of sessionMetrics) {
              await databaseService.update('game_metrics', { synced: 1 }, 'id = ?', [m.id]);
            }
          }
        } catch (err) {
          console.error('Failed to sync session:', err);
        }
      }

      // Sync unsynced mood entries
      const moods = await databaseService.query('mood_entry', 'synced = 0');

      for (const mood of moods) {
        try {
          const response = await fetch(`${SYNC_URL}/mood-entry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uniqueCode,
              mood: mood.mood,
            }),
          });

          if (response.ok) {
            await databaseService.update('mood_entry', { synced: 1 }, 'id = ?', [mood.id]);
          }
        } catch (err) {
          console.error('Failed to sync mood:', err);
        }
      }

      // Fetch recommendations from validate-code then recommendations endpoint
      try {
          const validateRes = await fetch(`${SYNC_URL}/validate-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uniqueCode }),
        });

        if (validateRes.ok) {
          const validateData = await validateRes.json();
          if (validateData.valid && validateData.childId) {
            const recRes = await fetch(`${SYNC_URL}/recommendations`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uniqueCode }),
            });
            if (recRes.ok) {
              const recs = await recRes.json();
              for (const rec of recs) {
                await databaseService.insert('recommendation', {
                  id: rec.id || Date.now().toString() + Math.random(),
                  child_id: child.id,
                  content: rec.content || '',
                  encouragement: rec.encouragement || '',
                  suggested_activity: rec.suggestedActivity || '',
                  created_at: Date.now(),
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      }

      console.log('Sync completed');
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
