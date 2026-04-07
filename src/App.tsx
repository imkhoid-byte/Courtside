import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AppProvider } from './contexts/AppContext'
import { ScoreProvider } from './contexts/ScoreContext'
import { I18nProvider } from './contexts/I18nContext'
import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'
import { ScorePage } from './pages/ScorePage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { HistoryPage } from './pages/HistoryPage'
import { ProfilePage } from './pages/ProfilePage'
import { LogMatchPage } from './pages/LogMatchPage'
import { TournamentPage } from './pages/TournamentPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { MatchReplayPage } from './pages/MatchReplayPage'
import { RulesPage } from './pages/RulesPage'
import { getPref } from './lib/db'

function AppRoutes() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)

  useEffect(() => {
    getPref('onboardingDone').then(v => {
      setOnboardingDone(v === '1')
    })
  }, [])

  if (onboardingDone === null) return null // Loading

  if (!onboardingDone) {
    return <OnboardingPage onDone={() => setOnboardingDone(true)} />
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/score" element={<ScorePage />} />
        <Route path="/stats" element={<AnalyticsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/me" element={<ProfilePage />} />
        <Route path="/log" element={<LogMatchPage />} />
        <Route path="/tournament" element={<TournamentPage />} />
        <Route path="/match/:id" element={<MatchReplayPage />} />
        <Route path="/rules" element={<RulesPage />} />
      </Routes>
    </AppShell>
  )
}

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AppProvider>
          <ScoreProvider>
            <AppRoutes />
          </ScoreProvider>
        </AppProvider>
      </I18nProvider>
    </BrowserRouter>
  )
}

export default App
