# PremiumLott V2

Prototipo frontend estático de PremiumLott preparado para GitHub Pages.

## Cambios principales de esta versión

- Estado global unificado en `premiumlott_state_v2`.
- Migración automática desde `premiumlott_state_v1` y tickets anteriores de Premium World Cup.
- Login, usuario, wallet, tickets y movimientos conectados a una sola fuente de datos.
- PremiumGol ahora valida sesión, saldo y 8 pronósticos completos.
- Premium World Cup rediseñado con flujo por pasos, grupos desplegables, mejores terceros y bracket visual.
- Tickets de todos los juegos aparecen en `Mis jugadas`.
- Descuento de saldo y movimientos coherentes al registrar tickets.
- Hero de inicio corregido para no depender de videos faltantes.
- Assets duplicados en la carpeta raíz `img/` eliminados; la ruta estándar es `assets/img/`.

## Archivos clave

- `assets/js/app.js`: estado global, sesión, tickets, wallet y utilidades.
- `assets/js/auth.js`: login y registro.
- `assets/js/premiumgol.js`: lógica validada de PremiumGol.
- `assets/js/mundial.js`: flujo completo de Premium World Cup.
- `assets/js/wallet.js`: recargas y movimientos.
- `assets/css/main.css`: estilos generales y rediseño World Cup.

## Nota

Esta versión sigue siendo un prototipo frontend. Para producción real se necesita backend, pasarela de pagos real, KYC, autorización regulatoria, seguridad, auditoría y base de datos.
