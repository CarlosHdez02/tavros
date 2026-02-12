# Documentación del Módulo de Plataformas – Tavros

## Resumen Ejecutivo

Este documento describe el trabajo realizado para el módulo de plataformas de Tavros, una aplicación de gestión de sesiones y reservas para gimnasio. El módulo muestra un plano de planta con plataformas numeradas, reservas de clientes y se visualiza en pantallas TV de 65" en orientación vertical.

---

## 1. Requisitos y Alcance

### 1.1 Requisitos Funcionales

- Mostrar el layout de plataformas con datos provenientes de la API de check-in
- Integrar el módulo en el carrusel principal de la app, con duración y orden definidos por Excel
- Asignar clientes a plataformas según el orden de las reservas
- Mostrar información reducida por plataforma: nombre (primer nombre + primer apellido) y tipo de clase
- Gestionar plataformas vacías con logo Tavros

### 1.2 Requisitos de Diseño (UI/UX)

- Estilo visual con acentos en color dorado (#E8B44F)
- Layout responsivo para TV 65" en vertical
- Sin desbordamiento de texto ni elementos fuera de contenedores
- Eliminación de elementos decorativos (ventana, mancuernas, poleas) para priorizar espacio a las plataformas
- Entrada ubicada en la esquina superior derecha

### 1.3 Requisitos Técnicos

- Sin errores de lint
- Tests unitarios que cubran componentes principales y casos límite

---

## 2. Trabajo Realizado

### 2.1 Componentes Principales

| Componente | Descripción |
|------------|-------------|
| `PlatformsMap.component.tsx` | Componente principal del mapa de plataformas |
| `Table.component.tsx` | Contenedor que obtiene datos de la API y renderiza PlatformsMap |
| `Carroussel.component.tsx` | Carrusel que alterna entre tabla, videos y galería |

### 2.2 Cambios de Layout

1. **Orden de plataformas**
   - Filas superiores: plataformas 9 y 10
   - Segunda fila: 8, 6, 4, 2
   - Tercera fila: 7, 5, 3, 1

2. **Eliminación de elementos**
   - Ventana
   - Rack de mancuernas
   - Máquina de poleas (lat pulldown)

3. **Reposicionamiento**
   - Entrada: esquina superior derecha

4. **Estilo visual**
   - Eliminación de bordes grises/blancos en plataformas
   - Eliminación de bordes/márgenes que generaban marco blanco alrededor de la app

### 2.3 Información por Plataforma

- **Ocupadas:** nombre del cliente + tipo de clase
- **Vacías:** logo Tavros
- **Nombre:** primer nombre + primer apellido (incluyendo apellidos compuestos)

### 2.4 Manejo de Nombres

- **Primer nombre:** solo la primera palabra (ej. "Evelyn" en "Evelyn Vianey")
- **Primer apellido:** primer apellido completo, incluyendo compuestos:
  - "de la Rosa", "del Castillo", "de los Santos", etc.
- Ejemplos:
  - "Evelyn Vianey Romero" → "Evelyn Romero"
  - "Jose Eduardo Gonzalez" → "Jose Gonzalez"
  - "Angel de la Rosa Martinez" → "Angel de la Rosa"

### 2.5 Tipo de Clase

- Mostrado en etiqueta dorada
- Truncado a 8 caracteres si es largo (ej. "SEMIPRIVADA" → "SEMIPRIV.")
- Evita desbordamiento con `overflow: hidden` y `text-overflow: ellipsis`

### 2.6 Responsividad y Contenedores

- Uso de `minWidth: 0`, `overflow: hidden` y `box-sizing: border-box` en contenedores flex/grid
- Truncamiento de nombres con ellipsis
- Eliminación de márgenes externos para vista a pantalla completa en TV

---

## 3. Pruebas (Testing)

### 3.1 Suite de Tests

- **Carroussel.component.test.tsx** (6 tests)
  - Estado de carga
  - Renderizado del primer slide
  - Tipos de elemento (tabla, video, galería)
  - Avance por duración y loop
  - Duración según Excel
  - Mensaje cuando no hay datos

- **PlatformsMap.component.test.tsx** (11 tests)
  - Renderizado con reservas vacías
  - Renderizado con reservas
  - Nombres de clientes
  - Etiqueta "Entrada"
  - Tipos de sesión (nombre vacío/desconocido)
  - Más de 10 reservas
  - Variantes de tamaño (default/large)

- **Table.component.test.tsx** (5 tests)
  - Estado de carga
  - Renderizado con datos de la API
  - Manejo de error de API
  - Manejo de 404 / sin datos
  - Renderizado con datos de respaldo

### 3.2 Ejecución

```bash
npm run test
```

Todos los tests pasan (22 tests en total).

---

## 4. Integración con el Sistema

### 4.1 Flujo de Datos

1. El carrusel obtiene configuración desde `/api/videos` (Excel/Google Sheet)
2. Para el slide tipo "table", se renderiza `Table.component`
3. Table obtiene check-in desde `NEXT_PUBLIC_API_URL/api/checkin/{fecha}`
4. Se selecciona la sesión actual por horario y se pasan `reservations` y `sessionTime` a PlatformsMap

### 4.2 Ruta Principal

- La ruta `/` muestra el carrusel
- El slide de plataformas usa la duración definida en Excel (`durationSeconds`)

---

## 5. Estimación de Tiempo

| Fase | Actividad | Tiempo estimado |
|------|-----------|-----------------|
| Layout inicial | Definición de grid, plataformas, entrada | ~2h |
| Ajustes de diseño | Colores, tamaños, eliminación de sketches | ~2h |
| Orden y disposición | Cambio de orden de plataformas, layout invertido | ~1h |
| Nombres y tipos | Truncamiento, apellidos compuestos | ~1.5h |
| Responsividad | Overflow, bordes, TV 65" | ~1.5h |
| Testing | Tests unitarios y correcciones | ~2h |
| **Total** | | **~10h** |

*Nota: tiempo aproximado según iteraciones de desarrollo.*

---

## 6. Archivos Modificados

- `src/components/PlatformsMap.component.tsx` – Lógica y layout principal
- `src/components/Table.component.tsx` – Header y contenedor
- `src/app/page.tsx` – Contenedor de la ruta principal
- `src/app/layout.tsx` – Márgenes y estructura
- `src/app/globals.css` – Estilos globales
- `src/components/PlatformsMap.component.test.tsx` – Tests de PlatformsMap
- `src/components/Table.component.test.tsx` – Tests de Table

---

## 7. Conclusión

El módulo de plataformas cumple con los requisitos funcionales y de diseño, está integrado en el carrusel con datos en tiempo real y ha sido probado para garantizar su correcto funcionamiento en distintos escenarios. La implementación es apta para despliegue en TV 65" en orientación vertical.
