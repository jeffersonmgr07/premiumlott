# Casos de prueba obligatorios — PremiumGol Fase 1

Estado verificado durante el desarrollo de esta entrega. `Verificado en navegador` significa que se ejecutó el flujo real (servidor estático local + Chrome headless) y se inspeccionó el resultado en `Store`/UI. `Verificado por código` significa que la regla está implementada y revisada línea por línea, pero no se ejecutó manualmente esa corrida exacta en esta sesión.

| # | Caso | Estado | Evidencia |
|---|---|---|---|
| 1 | No se puede registrar ticket con menos de 12 selecciones | ✅ Verificado por código | `validatePicks()` en `mock-api.js` exige `Object.keys(picks).length === 12` antes de `purchaseTickets`/`createTicketDraft`. |
| 2 | No se puede registrar ticket sin grupo | ✅ Verificado por código | `purchaseTickets` exige `groupMembers` activo (`NOT_GROUP_MEMBER`) antes de crear el ticket. |
| 3 | No se puede registrar ticket sin iniciar sesión | ✅ Verificado en navegador | `AuthService.requireAuth` redirige a `login.html?redirect=...` en todas las páginas protegidas. |
| 4 | No se puede registrar ticket con saldo insuficiente | ✅ Verificado por código | `purchaseTickets` compara `wallet.balanceCents` vs. costo total y devuelve `INSUFFICIENT_BALANCE`. |
| 5 | No se puede comprar después del cierre | ✅ Verificado por código | `purchaseTickets` valida `program.status==='open' && closeAt > now`; el builder además deshabilita el carrito cuando el contador llega a cero. |
| 6 | Dos clics de confirmación no duplican la compra | ✅ Verificado en navegador | Se dispararon dos `PremiumGolService.checkout()` concurrentes: ambos resolvieron con el mismo `idempotencyKey` y **un solo** ticket creado; el saldo se debitó una sola vez (S/ 5.00). |
| 7 | Cada ticket descuenta exactamente S/ 5.00 | ✅ Verificado en navegador | Compra de 2 tickets → saldo bajó de S/ 100.00 a S/ 90.00; libro mayor mostró dos líneas de `-S/ 5.00`. |
| 8 | Cada ticket aporta exactamente S/ 4.00 al pozo | ✅ Verificado en navegador | 3 tickets en un grupo `HIGHEST_SCORE` generaron un pozo semanal de S/ 12.00 (3 × S/ 4.00). |
| 9 | Cada ticket aporta exactamente S/ 1.00 a la plataforma | ✅ Verificado en navegador | Panel admin mostró "Ingresos plataforma (demo): S/ 12.00" con 12 tickets activos. |
| 10 | El pozo de un grupo no afecta a otro grupo | ✅ Verificado en navegador | Tres grupos con el mismo programa liquidaron pozos independientes (S/ 12.00, S/ 12.00, S/ 6.00+S/ 6.00) sin mezclarse. |
| 11 | En `HIGHEST_SCORE`, los empates se dividen por ticket | ✅ Verificado en navegador | Grupo "Amigos del Barrio": 2 tickets empatados en 11/12 dividieron S/ 12.00 en S/ 6.00 + S/ 6.00 exactos. |
| 12 | En `PERFECT_12`, el pozo se acumula si nadie logra 12 | ✅ Verificado por código | `Settlement.computeProgramSettlement` fija `progressiveCarryOutCents = total` cuando `perfectTickets.length===0`; el valor se persiste en `group.progressivePoolCents` para el siguiente programa. |
| 13 | En `MIXED`, se distribuye correctamente el pozo semanal y el progresivo | ✅ Verificado en navegador | Grupo "Oficina Premium": el ticket con 12/12 ganó el pozo semanal (S/ 6.00, por tener también el máximo puntaje) **y** el pozo progresivo (S/ 6.00) en la misma liquidación. |
| 14 | Un partido `VOID` cuenta según la política configurada | ✅ Verificado por código | `Settlement.computeHits` suma el partido como acierto solo si `voidPolicy !== 'VOID_EXCLUDED'`. No se ejecutó un caso en vivo con resultado `VOID` en esta sesión; recomendado antes de producción. |
| 15 | No se puede liquidar dos veces | ✅ Verificado en navegador | `Settlement.settleProgram` rechaza con `PROGRAM_ALREADY_SETTLED` si `program.settledAt` ya está fijado (este guardado se disparó realmente durante el desarrollo al detectar el bug de datos semilla descrito abajo). |
| 16 | El DNI no puede registrarse dos veces | ✅ Verificado por código | `registerUser` compara `state.users.some(u => u.dni === payload.dni)` → `DNI_ALREADY_EXISTS`. |
| 17 | El correo no puede registrarse dos veces | ✅ Verificado por código | `findUserByEmail` + `EMAIL_ALREADY_EXISTS`. |
| 18 | Un menor de edad no puede completar el registro | ✅ Verificado por código | `Validators.isAdult(birthDate)` exige ≥ 18 años cumplidos. |
| 19 | Un usuario de Google nuevo debe completar DNI y datos pendientes | ⚠️ Simulado | `loginWithGoogle` devuelve `GOOGLE_NOT_IMPLEMENTED`; la UI redirige a `registro.html` para completar el alta manualmente. No hay integración real con Google Identity Services en esta fase (ver sección 20 del prompt maestro). |
| 20 | El creador no puede cambiar la modalidad después del primer ticket | ✅ Cumplido por diseño | No existe ningún endpoint ni pantalla para editar `prizeMode` tras la creación del grupo; `group.modeLockedAt` queda registrado en el primer ticket para cuando se habilite edición previa a esa fecha. |
| 21 | Un usuario puede pertenecer a varios grupos | ✅ Verificado en navegador | El usuario demo "Carlos" pertenece simultáneamente a "Amigos del Barrio", "Los Acumuladores" y "Oficina Premium". |
| 22 | Cada ticket pertenece a un solo grupo | ✅ Verificado por código | `Ticket.groupId` es un campo único (no arreglo). |
| 23 | El saldo final coincide con el libro mayor | ✅ Verificado en navegador | Se sumó manualmente el historial de `WalletLedger` (S/ 100.00 − 5.00 − 5.00) y coincidió con el saldo mostrado (S/ 90.00). Esta prueba detectó y permitió corregir un bug real de doble acreditación de saldo inicial (ver notas de la entrega). |
| 24 | La migración de V2 a V3 conserva datos compatibles | ✅ Verificado en navegador | Se sembró manualmente un `premiumlott_state_v2` con usuario, saldo, ticket y movimiento; tras cargar la app se migró correctamente a v3: usuario, saldo (S/ 42.50), ticket heredado en `legacyTickets` y sesión activa preservada. |
| 25 | Premium World Cup sigue funcionando después de los cambios | ✅ Verificado en navegador | `juegos/mundial.html` (sin modificar `assets/js/mundial.js`) cargó sin errores de consola; `PL.isLoggedIn()`, `PL.canPay()`, `PL.addTicket()` operaron correctamente sobre el nuevo Store v3 vía la capa de compatibilidad en `app.js`, descontando saldo y registrando el ticket en `legacyTickets`. |

## Bugs encontrados y corregidos durante esta ronda de pruebas

1. **Registro no iniciaba sesión** → el redireccionamiento a "Verificar correo" rebotaba a login. Corregido creando la sesión dentro de `registerUser`.
2. **Doble acreditación de saldo inicial** → `ensureWallet` fijaba un saldo por defecto y además se llamaba `ledgerEntry`, sumando el doble (S/ 200 en vez de S/ 100). Corregido: las billeteras nuevas siempre nacen en 0 y todo saldo inicial se acredita una única vez vía `ledgerEntry`.
3. **`i18n.js` revertía "Mi cuenta" a "Iniciar sesión"** por reaplicar la traducción `data-i18n="nav.login"` después de que `Layout` actualizaba el enlace. Corregido quitando el atributo `data-i18n` al detectar sesión activa.
4. **El programa semilla "liquidado" no generaba liquidación real** → se fijaba `settledAt` manualmente antes de llamar `Settlement.settleProgram`, que por diseño rechaza programas ya liquidados. Corregido: el programa se crea en `results_pending` y es la propia llamada a `settleProgram` la que genera el registro de liquidación, los payouts y los créditos de premio.
5. **Overflow horizontal en móvil** en el constructor de PremiumGol, causado por un `style="grid-template-columns:...340px"` embebido que impedía que la media query responsiva existente colapsara la grilla; además el encabezado no tenía un punto de quiebre para pantallas menores a ~480 px. Ambos corregidos.

## Cómo reproducir las pruebas manualmente

```bash
cd premiumlott-main
python3 -m http.server 8811
# abrir http://localhost:8811/index.html
```

Credenciales de prueba: ver `README.md` (sección "Credenciales demo").
