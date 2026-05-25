// client/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar.jsx'
import { BottomNav } from './components/layout/BottomNav.jsx'
import { useAuth } from './context/AuthContext.jsx'

import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Users from './pages/Users.jsx'
import Profile from './pages/Profile.jsx'
import MyProfile from './pages/MyProfile.jsx'
import Meetups from './pages/Meetups.jsx'
import MeetupDetail from './pages/MeetupDetail.jsx'
import CreateMeetup from './pages/CreateMeetup.jsx'
import Clubs from './pages/Clubs.jsx'
import ClubDetail from './pages/ClubDetail.jsx'
import MyBookings from './pages/MyBookings.jsx'
import BookingSuccess from './pages/BookingSuccess.jsx'
import BookingCancel from './pages/BookingCancel.jsx'
import MyFriends from './pages/MyFriends.jsx'
import MyClubs from './pages/MyClubs.jsx'
import MyClubNew from './pages/MyClubNew.jsx'
import MyClubManage from './pages/MyClubManage.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminHome from './pages/admin/AdminHome.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import AdminClubs from './pages/admin/AdminClubs.jsx'
import AdminEvents from './pages/admin/AdminEvents.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-4">Cargando...</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand to-emerald-700">
        <div className="text-center text-white">
          <div className="text-6xl mb-3">🏆</div>
          <p className="text-xl font-bold">SportMatch</p>
          <p className="text-sm text-white/80 mt-1">Cargando...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"                element={<Home />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/users"           element={<Users />} />
          <Route path="/meetups"         element={<Meetups />} />
          <Route path="/meetups/new"     element={<Protected><CreateMeetup /></Protected>} />
          <Route path="/meetups/:id"     element={<MeetupDetail />} />
          <Route path="/clubs"           element={<Clubs />} />
          <Route path="/clubs/:id"       element={<ClubDetail />} />
          <Route path="/me"              element={<Protected><MyProfile /></Protected>} />
          <Route path="/me/bookings"     element={<Protected><MyBookings /></Protected>} />
          <Route path="/me/friends"      element={<Protected><MyFriends /></Protected>} />
          <Route path="/me/clubs"        element={<Protected><MyClubs /></Protected>} />
          <Route path="/me/clubs/new"    element={<Protected><MyClubNew /></Protected>} />
          <Route path="/me/clubs/:id"    element={<Protected><MyClubManage /></Protected>} />
          <Route path="/booking/:id/success" element={<Protected><BookingSuccess /></Protected>} />
          <Route path="/booking/:id/cancel"  element={<Protected><BookingCancel /></Protected>} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index                element={<AdminHome />} />
            <Route path="deportistas"   element={<AdminUsers />} />
            <Route path="clubes"        element={<AdminClubs />} />
            <Route path="eventos"       element={<AdminEvents />} />
          </Route>
          <Route path="/:slug"           element={<Profile />} />
          <Route path="*"                element={<p className="p-8 text-center text-slate-500">404 — página no encontrada</p>} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
