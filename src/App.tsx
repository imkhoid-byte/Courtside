import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, Component, lazy, Suspense } from 'react'
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
        <div style={{ padding: 32, fontFamily: '"DM Sans"', background: '#07070f', minHeight: '100vh', color: '#eeeeff' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#7878a8', marginBottom: 24 }}>{err.message}</div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
            style={{ padding: '12px 24px', background: '#7c3aed', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#fff' }}
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
import { OnboardingPage } from './pages/OnboardingPage'
import { getPref } from './lib/db'

// ─── Eagerly loaded (core paths) ──────────────────────────────────────────────
import { HomePage } from './pages/HomePage'
import { ScorePage } from './pages/ScorePage'
import { PartyPage } from './pages/PartyPage'
import { LogMatchPage } from './pages/LogMatchPage'
import { ProfilePage } from './pages/ProfilePage'

// ─── Lazily loaded (heavy / infrequent routes) ────────────────────────────────
const AnalyticsPage  = lazy(() => import('./pages/AnalyticsPage').then(m  => ({ default: m.AnalyticsPage  })))
const HistoryPage    = lazy(() => import('./pages/HistoryPage').then(m    => ({ default: m.HistoryPage    })))
const TournamentPage = lazy(() => import('./pages/TournamentPage').then(m => ({ default: m.TournamentPage })))
const MatchReplayPage= lazy(() => import('./pages/MatchReplayPage').then(m=> ({ default: m.MatchReplayPage})))
const RulesPage      = lazy(() => import('./pages/RulesPage').then(m      => ({ default: m.RulesPage      })))
const ProPage        = lazy(() => import('./pages/ProPage').then(m        => ({ default: m.ProPage        })))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #1e1e3c', borderTopColor: '#7c3aed', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function AppRoutes() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)

  useEffect(() => {
    getPref('onboardingDone').then(v => {
      setOnboardingDone(v === '1')
    })
  }, [])

  if (onboardingDone === null) return null

  if (!onboardingDone) {
    return <OnboardingPage onDone={() => setOnboardingDone(true)} />
  }

  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
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
          <Route path="/pro" element={<ProPage />} />
          <Route path="/party" element={<PartyPage />} />
        </Routes>
      </Suspense>
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
