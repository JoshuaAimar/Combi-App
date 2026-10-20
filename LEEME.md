# La Combi: registro diario de pedidos

App web instalable (PWA) para el iPhone de Expendio La Combi.

## Qué hace

- **Día:** se elige el día (hoy por defecto) y se anota cuántas piezas de cada producto se registraron. Cada cantidad se guarda sola al escribirla.
- **Totales del día:** barra fija abajo con piezas, costo, venta y ganancia (con los precios actuales de cada producto).
- **Productos:** catálogo con los 49 productos de la hoja de pedido; agregar, editar (nombre, precio de compra y precio de venta), eliminar y buscar.
- **Copiar:** copia el pedido del día como texto, listo para pegarlo en WhatsApp.
- **Conteo:** escribir lo que se cuenta de cada producto, ver la diferencia contra lo registrado ese día, guardar (con la precisión del conteo) y ajustar lo registrado con un botón.
- **Respaldo:** guardar y restaurar productos, días y conteos en un archivo.
- Se instala en la pantalla de inicio y funciona sin internet.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Las pantallas (estructura). |
| `styles.css` | El aspecto (colores, tamaños). |
| `datos.js` | Guardar y leer los datos en el teléfono. |
| `app.js` | Lo que hace cada botón. |
| `sw.js` | Hace que la app funcione sin internet. |
| `manifest.webmanifest` | Nombre e íconos para poder instalarla. |
| `icon-*.png`, `apple-touch-icon.png`, `logo.png` | Íconos y logo. |

## Cómo se guardan los datos

Todo queda en el teléfono (almacenamiento local del navegador), en tres partes:

- **productos:** nombre, precio de compra y precio de venta.
- **días:** para cada fecha, las piezas de cada producto (`{ "2026-10-20": { idProducto: piezas } }`).
- **conteos:** cada conteo guarda el día, lo registrado, lo contado, la diferencia y si ya se ajustó.

## Probarla en la computadora

Abre la carpeta en Visual Studio Code, instala la extensión **Live Server** y haz clic derecho en `index.html` > **Open with Live Server**. En `localhost` el service worker se apaga solo para que veas los cambios al instante.

## Publicarla y actualizarla (GitHub Desktop + GitHub Pages)

1. Copia los archivos a la carpeta del repositorio y reemplaza los anteriores.
2. En GitHub Desktop escribe un resumen, presiona **Commit to main** y luego **Push origin**.
3. En uno o dos minutos se actualiza la dirección `https://TU-USUARIO.github.io/Combi-App/`.
4. **Cambia el número de `VERSION` en `sw.js`** en cada actualización (por ejemplo, de `combi-v4` a `combi-v5`); si no, el iPhone sigue mostrando la versión anterior.

## Instalarla en el iPhone

1. Abrir la dirección en **Safari**.
2. Tocar **Compartir** y elegir **Agregar a pantalla de inicio**.
3. Abrirla siempre desde el ícono.

## Importante

- **Respaldo:** usen "Guardar respaldo" con frecuencia y abran la app desde el ícono instalado.
- **Precios:** los totales usan el precio actual del producto. Si cambia un precio, los totales de días anteriores se recalculan con el precio nuevo.
