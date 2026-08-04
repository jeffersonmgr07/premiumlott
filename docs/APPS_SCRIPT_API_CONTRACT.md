# Contrato de API — Google Apps Script (Fase 2)

Este documento define el contrato que deberá implementar `AppsScriptApi` para reemplazar a `MockApi` sin que ninguna pantalla del frontend deba reescribirse. Hoy, `assets/js/services/api-client.js` expone `window.Api` delegando en `MockApi` (localStorage). En la Fase 2, `api-client.js` cambiará su `backend` a `AppsScriptApi`, que hará `fetch()` contra un Web App de Google Apps Script publicado, manteniendo **idénticos nombres de método, parámetros y forma de respuesta**.

## 1. Formato de solicitud

Todas las solicitudes son `POST` en JSON contra el endpoint único del Web App, con un campo `action` que indica el método remoto y `payload` con los argumentos:

```json
{
  "action": "purchaseTickets",
  "payload": { "groupId": "...", "programId": "...", "tickets": [{ "picks": { "matchId": "L" } }] },
  "idempotencyKey": "uuid",
  "sessionToken": "opaque-token"
}
```

## 2. Formato de respuesta

```json
{
  "ok": true,
  "data": {},
  "error": null,
  "requestId": "uuid",
  "serverTime": "ISO-8601"
}
```

Errores:

```json
{
  "ok": false,
  "data": null,
  "error": { "code": "PROGRAM_CLOSED", "message": "El programa ya se encuentra cerrado." },
  "requestId": "uuid",
  "serverTime": "ISO-8601"
}
```

`serverTime` es obligatorio en toda respuesta: es la única hora válida para decidir si un programa sigue abierto. El navegador **nunca** debe confiar en su propio reloj para esa decisión en producción.

## 3. Catálogo de métodos

### Autenticación
| Método | Payload | Notas |
|---|---|---|
| `registerUser` | firstName, lastName, dni, email, phone, birthDate, password, confirmPassword, termsAccepted, privacyAccepted, ageDeclared, marketingConsent | Crea sesión automáticamente (igual que el mock) y dispara `requestEmailVerification`. |
| `login` | email, password | Aplica bloqueo tras `loginMaxAttempts` fallos. |
| `logout` | — | Invalida el token de sesión activo. |
| `getCurrentUser` | — | Requiere `sessionToken`. |
| `requestEmailVerification` | userId | Genera OTP real (envío de correo), nunca lo devuelve en el payload de respuesta. |
| `verifyEmailCode` | userId, code | Aplica `otpMaxAttempts` y expiración. |
| `resendEmailVerification` | userId | Respeta `otpResendCooldownSeconds`. |
| `requestPasswordReset` | email | Respuesta genérica exista o no el correo (anti-enumeración). |
| `resetPassword` | email, code, newPassword, confirmPassword | — |
| `loginWithGoogle` | googleIdToken | Verifica el token con Google en servidor; si el usuario es nuevo, exige completar DNI/celular/nacimiento antes de crear la cuenta. |

### Grupos
`createGroup`, `getMyGroups`, `getGroup`, `previewGroupByCode`, `joinGroupByCode`, `createInvitation`, `revokeInvitation`, `removeMember`, `transferOwnership`, `setGroupJoinLocked`.

### PremiumGol
`listPrograms`, `getOpenProgram`, `getProgram`, `createTicketDraft`, `purchaseTickets(payload, idempotencyKey)`, `getMyTickets`, `getGroupLeaderboard`, `getGroupPool`.

### Administración (requieren rol `admin`)
`createProgram`, `updateDraftProgram`, `openProgram`, `closeProgram`, `setMatchResult`, `correctMatchResult`, `previewSettlement`, `settleProgram(programId, idempotencyKey)`, `cancelProgram`, `adminListPrograms`, `adminGetOverview`, `adminGetAuditLog`.

### Billetera
`getWallet`, `getWalletLedger`, `topUpDemoBalance`, `resetDemoAccount` (estos dos últimos solo existen mientras el modo demo esté activo; deben eliminarse o protegerse detrás de un flag en producción real).

## 4. Códigos de error usados por el frontend

`SESSION_REQUIRED`, `FORBIDDEN`, `EMAIL_NOT_VERIFIED`, `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `EMAIL_ALREADY_EXISTS`, `DNI_ALREADY_EXISTS`, `INVALID_DNI`, `INVALID_PHONE`, `UNDERAGE`, `WEAK_PASSWORD`, `PASSWORD_MISMATCH`, `CONSENT_REQUIRED`, `INVALID_CODE`, `CODE_EXPIRED`, `MAX_ATTEMPTS_REACHED`, `COOLDOWN_ACTIVE`, `GROUP_NOT_FOUND`, `GROUP_FULL`, `GROUP_JOIN_LOCKED`, `ALREADY_MEMBER`, `NOT_GROUP_MEMBER`, `MEMBER_HAS_ACTIVE_TICKETS`, `CANNOT_REMOVE_OWNER`, `PROGRAM_NOT_FOUND`, `PROGRAM_CLOSED`, `PROGRAM_NOT_DRAFT`, `PROGRAM_NOT_OPEN`, `PROGRAM_NOT_EDITABLE`, `PROGRAM_ALREADY_SETTLED`, `PROGRAM_NOT_CANCELLABLE`, `INVALID_MATCHES`, `INVALID_RESULT`, `RESULTS_INCOMPLETE`, `INCOMPLETE_PICKS`, `EMPTY_CART`, `INSUFFICIENT_BALANCE`, `INVALID_AMOUNT`.

El backend debe conservar exactamente estos códigos para que los mensajes ya traducidos en el frontend sigan funcionando.

## 5. Reglas obligatorias del backend (Fase 2)

- El navegador **nunca** es la fuente autoritativa del saldo: cada lectura de saldo debe venir de `getWallet`/`getWalletLedger`, nunca de un valor cacheado sin verificar.
- El navegador **nunca** liquida premios por sí solo: `settleProgram` se ejecuta únicamente en el servidor.
- El navegador **nunca** escribe directamente en Google Sheets: todo pasa por el Web App de Apps Script.
- Usar `LockService` (`LockService.getScriptLock()`) alrededor de: compra de tickets, apertura/cierre de programa, carga de resultados y liquidación, para evitar condiciones de carrera entre usuarios concurrentes.
- Validar en servidor, en cada solicitud: sesión vigente, rol, estado del programa y `idempotencyKey` (rechazar reintentos duplicados devolviendo el resultado ya procesado, igual que hace hoy `MockApi.purchaseTickets`).
- Registrar toda modificación crítica en la hoja `AuditLog`.
- Verificar el `googleIdToken` con la librería oficial de Google en el propio Apps Script antes de crear o vincular una cuenta.
- Aplicar límites de intentos (`loginMaxAttempts`, `otpMaxAttempts`) y expiración de códigos (`otpExpiryMinutes`) del lado servidor, no solo en el cliente.
- Las contraseñas deben almacenarse con un hash real (p. ej. bcrypt vía una librería compatible con Apps Script, o delegando el hashing a un servicio externo); el `demoHash` actual del prototipo es **exclusivamente** para no guardar texto plano en el demo y no debe usarse en producción.
