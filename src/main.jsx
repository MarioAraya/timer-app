import { render } from 'preact'
import App from './app.jsx'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import './styles/themes.css'
import './index.css'

render(
  <ThemeProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </ThemeProvider>,
  document.getElementById('app')
)
