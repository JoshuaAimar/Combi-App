// datos.js
// Aquí vive TODO lo relacionado con guardar y leer datos.
// Así, si más adelante cambian el almacenamiento del teléfono por una base
// de datos en la nube, solo hay que modificar este archivo.
//
// Se guardan tres cosas en el teléfono:
//   1. productos: el catálogo, con su precio de compra y de venta.
//   2. días:      cuántas piezas de cada producto se registraron cada día.
//   3. conteos:   lo que se contó con las manos, comparado contra lo registrado.

const Datos = (function () {
  // Nombres con los que se guarda cada cosa dentro del teléfono.
  const CLAVE = 'combi_productos';
  const CLAVE_DIAS = 'combi_dias';
  const CLAVE_CONTEOS = 'combi_conteos_dia';

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

  // Genera un identificador único para cada cosa que se guarda.
  function nuevoId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // Redondea a centavos, para que las sumas no arrastren decimales raros.
  function aCentavos(numero) {
    return Math.round(numero * 100) / 100;
  }

  // Lee un objeto guardado (como los días). Si no hay nada o está dañado, devuelve uno vacío.
  function leerObjeto(clave) {
    const texto = localStorage.getItem(clave);
    if (texto === null) return {};
    try {
      const valor = JSON.parse(texto);
      if (valor !== null && typeof valor === 'object' && !Array.isArray(valor)) return valor;
      return {};
    } catch (error) {
      return {};
    }
  }

  // Lee una lista guardada (como los conteos). Si no hay nada o está dañada, devuelve una vacía.
  function leerLista(clave) {
    const texto = localStorage.getItem(clave);
    if (texto === null) return [];
    try {
      const valor = JSON.parse(texto);
      return Array.isArray(valor) ? valor : [];
    } catch (error) {
      return [];
    }
  }

  // ---------- Productos ----------

  // Crea un producto nuevo con sus precios en cero.
  function crearProducto(nombre) {
    return { id: nuevoId(), nombre: nombre, precioCompra: 0, precioVenta: 0 };
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
    const precios = [producto.precioCompra, producto.precioVenta];
    if (precios.some(function (n) { return typeof n !== 'number' || isNaN(n) || n < 0; })) {
      return 'Los precios deben ser números de 0 en adelante.';
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

  // Elimina un producto por su id, y también sus cantidades de todos los días.
  function eliminarProducto(id) {
    const lista = listar().filter(function (p) { return p.id !== id; });
    guardarLista(lista);

    const dias = leerObjeto(CLAVE_DIAS);
    Object.keys(dias).forEach(function (fecha) {
      delete dias[fecha][id];
      if (Object.keys(dias[fecha]).length === 0) delete dias[fecha];
    });
    localStorage.setItem(CLAVE_DIAS, JSON.stringify(dias));
  }

  // ---------- Días: cantidades registradas ----------

  // Revisa que la fecha tenga el formato AAAA-MM-DD y sea un día que existe.
  function fechaValida(fecha) {
    if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
    const partes = fecha.split('-').map(Number);
    const d = new Date(partes[0], partes[1] - 1, partes[2]);
    return d.getFullYear() === partes[0] && d.getMonth() === partes[1] - 1 && d.getDate() === partes[2];
  }

  // Devuelve las cantidades de un día, como { idDelProducto: piezas }.
  function cantidadesDelDia(fecha) {
    const dias = leerObjeto(CLAVE_DIAS);
    return Object.assign({}, dias[fecha] || {});
  }

  // Anota cuántas piezas de un producto se registraron en un día.
  // Con 0 se borra el registro de ese producto en ese día.
  // Devuelve un mensaje de error, o '' si se guardó bien.
  function guardarCantidad(fecha, productoId, cantidad) {
    if (!fechaValida(fecha)) return 'La fecha no es válida.';
    if (!Number.isInteger(cantidad) || cantidad < 0) {
      return 'La cantidad debe ser un número entero de 0 en adelante.';
    }
    const existe = listar().some(function (p) { return p.id === productoId; });
    if (!existe) return 'El producto no existe.';

    const dias = leerObjeto(CLAVE_DIAS);
    if (!dias[fecha]) dias[fecha] = {};
    if (cantidad === 0) {
      delete dias[fecha][productoId];
      if (Object.keys(dias[fecha]).length === 0) delete dias[fecha];
    } else {
      dias[fecha][productoId] = cantidad;
    }
    localStorage.setItem(CLAVE_DIAS, JSON.stringify(dias));
    return '';
  }

  // Suma lo de un día: piezas, costo, venta y ganancia (con los precios actuales).
  function totalesDelDia(fecha) {
    const cantidades = cantidadesDelDia(fecha);
    const total = { piezas: 0, costo: 0, venta: 0, ganancia: 0 };
    listar().forEach(function (producto) {
      const cantidad = cantidades[producto.id] || 0;
      if (cantidad <= 0) return;
      total.piezas = total.piezas + cantidad;
      total.costo = total.costo + cantidad * producto.precioCompra;
      total.venta = total.venta + cantidad * producto.precioVenta;
    });
    total.costo = aCentavos(total.costo);
    total.venta = aCentavos(total.venta);
    total.ganancia = aCentavos(total.venta - total.costo);
    return total;
  }

  // ---------- Conteos físicos y ajustes ----------

  // Lee la lista de conteos guardados.
  function listarConteos() {
    return leerLista(CLAVE_CONTEOS);
  }

  // Anota lo que se contó con las manos de un producto en un día y lo compara con lo registrado.
  // Devuelve { error: '...' } si algo falla, o { error: '', conteo: {...} } si todo salió bien.
  function registrarConteo(fecha, productoId, contado) {
    if (!fechaValida(fecha)) return { error: 'La fecha no es válida.' };
    if (!Number.isInteger(contado) || contado < 0) {
      return { error: 'El conteo debe ser un número entero de 0 en adelante.' };
    }
    const existe = listar().some(function (p) { return p.id === productoId; });
    if (!existe) return { error: 'El producto no existe.' };

    const registrado = cantidadesDelDia(fecha)[productoId] || 0;
    const conteo = {
      id: nuevoId(),
      fecha: fecha,
      productoId: productoId,
      registrado: registrado,
      contado: contado,
      diferencia: contado - registrado,     // negativo = faltan piezas, positivo = sobran
      ajustado: false,
      creado: new Date().toISOString()
    };
    const conteos = listarConteos();
    conteos.push(conteo);
    localStorage.setItem(CLAVE_CONTEOS, JSON.stringify(conteos));
    return { error: '', conteo: conteo };
  }

  // Corrige lo registrado ese día para que coincida con lo que se contó.
  // Devuelve un mensaje de error, o '' si todo salió bien.
  function ajustarAlConteo(conteoId) {
    const conteos = listarConteos();
    const conteo = conteos.find(function (c) { return c.id === conteoId; });
    if (!conteo) return 'El conteo no existe.';
    if (conteo.ajustado) return 'Este conteo ya se ajustó.';
    if (conteo.diferencia === 0) return 'No hay diferencia que ajustar.';

    const error = guardarCantidad(conteo.fecha, conteo.productoId, conteo.contado);
    if (error !== '') return error;

    conteo.ajustado = true;
    localStorage.setItem(CLAVE_CONTEOS, JSON.stringify(conteos));
    return '';
  }

  // ---------- Respaldo ----------

  // Devuelve el respaldo como texto (para guardarlo en un archivo).
  function exportar() {
    return JSON.stringify({
      app: 'combi',
      version: 4,
      fecha: new Date().toISOString(),
      productos: listar(),
      dias: leerObjeto(CLAVE_DIAS),
      conteos: listarConteos()
    }, null, 2);
  }

  // Revisa que los días tengan la forma { fecha: { idProducto: cantidad } }.
  function diasValidos(dias) {
    if (dias === null || typeof dias !== 'object' || Array.isArray(dias)) return false;
    return Object.keys(dias).every(function (fecha) {
      const dia = dias[fecha];
      if (!fechaValida(fecha) || dia === null || typeof dia !== 'object' || Array.isArray(dia)) return false;
      return Object.keys(dia).every(function (id) { return Number.isInteger(dia[id]) && dia[id] > 0; });
    });
  }

  // Restaura un respaldo. Lanza un error con mensaje claro si el archivo no sirve.
  // Los respaldos de versiones anteriores solo traen productos: en ese caso, no hay días ni conteos.
  function importar(texto) {
    let datos;
    try {
      datos = JSON.parse(texto);
    } catch (error) {
      throw new Error('El archivo no es un respaldo válido.');
    }
    if (!datos || datos.app !== 'combi' || !Array.isArray(datos.productos)) {
      throw new Error('El archivo no es un respaldo de esta app.');
    }
    const esNuevo = datos.version >= 4;
    const dias = esNuevo && datos.dias !== undefined ? datos.dias : {};
    const conteos = esNuevo && datos.conteos !== undefined ? datos.conteos : [];
    if (!diasValidos(dias) || !Array.isArray(conteos)) {
      throw new Error('Los días o conteos del respaldo no son válidos.');
    }
    // Todo está revisado: ahora sí guardamos.
    guardarLista(datos.productos);
    localStorage.setItem(CLAVE_DIAS, JSON.stringify(dias));
    localStorage.setItem(CLAVE_CONTEOS, JSON.stringify(conteos));
    return {
      productos: datos.productos.length,
      dias: Object.keys(dias).length,
      conteos: conteos.length
    };
  }

  // Lo que dejamos disponible para el resto de la app.
  return {
    listar: listar,
    guardarProducto: guardarProducto,
    eliminarProducto: eliminarProducto,
    cantidadesDelDia: cantidadesDelDia,
    guardarCantidad: guardarCantidad,
    totalesDelDia: totalesDelDia,
    listarConteos: listarConteos,
    registrarConteo: registrarConteo,
    ajustarAlConteo: ajustarAlConteo,
    exportar: exportar,
    importar: importar
  };
})();
