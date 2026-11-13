# Timer TV (LG webOS 2017-18)

HIIT y Tabata con sus canciones, para entrenar frente al TV. Spec: `PLAN.md`.

## Instalar en el TV (una vez)
1. Cuenta en https://webostv.developer.lge.com y app **Developer Mode** en el TV (la sesión caduca: renovarla desde esa app o la app instalada se borra).
2. En el TV: Developer Mode ON, anotar la IP y la passphrase.
3. En el Mac:
   ```bash
   cd tv-webos && npm install
   npx ares-setup-device --add tv -i "host=<IP_TV>" -i "port=9922" -i "username=prisoner"
   npx ares-novacom --device tv --getkey      # pide la passphrase del TV
   npx ares-setup-device --modify tv -i "privateKey=tv_webos" -i "passphrase=<PASSPHRASE>"
   npx ares-device --device tv -i             # verifica conexión
   ```

## Desplegar
```bash
npm run tv:install     # build + .ipk + instala + lanza
```
Solo generar el paquete: `npm run tv:package` → `build/com.timerapp.tv_0.1.0_all.ipk`.
Requiere los MP3 en `../public/` (HIIT x12 y Tabata Rocky).

## Control remoto
| Tecla | Home | Workout |
|---|---|---|
| ◀ ▶ | Cambiar tarjeta | Round anterior / siguiente |
| OK | Empezar | Pausa / seguir |
| Back | Salir | Pausa; segundo Back = Inicio |
| Azul | — | Overlay de debug |

## Desarrollo
`npm run dev` (http://localhost:5556, teclado: flechas/Enter/Backspace/D) · `npm test` · `npm run build`.
