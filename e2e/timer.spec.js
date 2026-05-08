import { test, expect } from '@playwright/test'

// Helpers reutilizables
const card = (page, id) => page.getByTestId(`timer-card-${id}`)
const setupStartBtn = (page) => page.getByTestId('setup-start-btn')
const activeBackBtn = (page) => page.getByTestId('active-back-btn')
const ctrlStart = (page) => page.getByTestId('ctrl-start')
const ctrlPause = (page) => page.getByTestId('ctrl-pause')
const ctrlReset = (page) => page.getByTestId('ctrl-reset')
const timersHome = (page) => page.locator('.timers-home')
const setupView = (page) => page.locator('.workout-setup-view')
const activeView = (page) => page.locator('.workout-active-view')

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(timersHome(page)).toBeVisible()
})

// ─────────────────────────────────────────────────────
// HIIT
// ─────────────────────────────────────────────────────

test.describe('HIIT Timer', () => {
  test('muestra la card en el home', async ({ page }) => {
    await expect(card(page, 'hiit')).toBeVisible()
  })

  test('click en la card abre la pantalla de setup', async ({ page }) => {
    await card(page, 'hiit').click()
    await expect(setupView(page)).toBeVisible()
    await expect(timersHome(page)).not.toBeVisible()
  })

  test('back en setup vuelve al home', async ({ page }) => {
    await card(page, 'hiit').click()
    await expect(setupView(page)).toBeVisible()
    await page.locator('.back-button').click()
    await expect(timersHome(page)).toBeVisible()
  })

  test('start workout abre la vista activa', async ({ page }) => {
    await card(page, 'hiit').click()
    await setupStartBtn(page).click()
    await expect(activeView(page)).toBeVisible()
    await expect(setupView(page)).not.toBeVisible()
  })

  test('iniciar el timer muestra el botón de pausa', async ({ page }) => {
    await card(page, 'hiit').click()
    await setupStartBtn(page).click()
    await ctrlStart(page).click()
    await expect(ctrlPause(page)).toBeVisible()
    await expect(ctrlStart(page)).not.toBeVisible()
  })

  test('pausar el timer muestra el botón de inicio', async ({ page }) => {
    await card(page, 'hiit').click()
    await setupStartBtn(page).click()
    await ctrlStart(page).click()
    await ctrlPause(page).click()
    await expect(ctrlStart(page)).toBeVisible()
    await expect(ctrlPause(page)).not.toBeVisible()
  })

  test('resetear vuelve al estado inicial (timer detenido)', async ({ page }) => {
    await card(page, 'hiit').click()
    await setupStartBtn(page).click()
    await ctrlStart(page).click()
    await ctrlPause(page).click()
    await ctrlReset(page).click()
    await expect(ctrlStart(page)).toBeVisible()
  })

  test('back en vista activa vuelve al setup', async ({ page }) => {
    await card(page, 'hiit').click()
    await setupStartBtn(page).click()
    await activeBackBtn(page).click()
    await expect(setupView(page)).toBeVisible()
    await expect(activeView(page)).not.toBeVisible()
  })

  test('flujo completo: home → setup → activo → pausar → resetear → setup → home', async ({ page }) => {
    // Home → setup
    await card(page, 'hiit').click()
    await expect(setupView(page)).toBeVisible()

    // Setup → activo
    await setupStartBtn(page).click()
    await expect(activeView(page)).toBeVisible()

    // Iniciar → pausar → resetear
    await ctrlStart(page).click()
    await expect(ctrlPause(page)).toBeVisible()
    await ctrlPause(page).click()
    await ctrlReset(page).click()
    await expect(ctrlStart(page)).toBeVisible()

    // Activo → setup → home
    await activeBackBtn(page).click()
    await expect(setupView(page)).toBeVisible()
    await page.locator('.back-button').click()
    await expect(timersHome(page)).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────
// Tabata
// ─────────────────────────────────────────────────────

test.describe('Tabata Timer', () => {
  test('muestra la card en el home', async ({ page }) => {
    await expect(card(page, 'tabata')).toBeVisible()
  })

  test('click en la card abre la pantalla de setup', async ({ page }) => {
    await card(page, 'tabata').click()
    await expect(setupView(page)).toBeVisible()
    await expect(timersHome(page)).not.toBeVisible()
  })

  test('back en setup vuelve al home', async ({ page }) => {
    await card(page, 'tabata').click()
    await expect(setupView(page)).toBeVisible()
    await page.locator('.back-button').click()
    await expect(timersHome(page)).toBeVisible()
  })

  test('start workout abre la vista activa', async ({ page }) => {
    await card(page, 'tabata').click()
    await setupStartBtn(page).click()
    await expect(activeView(page)).toBeVisible()
  })

  test('iniciar el timer muestra el botón de pausa', async ({ page }) => {
    await card(page, 'tabata').click()
    await setupStartBtn(page).click()
    await ctrlStart(page).click()
    await expect(ctrlPause(page)).toBeVisible()
    await expect(ctrlStart(page)).not.toBeVisible()
  })

  test('pausar el timer muestra el botón de inicio', async ({ page }) => {
    await card(page, 'tabata').click()
    await setupStartBtn(page).click()
    await ctrlStart(page).click()
    await ctrlPause(page).click()
    await expect(ctrlStart(page)).toBeVisible()
  })

  test('resetear vuelve al estado inicial (timer detenido)', async ({ page }) => {
    await card(page, 'tabata').click()
    await setupStartBtn(page).click()
    await ctrlStart(page).click()
    await ctrlPause(page).click()
    await ctrlReset(page).click()
    await expect(ctrlStart(page)).toBeVisible()
  })

  test('flujo completo: home → setup → activo → pausar → resetear → setup → home', async ({ page }) => {
    await card(page, 'tabata').click()
    await expect(setupView(page)).toBeVisible()

    await setupStartBtn(page).click()
    await expect(activeView(page)).toBeVisible()

    await ctrlStart(page).click()
    await expect(ctrlPause(page)).toBeVisible()
    await ctrlPause(page).click()
    await ctrlReset(page).click()
    await expect(ctrlStart(page)).toBeVisible()

    await activeBackBtn(page).click()
    await expect(setupView(page)).toBeVisible()
    await page.locator('.back-button').click()
    await expect(timersHome(page)).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────
// Reproducción de MP3
// ─────────────────────────────────────────────────────

/**
 * Reemplaza window.Audio con un mock que:
 * - Dispara canplaythrough automáticamente (para que initialize() resuelva)
 * - Registra cada llamada a play() en window.__audioPlayCalls
 * - Setea paused=false en play() para poder verificar el estado
 *
 * Debe llamarse ANTES de page.goto() para que aplique al cargar la página.
 * Como beforeEach ya hizo un goto('/'), el test debe hacer un segundo goto('/')
 * después de registrar el mock.
 */
const mockAudio = (page) =>
  page.addInitScript(() => {
    window.__audioPlayCalls = []

    class MockAudio extends EventTarget {
      constructor(src) {
        super()
        this.src = src || ''
        this.paused = true
        this.volume = 1
        this.currentTime = 0
        this.loop = false
        this.preload = 'auto'
        this.readyState = 4
      }

      setAttribute() {}

      play() {
        this.paused = false
        window.__audioPlayCalls.push(this.src)
        return Promise.resolve()
      }

      pause() {
        this.paused = true
        this.dispatchEvent(new Event('pause'))
      }

      // Síncrono: WorkoutAudioPlayer.initialize() registra el listener ANTES de llamar
      // load(), así canplaythrough resuelve el Promise en la misma macrotarea.
      // Esto garantiza que playerReady=true antes de que handleStart() llame resume().
      load() {
        this.dispatchEvent(new Event('canplaythrough'))
      }
    }

    window.Audio = MockAudio
  })

test.describe('Reproducción de MP3', () => {
  test('HIIT: config default → play → MP3 de HIIT se reproduce', async ({ page }) => {
    // Registrar mock antes de cargar la página con el mock activo
    await mockAudio(page)
    await page.goto('/')
    await expect(timersHome(page)).toBeVisible()

    // Entrar al timer con config default (sin cambiar nada en setup)
    await card(page, 'hiit').click()
    await expect(setupView(page)).toBeVisible()

    await setupStartBtn(page).click()
    await expect(activeView(page)).toBeVisible()

    // Dar play
    await ctrlStart(page).click()
    await expect(ctrlPause(page)).toBeVisible()

    // Esperar a que play() sea llamado (WorkoutAudioPlayer es async)
    await page.waitForFunction(
      () => window.__audioPlayCalls.length > 0,
      { timeout: 5000 }
    )

    const playCalls = await page.evaluate(() => window.__audioPlayCalls)

    // Verificar que se llamó play() con la URL del MP3 de HIIT
    expect(playCalls.some((src) => src.includes('hiit'))).toBe(true)
  })

  test('Tabata: config default → play → MP3 de Tabata se reproduce', async ({ page }) => {
    await mockAudio(page)
    await page.goto('/')
    await expect(timersHome(page)).toBeVisible()

    await card(page, 'tabata').click()
    await expect(setupView(page)).toBeVisible()

    await setupStartBtn(page).click()
    await expect(activeView(page)).toBeVisible()

    await ctrlStart(page).click()
    await expect(ctrlPause(page)).toBeVisible()

    await page.waitForFunction(
      () => window.__audioPlayCalls.length > 0,
      { timeout: 5000 }
    )

    const playCalls = await page.evaluate(() => window.__audioPlayCalls)
    expect(playCalls.some((src) => src.includes('tabata'))).toBe(true)
  })

})

// ─────────────────────────────────────────────────────
// Navegación entre timers
// ─────────────────────────────────────────────────────

test.describe('Navegación entre timers', () => {
  test('después de volver al home, ambas cards siguen visibles', async ({ page }) => {
    await card(page, 'hiit').click()
    await page.locator('.back-button').click()
    await expect(card(page, 'hiit')).toBeVisible()
    await expect(card(page, 'tabata')).toBeVisible()
  })

  test('puede entrar a HIIT y luego a Tabata en la misma sesión', async ({ page }) => {
    // HIIT
    await card(page, 'hiit').click()
    await expect(setupView(page)).toBeVisible()
    await page.locator('.back-button').click()

    // Tabata
    await card(page, 'tabata').click()
    await expect(setupView(page)).toBeVisible()
  })
})
