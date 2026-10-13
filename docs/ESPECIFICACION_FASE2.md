# Exclusive 360 · Guía de conversación — Especificación funcional (Fase 2, borrador)

Fuente única de reglas: los cuatro documentos EXCLUSIVE 360 proporcionados. Lo marcado **[PROPUESTA]** no está en los documentos y requiere confirmación.

## 1. Alcance
Herramienta de conversación guiada para el ejecutivo de primera línea. No clasifica bases de clientes. Datos ficticios; conexión futura con datos reales (fuera del alcance actual; requiere backend y autorización institucional).

## 2. Semáforo de escalamiento (normativo)
Entrada: situaciones marcadas por el ejecutivo.

| Nivel | Condición | Acción documentada |
|---|---|---|
| Rojo | Al menos 1 de 6 situaciones rojas | Detener la recomendación personal → canalizar + documentar |
| Amarillo | Ninguna roja y al menos 1 de 6 amarillas | Canalizar + registrar en ARIA + confirmar contacto |
| Verde | Ninguna roja ni amarilla | Conocer + informar + definir siguiente paso |

Regla confirmada: prevalece el nivel más restrictivo (rojo > amarillo > verde).
Nota: el verde en los documentos describe acciones permitidas, no situaciones del cliente. Se modela como estado por omisión.

## 3. Radar de relación (comercial)
| Nivel | Condición |
|---|---|
| Alto valor / Exclusive | Desarrollo cumplido **y** señales de alto valor suficientes **[PROPUESTA: mínimo 2 de 5]** |
| Oportunidad de desarrollo | 2 o más de 6 señales de desarrollo |
| Prioridad normal | Necesidad operativa/transaccional, sin interés en profundizar |

Hueco documental: el caso de exactamente 1 señal de desarrollo no está definido. Prototipo: se muestra Prioridad normal con aviso.
Condición "Valor / potencial" (OMNI): campo de captura manual.
Aviso obligatorio: el cuestionario no determina por sí mismo que un cliente pertenece a Exclusive.

### Marco de ponderación **[PROPUESTA]**
Cada señal de desarrollo se puntúa en dos criterios (0–2): Capacidad (indica recursos o relación movilizables) e Intención (indica disposición a actuar). Peso = suma.

| Señal | Capacidad | Intención | Peso |
|---|---|---|---|
| Proyectos próximos | 1 | 1 | 2 |
| Recursos con mayor horizonte | 2 | 1 | 3 |
| Inversiones en otras instituciones | 2 | 0 | 2 |
| Necesidades personales + empresariales | 2 | 1 | 3 |
| Interés en revisar alternativas | 1 | 2 | 3 |
| Necesidad de atención más especializada | 1 | 1 | 2 |

Decisión de diseño: los pesos solo ordenan prioridad dentro de un mismo nivel; **no** alteran la regla documentada de "2 o más señales".

## 4. Datos previos
Cuatro confirmaciones registradas: objetivo, liquidez, horizonte, prioridad/riesgo.

## 5. Persistencia
Notas y estado en localStorage del navegador. Sin servidor ni envío de datos.

## 6. Criterios de aceptación
1. Con ninguna casilla: verde y prioridad normal.
2. Una roja y una amarilla: resultado rojo.
3. Una amarilla sin rojas: amarillo.
4. Dos señales de desarrollo: oportunidad de desarrollo.
5. Dos de desarrollo + mínimo de alto valor: alto valor.
6. Los dos semáforos nunca se combinan.
7. Cada color con texto e icono; navegación por teclado.
8. Reiniciar borra casillas y notas.

## 7. Erratas detectadas en los documentos (sin corregir en origen)
"PRIODIDAD", "imporatante", "cualitivo", "especí fica", "BanBajio" sin tilde en un texto.

## 8. Decisiones confirmadas (10 oct 2026)
- Pesos propuestos y mínimo de 2 señales de alto valor: aceptados como razonables (siguen pendientes de validación institucional).
- Una sola señal de desarrollo: Prioridad normal con aviso.
- Logotipo: se declara provisional (extraído del PDF, baja resolución).
- Estructura: conversación guiada (vista principal) más panel e historial local (decisión de diseño de Claude, aprobada por delegación).
- Modo claro, uso en escritorio (con diseño adaptable).
