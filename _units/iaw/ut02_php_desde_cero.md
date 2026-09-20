---
title: "UT02 · PHP desde cero: estructurada, modular, POO y web"
description: "Aprendizaje progresivo de PHP en Debian: sintaxis, datos, control, funciones, clases, formularios y sesiones. Sin base de datos al inicio."
summary: "Primero escribir y comprender PHP; después integrarlo con HTML, estado web e identidad."
module_key: iaw
cycle_key: asir
order: 2
module_title: "Implantación de Aplicaciones Web"
module_code: "0376"
cycle_title: "Administración de Sistemas Informáticos en Red"
course: "2.º ASIR"
unit: "UT02"
hours: 32
level: "iniciacion"
authors:
  - fjcano
reviewers:
  - fjcano
rights: all-rights-reserved
version: "2.0-reconstruccion-desde-cero"
last_reviewed: 2026-09-21
visibility: public
ra:
  - "RA5"
ce:
  - "RA5.a"
  - "RA5.b"
  - "RA5.c"
  - "RA5.d"
  - "RA5.e"
  - "RA5.f"
  - "RA5.g"
  - "RA5.h"
  - "RA5.i"

tags:
  - php
  - desarrollo-servidor
  - asir
permalink: /docencia/asir/iaw/ut02/
published: true
---

# UT02 · PHP desde cero

> **Plan de 32 h propuesto para revisión de programación.** No confundir con las 24 h de la versión anterior: para una introducción real desde cero y un bloque de POO introductoria se propone reajuste global sin superar 130 h. Si no se aprueba el reajuste, POO y parte de la batería quedarán como ampliación fuera del mínimo lectivo.

**RA5 — Genera documentos Web utilizando lenguajes de guiones de servidor.** La POO se introduce como recurso didáctico para comprender código reutilizable, no como un RA nuevo ni una exigencia externa al currículo.

## Punto de partida y mapa

| Capítulo | Horas propuestas | Evidencia núcleo |
|---|---:|---|
| 1. Introducción/entorno | 3 | Primer PHP desde navegador y terminal |
| 2. Variables y arrays | 5 | Operaciones y datos individuales |
| 3. Estructurada | 6 | Decisiones, iteraciones y tabla dinámica |
| 4. Modular | 5 | Funciones y separación por ficheros |
| 5. POO aplicada | 6 | Objeto Ticket y contrato de notificación |
| 6. Formularios | 4 | Ticket HTML→PHP validado |
| 7. Cookies/sesiones | 3 | Sesión e identidad por navegador |
| **Total** | **32** | **RA5** |


> **Itinerario gradual.** No se presupone experiencia previa en PHP. Se presupone únicamente el repaso HTML/CSS y un formulario HTML con `name`, `action` y `method`. El objetivo es desarrollar las ideas, probarlas y después implantarlas; no copiar una aplicación terminada.

**Problema profesional conductor:** el equipo de sistemas recibe el encargo de implantar *IAW Desk*, una aplicación web sencilla de tickets. No la programaremos entera de golpe: cada capítulo aporta una pieza y deja evidencias verificables.

| Ruta | Papel | Dónde se ejecuta |
|---|---|---|
| VS Code + Remote-SSH | Editor del alumno | VS Code en el PC; ficheros en Debian |
| `php -l`, `php archivo.php` | Comprobaciones CLI | Debian, terminal remota |
| Navegador | Solicita páginas y envía formularios | PC o VM cliente |
| Apache + PHP-FPM | Atiende HTTP y ejecuta PHP web | Debian `IAW-WEB01` |

> **No confundir:** editar por SSH no es enviar el PHP al navegador; PHP se ejecuta en Debian y el navegador recibe HTML. `php -S localhost:8000` puede usarse en una demostración local, pero no sustituye la implantación con Apache y FPM.

**Antes de empezar:** en tu máquina comprueba que `php -v` y `php -l index.php` funcionan; desde el PC comprueba SSH y HTTP al servidor. Si no funciona HTTP, diagnostica red → Apache → PHP-FPM → error PHP; no modifiques código a ciegas.

## Capítulo 1 · De HTML estático a PHP ejecutable (3 h)

**Pregunta inicial:** ¿qué cambia entre `horario.html` y `horario.php` si ambos se ven en el navegador? El HTML es el resultado; PHP puede producirlo dinámicamente antes de enviarlo.

1. Abre la terminal de Debian desde VS Code Remote-SSH y ejecuta `php -v`.
2. En tu proyecto crea `public/01_hola.php`; escribe el ejemplo; prueba sintaxis con `php -l public/01_hola.php`.
3. Abre la ruta HTTP publicada en Apache. No abras el archivo con `file:///`: eso NO ejecuta PHP.
4. Usa «Ver código fuente»: identifica qué fragmentos PHP han desaparecido en la respuesta.

```php
<?php
// Código ejecutado en el servidor: primero sin variables.
echo '<h1>Hola desde IAW</h1>';
echo '<p>Este HTML lo ha generado PHP.</p>';
```

**Sintaxis desde cero:** etiqueta `<?php`, instrucciones terminadas con `;`, comentario `//` y `/* ... */`, `echo`, `print_r`, `var_dump` y errores de sintaxis. En ficheros solo PHP es preferible omitir el cierre `?>` para evitar salida accidental. En plantillas mixtas se usa `<?= ... ?>` para mostrar una expresión.

```php
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>IAW</title></head>
<body>
  <h1>Mi primer PHP</h1>
  <p>Servidor: <?= htmlspecialchars(php_uname('n'), ENT_QUOTES, 'UTF-8') ?></p>
</body>
</html>
```

**Error guiado:** quita un `;`, usa `php -l`, anota síntoma, línea y corrección. Nunca uses un `phpinfo()` público de forma permanente: sirve de diagnóstico temporal y expone detalles del entorno.

**Ejercicios rápidos web:** (1) Genera tres `<p>` con `echo`; (2) alterna HTML/PHP; (3) comenta una línea y predice el resultado; (4) provoca y repara un ParseError; (5) describe el viaje HTTP en seis pasos; (6) compara resultado de `php archivo.php` con el navegador cuando el HTML contiene etiquetas.



### Guion guiado para la primera clase: predicción → ejecución → explicación

Antes de pulsar F5, el alumnado escribe qué espera ver, en qué ordenador se encuentra el fichero y qué programa lo interpreta. La primera práctica NO pide sesiones ni funciones. El profesor enseña simultáneamente tres vistas: el editor remoto, la terminal del servidor con `php -l` y el navegador del cliente con el resultado.

```text
Servidor Debian
  /srv/iaw/php/public/01_hola.php
        ↓ petición HTTP
Apache → PHP-FPM → salida HTML
        ↓ respuesta HTTP
Navegador del equipo del alumno
```

**Revisión paso a paso:** ¿Se ve el código literal `<?php`? Comprobar si la ruta se abrió como `file:///`, si Apache sirve `.php` sin FPM o si se trata de un archivo de texto. ¿Se muestra una página blanca? Comprobar `php -l`, respuesta HTTP y log; no adivinar a partir del aspecto. ¿Se ve HTML pero no el valor esperado? Inspeccionar las variables y el recorrido de ejecución.

**Antes de avanzar:** cada alumno debe poder explicar qué son `echo`, `;`, comentarios, qué significa extensión `.php` y por qué «Ver código fuente» muestra el resultado pero no la lógica. No instalar extensiones VS Code como sustituto de PHP: el editor colorea sintaxis, el intérprete ejecuta instrucciones y Apache publica la respuesta.

## Capítulo 2 · Variables, tipos y expresiones (5 h)

**Motivación:** un ticket contiene nombre, prioridad y tiempo estimado; para transformarlos necesitamos datos y operaciones. Una variable representa un valor, no una pantalla ni una sesión.

```php
<?php
$puesto = 7;                // int
$nombre = 'Cano';         // string
$precioHora = 18.50;      // float
$urgente = false;         // bool
$sinAsignar = null;       // null
$importe = 2 * $precioHora;
echo "$nombre · puesto $puesto · total: $importe €";
```

**Se estudia en este orden:** nombres y `$`; asignación y reasignación; tipos `int`, `float`, `string`, `bool`, `null`; `gettype` / `var_dump`; comillas simples/dobles y concatenación con `.`; operadores `+`, `-`, `*`, `/`, `%`, `**`, `+=`; comparaciones `===` y `!==` sin confundirlas con `=`; casting explícito; constantes `const` y `define` cuando corresponda.

```php
<?php
const IVA = 0.21;
$base = 52.00;
$total = $base * (1 + IVA);
echo number_format($total, 2, ',', '.') . ' €';
```

### Arrays: nuestra primera colección

```php
<?php
$prioridades = ['baja', 'media', 'alta'];
$ticket = [
    'codigo' => 'IAW-07',
    'asunto' => 'No carga la web',
    'prioridad' => 'alta',
];
echo $ticket['asunto'];
```

Explica **array indexado frente a asociativo**, clave/valor, acceso e índice inexistente; `count`, `in_array`, `array_keys`, `array_values`, `isset` y `??`. Introduce la diferencia entre cadena `'7'` y entero `7`: no confíes en conversiones implícitas cuando la intención sea numérica.

**Ejercicios rápidos web:** (1) salario con horas; (2) segundos → horas y minutos; (3) factura con IVA; (4) concatenar nombre/apellido; (5) tres notas y media; (6) porcentaje de ocupación; (7) acceder a un ticket asociativo; (8) añadir un módulo a un array; (9) explicar `=`, `==`, `===`; (10) comprobar `null` con `??`.

**Control de calidad:** explica con tus palabras el resultado antes de ejecutar; usa `var_dump` en desarrollo, no como interfaz de usuario.



### Ejemplo guiado desde una situación cotidiana

Un alumno conoce su número de puesto y cuántas horas tardaría en resolver una incidencia. Construye primero una frase estática. Después sustituye cada dato cambiante por una variable y la frase continúa teniendo sentido aunque varíen los valores.

```php
<?php
$puesto = 7;
$horas = 3;
$tarifa = 22.5;
$total = $horas * $tarifa;

// Primero operación; después representación.
echo '<p>IAW-' . $puesto . ': ' . $total . ' €</p>';
```

**Recorrido de valores:** al ejecutar `$horas = 3`, la variable contiene 3; tras `$horas = $horas + 1`, contiene 4. La asignación no expresa igualdad matemática: calcula el lado derecho y guarda el resultado a la izquierda. `var_dump($horas)` ayuda a verificar este cambio.

**Tipos y operaciones:** `2 + 3` suma números; `'2' . '3'` une cadenas; `'2' + 3` puede convertirse implícitamente, pero para entrada humana validaremos y convertiremos de forma controlada. La precisión de `float` puede no ser exacta en cálculos monetarios complejos: para estas prácticas solo trabajamos importes didácticos y mostramos dos decimales.

**Arrays en cuatro pasos:** se escribe una lista de prioridades, se accede al primer elemento `[$indice]`, se recorre con `foreach`, se construye un ticket con claves explícitas y se accede mediante `['asunto']`. No mezcles la posición 0 de un array indexado con la clave `'0'` o con el identificador SQL del ticket.

**Pregunta de salida:** en `$ticket['codigo'] ?? 'sin código'`, ¿qué parte representa una clave? ¿Qué ocurre al añadir `['estado'=>'abierto']`? Justifica el resultado antes de usar `print_r`.

## Capítulo 3 · Programación estructurada: decisiones y bucles (6 h)

**Motivación:** con variables ya representamos un ticket; ahora decidimos qué hacer según la prioridad y repetimos trabajo para listas. Cada estructura se aprende con entrada fija antes de formularios.

```php
<?php
$prioridad = 'alta';
if ($prioridad === 'alta') {
    echo 'Resolver hoy';
} elseif ($prioridad === 'media') {
    echo 'Planificar';
} else {
    echo 'Seguimiento normal';
}
```

**Conceptos:** `if/elseif/else`, `switch`, `match` (después de `switch`, no antes), `&&`, `||`, `!`, cortocircuito y comparación estricta; `for`, `while`, `do ... while`, `foreach` (valor y clave), `break` y `continue`; bucles infinitos y condiciones de parada.

```php
<?php
$tickets = [
  ['id' => 1, 'estado' => 'abierto'],
  ['id' => 2, 'estado' => 'cerrado'],
  ['id' => 3, 'estado' => 'abierto'],
];
$abiertos = 0;
foreach ($tickets as $ticket) {
    if ($ticket['estado'] === 'abierto') {
        $abiertos++;
    }
}
echo "Abiertos: $abiertos";
```

**Generación de tabla HTML con `foreach`:** recuperamos la tabla del horario sin repetir 30 filas manuales. El valor mostrado se escapará con `htmlspecialchars` cuando proceda de una entrada o fuente no fiable.

**Ejercicios rápidos web:** (1) determinar par/impar; (2) clasificar temperatura; (3) mayor de tres valores; (4) tabla de multiplicar; (5) suma 1..N; (6) factorial iterativo; (7) primos en un rango; (8) mostrar ticket por prioridad; (9) contar estados de un array; (10) tabla HTML por `foreach`; (11) localizar primer error en array; (12) corregir bucle infinito. **Ampliación:** problema de cambio de moneda con tarifa fija suministrada, sin presentarla como cotización actual.

**Prueba explicada:** con `N=1`, `N=0`, `N=10`, demuestra dónde se inicia, cuándo termina y qué pasa si está vacío el array.



### Paso a paso: de un cálculo a una decisión y a una lista

1. **Condición simple:** dado un valor de prioridad fijo, decidir si es alta; probar también el caso falso.
2. **Dos alternativas:** incorporar `else`; hacer explícito qué salida corresponde al caso no urgente.
3. **Tres alternativas:** `elseif`; mover un caso a `switch` y comparar legibilidad.
4. **Repetición:** usar `for` para números consecutivos y `foreach` para tickets ya almacenados en un array.
5. **Acumulador:** inicializar `$abiertos = 0` antes del bucle, incrementarlo solo en la rama correcta y comprobar el total después.

La condición de `for` se evalúa antes de cada vuelta. En `while`, el alumno debe identificar qué instrucción cambia la variable implicada: si no cambia, puede aparecer un bucle infinito. `foreach` no requiere gestionar manualmente un índice para recorrer un array. Si el array está vacío, el cuerpo no se ejecuta y el acumulador conserva el valor inicial.

```php
<?php
$notas = [6, 8, 5];
$suma = 0;
foreach ($notas as $nota) {
    $suma += $nota;
}
$media = count($notas) > 0 ? $suma / count($notas) : null;
```

**Error frecuente:** calcular la media dentro del bucle o dividir por cero cuando el array está vacío. **Depuración guiada:** crear una tabla en papel con columnas vuelta, `$nota`, `$suma` y comprobar la salida. Después trasladar la misma tabla a un HTML visible para el usuario.

**No adelantar formularios:** cuando el enunciado antiguo dice «leer un número por teclado», en este capítulo significa una variable PHP de entrada fija. El formulario aparecerá en el capítulo 6 y permitirá reutilizar, no rehacer, la solución.

## Capítulo 4 · Programación modular: funciones y ficheros (5 h)

**Motivación:** si calculamos la prioridad en cinco páginas, copiar el mismo bloque crea cinco posibles errores. Una función encapsula una responsabilidad y devuelve un resultado.

```php
<?php
declare(strict_types=1);
function calcularImporte(float $horas, float $tarifa): float {
    return $horas * $tarifa;
}
echo calcularImporte(2.5, 20.0);
```

**Orden:** definir y llamar; parámetro y argumento; `return` frente a `echo`; tipos de parámetros y retorno; ámbito local; parámetros opcionales; valor y referencia (solo tras entender valores); refactorizar repetición; funciones puras y pruebas de casos.

```php
<?php
declare(strict_types=1);
function etiquetaPrioridad(string $prioridad): string {
    return match ($prioridad) {
        'alta' => 'Urgente',
        'media' => 'Planificable',
        default => 'Normal',
    };
}
```

### De una función a una estructura modular

```text
iaw-desk/
├── public/
│   └── index.php
├── src/
│   └── tickets.php
└── templates/
    └── lista.php
```

En `public/index.php`: `require_once __DIR__ . '/../src/tickets.php';` y después una plantilla sencilla. Explica **`include` vs `require`**, `__DIR__`, rutas relativas, separación lógica/vista y por qué `src/` debe permanecer fuera del `DocumentRoot`.

**Ejercicios rápidos web:** (1) `esPar(int): bool`; (2) `areaCirculo(float): float`; (3) `calcularIVA(float): float`; (4) `esPrimo(int): bool`; (5) `contarAbiertos(array): int`; (6) `formatearCodigo(int): string`; (7) separar la calculadora en funciones; (8) incorporar `require_once`; (9) crear pruebas con entradas límite; (10) mover HTML a plantilla sin perder el flujo.



### Escalera de modularidad: lo mismo tres veces, pero cada vez mejor

**Primero**, cálculo repetido dentro del fichero; **segundo**, función que recibe parámetros y devuelve el dato; **tercero**, separar función de presentación y cargarla desde `public/index.php`. Se pide al alumno detectar qué cambia si se modifica una tarifa, una regla de prioridad o la estructura HTML.

```php
<?php
declare(strict_types=1);
function totalServicio(float $horas, float $tarifa): float {
    if ($horas < 0 || $tarifa < 0) {
        throw new InvalidArgumentException('No se permiten negativos');
    }
    return $horas * $tarifa;
}
```

Una función que devuelve el número permite mostrarlo como tabla HTML, imprimirlo en CLI o utilizarlo en otro cálculo. Si una función produce directamente HTML con `echo`, pierde parte de esa reutilización. **No significa que `echo` sea erróneo**: significa que salida y cálculo tienen responsabilidades distintas.

```php
<?php
// public/index.php
require_once __DIR__ . '/../src/calculos.php';
$importe = totalServicio(3.0, 22.5);
require __DIR__ . '/../templates/resumen.php';
```

**Pruebas manuales:** `totalServicio(0, 20)` devuelve 0; `totalServicio(2, 20)` devuelve 40; `totalServicio(-1, 20)` genera la excepción prevista. La excepción se usa como ejemplo controlado, no se vuelca una traza al usuario de producción. Una función pequeña con nombre descriptivo es más fácil de contrastar individualmente que una página de 200 líneas que hace todo.

## Capítulo 5 · Primeros pasos en POO sin frameworks (6 h)

**Por qué POO aquí:** queremos que el alumnado pueda leer una clase propia, entender objetos de bibliotecas como `PDO` y no ver los CMS/frameworks como magia. **No sustituimos el módulo de Programación:** esto es una introducción aplicada y recuperaremos POO al adaptar CMS.

**Primero:** objeto real (un ticket) → estado (`asunto`, `prioridad`) → comportamiento (`cerrar`); clase vs objeto; propiedades y métodos; constructor; `$this`; visibilidad `private/public`; encapsulación.

```php
<?php
declare(strict_types=1);
final class Ticket {
    private bool $cerrado = false;

    public function __construct(
        private int $id,
        private string $asunto,
        private string $prioridad
    ) {}

    public function cerrar(): void { $this->cerrado = true; }
    public function estaCerrado(): bool { return $this->cerrado; }
    public function resumen(): string {
        return "#{$this->id} {$this->asunto}";
    }
}

$ticket = new Ticket(7, 'No carga Apache', 'alta');
$ticket->cerrar();
echo $ticket->resumen();
```

**Luego, solo cuando dominan una clase:** relación «es un» frente a «tiene un», herencia con `extends`, interfaz como contrato (`implements`), separación de responsabilidades. Prioriza composición y clases pequeñas antes que herencias profundas.

```php
<?php
interface Notificador {
    public function enviar(string $mensaje): void;
}
final class NotificadorPantalla implements Notificador {
    public function enviar(string $mensaje): void {
        echo htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8');
    }
}
```

**Autoload/Composer:** mostrar qué problema resuelven; no exigir un proyecto Laravel antes de entender una clase propia.

**Ejercicios rápidos web:** (1) clase `Modulo` con nombre y horas; (2) clase `Ticket` con cerrar/reabrir; (3) constructor que rechaza asunto vacío; (4) método que devuelve HTML escapado; (5) clase `Usuario` con rol; (6) colección de objetos Ticket y conteo; (7) interfaz `Notificador`; (8) dos implementaciones de notificación; (9) refactorizar funciones globales hacia un servicio sencillo; (10) diagrama de responsabilidades y qué no debe conocer la clase.



### Secuencia de POO para no aprender palabras vacías

**Fase A — sin herencia.** Pide al alumno escribir en una hoja «ticket 7, asunto: Apache caído, estado: abierto»; pregúntale qué datos son estado y qué acciones se pueden realizar. Solo entonces presenta `class Ticket`, `new Ticket(...)`, propiedades y métodos. Dos objetos de la misma clase deben poder contener valores diferentes.

**Fase B — encapsulación.** Si `$ticket->estado = 'cualquier cosa'` fuese permitido, el programa aceptaría estados imposibles. Oculta la propiedad con `private` y crea un método de cambio que limite los valores. Explica `$this` como la instancia actual, nunca como variable del navegador.

**Fase C — responsabilidad.** `Ticket` entiende su estado, pero no debería abrir una conexión de base de datos ni imprimir la cabecera HTML. Introduce `TicketRepository` como nombre de una responsabilidad que ampliaremos en UT03. Antes de usar una clase como PDO el alumno ya habrá utilizado un objeto propio.

**Fase D — contrato.** Una interfaz `Notificador` define qué operación está disponible; las implementaciones cambian el destino sin cambiar el código que usa la interfaz. Herencia (`extends`) se presenta con un ejemplo pequeño para reconocerla, no como obligación de utilizarla por todas partes.

**Prueba de comprensión:** ¿Cuál es la diferencia entre `Ticket` y `$ticket1`? ¿Qué hace `new`? ¿Por qué el método `cerrar()` puede ser `public` mientras la propiedad `$cerrado` permanece `private`? ¿Cuándo sería excesivo crear 12 clases para una página de dos operaciones?

## Capítulo 6 · Formularios, GET/POST y validación (4 h)

**Ahora recuperamos el formulario de HTML realizado antes del PHP.** No se introduce `$_POST` antes de que la persona conozca variables, arrays y condicionales: `$_POST` es un array asociativo con los campos enviados de forma habitual por un formulario `method="post"`.

```html
<form method="post" action="procesar.php">
  <label for="nombre">Nombre</label>
  <input id="nombre" name="nombre" required>
  <button type="submit">Enviar</button>
</form>
```

```php
<?php
$nombre = trim($_POST['nombre'] ?? '');
if ($nombre === '') {
    http_response_code(422);
    echo 'Falta el nombre';
    exit;
}
echo htmlspecialchars($nombre, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
```

**Línea por línea:** ruta `action`, verbo `method`, clave `name`, GET en URL frente a POST en el cuerpo, `$_SERVER['REQUEST_METHOD']`, `??`, `trim`, validación en servidor, salida HTML escapada, estados HTTP y `header('Location: ...', true, 303); exit;` (solo tras procesar POST correctamente).

**Seguridad sin ruido:** `required` es comodidad del navegador, no defensa. `POST` no significa cifrado: para confidencialidad se requiere HTTPS. No confundas escapar HTML con validar negocio ni con parametrizar SQL.

**Ejercicios rápidos web:** (1) recuperar `nombre`; (2) leer radio y select; (3) checkbox ausente; (4) GET como filtro; (5) validar nota 0..10; (6) validar prioridad entre valores permitidos; (7) escapar `&`, `<`, comillas; (8) recuperar valores tras error; (9) separar formulario y procesador; (10) reto ticket personalizado `IAW-NN`.



### El recorrido de una petición con datos reales

El alumno tiene `formulario.html` y `procesar.php`. Primero abre solo el formulario, indica qué controles se enviarán, pulsa y comprueba el resultado en el procesador. Luego añade el método incorrecto y observa que el servidor rechaza GET donde espera POST.

```php
<?php
// procesar.php, fragmento explicativo
$asunto = trim($_POST['asunto'] ?? '');
$prioridad = $_POST['prioridad'] ?? '';
$validas = ['baja', 'media', 'alta'];
if ($asunto === '' || !in_array($prioridad, $validas, true)) {
    http_response_code(422);
    exit('Corrige los datos del formulario');
}
```

**Tres pruebas imprescindibles:** (a) envío correcto, (b) asunto vacío, (c) prioridad inventada editando el HTML local del navegador. `required` solo ayuda con (b) en uso normal; no impide (c) ni sustituye la comprobación de servidor.

**Salida segura:** la cadena `<b>prueba</b>` puede ser contenido del ticket y debe mostrarse como texto cuando no es HTML que nosotros controlamos. Aplicar `htmlspecialchars(..., ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')` en el contexto de texto/atributo HTML adecuado; no confundirlo con validación de email ni con seguridad SQL.

**Para el profesor:** abrir DevTools → Network y señalar Request Method, Request Payload/Form Data y Response; comparar GET y POST sin explicar que POST es secreto. Identificar por qué el campo `id` conecta label/control y `name` se convierte en clave enviada al servidor.

## Capítulo 7 · Estado web: cookies, sesiones e identidad (3 h)

**Pregunta:** un segundo HTTP GET no «recuerda» por sí solo los valores PHP de la petición anterior. Ahora sí está justificado presentar mecanismos de estado: cookie en el navegador, sesión gestionada por el servidor, BBDD para persistencia duradera (siguiente UT).

```php
<?php
session_start();
$_SESSION['visitas'] = ($_SESSION['visitas'] ?? 0) + 1;
echo 'Visitas: ' . $_SESSION['visitas'];
```

**Escalera:** estado en URL → cookie de preferencia (no secreto) → sesión (identificador en cookie + datos de sesión en servidor) → login y logout → aislamiento (un usuario no consulta datos de otro por cambiar `?user=...`).

**Funciones:** `setcookie` antes de salida, `$_COOKIE`, `session_start`, `$_SESSION`, `session_regenerate_id(true)` tras login, `unset`, cierre y `session_destroy` con borrado de cookie si corresponde. **Nunca guardes contraseñas ni hashes de contraseña en cookies de preferencias.** Para comprobación de contraseñas usa `password_hash` y `password_verify` en el bloque de identidad más avanzado.

**Ejercicios rápidos web:** (1) contador de sesión; (2) color de tema en cookie; (3) visita tras cerrar navegador; (4) dos navegadores y dos sesiones; (5) login de demostración con cuentas de prueba; (6) logout; (7) impedir consulta de notas ajenas; (8) explicar qué sí persistirá tras reiniciar Apache y qué no se debe presumir.

> **Cierre RA5:** demostrar código claro, formulario validado, sesión e identidad aislada. La siguiente UT introduce una base de datos para que los tickets sobrevivan a las peticiones sin depender solo de la sesión.


### Línea temporal: tres peticiones distintas y una identidad

Primera visita: no hay sesión de la aplicación; PHP puede crearla y enviar al navegador un identificador de sesión en una cookie. Segunda petición: el navegador devuelve ese identificador y PHP recupera los datos correspondientes del lado del servidor. Tercera petición desde ventana privada: normalmente una cookie diferente, por tanto otra sesión. La sesión no representa por sí sola una cuenta autenticada: necesitamos verificar las credenciales y asociar una identidad validada.

```php
<?php
// Esquema tras una autenticación CORRECTA ya verificada.
session_start();
session_regenerate_id(true);
$_SESSION['usuario'] = [
    'id' => 7,
    'nombre' => 'alumno07',
    'rol' => 'usuario',
];
```

**Cookies:** sirven, entre otros usos, para preferencias. `setcookie` envía una cabecera de respuesta; el valor llegará en peticiones posteriores. No asumir que el navegador conserva una cookie hasta la fecha prevista en cualquier configuración de privacidad. **Sesiones:** `$_SESSION` no es una base de datos; su configuración y almacenamiento pueden variar, y «cerrar pestaña» no equivale a ejecutar `session_destroy()` en el servidor.

**Autorizar no es autenticar:** saber quién eres no concede permiso para leer cualquier `?id=...`. El usuario de sesión es la fuente de identidad; el identificador de recurso solicitado es un dato que debe comprobarse contra su propietario. Este principio pasará literalmente a `WHERE id=:id AND owner_id=:owner` en UT03.

## Prácticas y evaluación del bloque

Las actividades breves anteriores son **banco de entrenamiento público**. Las entregas integradoras (sin soluciones en la web), con variantes por número de puesto, casos de prueba y defensa, van en PDF del aula virtual. Cada alumno: `NN` = puesto con dos cifras; ejemplo `07`, prefijo `IAW-07`, formulario con `puesto=07`, nombre del proyecto `desk07`. No cambia la dificultad, solo la identidad/datos.

| Instrumento | Evidencia orientativa RA5 |
|---|---|
| Pruebas breves | Sintaxis, variables, control, funciones, clases básicas |
| Laboratorio | Código operativo en Apache + PHP-FPM |
| Prácticas | Formularios, sesión, validación y aislamiento |
| Defensa | Explicar recorrido HTTP, errores y responsabilidades |

**Lecturas:** [Sintaxis PHP](https://www.php.net/manual/es/language.basic-syntax.php), [tipos](https://www.php.net/manual/es/language.types.php), [estructuras de control](https://www.php.net/manual/es/language.control-structures.php), [funciones](https://www.php.net/manual/es/language.functions.php), [clases](https://www.php.net/manual/es/language.oop5.php), [sesiones](https://www.php.net/manual/es/book.session.php), [seguridad OWASP: XSS](https://owasp.org/www-community/attacks/xss/).

**Secuencia siguiente:** [UT03 · PHP y BBDD](/docencia/asir/iaw/ut03/). La lectura de formularios y sesiones sigue siendo competencia previa antes de introducir PDO.
