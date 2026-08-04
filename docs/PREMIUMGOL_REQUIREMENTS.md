# PremiumGol — Requisitos funcionales (Fase 1 → Fase 2)

Este documento resume el alcance funcional implementado en el prototipo frontend (Fase 1) y sirve como referencia de requisitos para la implementación del backend en Google Apps Script (Fase 2).

## 1. Programa oficial

- Cada programa tiene **exactamente 12 partidos**, numerados 1–12.
- Estados: `draft → open → closed → results_pending → settled` (o `cancelled` desde cualquier estado previo a `settled`).
- Campos: código único, nombre, fecha de apertura, fecha de cierre, zona horaria `America/Lima`, fecha estimada de liquidación, precio de ticket (500 céntimos = S/ 5.00), `voidPolicy`.
- El cierre bloquea nuevas compras. En el prototipo se usa el reloj del navegador; **en producción la hora válida debe venir siempre del servidor**.
- `voidPolicy` se fija en `draft` y queda bloqueada al abrir el programa. Valor por defecto: `VOID_COUNTS_AS_HIT` (un partido `VOID` cuenta como acierto para todos los tickets). Alternativa soportada por el modelo de datos: `VOID_EXCLUDED`.

## 2. Selección de pronósticos y carrito

- El usuario marca `L`/`E`/`V` en cada uno de los 12 partidos.
- Un ticket solo se acepta con **12/12 selecciones completas**.
- El carrito permite agregar, editar, duplicar y eliminar jugadas antes de confirmar; también generar selecciones al azar.
- Montos en céntimos: `ticketPriceCents = 500`, `groupPoolContributionCents = 400`, `houseFeeCents = 100`.

## 3. Compra de tickets (idempotente)

Orden de validación en `purchaseTickets` (ver `assets/js/services/mock-api.js`):

1. Sesión activa (`SESSION_REQUIRED`).
2. Correo verificado / cuenta demo habilitada (`EMAIL_NOT_VERIFIED`).
3. Pertenencia activa al grupo (`NOT_GROUP_MEMBER`).
4. Programa abierto y dentro de fecha de cierre (`PROGRAM_CLOSED`).
5. 12 selecciones válidas por ticket (`INCOMPLETE_PICKS`).
6. Saldo suficiente (`INSUFFICIENT_BALANCE`).
7. Verificación de `idempotencyKey`: si ya existen tickets con la misma clave, se devuelven esos tickets sin duplicar la compra.
8. Se genera código único por ticket, se descuenta el saldo, se registra el movimiento de billetera, se actualiza el pozo del grupo.

## 4. Grupos privados

- Un usuario crea un grupo con nombre, descripción, capacidad (2–50, con atajos 5/10/20/50), modalidad de premiación y aceptación de reglas.
- El creador es automáticamente `OWNER`. Se genera código corto (6 caracteres) y enlace de invitación.
- Invitaciones: estados `PENDING → ACCEPTED | EXPIRED | REVOKED`.
- Reglas de administración:
  - La modalidad no puede cambiar después de la primera compra (`group.modeLockedAt`).
  - La capacidad no puede bajar del número actual de miembros activos.
  - No se puede retirar a un miembro con tickets activos en el programa abierto.
  - El creador no puede salir sin transferir antes la administración.
  - El creador no recibe comisión adicional.

## 5. Modalidades de premiación

Pozos independientes por **grupo + programa**. Premiación por **ticket ganador** (no por usuario).

| Código | Regla |
|---|---|
| `HIGHEST_SCORE` | Pozo del programa (400 céntimos × ticket) se reparte entre los tickets con mayor cantidad de aciertos. Sin acumulación. |
| `PERFECT_12` | Solo ganan tickets con 12/12. Si nadie acierta, el pozo completo se acumula al siguiente programa del mismo grupo (`group.progressivePoolCents`). |
| `MIXED` | 50% del aporte (200 céntimos) va al pozo semanal (mayor puntaje), 50% al pozo progresivo 12/12. Un ticket con 12/12 participa en ambos pozos porque siempre iguala el máximo puntaje. |

División de empates: exacta en céntimos (reparto base + remanente asignado por orden de código de ticket) para que la suma nunca pierda ni gane céntimos.

## 6. Registro, autenticación y recuperación

- Cuenta identificada por correo (no username). Campos: nombres, apellidos, DNI (8 dígitos, único), celular peruano, fecha de nacimiento, país fijo `PE`, contraseña, consentimientos (términos, privacidad, mayoría de edad, marketing opcional y desmarcado).
- Verificación de correo por código OTP de 6 dígitos, con reintentos máximos, expiración y reenvío con cooldown. En modo demo el código se muestra en pantalla.
- Login por correo/contraseña con bloqueo temporal tras intentos fallidos repetidos.
- Recuperación de contraseña con OTP demostrativo.
- Botón "Continuar con Google" preparado como adaptador de servicio (`Api.loginWithGoogle`), sin autenticación real en esta fase.

## 7. Billetera de prueba

- Saldo y libro mayor 100% en céntimos. Todo movimiento pasa por `walletLedger` (nunca se edita el saldo directamente).
- Tipos: `DEMO_TOPUP`, `TICKET_PURCHASE`, `PRIZE_CREDIT`, `REFUND`, `ADMIN_ADJUSTMENT`.
- Métodos de pago reales (tarjeta, Yape/Plin, PayPal, cripto) se muestran deshabilitados como "Próximamente / no disponible en modo de prueba".

## 8. Panel administrativo

- CRUD de programas en `draft` (incluye carga de los 12 partidos).
- Apertura y cierre de programas.
- Carga de resultados `L`/`E`/`V`/`VOID` por partido (solo en `closed`/`results_pending`).
- Previsualización de liquidación y liquidación definitiva (idempotente vía `program.settledAt`).
- Cancelación de programa con reembolso completo de tickets activos.
- Corrección auditada de resultado posterior a liquidación (`correctMatchResult`), documentada como acción manual que no recalcula automáticamente pagos ya liquidados.
- Resumen de ingresos de plataforma y auditoría de acciones.

## 9. Trazabilidad y auditoría

Toda acción sensible (registro, login, verificación, creación/edición de grupo, compra, apertura/cierre/liquidación/cancelación de programa, ajustes de saldo) genera una entrada en `auditLog` con actor, rol, acción, entidad y metadata.
