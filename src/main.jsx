import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { getLang } from './lib/i18n'
// Ustaw HTML lang przy starcie
if (typeof document !== 'undefined') document.documentElement.lang = getLang();
import PublicSite from './pages/PublicSite.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ProspectView from './pages/ProspectView.jsx'
import PanelLayout from './pages/PanelLayout.jsx'

import KominiarzDashboard from './pages/kominiarz/Dashboard.jsx'
import Kalendarz from './pages/kominiarz/Kalendarz.jsx'
import Klienci from './pages/kominiarz/Klienci.jsx'
import BudynekDetail from './pages/kominiarz/BudynekDetail.jsx'
import Wizyty from './pages/kominiarz/Wizyty.jsx'
import WizytaDetail from './pages/kominiarz/WizytaDetail.jsx'
import NBA from './pages/kominiarz/NBA.jsx'
import Oferty from './pages/kominiarz/Oferty.jsx'
import KominiarzUstawienia from './pages/kominiarz/Ustawienia.jsx'
import KominiarzMagicLinki from './pages/kominiarz/MagicLinki.jsx'
import KominiarzLeady from './pages/kominiarz/Leady.jsx'

import SpoldzielniaDashboard from './pages/spoldzielnia/Dashboard.jsx'
import SpoldzielniaObiekty from './pages/spoldzielnia/Obiekty.jsx'
import SpoldzielniaRaporty from './pages/spoldzielnia/Raporty.jsx'

import MieszkaniecDashboard from './pages/mieszkaniec/Dashboard.jsx'
import WybierzTermin from './pages/mieszkaniec/WybierzTermin.jsx'
import Historia from './pages/mieszkaniec/Historia.jsx'
import Zgloszenie from './pages/mieszkaniec/Zgloszenie.jsx'
import MieszkaniecOferty from './pages/mieszkaniec/Oferty.jsx'

import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminUsers from './pages/admin/Users.jsx'
import AdminMagicLinks from './pages/admin/MagicLinks.jsx'
import AdminLeads from './pages/admin/Leads.jsx'
import AdminCMS from './pages/admin/CMS.jsx'
import AdminAudit from './pages/admin/Audit.jsx'
import AdminData from './pages/admin/Data.jsx'
import IssuesList from './pages/shared/IssuesList.jsx'
import Profile from './pages/shared/Profile.jsx'
import WizytaMieszkanca from './pages/mieszkaniec/WizytaDetail.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicSite />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Magic link — bez logowania */}
        <Route path="/p/:token" element={<ProspectView />} />

        <Route path="/panel" element={<PanelLayout />}>
          {/* KOMINIARZ */}
          <Route path="kominiarz" element={<KominiarzDashboard />} />
          <Route path="kominiarz/kalendarz" element={<Kalendarz />} />
          <Route path="kominiarz/klienci" element={<Klienci />} />
          <Route path="kominiarz/budynek/:id" element={<BudynekDetail />} />
          <Route path="kominiarz/wizyty" element={<Wizyty />} />
          <Route path="kominiarz/wizyta/:id" element={<WizytaDetail />} />
          <Route path="kominiarz/nba" element={<NBA />} />
          <Route path="kominiarz/oferty" element={<Oferty />} />
          <Route path="kominiarz/leady" element={<KominiarzLeady />} />
          <Route path="kominiarz/magic-linki" element={<KominiarzMagicLinki />} />
          <Route path="kominiarz/zgloszenia" element={<IssuesList />} />
          <Route path="kominiarz/ustawienia" element={<KominiarzUstawienia />} />

          {/* SPÓŁDZIELNIA / ZARZĄDCA */}
          <Route path="spoldzielnia" element={<SpoldzielniaDashboard />} />
          <Route path="spoldzielnia/obiekty" element={<SpoldzielniaObiekty />} />
          <Route path="spoldzielnia/raporty" element={<SpoldzielniaRaporty />} />
          <Route path="spoldzielnia/zgloszenia" element={<IssuesList />} />

          {/* MIESZKANIEC */}
          <Route path="mieszkaniec" element={<MieszkaniecDashboard />} />
          <Route path="mieszkaniec/termin" element={<WybierzTermin />} />
          <Route path="mieszkaniec/historia" element={<Historia />} />
          <Route path="mieszkaniec/zgloszenie" element={<Zgloszenie />} />
          <Route path="mieszkaniec/oferty" element={<MieszkaniecOferty />} />

          {/* ADMIN */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/magic-links" element={<AdminMagicLinks />} />
          <Route path="admin/leads" element={<AdminLeads />} />
          <Route path="admin/cms" element={<AdminCMS />} />
          <Route path="admin/zgloszenia" element={<IssuesList />} />

          {/* SHARED */}
          <Route path="profil" element={<Profile />} />
          <Route path="mieszkaniec/wizyta/:id" element={<WizytaMieszkanca />} />
          <Route path="admin/audit" element={<AdminAudit />} />
          <Route path="admin/dane" element={<AdminData />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
