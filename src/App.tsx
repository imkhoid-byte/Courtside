import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

// ─── Global error boundary — prevents any crash from showing a black screen ──

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(_error: Error, info: ErrorInfo) { console.error('App error:', info) }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      return (
        <div style={{ padding: 32, fontFamily: '"DM Sans"', background: '#08090d', minHeight: '100vh', color: '#e4e8f2' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#636b84', marginBottom: 24 }}>{err.message}</div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
            style={{ padding: '12px 24px', background: '#bef264', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#08090d' }}
          >Go Home</button>
        </div>
      )
    }
    return this.props.children
  }
}
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
    <ErrorBoundary>
      <BrowserRouter>
        <I18nProvider>
          <AppProvider>
            <ScoreProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </ScoreProvider>
          </AppProvider>
        </I18nProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
