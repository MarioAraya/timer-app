import { render } from 'preact'
import App from './app.jsx'
import { LanguageProvider } from './context/LanguageContext'
import './index.css'

render(
  <LanguageProvider>
    <App />
  </LanguageProvider>,
  document.getElementById('app')
)