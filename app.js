// app.js
// Maneja lo que se ve en pantalla y lo que hace cada botón.
// Los datos se leen y se guardan con el archivo datos.js.

// ---------- 1. Buscamos los elementos de la página ----------
const lista = document.getElementById('lista');
const contador = document.getElementById('contador');
const vacio = document.getElementById('vacio');
const buscador = document.getElementById('buscador');
const campoFecha = document.getElementById('campoFecha');
const aviso = document.getElementById('aviso');

const totPiezas = document.getElementById('totPiezas');
const totCosto = document.getElementById('totCosto');
const totVenta = document.getElementById('totVenta');
const totGanancia = document.getElementById('totGanancia');

const hoja = document.getElementById('hoja');
const formulario = document.getElementById('formulario');
const tituloFormulario = document.getElementById('tituloFormulario');
const campoNombre = document.getElementById('campoNombre');
const campoCompra = document.getElementById('campoCompra');
const campoVenta = document.getElementById('campoVenta');
const mensajeError = document.getElementById('mensajeError');
const btnEliminar = document.getElementById('btnEliminar');

// Aquí recordamos qué producto se está editando (null = producto nuevo).
let productoEnEdicion = null;

// ---------- 2. Utilidades ----------

// Muestra un número como dinero: 1234.5 -> $1,234.50
function dinero(numero) {
  return '$' + Number(numero).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Agrega un cero a la izquierda si hace falta: 5 -> '05'
function dos(numero) {
  return String(numero).padStart(2, '0');
}

// La fecha de hoy con el formato AAAA-MM-DD, según el reloj del teléfono.
function hoy() {
  const d = new Date();
  return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate());
}

// '2026-10-20' -> '20/10/2026'
function formatoFecha(fecha) {
  const partes = fecha.split('-');
  return partes[2] + '/' + partes[1] + '/' + partes[0];
}

// Escribe un número con su palabra en singular o plural: (1, 'día', 'días') -> '1 día'
function plural(numero, singular, varios) {
  return numero + ' ' + (numero === 1 ? singular : varios);
}

// Para ordenar los productos por nombre.
function porNombre(a, b) {
  return a.nombre.localeCompare(b.nombre, 'es');
}

// Muestra un aviso corto arriba y lo quita solo a los pocos segundos.
let temporizadorAviso = null;
function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(function () { aviso.hidden = true; }, 2800);
}

// ---------- 3. Mostrar la lista del día ----------

// Actualiza la barra de abajo: piezas, costo, venta y ganancia del día elegido.
function mostrarTotales() {
  const total = Datos.totalesDelDia(campoFecha.value);
  totPiezas.textContent = total.piezas;
  totCosto.textContent = dinero(total.costo);
  totVenta.textContent = dinero(total.venta);
  totGanancia.textContent = dinero(total.ganancia);
}

// Guarda la cantidad que se escribió en una fila.
function guardarCantidadDeFila(producto, fila, input) {
  const texto = input.value;
  const cantidad = texto === '' ? 0 : Number(texto);    // vacío = 0 piezas
  const error = Datos.guardarCantidad(campoFecha.value, producto.id, cantidad);
  if (error !== '') {
    input.classList.add('invalido');                    // borde rojo: algo está mal
    return;
  }
  input.classList.remove('invalido');
  fila.classList.toggle('con-cantidad', cantidad > 0);  // se resalta si hay piezas
  mostrarTotales();
}

function mostrarLista() {
  const fecha = campoFecha.value;
  const texto = buscador.value.trim().toLowerCase();
  const todos = Datos.listar();
  const cantidades = Datos.cantidadesDelDia(fecha);

  // Filtramos por lo que se escribió en el buscador y ordenamos por nombre.
  const productos = todos
    .filter(function (p) { return p.nombre.toLowerCase().includes(texto); })
    .sort(porNombre);

  lista.innerHTML = '';
  productos.forEach(function (producto) {
    const cantidad = cantidades[producto.id] || 0;

    const fila = document.createElement('li');
    if (cantidad > 0) fila.classList.add('con-cantidad');

    // Lado izquierdo: nombre y precios. Al tocarlo se edita el producto.
    const info = document.createElement('div');
    info.className = 'info';
    const nombre = document.createElement('div');
    nombre.className = 'nombre';
    nombre.textContent = producto.nombre;            // textContent evita problemas con caracteres raros
    const detalle = document.createElement('div');
    detalle.className = 'detalle';
    detalle.textContent = 'Compra ' + dinero(producto.precioCompra) +
      ' · Venta ' + dinero(producto.precioVenta);
    info.appendChild(nombre);
    info.appendChild(detalle);
    info.addEventListener('click', function () { abrirFormulario(producto); });

    // Lado derecho: cuántas piezas se registraron ese día.
    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'numeric';
    input.min = '0';
    input.step = '1';
    input.placeholder = '0';
    input.value = cantidad > 0 ? cantidad : '';
    input.setAttribute('aria-label', 'Piezas de ' + producto.nombre);
    input.addEventListener('input', function () { guardarCantidadDeFila(producto, fila, input); });

    fila.appendChild(info);
    fila.appendChild(input);
    lista.appendChild(fila);
  });

  contador.textContent = plural(todos.length, 'producto', 'productos');
  vacio.hidden = productos.length > 0;
  mostrarTotales();
}

buscador.addEventListener('input', mostrarLista);

// Cambiar de día
campoFecha.addEventListener('change', function () {
  if (campoFecha.value === '') campoFecha.value = hoy();   // el día no puede quedar vacío
  mostrarLista();
});
document.getElementById('btnHoy').addEventListener('click', function () {
  campoFecha.value = hoy();
  mostrarLista();
});

// ---------- 4. Formulario de agregar / editar producto ----------
function abrirFormulario(producto) {
  productoEnEdicion = producto;                      // null si es nuevo
  mensajeError.hidden = true;

  if (producto === null) {
    tituloFormulario.textContent = 'Nuevo producto';
    campoNombre.value = '';
    campoCompra.value = 0;
    campoVenta.value = 0;
    btnEliminar.hidden = true;
  } else {
    tituloFormulario.textContent = 'Editar producto';
    campoNombre.value = producto.nombre;
    campoCompra.value = producto.precioCompra;
    campoVenta.value = producto.precioVenta;
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
    precioVenta: parseFloat(campoVenta.value)
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
  if (confirm('¿Eliminar "' + productoEnEdicion.nombre + '"? También se borrarán sus cantidades de todos los días.')) {
    Datos.eliminarProducto(productoEnEdicion.id);
    cerrarFormulario();
    mostrarLista();
  }
});

// ---------- 5. Copiar el pedido del día ----------
// Arma el texto con lo registrado ese día y lo copia, para pegarlo en WhatsApp.
document.getElementById('btnCopiar').addEventListener('click', function () {
  const fecha = campoFecha.value;
  const cantidades = Datos.cantidadesDelDia(fecha);

  const lineas = Datos.listar()
    .filter(function (p) { return cantidades[p.id] > 0; })
    .sort(porNombre)
    .map(function (p) { return cantidades[p.id] + ' ' + p.nombre; });

  if (lineas.length === 0) {
    mostrarAviso('No hay piezas registradas este día.');
    return;
  }

  const total = Datos.totalesDelDia(fecha).piezas;
  const texto = 'Pedido Expendio La Combi (' + formatoFecha(fecha) + ')\n' +
    lineas.join('\n') + '\nTotal: ' + total + ' piezas';

  if (!navigator.clipboard) {
    alert('No se pudo copiar. Este es el pedido:\n\n' + texto);
    return;
  }
  navigator.clipboard.writeText(texto).then(function () {
    mostrarAviso('Pedido copiado (' + plural(lineas.length, 'producto', 'productos') + '). Pégalo en WhatsApp.');
  }).catch(function () {
    alert('No se pudo copiar. Este es el pedido:\n\n' + texto);
  });
});

// ---------- 6. Respaldo ----------
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
  if (!confirm('Esto reemplazará los productos, días y conteos actuales por los del respaldo. ¿Continuar?')) {
    archivoRespaldo.value = '';
    return;
  }
  const lector = new FileReader();
  lector.onload = function () {
    try {
      const resumen = Datos.importar(lector.result);
      mostrarLista();
      alert('Respaldo restaurado: ' + plural(resumen.productos, 'producto', 'productos') + ', ' +
        plural(resumen.dias, 'día', 'días') + ' y ' + plural(resumen.conteos, 'conteo', 'conteos') + '.');
    } catch (error) {
      alert(error.message);
    }
    archivoRespaldo.value = '';
  };
  lector.readAsText(archivo);
});

// ---------- 7. Conteo físico ----------
const hojaConteo = document.getElementById('hojaConteo');
const listaConteo = document.getElementById('listaConteo');
const ayudaConteo = document.getElementById('ayudaConteo');
const resultadoConteo = document.getElementById('resultadoConteo');
const conteoMensaje = document.getElementById('conteoMensaje');
const conteoError = document.getElementById('conteoError');

// Aquí recordamos cada fila de la pantalla: su producto, lo registrado, su cuadro y su aviso.
let filasConteo = [];
// El día al que pertenece el conteo que se está haciendo.
let fechaConteo = '';

// Muestra la diferencia entre lo contado y lo registrado, en esa fila.
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
  const diferencia = contado - fila.registrado;
  if (diferencia === 0) {
    fila.dif.textContent = 'Coincide';
    fila.dif.className = 'dif ok';
  } else {
    fila.dif.textContent = 'Diferencia: ' + (diferencia > 0 ? '+' : '') + diferencia;
    fila.dif.className = 'dif mal';
  }
}

function abrirConteo() {
  fechaConteo = campoFecha.value;
  resultadoConteo.hidden = true;
  conteoMensaje.hidden = true;
  conteoError.hidden = true;
  listaConteo.innerHTML = '';
  filasConteo = [];

  ayudaConteo.textContent = 'Día ' + formatoFecha(fechaConteo) + '. Cuenta las piezas que hay y escríbelas. ' +
    'La app te muestra la diferencia contra lo registrado ese día. Deja en blanco lo que no cuentes.';

  const registrados = Datos.cantidadesDelDia(fechaConteo);
  const productos = Datos.listar().sort(porNombre);

  productos.forEach(function (producto) {
    const registrado = registrados[producto.id] || 0;

    const li = document.createElement('li');
    li.className = 'fila-conteo';

    const datos = document.createElement('div');
    datos.className = 'datos';
    const nombre = document.createElement('div');
    nombre.className = 'nombre';
    nombre.textContent = producto.nombre;
    const textoRegistrado = document.createElement('div');
    textoRegistrado.className = 'registrado';
    textoRegistrado.textContent = 'Registrado: ' + registrado;
    const dif = document.createElement('div');
    dif.className = 'dif';
    datos.appendChild(nombre);
    datos.appendChild(textoRegistrado);
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

    const fila = { producto: producto, registrado: registrado, textoRegistrado: textoRegistrado, input: input, dif: dif };
    input.addEventListener('input', function () {
      conteoError.hidden = true;
      mostrarDiferencia(fila);
    });
    filasConteo.push(fila);
  });

  hojaConteo.hidden = false;
}

// Corrige lo registrado de un producto para que coincida con el conteo. Devuelve true si se pudo.
function ajustarUno(item, boton) {
  const error = Datos.ajustarAlConteo(item.conteo.id);
  if (error !== '') {
    alert(error);
    return false;
  }
  boton.textContent = 'Ajustado ✓';
  boton.disabled = true;
  // Lo registrado cambió, así que actualizamos el "Registrado" de esa fila.
  item.fila.registrado = Datos.cantidadesDelDia(fechaConteo)[item.fila.producto.id] || 0;
  item.fila.textoRegistrado.textContent = 'Registrado: ' + item.fila.registrado;
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
    detalle.className = 'detalle-resultado';
    detalle.textContent = 'Registrado ' + c.registrado + ' · Contado ' + c.contado +
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
  mostrarLista();                      // actualiza las cantidades y los totales
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
    const resultado = Datos.registrarConteo(fechaConteo, f.producto.id, Number(f.input.value));
    if (resultado.conteo.diferencia !== 0) {
      conDiferencia.push({ fila: f, conteo: resultado.conteo });
    }
    f.input.value = '';
    mostrarDiferencia(f);
  });

  // Precisión: de todo lo que se contó, ¿qué porcentaje coincidió?
  const precision = Math.round((contadas.length - conDiferencia.length) / contadas.length * 100);
  conteoMensaje.textContent = 'Se guardaron ' + plural(contadas.length, 'conteo', 'conteos') + ', ' + conDiferencia.length +
    ' con diferencia. Precisión: ' + precision + ' %.';
  conteoMensaje.hidden = false;
  mostrarResultado(conDiferencia);
});

// ---------- 8. Service worker (hace que funcione sin internet) ----------
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

// ---------- 9. Arranque ----------
campoFecha.value = hoy();
mostrarLista();
