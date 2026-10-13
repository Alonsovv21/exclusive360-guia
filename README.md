# Exclusive 360 · Guía de conversación

Prototipo de portafolio de una herramienta de **conversación guiada** para ejecutivos de primera línea, basada en los documentos EXCLUSIVE 360 (Guía rápida de necesidades, Semáforo y Radar de relación).

> **Estado:** prototipo con **datos ficticios**. No es una aplicación autorizada para uso institucional. El logotipo (`public/logo-provisional.png`) es **provisional**: se extrajo del PDF proporcionado, tiene baja resolución y debe sustituirse por el SVG oficial.

## Qué hace
- **Conversación:** el ejecutivo confirma los cuatro datos previos, marca situaciones y señales, y obtiene **dos semáforos independientes**:
  - *Semáforo de escalamiento* (normativo): verde, amarillo, rojo. Prevalece el nivel más restrictivo.
  - *Radar de relación* (comercial): prioridad normal, oportunidad de desarrollo, alto valor / Exclusive.
- **Panel e historial:** indicadores, gráficos, cruce de ambos semáforos, tabla con búsqueda, filtros y orden, ficha individual con justificación, exportación a CSV y datos de demostración.
- Todo se guarda **solo en el navegador** (localStorage). No hay servidor ni envío de datos.

Las reglas están en `src/rules.js`, separadas de la interfaz y cubiertas por pruebas (`src/rules.test.js`). Especificación: `docs/ESPECIFICACION_FASE2.md`.

## Requisitos
Node.js 20 o superior.

## Instalación y ejecución
```bash
npm install
npm run dev        # desarrollo en http://localhost:5173
npm test           # pruebas del motor de reglas
npm run build      # genera la carpeta dist/
npm run preview    # sirve dist/ localmente
```

## Publicación en GitHub Pages
1. Cree un repositorio en GitHub (si usa material interno, **privado** salvo autorización expresa de publicación; GitHub Pages en repositorios privados depende del plan).
2. Desde esta carpeta:
   ```bash
   git init
   git add .
   git commit -m "Prototipo Exclusive 360"
   git branch -M main
   git remote add origin https://github.com/<usuario>/<repositorio>.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. El flujo `.github/workflows/deploy.yml` compila y publica en cada *push* a `main`. La URL será `https://<usuario>.github.io/<repositorio>/`.

La configuración usa `base: './'`, por lo que no depende del nombre del repositorio.

### Lista de comprobación tras publicar
- [ ] La página carga sin errores en la consola del navegador.
- [ ] El logotipo y los estilos se ven correctamente.
- [ ] Marcar casillas actualiza los dos semáforos.
- [ ] «Cargar datos de demostración» llena el panel; los filtros y el orden funcionan.
- [ ] La ficha se abre y se cierra (también con Esc).
- [ ] «Exportar CSV» descarga el archivo.
- [ ] Se ve bien en móvil y en escritorio.

## Privacidad y seguridad
- Use únicamente datos ficticios. **No publique archivos de clientes reales** en el repositorio.
- localStorage no está cifrado: cualquier persona con acceso al navegador puede leerlo.
- La tipografía Poppins se carga desde Google Fonts (petición externa). Para uso institucional, aloje la fuente localmente.
- Conectar con archivos o sistemas reales (OMNI, ARIA) exige un backend con autenticación, permisos y autorización de seguridad. **Una página estática no puede hacerlo de forma segura.**

## Limitaciones conocidas y pendientes
- Reglas **por validar** (marcadas como *[PROPUESTA]* en la especificación): mínimo de 2 señales de alto valor, marco de ponderación, caso de una sola señal de desarrollo.
- Criterio cuantitativo de «patrimonio significativo» y «relación patrimonial relevante»: por definir.
- Identidad visual: colores y tipografía tomados de los PDF proporcionados; no se consultó una guía oficial de marca. Los colores del semáforo son propuesta de diseño.
- Pruebas en navegador realizadas con Chromium (escritorio y ancho móvil de 390 px). No se probó en Safari ni Firefox, ni con lectores de pantalla.
- Sin integración con ARIA ni OMNI; «Valor / potencial» es una captura manual.
