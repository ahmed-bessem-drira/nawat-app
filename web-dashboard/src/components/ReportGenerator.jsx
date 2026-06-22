import { useState, useRef } from 'react'
import html2pdf from 'html2pdf.js'

const GAME_LABELS = {
  NOISE_SOUK: 'Noise Souk',
  GATE_OF_PATIENCE: 'Gate of Patience',
  CLOUD_VALLEY: 'Cloud Valley',
  BACKPACK_OASIS: 'Backpack Oasis',
}

const getStateSummary = (sessions) => {
  if (sessions.length === 0) return 'Aucune session enregistrée pour le moment.'
  const avgAcc = sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / sessions.length
  const avgReaction = sessions.reduce((a, s) => a + (s.reactionTime || 0), 0) / sessions.length
  if (avgAcc >= 80) return 'Votre enfant montre de très bonnes capacités d\'attention et de concentration.'
  if (avgAcc >= 60) return 'Votre enfant a des capacités correctes mais peut encore progresser en concentration.'
  if (avgAcc >= 40) return 'Votre enfant rencontre quelques difficultés d\'attention qui méritent un peu d\'entraînement.'
  return 'Votre enfant a des difficultés d\'attention significatives. Ne vous inquiétez pas, les jeux sont conçus pour l\'aider à progresser.'
}

const getProbableCauses = (sessions, moods) => {
  const causes = []
  const avgAcc = sessions.length > 0 ? sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / sessions.length : 0
  const avgReaction = sessions.length > 0 ? sessions.reduce((a, s) => a + (s.reactionTime || 0), 0) / sessions.length : 0

  if (avgAcc < 60) causes.push('Difficultés de concentration prolongée — l\'enfant peut avoir du mal à rester focus sur une tâche unique.')
  if (avgReaction > 800) causes.push('Temps de réaction lent — l\'enfant peut avoir besoin de plus de temps pour traiter les informations.')
  if (sessions.filter(s => s.gameType === 'NOISE_SOUK').length > 0 && avgAcc < 50) causes.push('Sensibilité aux distractions auditives — les environnements bruyants peuvent perturber l\'attention.')
  if (moods && moods.filter(m => m.mood === 'SAD' || m.mood === 'ANGRY' || m.mood === 'TIRED').length > moods.length / 2) causes.push('Fatigue ou stress émotionnel — l\'humeur de l\'enfant peut impacter ses performances.')
  if (sessions.length < 5) causes.push('Pas assez de données pour une analyse complète — continuez à jouer régulièrement pour obtenir un meilleur aperçu.')
  if (causes.length === 0) causes.push('Bonnes performances générales — aucun problème majeur détecté.')

  return causes
}

const getRecommendations = (sessions, moods) => {
  const recs = []
  const avgAcc = sessions.length > 0 ? sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / sessions.length : 0
  const gameTypes = [...new Set(sessions.map(s => s.gameType))]

  if (avgAcc < 60) recs.push({
    title: 'Jeux de concentration',
    text: 'Encouragez votre enfant à jouer à Cloud Valley et Gate of Patience — ces jeux sont conçus pour améliorer l\'attention soutenue.',
    icon: '🎯',
  })
  if (!gameTypes.includes('CLOUD_VALLEY')) recs.push({
    title: 'Essayez Cloud Valley',
    text: 'Ce jeu aide à développer la concentration visuelle et la patience. Idéal pour commencer en douceur.',
    icon: '☁️',
  })
  if (moods && moods.filter(m => m.mood === 'SAD' || m.mood === 'ANGRY').length > 0) recs.push({
    title: 'Gestion des émotions',
    text: 'Proposez des sessions courtes (5-10 min) quand l\'enfant est de bonne humeur. Le jeu calmant Cloud Valley est parfait pour se détendre.',
    icon: '🧘',
  })
  recs.push({
    title: 'Régularité',
    text: 'Essayez de jouer 3 à 5 fois par semaine, même pour 5 minutes. La régularité est plus importante que la durée.',
    icon: '📅',
  })
  recs.push({
    title: 'Valorisation',
    text: 'Félicitez toujours votre enfant après chaque session, quel que soit son score. Le progrès viendra avec la pratique !',
    icon: '🌟',
  })

  return recs
}

const getActions = (sessions, moods) => {
  const actions = []
  const avgAcc = sessions.length > 0 ? sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / sessions.length : 0
  const gameTypes = [...new Set(sessions.map(s => s.gameType))]

  if (avgAcc < 60) actions.push('Planifier 3 sessions courtes par semaine (5-10 minutes)')
  if (!gameTypes.includes('CLOUD_VALLEY')) actions.push('Découvrir le jeu Cloud Valley pour travailler la concentration visuelle')
  if (gameTypes.includes('NOISE_SOUK') && avgAcc < 50) actions.push('Réduire les distractions sonores pendant les jeux')
  if (moods && moods.filter(m => m.mood === 'SAD' || m.mood === 'ANGRY').length > 0) actions.push('Programmer les jeux après un moment de détente ou une activité plaisante')
  actions.push('Suivre l\'évolution chaque semaine sur le tableau de bord')
  actions.push('Utiliser le chatbot pour des conseils personnalisés')

  return actions
}

export default function ReportGenerator({ child, sessions, moods, recommendations }) {
  const [generating, setGenerating] = useState(false)
  const reportRef = useRef(null)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `rapport-${child?.nickname || child?.name || 'enfant'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }
      await html2pdf().set(opt).from(reportRef.current).save()
    } finally {
      setGenerating(false)
    }
  }

  const stateSummary = getStateSummary(sessions || [])
  const probableCauses = getProbableCauses(sessions || [], moods || [])
  const recs = getRecommendations(sessions || [], moods || [])
  const actions = getActions(sessions || [], moods || [])

  const totalSessions = (sessions || []).length
  const avgAccuracy = totalSessions > 0
    ? Math.round(sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / totalSessions)
    : 0
  const avgReaction = totalSessions > 0
    ? Math.round(sessions.reduce((a, s) => a + (s.reactionTime || 0), 0) / totalSessions)
    : 0
  const gameCounts = (sessions || []).reduce((acc, s) => {
    acc[s.gameType] = (acc[s.gameType] || 0) + 1; return acc
  }, {})
  const mostPlayed = Object.entries(gameCounts).sort((a, b) => b[1] - a[1])

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        {generating ? (
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {generating ? 'Génération...' : 'Générer le rapport PDF'}
      </button>

      <div ref={reportRef} className="absolute" style={{ top: '-9999px', left: '-9999px', width: '210mm', padding: '20mm 15mm', background: '#fff', fontFamily: 'Arial, sans-serif', fontSize: '11pt', color: '#333', lineHeight: 1.5 }}>
        <div style={{ borderBottom: '3px solid #0ea5e9', paddingBottom: 10, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#0ea5e9' }}>NAWAT</div>
            <div style={{ fontSize: 10, color: '#888' }}>Rapport parent — Suivi personnalisé</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 9, color: '#999' }}>
            Généré le {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>

        <div style={{ background: '#f0f9ff', padding: '12px 15px', borderRadius: 8, marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: '#0369a1' }}>{child?.nickname || child?.name || 'Enfant'}</div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 3 }}>Ce rapport est conçu pour vous aider à comprendre les progrès de votre enfant simplement.</div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#0ea5e9', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>État général</div>
          <p style={{ fontSize: 11, lineHeight: 1.5 }}>{stateSummary}</p>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#0ea5e9', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>Chiffres clés</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', width: '50%' }}>Nombre de sessions</td>
                <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>{totalSessions}</td>
              </tr>
              <tr style={{ background: '#f9fafb' }}>
                <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}>Précision moyenne</td>
                <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>{avgAccuracy}%</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}>Temps de réaction moyen</td>
                <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>{avgReaction > 0 ? `${avgReaction} ms` : '-'}</td>
              </tr>
              <tr style={{ background: '#f9fafb' }}>
                <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}>Jeu le plus joué</td>
                <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>{mostPlayed.length > 0 ? `${GAME_LABELS[mostPlayed[0][0]] || mostPlayed[0][0]} (${mostPlayed[0][1]})` : '-'}</td>
              </tr>
              {moods && moods.length > 0 && (
                <tr>
                  <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}>Humeurs enregistrées</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>{moods.length}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#0ea5e9', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>Causes probables</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 10 }}>
            {probableCauses.map((c, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{c}</li>
            ))}
          </ul>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#0ea5e9', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>Actions recommandées</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 10 }}>
            {actions.map((a, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{a}</li>
            ))}
          </ul>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#0ea5e9', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>Recommandations personnalisées</div>
          {recs.map((r, i) => (
            <div key={i} style={{ marginBottom: 8, padding: 8, background: i % 2 === 0 ? '#f9fafb' : '#fff', borderRadius: 4, border: '1px solid #e5e7eb' }}>
              <div style={{ color: '#0369a1', fontWeight: 'bold', fontSize: 10, marginBottom: 2 }}>{r.icon} {r.title}</div>
              <div style={{ fontSize: 10 }}>{r.text}</div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, fontSize: 8, color: '#999', textAlign: 'center' }}>
          NAWAT — Rapport généré automatiquement. Ce document est un outil d'aide au suivi parental.
        </div>
      </div>
    </>
  )
}
