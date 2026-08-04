# PremiumLott

Prototipo frontend estático de PremiumLott preparado para GitHub Pages. HTML5, CSS3 y JavaScript vanilla — sin frameworks, sin Node.js, sin build step.

> **MODO DE PRUEBA** — Todo el saldo, las jugadas y los premios de esta fase son ficticios. No se procesan depósitos, retiros ni premios reales.

## V4 — PremiumGol Fase 1 (programa de 12 partidos, grupos, billetera y panel admin)

Esta versión evoluciona el prototipo hacia una experiencia completa de **PremiumGol**: programa oficial de 12 partidos, grupos privados con pozos independientes, tres modalidades de premiación, billetera de prueba con libro mayor, y panel administrativo para gestionar programas, resultados y liquidaciones. Premium World Cup y el resto del sitio se mantienen funcionando sin cambios en su lógica.

### Arquitectura

```
assets/js/
  core/         store.js, settlement.js, formatters.js, router-utils.js, ui.js, layout.js
  services/     mock-api.js, api-client.js, auth-service.js, wallet-service.js,
                group-service.js, premiumgol-service.js, admin-service.js
  pages/        un controlador por pantalla (register.js, premiumgol-builder.js, admin-settlement.js, ...)
  app.js        arranque de página + capa de compatibilidad `PL` para Premium World Cup
  mundial.js    Premium World Cup (sin modificar)
  i18n.js       selector de idioma (sin modificar)
```

- **Store (`core/store.js`)**: única fuente de datos en `localStorage` bajo la clave `premiumlott_state_v3`, con migración automática desde `premiumlott_state_v2`/`v1`. Todos los montos se guardan en céntimos.
- **MockApi (`services/mock-api.js`)**: simula el backend completo (autenticación, grupos, PremiumGol, billetera, administración) con el mismo contrato `{ok, data, error, requestId, serverTime}` que usará el futuro backend real.
- **ApiClient (`services/api-client.js`)**: fachada estable (`window.Api`) que hoy delega en `MockApi` y en la Fase 2 delegará en `AppsScriptApi` sin que ninguna pantalla deba reescribirse.
- **Settlement (`core/settlement.js`)**: motor de cálculo de aciertos y distribución de pozos para las 3 modalidades de premiación.
- **Layout (`core/layout.js`)**: inyecta encabezado, pie de página y aviso de modo de prueba en cada página desde una sola plantilla, evitando duplicar el HTML en más de 25 archivos.

### Compatibilidad con Premium World Cup

`assets/js/mundial.js` **no fue modificado**. Sigue usando el objeto global `PL` (`PL.isLoggedIn`, `PL.canPay`, `PL.addTicket`, `PL.makeCode`, `PL.money`), que ahora vive en `assets/js/app.js` como una capa de compatibilidad respaldada por el Store v3. Los tickets de Premium World Cup se guardan en `state.legacyTickets` para no mezclarse con el esquema estricto de tickets de PremiumGol (que requieren 12 pronósticos, grupo y programa).

## Credenciales demo

| Cuenta | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@premiumlott.demo` | `PremiumDemo2026!` |
| Usuario demo | `carlos.demo@premiumlott.demo` | `Demo2026!` |
| Usuario demo | `maria.demo@premiumlott.demo` | `Demo2026!` |

Estas cuentas y sus grupos/tickets de ejemplo se generan automáticamente la primera vez que se carga la aplicación (`Store.seedDemoData`). Para reiniciar todos los datos: `localStorage.clear()` y recargar, o usar "Reiniciar cuenta demo" en `saldo.html` para restablecer solo tu cuenta.

## Cómo probar localmente

GitHub Pages sirve archivos estáticos por HTTP, así que para probar localmente con el mismo comportamiento (fetch, rutas relativas) usa un servidor simple:

```bash
python3 -m http.server 8811
# abrir http://localhost:8811/index.html
```

Abrir el archivo directamente con `file://` no funciona correctamente porque `i18n.js` usa `fetch()`.

### Flujos principales para probar

1. **Registro + verificación**: `registro.html` → completar formulario → código OTP de prueba se muestra en pantalla → `verificar-correo.html`.
2. **Crear grupo**: `grupos/crear.html` → elegir modalidad → se genera código de invitación de 6 caracteres.
3. **Jugar PremiumGol**: desde el detalle del grupo, "Jugar PremiumGol" → marcar los 12 partidos → agregar al carrito → confirmar (descuenta saldo demo).
4. **Billetera**: `saldo.html` → recargar saldo demo → ver libro mayor.
5. **Admin**: iniciar sesión como `admin@premiumlott.demo` → `admin/index.html` → crear/abrir/cerrar programa → cargar resultados → previsualizar y liquidar.

## Notas

- Esta versión sigue siendo un prototipo frontend. Para producción real se necesita backend (Google Apps Script, ver `docs/`), pasarela de pagos real, KYC, autorización regulatoria, seguridad y auditoría de verdad.
- Los documentos de la carpeta [`docs/`](docs/) detallan los requisitos funcionales, el contrato de API para Apps Script, el esquema de Google Sheets y los casos de prueba verificados.

---

## Historial de versiones anteriores

### V3.1 — Ajustes UX móvil
- Los grupos desplegables de Premium World Cup ya no se cierran al seleccionar el primer país.
- Íconos SVG reales para redes sociales en el pie de página.

### V3 — Worldgroup Premium profesional
- `juegos/mundial.html` entra directamente a Worldgroup Premium (una sola modalidad).
- Fixture organizado en bloques verticales desplegables: grupos, mejores terceros, ronda de 32 hasta campeón.

### V2 — Estado unificado
- Estado global unificado, login/wallet/tickets conectados a una sola fuente de datos.
