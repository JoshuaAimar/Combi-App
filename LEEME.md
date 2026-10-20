# La Combi: control de inventario (primer incremento)

App web instalable (PWA) para el iPhone. En este primer incremento incluye:

- Catálogo con los 49 productos de la hoja de pedido.
- Buscar, agregar, editar y eliminar productos (nombre, precio de compra, precio de venta y existencia mínima).
- Respaldo: guardar y restaurar los datos en un archivo.
- Instalable en la pantalla de inicio y funciona sin internet.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Las pantallas (estructura). |
| `styles.css` | El aspecto (colores, tamaños). |
| `datos.js` | Guardar y leer los datos en el teléfono. |
| `app.js` | Lo que hace cada botón. |
| `sw.js` | Hace que la app funcione sin internet. |
| `manifest.webmanifest` | Nombre e íconos para poder instalarla. |
| `icon-*.png`, `apple-touch-icon.png` | Íconos de la app. |

## 1. Probarla en la computadora

Abran la carpeta en Visual Studio Code, instalen la extensión **Live Server** y den clic en "Go Live". También sirve, desde una terminal dentro de la carpeta: `python -m http.server 8000` y abrir `http://localhost:8000`.

## 2. Publicarla gratis (GitHub Pages)

Para instalarse en el iPhone, la app necesita estar en una dirección con **https**.

1. Crear una cuenta en github.com.
2. Crear un repositorio **público** llamado `combi-app` y subir todos los archivos de esta carpeta (botón "Add file" > "Upload files").
3. Ir a **Settings > Pages**, en "Branch" elegir `main` y la carpeta `/ (root)`, y dar **Save**.
4. En unos minutos aparece la dirección, parecida a `https://TU-USUARIO.github.io/combi-app/`.

Solo el código queda en GitHub. Los productos y datos del negocio se guardan únicamente en el teléfono.

## 3. Instalarla en el iPhone

1. Abrir la dirección en **Safari** (no en otro navegador).
2. Tocar el botón **Compartir** (cuadro con flecha hacia arriba).
3. Elegir **Agregar a pantalla de inicio** y confirmar.
4. Abrirla desde el ícono "La Combi".

## Importante

- **Respaldo:** en iPhone el navegador puede borrar los datos de un sitio si el almacenamiento se llena. Usen "Guardar respaldo" con frecuencia, y abran la app desde el ícono instalado.
- **Actualizaciones:** si cambian algún archivo, suban el cambio y modifiquen el número de `VERSION` en `sw.js` (por ejemplo, de `combi-v1` a `combi-v2`); si no, el teléfono seguirá mostrando la versión anterior.
- Esta versión se probó en un navegador móvil simulado. Falta probarla en el iPhone real del negocio.

## Siguientes incrementos

2. Registro de movimientos (entradas, ventas y mermas).
3. Existencias, conteo físico y conciliación.
4. Pedido sugerido.
