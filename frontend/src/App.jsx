import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import BookPage from './pages/BookPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ReadingPage from './pages/ReadingPage.jsx'
import SearchPage from './pages/SearchPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="books/:id" element={<BookPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="reading" element={<ReadingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
