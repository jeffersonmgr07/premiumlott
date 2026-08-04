# Esquema de Google Sheets (Fase 2)

Cada tabla corresponde a una hoja del mismo nombre en el libro de Google Sheets que usará Apps Script como base de datos. Los montos se guardan siempre en **céntimos** (enteros), igual que en el Store del frontend. Los campos marcados `JSON` se guardan como texto JSON serializado en una sola celda porque Sheets no soporta estructuras anidadas nativamente.

## 1. Users
| Columna | Tipo | Obligatorio | Ejemplo | Índice / restricción |
|---|---|---|---|---|
| id | string (uuid) | sí | `a1b2...` | Clave primaria |
| email | string | sí | `cliente@correo.com` | Único, normalizado en minúsculas |
| firstName | string | sí | `Lucía` | |
| lastName | string | sí | `Prueba` | |
| dni | string(8) | sí | `87654321` | Único |
| phone | string | sí | `987654321` | |
| birthDate | date ISO | sí | `1998-05-10` | |
| country | string | sí | `PE` | |
| passwordHash | string | sí | hash bcrypt | Nunca texto plano |
| role | enum | sí | `user` / `admin` | |
| emailVerified | boolean | sí | `TRUE` | |
| marketingConsent | boolean | sí | `FALSE` | |
| termsAcceptedAt | datetime ISO | sí | | |
| privacyAcceptedAt | datetime ISO | sí | | |
| ageDeclaredAt | datetime ISO | sí | | |
| authProvider | enum | sí | `password` / `google` | |
| googleSub | string | no | | Único si no vacío |
| status | enum | sí | `active` / `blocked` | |
| failedLoginCount | number | sí | `0` | |
| lockedUntil | datetime ISO | no | | |
| createdAt | datetime ISO | sí | | |

## 2. Sessions
| Columna | Tipo | Obligatorio | Relación |
|---|---|---|---|
| id | uuid | sí | Clave primaria |
| userId | uuid | sí | → Users.id |
| token | string | sí | Único, opaco |
| createdAt | datetime | sí | |
| expiresAt | datetime | no | |
| active | boolean | sí | |

## 3. EmailVerifications
| Columna | Tipo | Obligatorio |
|---|---|---|
| id | uuid | sí |
| userId | uuid (→ Users.id) | sí |
| email | string | sí |
| codeHash | string | sí (nunca texto plano en producción) |
| attempts | number | sí |
| maxAttempts | number | sí |
| verified | boolean | sí |
| createdAt | datetime | sí |
| expiresAt | datetime | sí |
| lastSentAt | datetime | sí |

## 4. PasswordResets
Igual estructura que `EmailVerifications`, más `used` (boolean).

## 5. Wallets
| Columna | Tipo | Obligatorio | Restricción |
|---|---|---|---|
| id | uuid | sí | Clave primaria |
| userId | uuid (→ Users.id) | sí | Único (una billetera por usuario) |
| balanceCents | integer | sí | Nunca editar directo; solo vía WalletLedger |
| currency | string | sí | `PEN` |
| createdAt | datetime | sí | |

## 6. WalletLedger
| Columna | Tipo | Obligatorio |
|---|---|---|
| id | uuid | sí |
| walletId | uuid (→ Wallets.id) | sí |
| userId | uuid (→ Users.id) | sí |
| type | enum | sí — `DEMO_TOPUP`, `TICKET_PURCHASE`, `PRIZE_CREDIT`, `REFUND`, `ADMIN_ADJUSTMENT` |
| amountCents | integer (con signo) | sí |
| balanceBeforeCents | integer | sí |
| balanceAfterCents | integer | sí |
| referenceType | string | no — `ticket`, `legacyTicket`, etc. |
| referenceId | string | no |
| description | string | sí |
| createdAt | datetime | sí |

## 7. Groups
| Columna | Tipo | Obligatorio | Restricción |
|---|---|---|---|
| id | uuid | sí | Clave primaria |
| name | string | sí | |
| description | string | no | |
| avatarInitials | string | sí | |
| capacity | integer | sí | 2–50 |
| prizeMode | enum | sí | `HIGHEST_SCORE`, `PERFECT_12`, `MIXED` |
| privacy | enum | sí | `CODE` |
| code | string(6) | sí | Único |
| inviteLink | string | sí | |
| ownerId | uuid (→ Users.id) | sí | |
| status | enum | sí | `ACTIVE` / `CLOSED` |
| joinLocked | boolean | sí | |
| modeLockedAt | datetime | no | Se fija en la primera compra del grupo |
| progressivePoolCents | integer | sí | Acumulado vivo para `PERFECT_12` / `MIXED` |
| rulesAcceptedVersion | integer | sí | |
| createdAt | datetime | sí | |

## 8. GroupMembers
| Columna | Tipo | Obligatorio |
|---|---|---|
| id | uuid | sí |
| groupId | uuid (→ Groups.id) | sí |
| userId | uuid (→ Users.id) | sí |
| role | enum | sí — `OWNER` / `MEMBER` |
| status | enum | sí — `ACTIVE` / `REMOVED` |
| joinedAt | datetime | sí |
| removedAt | datetime | no |

Restricción lógica: un `(groupId, userId)` activo no puede repetirse.

## 9. GroupInvitations
| Columna | Tipo | Obligatorio |
|---|---|---|
| id | uuid | sí |
| groupId | uuid (→ Groups.id) | sí |
| code | string(6) | sí, único |
| link | string | sí |
| status | enum | sí — `PENDING`/`ACCEPTED`/`EXPIRED`/`REVOKED` |
| createdBy | uuid (→ Users.id) | sí |
| createdAt | datetime | sí |
| expiresAt | datetime | sí |
| acceptedBy | uuid | no |
| acceptedAt | datetime | no |
| revokedAt | datetime | no |

## 10. Programs
| Columna | Tipo | Obligatorio | Restricción |
|---|---|---|---|
| id | uuid | sí | Clave primaria |
| code | string | sí | Único |
| name | string | sí | |
| status | enum | sí | `draft`/`open`/`closed`/`results_pending`/`settled`/`cancelled` |
| openAt | datetime | sí | |
| closeAt | datetime | sí | > openAt |
| timezone | string | sí | `America/Lima` |
| estimatedSettlementAt | datetime | sí | |
| ticketPriceCents | integer | sí | `500` |
| voidPolicy | enum | sí | `VOID_COUNTS_AS_HIT` / `VOID_EXCLUDED` |
| settledAt | datetime | no | |
| settlementIdempotencyKey | string | no | |
| createdAt | datetime | sí | |
| cancelledAt | datetime | no | |
| cancelReason | string | no | |

## 11. Matches
| Columna | Tipo | Obligatorio | Restricción |
|---|---|---|---|
| id | uuid | sí | Clave primaria |
| programId | uuid (→ Programs.id) | sí | |
| number | integer | sí | 1–12, único por programId |
| competition | string | sí | |
| home | string | sí | |
| away | string | sí | |
| kickoffAt | datetime | sí | |
| status | enum | sí | `SCHEDULED`/`FINISHED`/`VOID` |
| result | enum | no | `L`/`E`/`V`/`VOID` |

Restricción lógica: exactamente 12 filas por `programId`.

## 12. Tickets
| Columna | Tipo | Obligatorio | Restricción |
|---|---|---|---|
| id | uuid | sí | Clave primaria |
| code | string | sí | Único |
| userId | uuid (→ Users.id) | sí | |
| groupId | uuid (→ Groups.id) | sí | |
| programId | uuid (→ Programs.id) | sí | |
| priceCents | integer | sí | `500` |
| poolContributionCents | integer | sí | `400` |
| houseFeeCents | integer | sí | `100` |
| status | enum | sí | `ACTIVE`/`REFUNDED` |
| purchasedAt | datetime | sí | |
| idempotencyKey | string | sí | Único por lote de compra |
| hits | integer | no | Calculado al cerrar/liquidar |
| isWinner | boolean | sí | |
| prizeCents | integer | sí | |
| settledAt | datetime | no | |

## 13. TicketPicks
| Columna | Tipo | Obligatorio |
|---|---|---|
| id | uuid | sí |
| ticketId | uuid (→ Tickets.id) | sí |
| matchId | uuid (→ Matches.id) | sí |
| pick | enum | sí — `L`/`E`/`V` |

Restricción lógica: exactamente 12 filas por `ticketId`. Diseño elegido para que la carga masiva a Sheets sea una fila por pronóstico (más simple de auditar que un `JSON` embebido).

## 14. GroupPools
| Columna | Tipo | Obligatorio |
|---|---|---|
| id | uuid | sí |
| groupId | uuid (→ Groups.id) | sí |
| programId | uuid (→ Programs.id) | sí |
| ticketCount | integer | sí |
| contributionTotalCents | integer | sí |
| weeklyPoolCents | integer | sí |
| progressiveContributionCents | integer | sí |

Restricción lógica: único por `(groupId, programId)`.

## 15. Settlements
| Columna | Tipo | Obligatorio |
|---|---|---|
| id | uuid | sí |
| programId | uuid (→ Programs.id) | sí, único |
| idempotencyKey | string | sí |
| settledBy | uuid (→ Users.id) | sí |
| settledAt | datetime | sí |
| groupsJson | JSON | sí — snapshot completo de la distribución por grupo (ver `Settlement.computeProgramSettlement`) |
| totalPrizeCentsDistributed | integer | sí |
| createdAt | datetime | sí |

## 16. Payouts
| Columna | Tipo | Obligatorio |
|---|---|---|
| id | uuid | sí |
| settlementId | uuid (→ Settlements.id) | sí |
| programId | uuid (→ Programs.id) | sí |
| groupId | uuid (→ Groups.id) | sí |
| ticketId | uuid (→ Tickets.id) | sí |
| userId | uuid (→ Users.id) | sí |
| poolType | enum | sí — `WEEKLY`/`PROGRESSIVE` |
| prizeCents | integer | sí |
| createdAt | datetime | sí |

## 17. AuditLog
| Columna | Tipo | Obligatorio |
|---|---|---|
| id | uuid | sí |
| actorId | uuid | no (`system` si es automático) |
| actorRole | string | sí |
| action | string | sí |
| entityType | string | no |
| entityId | string | no |
| metadataJson | JSON | no |
| createdAt | datetime | sí |

## 18. Config
Hoja clave/valor para parámetros operativos (equivalente a `appConfig` del Store): `otpResendCooldownSeconds`, `otpMaxAttempts`, `otpExpiryMinutes`, `loginMaxAttempts`, `loginLockoutMinutes`, `ticketPriceCents`, `groupPoolContributionCents`, `houseFeeCents`, `minGroupCapacity`, `maxGroupCapacity`, `timezone`.

| Columna | Tipo | Obligatorio |
|---|---|---|
| key | string | sí, único |
| value | string | sí |
| updatedAt | datetime | sí |

## 19. ResponsibleGaming
Pendiente para Fase 2 (no implementado en el frontend de esta fase; solo existe la página estática `pages/legales/juego-responsable.html`). Esquema propuesto para autolímites y autoexclusión:

| Columna | Tipo | Obligatorio |
|---|---|---|
| id | uuid | sí |
| userId | uuid (→ Users.id) | sí |
| type | enum | sí — `DEPOSIT_LIMIT`/`SELF_EXCLUSION`/`COOLDOWN` |
| valueCents | integer | no (aplica a `DEPOSIT_LIMIT`) |
| startsAt | datetime | sí |
| endsAt | datetime | no |
| createdAt | datetime | sí |
