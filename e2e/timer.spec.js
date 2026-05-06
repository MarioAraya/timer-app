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
