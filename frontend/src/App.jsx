import { Route, Routes } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth.jsx'
import Layout from './components/Layout.jsx'
import BookPage from './pages/BookPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import LentPage from './pages/LentPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ImportPage from './pages/ImportPage.jsx'
import ReadingPage from './pages/ReadingPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import SearchPage from './pages/SearchPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Javne strani (tudi za obiskovalce) */}
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="books/:id" element={<BookPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Samo za prijavljene */}
        <Route element={<RequireAuth />}>
          <Route path="library" element={<LibraryPage />} />
          <Route path="library/lent" element={<LentPage />} />
          <Route path="reading" element={<ReadingPage />} />
          <Route path="import" element={<ImportPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
