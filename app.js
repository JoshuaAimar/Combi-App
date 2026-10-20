// app.js
// Maneja lo que se ve en pantalla y lo que hace cada botón.
// Los datos se leen y se guardan con el archivo datos.js.

// ---------- 1. Buscamos los elementos de la página ----------
const lista = document.getElementById('lista');
const contador = document.getElementById('contador');
const vacio = document.getElementById('vacio');
const buscador = document.getElementById('buscador');

const hoja = document.getElementById('hoja');
const formulario = document.getElementById('formulario');
const tituloFormulario = document.getElementById('tituloFormulario');
const campoNombre = document.getElementById('campoNombre');
const campoCompra = document.getElementById('campoCompra');
const campoVenta = document.getElementById('campoVenta');
const campoMinima = document.getElementById('campoMinima');
const mensajeError = document.getElementById('mensajeError');
const btnEliminar = document.getElementById('btnEliminar');

// Aquí recordamos qué producto se está editando (null = producto nuevo).
let productoEnEdicion = null;

// ---------- 2. Mostrar la lista ----------
function dinero(numero) {
  return '$' + Number(numero).toFixed(2);
}

function mostrarLista() {
  const texto = buscador.value.trim().toLowerCase();
  const todos = Datos.listar();

  // Filtramos por lo que se escribió en el buscador y ordenamos por nombre.
  const productos = todos
    .filter(function (p) { return p.nombre.toLowerCase().includes(texto); })
    .sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });

  lista.innerHTML = '';
  productos.forEach(function (producto) {
    const fila = document.createElement('li');

    const info = document.createElement('div');
    const nombre = document.createElement('div');
    nombre.className = 'nombre';
    nombre.textContent = producto.nombre;           // textContent evita problemas con caracteres raros
    const detalle = document.createElement('div');
    detalle.className = 'detalle';
    detalle.textContent = 'Compra ' + dinero(producto.precioCompra) +
      ' · Venta ' + dinero(producto.precioVenta) +
      ' · Ganancia ' + dinero(producto.precioVenta - producto.precioCompra) +
      ' · Mínima ' + producto.existenciaMinima;
    info.appendChild(nombre);
    info.appendChild(detalle);

    const flecha = document.createElement('span');
    flecha.className = 'flecha';
    flecha.textContent = '›';

    // Cuántas piezas hay: entradas menos ventas y mermas
    const existencia = Datos.existenciaDe(producto.id);
    const piezas = document.createElement('span');
    piezas.className = 'existencia';
    piezas.textContent = 'Hay ' + existencia;
    if (existencia < producto.existenciaMinima) {
      piezas.classList.add('bajo');      // se pinta en rojo
    }

    fila.appendChild(info);
    fila.appendChild(piezas);
    fila.appendChild(flecha);
    fila.addEventListener('click', function () { abrirFormulario(producto); });
    lista.appendChild(fila);
  });

  contador.textContent = todos.length + (todos.length === 1 ? ' producto' : ' productos');
  vacio.hidden = productos.length > 0;
}

buscador.addEventListener('input', mostrarLista);

// ---------- 3. Formulario de agregar / editar ----------
function abrirFormulario(producto) {
  productoEnEdicion = producto;                      // null si es nuevo
  mensajeError.hidden = true;

  if (producto === null) {
    tituloFormulario.textContent = 'Nuevo producto';
    campoNombre.value = '';
    campoCompra.value = 0;
    campoVenta.value = 0;
    campoMinima.value = 0;
    btnEliminar.hidden = true;
  } else {
    tituloFormulario.textContent = 'Editar producto';
    campoNombre.value = producto.nombre;
    campoCompra.value = producto.precioCompra;
    campoVenta.value = producto.precioVenta;
    campoMinima.value = producto.existenciaMinima;
    btnEliminar.hidden = false;
  }
  hoja.hidden = false;
  campoNombre.focus();
}

function cerrarFormulario() {
  hoja.hidden = true;
  productoEnEdicion = null;
}

document.getElementById('btnAgregar').addEventListener('click', function () { abrirFormulario(null); });
document.getElementById('btnCancelar').addEventListener('click', cerrarFormulario);

formulario.addEventListener('submit', function (evento) {
  evento.preventDefault();                           // evita que la página se recargue

  const producto = {
    id: productoEnEdicion ? productoEnEdicion.id : '',
    nombre: campoNombre.value,
    precioCompra: parseFloat(campoCompra.value),
    precioVenta: parseFloat(campoVenta.value),
    existenciaMinima: parseInt(campoMinima.value, 10)
  };

  const error = Datos.guardarProducto(producto);
  if (error !== '') {
    mensajeError.textContent = error;
    mensajeError.hidden = false;
    return;
  }
  cerrarFormulario();
  mostrarLista();
});

// Si la persona vuelve a escribir, ocultamos el mensaje de error anterior.
formulario.addEventListener('input', function () { mensajeError.hidden = true; });

btnEliminar.addEventListener('click', function () {
  if (productoEnEdicion === null) return;
  if (confirm('¿Eliminar "' + productoEnEdicion.nombre + '"?')) {
    Datos.eliminarProducto(productoEnEdicion.id);
    cerrarFormulario();
    mostrarLista();
  }
});

// ---------- 4. Respaldo ----------
document.getElementById('btnExportar').addEventListener('click', function () {
  const contenido = Datos.exportar();
  const archivo = new Blob([contenido], { type: 'application/json' });
  const enlace = document.createElement('a');
  const fecha = new Date().toISOString().slice(0, 10);
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = 'respaldo-la-combi-' + fecha + '.json';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
});

const archivoRespaldo = document.getElementById('archivoRespaldo');
document.getElementById('btnImportar').addEventListener('click', function () { archivoRespaldo.click(); });

archivoRespaldo.addEventListener('change', function () {
  const archivo = archivoRespaldo.files[0];
  if (!archivo) return;
  if (!confirm('Esto reemplazará los productos y movimientos actuales por los del respaldo. ¿Continuar?')) {
    archivoRespaldo.value = '';
    return;
  }
  const lector = new FileReader();
  lector.onload = function () {
    try {
      const resumen = Datos.importar(lector.result);
      mostrarLista();
      alert('Respaldo restaurado: ' + resumen.productos + ' productos, ' + resumen.movimientos + ' movimientos y ' + resumen.conteos + ' conteos.');
    } catch (error) {
      alert(error.message);
    }
    archivoRespaldo.value = '';
  };
  lector.readAsText(archivo);
});

// ---------- 5. Service worker (hace que funcione sin internet) ----------
// Mientras programamos (localhost) lo desactivamos para ver los cambios al instante.
const enDesarrollo = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

if ('serviceWorker' in navigator) {
  if (enDesarrollo) {
    navigator.serviceWorker.getRegistrations().then(function (registros) {
      registros.forEach(function (registro) { registro.unregister(); });
    });
  } else {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js');
    });
  }
}

// ---------- 6. Registrar movimientos (entradas, ventas y mermas) ----------
const hojaMov = document.getElementById('hojaMov');
const formMov = document.getElementById('formMov');
const movProducto = document.getElementById('movProducto');
const movCantidad = document.getElementById('movCantidad');
const movMensaje = document.getElementById('movMensaje');
const movError = document.getElementById('movError');

// Llena la lista desplegable con los productos, en orden alfabético.
function llenarProductos() {
  const productos = Datos.listar().sort(function (a, b) {
    return a.nombre.localeCompare(b.nombre, 'es');
  });
  movProducto.innerHTML = '';
  productos.forEach(function (producto) {
    const opcion = document.createElement('option');
    opcion.value = producto.id;
    opcion.textContent = producto.nombre;
    movProducto.appendChild(opcion);
  });
}

function abrirMovimiento() {
  llenarProductos();
  movCantidad.value = '';
  movMensaje.hidden = true;
  movError.hidden = true;
  hojaMov.hidden = false;
}

function cerrarMovimiento() {
  hojaMov.hidden = true;
  mostrarLista();                 // actualiza los "Hay ..." de la lista
}

document.getElementById('btnMovimiento').addEventListener('click', abrirMovimiento);
document.getElementById('btnCerrarMov').addEventListener('click', cerrarMovimiento);

formMov.addEventListener('submit', function (evento) {
  evento.preventDefault();
  movMensaje.hidden = true;
  movError.hidden = true;

  const tipo = formMov.elements['movTipo'].value;      // 'entrada', 'venta' o 'merma'
  const cantidad = Number(movCantidad.value);          // Number no recorta decimales en silencio
  const error = Datos.registrarMovimiento(movProducto.value, tipo, cantidad);

  if (error !== '') {
    movError.textContent = error;
    movError.hidden = false;
    return;
  }

  const nombre = movProducto.options[movProducto.selectedIndex].text;
  movMensaje.textContent = 'Guardado: ' + tipo + ' de ' + cantidad + ' · ' + nombre +
    ' (ahora hay ' + Datos.existenciaDe(movProducto.value) + ')';
  movMensaje.hidden = false;
  movCantidad.value = '';
  movCantidad.focus();
});

// Si la persona vuelve a escribir, ocultamos el error anterior.
formMov.addEventListener('input', function () { movError.hidden = true; });

// ---------- 6b. Conteo físico ----------
const hojaConteo = document.getElementById('hojaConteo');
const listaConteo = document.getElementById('listaConteo');
const conteoMensaje = document.getElementById('conteoMensaje');
const conteoError = document.getElementById('conteoError');

// Aquí recordamos cada fila de la pantalla: su producto, lo esperado, su cuadro y su aviso.
let filasConteo = [];

// Muestra la diferencia entre lo contado y lo esperado, en esa fila.
function mostrarDiferencia(fila) {
  const texto = fila.input.value;
  if (texto === '') {
    fila.dif.textContent = '';
    fila.dif.className = 'dif';
    return;
  }
  const contado = Number(texto);
  if (!Number.isInteger(contado) || contado < 0) {
    fila.dif.textContent = 'Número no válido';
    fila.dif.className = 'dif mal';
    return;
  }
  const diferencia = contado - fila.esperado;
  if (diferencia === 0) {
    fila.dif.textContent = 'Coincide';
    fila.dif.className = 'dif ok';
  } else {
    fila.dif.textContent = 'Diferencia: ' + (diferencia > 0 ? '+' : '') + diferencia;
    fila.dif.className = 'dif mal';
  }
}

function abrirConteo() {
  resultadoConteo.hidden = true;
  conteoMensaje.hidden = true;
  conteoError.hidden = true;
  listaConteo.innerHTML = '';
  filasConteo = [];

  const productos = Datos.listar().sort(function (a, b) {
    return a.nombre.localeCompare(b.nombre, 'es');
  });

  productos.forEach(function (producto) {
    const esperado = Datos.existenciaDe(producto.id);

    const li = document.createElement('li');
    li.className = 'fila-conteo';

    const datos = document.createElement('div');
    datos.className = 'datos';
    const nombre = document.createElement('div');
    nombre.className = 'nombre';
    nombre.textContent = producto.nombre;
    const textoEsperado = document.createElement('div');
    textoEsperado.className = 'esperado';
    textoEsperado.textContent = 'Esperado: ' + esperado;
    const dif = document.createElement('div');
    dif.className = 'dif';
    datos.appendChild(nombre);
    datos.appendChild(textoEsperado);
    datos.appendChild(dif);

    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'numeric';
    input.min = '0';
    input.step = '1';
    input.placeholder = '—';

    li.appendChild(datos);
    li.appendChild(input);
    listaConteo.appendChild(li);

    const fila = { producto: producto, esperado: esperado, textoEsperado: textoEsperado, input: input, dif: dif };
    input.addEventListener('input', function () {
      conteoError.hidden = true;
      mostrarDiferencia(fila);
    });
    filasConteo.push(fila);
  });

  hojaConteo.hidden = false;
}

const resultadoConteo = document.getElementById('resultadoConteo');

// Ajusta la existencia de un producto al conteo. Devuelve true si se pudo.
function ajustarUno(item, boton) {
  const error = Datos.ajustarAlConteo(item.conteo.id);
  if (error !== '') {
    alert(error);
    return false;
  }
  boton.textContent = 'Ajustado ✓';
  boton.disabled = true;
  // La existencia cambió, así que actualizamos el "Esperado" de esa fila.
  item.fila.esperado = Datos.existenciaDe(item.fila.producto.id);
  item.fila.textoEsperado.textContent = 'Esperado: ' + item.fila.esperado;
  return true;
}

// Muestra arriba los productos con diferencia, cada uno con su botón "Ajustar".
function mostrarResultado(items) {
  resultadoConteo.innerHTML = '';
  if (items.length === 0) {
    resultadoConteo.hidden = true;
    return;
  }

  const titulo = document.createElement('h3');
  titulo.textContent = 'Diferencias encontradas';
  resultadoConteo.appendChild(titulo);

  const botones = [];
  items.forEach(function (item) {
    const c = item.conteo;
    const fila = document.createElement('div');
    fila.className = 'fila-resultado';

    const datos = document.createElement('div');
    datos.className = 'datos';
    const nombre = document.createElement('div');
    nombre.className = 'nombre';
    nombre.textContent = item.fila.producto.nombre;
    const detalle = document.createElement('div');
    detalle.className = 'detalle';
    detalle.textContent = 'Esperado ' + c.esperado + ' · Contado ' + c.contado +
      ' · Diferencia ' + (c.diferencia > 0 ? '+' : '') + c.diferencia;
    datos.appendChild(nombre);
    datos.appendChild(detalle);

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton-ajustar';
    boton.textContent = 'Ajustar';
    boton.addEventListener('click', function () { ajustarUno(item, boton); });
    botones.push({ item: item, boton: boton });

    fila.appendChild(datos);
    fila.appendChild(boton);
    resultadoConteo.appendChild(fila);
  });

  const todos = document.createElement('button');
  todos.type = 'button';
  todos.className = 'boton principal';
  todos.textContent = 'Ajustar todos';
  todos.addEventListener('click', function () {
    botones.forEach(function (b) {
      if (!b.boton.disabled) ajustarUno(b.item, b.boton);
    });
  });
  resultadoConteo.appendChild(todos);

  resultadoConteo.hidden = false;
  hojaConteo.scrollTop = 0;            // subimos para que se vea el resultado
}

function cerrarConteo() {
  hojaConteo.hidden = true;
  mostrarLista();
}

document.getElementById('btnConteo').addEventListener('click', abrirConteo);
document.getElementById('btnCerrarConteo').addEventListener('click', cerrarConteo);

document.getElementById('btnGuardarConteo').addEventListener('click', function () {
  conteoMensaje.hidden = true;
  conteoError.hidden = true;

  // Solo guardamos las filas donde se escribió algo.
  const contadas = filasConteo.filter(function (f) { return f.input.value !== ''; });
  if (contadas.length === 0) {
    conteoError.textContent = 'Escribe al menos un conteo.';
    conteoError.hidden = false;
    return;
  }

  // Primero revisamos TODO; si algo está mal, no guardamos nada.
  const invalidas = contadas.filter(function (f) {
    const numero = Number(f.input.value);
    return !Number.isInteger(numero) || numero < 0;
  });
  if (invalidas.length > 0) {
    const nombres = invalidas.map(function (f) { return f.producto.nombre; }).join(', ');
    conteoError.textContent = 'Revisa: ' + nombres + '. Deben ser números enteros de 0 en adelante.';
    conteoError.hidden = false;
    return;
  }

  // Ahora sí, guardamos cada conteo.
  const conDiferencia = [];          // aquí juntamos los que no coinciden
  contadas.forEach(function (f) {
    const resultado = Datos.registrarConteo(f.producto.id, Number(f.input.value));
    if (resultado.conteo.diferencia !== 0) {
      conDiferencia.push({ fila: f, conteo: resultado.conteo });
    }
    f.input.value = '';
    mostrarDiferencia(f);
  });

  // Precisión: de todo lo que se contó, ¿qué porcentaje coincidió?
  const precision = Math.round((contadas.length - conDiferencia.length) / contadas.length * 100);
  conteoMensaje.textContent = 'Se guardaron ' + contadas.length + ' conteos, ' + conDiferencia.length +
    ' con diferencia. Precisión: ' + precision + ' %.';  mostrarResultado(conDiferencia);
});

// ---------- 6c. Pedido sugerido ----------
const hojaPedido = document.getElementById('hojaPedido');
const listaPedido = document.getElementById('listaPedido');
const pedidoVacio = document.getElementById('pedidoVacio');
const pedidoMensaje = document.getElementById('pedidoMensaje');

// Aquí recordamos cada fila del pedido: su producto y su cuadro con la cantidad.
let filasPedido = [];

function abrirPedido() {
  pedidoMensaje.hidden = true;
  listaPedido.innerHTML = '';
  filasPedido = [];

  const productos = Datos.listar().sort(function (a, b) {
    return a.nombre.localeCompare(b.nombre, 'es');
  });

  productos.forEach(function (producto) {
    // Si la existencia salió negativa (se vendió más de lo anotado), contamos 0.
    const hay = Math.max(Datos.existenciaDe(producto.id), 0);
    const falta = producto.existenciaMinima - hay;
    if (falta <= 0) return;                      // este producto no hace falta pedirlo

    const li = document.createElement('li');
    li.className = 'fila-conteo';

    const datos = document.createElement('div');
    datos.className = 'datos';
    const nombre = document.createElement('div');
    nombre.className = 'nombre';
    nombre.textContent = producto.nombre;
    const detalle = document.createElement('div');
    detalle.className = 'esperado';
    detalle.textContent = 'Hay ' + hay + ' · Mínima ' + producto.existenciaMinima;
    datos.appendChild(nombre);
    datos.appendChild(detalle);

    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'numeric';
    input.min = '0';
    input.step = '1';
    input.value = falta;                         // la cantidad sugerida

    li.appendChild(datos);
    li.appendChild(input);
    listaPedido.appendChild(li);
    filasPedido.push({ producto: producto, input: input });
  });

  pedidoVacio.hidden = filasPedido.length > 0;
  hojaPedido.hidden = false;
}

document.getElementById('btnPedido').addEventListener('click', abrirPedido);
document.getElementById('btnCerrarPedido').addEventListener('click', function () {
  hojaPedido.hidden = true;
});

// Arma el texto del pedido y lo copia, para pegarlo en WhatsApp.
document.getElementById('btnCopiarPedido').addEventListener('click', function () {
  const lineas = [];
  filasPedido.forEach(function (f) {
    const cantidad = Number(f.input.value);
    if (Number.isInteger(cantidad) && cantidad > 0) {
      lineas.push(cantidad + ' ' + f.producto.nombre);
    }
  });

  if (lineas.length === 0) {
    pedidoMensaje.textContent = 'No hay nada que pedir.';
    pedidoMensaje.hidden = false;
    return;
  }

  const texto = 'Pedido Expendio La Combi (' + new Date().toLocaleDateString('es-MX') + ')\n' + lineas.join('\n');

  if (!navigator.clipboard) {
    alert('No se pudo copiar. Este es el pedido:\n\n' + texto);
    return;
  }
  navigator.clipboard.writeText(texto).then(function () {
    pedidoMensaje.textContent = 'Pedido copiado (' + lineas.length + ' productos). Pégalo en WhatsApp.';
    pedidoMensaje.hidden = false;
  }).catch(function () {
    alert('No se pudo copiar. Este es el pedido:\n\n' + texto);
  });
});

// ---------- 7. Arranque ----------
mostrarLista();
