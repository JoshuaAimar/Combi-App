// datos.js
// Aquí vive TODO lo relacionado con guardar y leer datos.
// Así, si más adelante cambian el almacenamiento del teléfono por una base
// de datos en la nube, solo hay que modificar este archivo.

const Datos = (function () {
  // Nombre con el que se guardan los productos dentro del teléfono.
  const CLAVE = 'combi_productos';

  // Catálogo inicial: los productos de la hoja de pedido.
  // Solo se carga la primera vez que se abre la app.
  const PRODUCTOS_INICIALES = [
    'Ciudadela', 'Tostado', 'Pastelito', 'Pastel', 'Niño', 'Ojo', 'Bisquet',
    'Nuez', 'P. Mula', 'Donas', 'Rellenas', 'Adobe', 'Taco-f', 'Moño-f',
    'Oreja', 'Cuadro-f', 'Empanada', 'Elote', 'G. grajea', 'G. coco',
    'G. azúcar', 'Cacahuate', 'Budín', 'Polvorón', 'Terrón', 'Puerco', 'Sol',
    'Servillano', 'Concha', 'Biscocho', 'Lima', 'Pan Moy', 'Podrida',
    'Cuerno-C', 'Capoteado', 'Roles', 'Almohada', 'Moño-d', 'Cuerno-d',
    'Cema', 'Virginia', 'Cerillo', 'Novia', 'Caja Roja', 'Bigote',
    'Rebanada', 'Queso', 'Pan G', 'Bolillo'
  ];

  // Genera un identificador único para cada producto.
  function nuevoId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // Crea un producto nuevo con sus datos en cero.
  function crearProducto(nombre) {
    return { id: nuevoId(), nombre: nombre, precioCompra: 0, precioVenta: 0, existenciaMinima: 0 };
  }

  // Guarda la lista completa de productos en el teléfono.
  function guardarLista(lista) {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  }

  // Lee la lista de productos. Si es la primera vez, carga el catálogo inicial.
  function listar() {
    const texto = localStorage.getItem(CLAVE);
    if (texto === null) {
      const lista = PRODUCTOS_INICIALES.map(crearProducto);
      guardarLista(lista);
      return lista;
    }
    try {
      return JSON.parse(texto);
    } catch (error) {
      // Si los datos se dañaron, conservamos una copia antes de empezar de cero.
      localStorage.setItem(CLAVE + '_dañado', texto);
      return [];
    }
  }

  // Revisa que un producto sea válido. Devuelve un mensaje de error, o '' si todo está bien.
  function validar(producto, lista) {
    const nombre = producto.nombre.trim();
    if (nombre === '') return 'Escribe el nombre del producto.';
    const repetido = lista.some(function (p) {
      return p.id !== producto.id && p.nombre.trim().toLowerCase() === nombre.toLowerCase();
    });
    if (repetido) return 'Ya existe un producto con ese nombre.';
    const numeros = [producto.precioCompra, producto.precioVenta, producto.existenciaMinima];
    if (numeros.some(function (n) { return typeof n !== 'number' || isNaN(n) || n < 0; })) {
      return 'Los precios y la existencia mínima deben ser números de 0 en adelante.';
    }
    return '';
  }

  // Agrega un producto nuevo o actualiza uno existente (si ya tiene id).
  // Devuelve un mensaje de error, o '' si se guardó bien.
  function guardarProducto(producto) {
    const lista = listar();
    const error = validar(producto, lista);
    if (error !== '') return error;
    producto.nombre = producto.nombre.trim();
    const posicion = lista.findIndex(function (p) { return p.id === producto.id; });
    if (posicion === -1) {
      producto.id = nuevoId();
      lista.push(producto);
    } else {
      lista[posicion] = producto;
    }
    guardarLista(lista);
    return '';
  }

  // Elimina un producto por su id.
  function eliminarProducto(id) {
    const lista = listar().filter(function (p) { return p.id !== id; });
    guardarLista(lista);
  }

  // Devuelve el respaldo como texto (para guardarlo en un archivo).
     function exportar() {
    return JSON.stringify({
      app: 'combi',
      version: 3,
      fecha: new Date().toISOString(),
      productos: listar(),
      movimientos: listarMovimientos(),
      conteos: listarConteos()
    }, null, 2);
  }

  // Restaura un respaldo. Lanza un error con mensaje claro si el archivo no sirve.
    function importar(texto) {
    let datos;
    try {
      datos = JSON.parse(texto);
    } catch (error) {
      throw new Error('El archivo no es un respaldo válido.');
    }
    if (!datos || datos.app !== 'combi' || !Array.isArray(datos.productos)) {
      throw new Error('El archivo no es un respaldo de esta app.');
    
    // Los respaldos antiguos no traen movimientos ni conteos: en ese caso, listas vacías.
    const movimientos = datos.movimientos === undefined ? [] : datos.movimientos;
    const conteos = datos.conteos === undefined ? [] : datos.conteos;
    if (!Array.isArray(movimientos) || !Array.isArray(conteos)) {
      throw new Error('Los movimientos o conteos del respaldo no son válidos.');
    }
    guardarLista(datos.productos);
    localStorage.setItem(CLAVE_MOVIMIENTOS, JSON.stringify(movimientos));
    localStorage.setItem(CLAVE_CONTEOS, JSON.stringify(conteos));
    return { productos: datos.productos.length, movimientos: movimientos.length, conteos: conteos.length };
  }
       // Los respaldos antiguos (versión 1) no traen movimientos: en ese caso, lista vacía.
    const movimientos = datos.movimientos === undefined ? [] : datos.movimientos;
    if (!Array.isArray(movimientos)) {
      throw new Error('Los movimientos del respaldo no son válidos.');
    }
    guardarLista(datos.productos);
    localStorage.setItem(CLAVE_MOVIMIENTOS, JSON.stringify(movimientos));
    return { productos: datos.productos.length, movimientos: movimientos.length };
    }

    // ---------- Movimientos (entradas, ventas y mermas) ----------
  const CLAVE_MOVIMIENTOS = 'combi_movimientos';
  const TIPOS = ['entrada', 'venta', 'merma'];

  // Lee la lista de movimientos guardados. Si no hay ninguno, devuelve una lista vacía.
  function listarMovimientos() {
    const texto = localStorage.getItem(CLAVE_MOVIMIENTOS);
    if (texto === null) return [];
    try {
      return JSON.parse(texto);
    } catch (error) {
      return [];
    }
  }

  // Anota un movimiento. Devuelve un mensaje de error, o '' si se guardó bien.
  function registrarMovimiento(productoId, tipo, cantidad) {
    if (!TIPOS.includes(tipo)) return 'Tipo de movimiento no válido.';
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return 'La cantidad debe ser un número entero mayor a 0.';
    }
    const existe = listar().some(function (p) { return p.id === productoId; });
    if (!existe) return 'El producto no existe.';

    const movimientos = listarMovimientos();
    movimientos.push({
      id: nuevoId(),
      productoId: productoId,
      tipo: tipo,
      cantidad: cantidad,
      fecha: new Date().toISOString()
    });
    localStorage.setItem(CLAVE_MOVIMIENTOS, JSON.stringify(movimientos));
    return '';
  }

  // Calcula cuántas piezas hay de un producto: entradas menos ventas y mermas.
  function existenciaDe(productoId) {
    let total = 0;
    listarMovimientos().forEach(function (m) {
      if (m.productoId !== productoId) return;
         if (m.tipo === 'entrada') {
        total = total + m.cantidad;
      } else if (m.tipo === 'ajuste') {
        total = total + m.cantidad;      // un ajuste puede ser positivo o negativo
      } else {
        total = total - m.cantidad;
      }
    });
    return total;
  }
    // ---------- Conteos físicos y ajustes ----------
  const CLAVE_CONTEOS = 'combi_conteos';

  // Lee la lista de conteos guardados. Si no hay ninguno, devuelve una lista vacía.
  function listarConteos() {
    const texto = localStorage.getItem(CLAVE_CONTEOS);
    if (texto === null) return [];
    try {
      return JSON.parse(texto);
    } catch (error) {
      return [];
    }
  }

  // Anota lo que se contó con las manos y lo compara con lo que la app esperaba.
  // Devuelve { error: '...' } si algo falla, o { error: '', conteo: {...} } si todo salió bien.
  function registrarConteo(productoId, contado) {
    if (!Number.isInteger(contado) || contado < 0) {
      return { error: 'El conteo debe ser un número entero de 0 en adelante.' };
    }
    const existe = listar().some(function (p) { return p.id === productoId; });
    if (!existe) return { error: 'El producto no existe.' };

    const esperado = existenciaDe(productoId);
    const conteo = {
      id: nuevoId(),
      productoId: productoId,
      fecha: new Date().toISOString(),
      esperado: esperado,
      contado: contado,
      diferencia: contado - esperado,     // negativo = faltan piezas, positivo = sobran
      ajustado: false
    };
    const conteos = listarConteos();
    conteos.push(conteo);
    localStorage.setItem(CLAVE_CONTEOS, JSON.stringify(conteos));
    return { error: '', conteo: conteo };
  }

  // Corrige las existencias para que coincidan con un conteo.
  // Lo hace anotando un movimiento de tipo 'ajuste'. Devuelve un mensaje de error, o '' si todo salió bien.
  function ajustarAlConteo(conteoId) {
    const conteos = listarConteos();
    const conteo = conteos.find(function (c) { return c.id === conteoId; });
    if (!conteo) return 'El conteo no existe.';
    if (conteo.ajustado) return 'Este conteo ya se ajustó.';
    if (conteo.diferencia === 0) return 'No hay diferencia que ajustar.';

    const movimientos = listarMovimientos();
    movimientos.push({
      id: nuevoId(),
      productoId: conteo.productoId,
      tipo: 'ajuste',
      cantidad: conteo.diferencia,
      fecha: new Date().toISOString(),
      conteoId: conteo.id
    });
    localStorage.setItem(CLAVE_MOVIMIENTOS, JSON.stringify(movimientos));

    conteo.ajustado = true;
    localStorage.setItem(CLAVE_CONTEOS, JSON.stringify(conteos));
    return '';
  }
  
  // Lo que dejamos disponible para el resto de la app.
  return {
    listar: listar,
    guardarProducto: guardarProducto,
    eliminarProducto: eliminarProducto,
    exportar: exportar,
    importar: importar,
    listarMovimientos: listarMovimientos,
    registrarMovimiento: registrarMovimiento,
    existenciaDe: existenciaDe,
     listarConteos: listarConteos,
    registrarConteo: registrarConteo,
    ajustarAlConteo: ajustarAlConteo
  };
}
)
 ();
