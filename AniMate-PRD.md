# PRD — AniMate 🐾

**Versión:** 1.1 · **Fecha:** 2026-08-01 · **Autor:** Adrián Hernández
**Estado:** Base para reconstrucción desde cero (sustituye al prototipo "Medicat")
**Cambios v1.1:** stack actualizado a app nativa con React Native + Expo (la v1.0 planteaba PWA con Next.js); push pasa a notificaciones nativas.

---

## 1. Resumen

AniMate es una app de **seguimiento compartido de la medicación de mascotas**. Permite que varias personas que cuidan al mismo animal (pareja, familia, cuidadores) sepan en todo momento qué medicinas tocan hoy, quién dio cada toma y qué quedó pendiente — eliminando el "¿le has dado tú la pastilla o se la doy yo?".

**Origen:** nació para coordinar la medicación de Roma (gata) entre dos personas. **Ambición:** producto para un nicho real — hogares con mascotas medicadas de forma crónica o en tratamientos largos.

## 2. Problema

Cuando una mascota necesita medicación (crónica o temporal), la coordinación entre cuidadores se hace hoy con memoria, mensajes de WhatsApp o notas en papel. Consecuencias:

- **Dosis duplicadas** (los dos cuidadores dan la misma toma) — riesgo real de salud.
- **Dosis olvidadas** (cada uno asume que la dio el otro).
- **Sin historial** para el veterinario: nadie sabe con certeza el cumplimiento del tratamiento.
- Las apps existentes de recordatorios de medicación están pensadas para humanos y para un solo usuario; no modelan "varios cuidadores, un paciente".

## 3. Usuarios objetivo

| Perfil | Descripción | Necesidad principal |
|---|---|---|
| **Cuidador principal** | Convive con la mascota, gestiona el tratamiento | Alta de medicinas, visión del día, historial |
| **Co-cuidador** | Pareja/familiar que también da tomas | Ver qué toca y marcar tomas en 2 toques |
| **Cuidador puntual** | Alguien que cuida la mascota unos días | Acceso temporal sencillo, instrucciones claras |
| *(futuro)* **Veterinario** | Revisa cumplimiento | Exportar/compartir historial |

Caso de uso canónico: 2 personas, 1 mascota, 1–4 medicinas activas con 1–3 tomas diarias cada una.

## 4. Propuesta de valor

1. **Multi-cuidador nativo**: el registro de "quién dio qué y cuándo" es el corazón del producto, no un añadido.
2. **Fricción mínima**: marcar una toma es un toque; ver el día es abrir la app. Sin flujos largos.
3. **Confianza**: una fuente de verdad compartida en tiempo real entre dispositivos.
4. **Tono cálido y doméstico**, no clínico: es el botiquín de casa, no un hospital.

## 5. Alcance por fases

### Fase 1 — MVP producto (objetivo de la reconstrucción)

Paridad funcional con el prototipo **más** las piezas que lo convierten en multi-dispositivo real:

- ✅ Vista **Hoy** (F1)
- ✅ **Historial** 7 días (F2)
- ✅ Gestión de **medicinas y pautas** (F3)
- ✅ **Cuidadores** (F4) — ahora con cuentas reales
- 🆕 **Auth real** con Supabase Auth (magic link / OAuth Google) — sustituye la identidad por cookie del prototipo
- 🆕 **Hogar compartido**: un hogar agrupa mascota(s) y cuidadores; invitación por enlace/código
- 🆕 **Sincronización en tiempo real** entre dispositivos (Supabase Realtime): si mi pareja marca una toma, la veo desaparecer de pendientes sin recargar

### Fase 2 — Retención

- **Notificaciones push nativas** de recordatorio (`expo-notifications`): a la hora de la toma, y aviso de "toma pendiente" pasado un margen
- Notificación al otro cuidador cuando se marca una toma (opcional, configurable)

### Fase 3 — Ampliación

- **Multi-mascota** por hogar
- **Notas y citas de veterinario** (historial clínico ligero, adjuntar indicaciones)
- Exportar historial (PDF/CSV) para llevar al veterinario
- Tratamientos con **fecha de fin** y pautas complejas (días alternos, "cada 48 h")

### Explícitamente fuera de alcance (por ahora)

- Versión web / PWA (la app nativa iOS/Android cubre el caso; Expo permite añadir web más adelante si hace falta)
- Recordatorios de comida, peso, paseos u otros cuidados no médicos
- Marketplace, teleconsulta veterinaria, monetización (se decidirá con tracción)

## 6. Requisitos funcionales

### F1 — Hoy (pantalla principal)

- Muestra las tomas del día actual agrupadas por franja: **mañana / tarde / noche** (según la hora programada).
- Cada toma muestra: medicina, dosis, hora programada, instrucciones breves.
- **Marcar como dada** con un toque: registra cuidador actual + hora real. Feedback visual inmediato (en el prototipo: huella de gato 🐾 como check).
- Se puede **desmarcar** (deshacer errores).
- Las tomas cuya hora ya pasó y no están marcadas se destacan como **pendientes/atrasadas**.
- Estado vacío amable cuando no hay medicinas activas, con CTA para crear la primera.

### F2 — Historial

- Últimos **7 días**, toma a toma: qué se dio (quién y a qué hora real) y qué quedó sin registrar.
- Las tomas no registradas de días pasados aparecen como "sin registrar" (no se pueden inventar retroactivamente sin dejar rastro; si se permite marcado retroactivo, debe quedar reflejado que se registró tarde).
- (Fase 3: rango ampliable y exportación.)

### F3 — Medicinas

- **Alta** de medicina: nombre, dosis (texto libre, ej. "media pastilla de 50 mg"), instrucciones opcionales (ej. "con comida"), y **horas de toma** (1..n horarios `HH:mm`).
- **Pausar / reanudar**: una medicina pausada no genera tomas en Hoy pero conserva su historial.
- **Eliminar** con confirmación (borra pautas; el historial debe conservarse o avisar claramente de que se pierde).
- Editar medicina y pautas existentes.

### F4 — Hogar y cuidadores

- **Registro/login** con Supabase Auth (magic link por email y/o Google).
- Al registrarse se crea un **hogar**; el usuario da de alta su mascota (nombre, especie, emoji).
- **Invitar cuidadores** por enlace o código de un solo uso; quien acepta se une al hogar con su propia cuenta.
- Cada toma registrada queda asociada al **usuario autenticado** que la marcó (nombre + emoji/avatar).
- Perfil del paciente editable (nombre, especie, emoji, notas).

### F5 — Notificaciones (Fase 2)

- Opt-in por dispositivo (permiso de notificaciones tras un momento de valor, nunca en el primer arranque).
- Recordatorio a la hora de cada toma; recordatorio de "pendiente" a los X minutos (configurable, por defecto 30).
- Si un cuidador marca la toma, se **cancela el recordatorio** en los demás dispositivos.

## 7. Requisitos no funcionales

- **Mobile-first**: se usa de pie, con el animal en brazos. Objetivos: marcar toma ≤ 2 toques desde abrir la app; arranque en frío < 2 s.
- **App nativa** iOS y Android desde una sola base de código (Expo + EAS Build); distribución por TestFlight/Play interna durante la fase personal.
- **Tiempo real**: cambios visibles en otros dispositivos < 2 s (Supabase Realtime).
- **Zonas horarias**: las horas de toma son hora local del hogar; cuidado con el cambio horario y el cálculo de "día" (`YYYY-MM-DD` local, no UTC).
- **Idioma**: español en v1; textos centralizados para i18n futura.
- **Accesibilidad**: objetivos táctiles ≥ 44 px, contraste AA, estados no comunicados solo por color.
- **Privacidad**: datos mínimos (email + nombre); RLS de Supabase para aislar hogares entre sí.

## 8. Modelo de datos (conceptual)

Validado en el prototipo; se añade `Household` y `Caregiver` pasa a estar vinculado a un usuario auth.

```
Household 1─n Caregiver (userId → auth.users, name, emoji)
Household 1─n Pet (name, species, emoji, notes)
Pet 1─n Medication (name, dose, instructions, active, createdAt)
Medication 1─n Schedule (time "HH:mm"; unique [medicationId, time])
Medication 1─n DoseLog (date "YYYY-MM-DD", scheduleId?, givenBy?, givenAt, notes?;
                        unique [scheduleId, date])
```

Decisiones que ya demostraron funcionar en el prototipo:

- `DoseLog` con `unique(scheduleId, date)` — imposible registrar dos veces la misma toma del mismo día (previene la dosis duplicada a nivel de BBDD).
- `date` como fecha **programada** (string local) separada de `givenAt` (timestamp real) — permite distinguir "la toma de las 9:00" de "la marqué a las 9:40".
- `onDelete: SetNull` en cuidador → el historial sobrevive si se elimina un cuidador.
- Dosis como **texto libre**, no estructurada — la realidad ("un cuarto de pastilla disuelto en agua") no cabe en number+unit.

## 9. Stack técnico

| Capa | Elección | Motivo |
|---|---|---|
| App | **React Native + Expo** (SDK 57, expo-router, TypeScript) | Una sola base de código que compila iOS y Android nativos |
| BBDD | **Supabase Postgres** | Decisión ya tomada; aporta Auth + Realtime + RLS |
| Acceso a datos | **supabase-js** directo desde la app | Sin backend propio ni ORM; la seguridad vive en Postgres (RLS) |
| Auth | Supabase Auth | Magic link + OAuth sin construir auth propia |
| Realtime | Supabase Realtime | Sincronización entre cuidadores |
| Push | **expo-notifications** (Fase 2) | Push nativo iOS/Android; elimina la limitación de web-push en Safari |
| Distribución | EAS Build (TestFlight / Google Play) | Builds en la nube sin Xcode/Android Studio locales |

## 10. Identidad y diseño

Conservar la dirección del prototipo, que funcionaba: **"botiquín doméstico"**, cálido y no clínico.

- Paleta: papel salvia de fondo, verde pino como color principal.
- Tipografía: **Fraunces** (display) + **Nunito Sans** (texto).
- Detalle de marca: **huella de gato como marcador de toma dada**.
- Navegación por pestañas inferiores: Hoy · Historial · Medicinas · Ajustes.

## 11. Métricas de éxito

**Fase personal (semana 1–4):** Adrián y su pareja lo usan a diario para Roma sin volver a WhatsApp; 0 dosis duplicadas.

**Fase producto:**
- Activación: % de hogares nuevos que registran ≥ 1 medicina y ≥ 1 toma el primer día.
- Retención: % de hogares con tomas registradas 7 y 30 días después del alta.
- Núcleo de valor: % de hogares con **≥ 2 cuidadores activos** (si esto no ocurre, el producto no se diferencia de un recordatorio personal).
- Cumplimiento: % de tomas programadas que se registran.

## 12. Riesgos y preguntas abiertas

- **Riesgo**: los recordatorios (Fase 2) son probablemente el driver de retención real; el MVP sin ellos depende de la disciplina del usuario. Mitigación: priorizar Fase 2 inmediatamente tras validar Fase 1.
- **Riesgo**: distribuir app nativa tiene más fricción que una PWA (cuenta de desarrollador Apple/Google, revisión de las stores); durante la fase personal se cubre con TestFlight/Play interna.
- **Pregunta abierta**: ¿pautas complejas (días alternos, "cada 48 h") son necesarias pronto? El prototipo solo soporta horas fijas diarias. Decidir con uso real.
- **Pregunta abierta**: monetización (freemium por nº de mascotas/cuidadores vs. suscripción única). Posponer hasta tener retención.
- **Pregunta abierta**: nombre "AniMate" — verificar disponibilidad de dominio y colisiones de marca antes del lanzamiento público.
