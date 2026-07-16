import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { TournamentProvider } from './hooks/useTournamentData'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ScrollToTop } from './components/ScrollToTop'
import { LandingPage } from './pages/LandingPage'
import { GroupsPage } from './pages/GroupsPage'
import { TeamsPage } from './pages/TeamsPage'
import { BracketPage } from './pages/BracketPage'
import { MatchesPage } from './pages/MatchesPage'
import { TeamPage } from './pages/TeamPage'
import { PlayersPage } from './pages/PlayersPage'
import { PlayerPage } from './pages/PlayerPage'
import { AwardsPage } from './pages/AwardsPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage'
import { AdminRosterPage } from './pages/admin/AdminRosterPage'
import { AdminMatchesPage } from './pages/admin/AdminMatchesPage'
import { AdminMatchResultPage } from './pages/admin/AdminMatchResultPage'
import { AdminAwardsPage } from './pages/admin/AdminAwardsPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <TournamentProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/teams" replace />} />
            <Route path="teams" element={<AdminTeamsPage />} />
            <Route path="teams/:teamId/roster" element={<AdminRosterPage />} />
            <Route path="matches" element={<AdminMatchesPage />} />
            <Route path="matches/:matchId" element={<AdminMatchResultPage />} />
            <Route path="awards" element={<AdminAwardsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
          <Route
            path="/*"
            element={
              <PublicLayout>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/teams" element={<TeamsPage />} />
                  <Route path="/groups" element={<GroupsPage />} />
                  <Route path="/bracket" element={<BracketPage />} />
                  <Route path="/matches" element={<MatchesPage />} />
                  <Route path="/teams/:teamId" element={<TeamPage />} />
                  <Route path="/players" element={<PlayersPage />} />
                  <Route path="/players/:playerId" element={<PlayerPage />} />
                  <Route path="/awards" element={<AwardsPage />} />
                </Routes>
              </PublicLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </TournamentProvider>
  )
}

export default App
