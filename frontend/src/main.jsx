import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'
import AboutPage   from './pages/AboutPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<App />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/about"   element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
