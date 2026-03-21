import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { ScoreProvider } from './contexts/ScoreContext'
import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'
import { ScorePage } from './pages/ScorePage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { HistoryPage } from './pages/HistoryPage'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ScoreProvider>
          <AppShell>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/score" element={<ScorePage />} />
              <Route path="/stats" element={<AnalyticsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/me" element={<ProfilePage />} />
            </Routes>
          </AppShell>
        </ScoreProvider>
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
