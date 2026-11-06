---
title: "UT02 · Introducción a PHP: de los primeros programas a una aplicación web"
description: "PHP desde cero en IAW: formularios y validación, funciones incorporadas y propias, modularidad, POO, ficheros y subidas seguras, cookies, sesiones, autenticación y correo con PHPMailer."
summary: "Del primer script a una aplicación web con estado: entrada HTTP, built-ins, funciones propias, objetos, persistencia ligera, autenticación, ficheros seguros y notificaciones por correo."

module_key: iaw
cycle_key: asir
order: 2

module_title: "Implantación de Aplicaciones Web"
module_code: "0376"
cycle_title: "Administración de Sistemas Informáticos en Red"
course: "2.º ASIR"
unit: "UT02"
level: "iniciacion-intermedio"

authors:
  - fjcano

reviewers:
  - fjcano

rights: all-rights-reserved
version: "4.3"
last_reviewed: 2026-11-04
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
  - servidor
  - programacion-estructurada
  - arrays
  - formularios
  - http
  - validacion
  - funciones-incorporadas
  - funciones
  - callbacks
  - modularidad
  - poo
  - ficheros
  - subidas
  - persistencia
  - json
  - cookies
  - sesiones
  - autenticacion
  - autorizacion
  - csrf
  - seguridad
  - composer
  - phpmailer
  - email
  - asir

permalink: /docencia/asir/iaw/ut02/
published: true

toc:
  - title: Qué aprenderás
    id: objetivos
  - title: Dónde y cómo ejecutamos PHP
    id: entorno
  - title: Primer programa
    id: primer-php
  - title: Variables y tipos
    id: variables
  - title: Cadenas y operadores
    id: operadores
  - title: Condiciones paso a paso
    id: condiciones
  - title: Repeticiones y bucles
    id: bucles
  - title: Arrays y foreach
    id: arrays
  - title: Entrada de datos y formularios
    id: formularios
  - title: Funciones incorporadas
    id: builtins
  - title: Funciones propias y procedimientos
    id: funciones
  - title: Organizar varios archivos
    id: modularidad
  - title: Métodos y POO
    id: poo
  - title: Persistencia, logs y ficheros seguros
    id: ficheros
  - title: Cookies, sesiones y autenticación
    id: estado
  - title: Correo electrónico con PHPMailer
    id: email
  - title: Ejercicios progresivos
    id: ejercicios
  - title: Diagnóstico y buenas prácticas
    id: diagnostico
  - title: Glosario y referencias
    id: fuentes
---

## Qué aprenderás {#objetivos}

Una página HTML es un documento que el navegador interpreta y muestra. Una aplicación web puede necesitar **calcular un precio, escoger qué contenido mostrar, procesar los datos de un formulario o recordar qué usuario ha iniciado sesión**. PHP permite desarrollar esa lógica en el servidor.

En esta unidad aprenderemos PHP desde sus elementos más sencillos. No es necesario haber programado antes en PHP; sí conviene recordar la estructura básica de HTML y los atributos `name`, `action` y `method` de los formularios. Comenzaremos con valores escritos directamente en el código; después aprenderemos a recibir información, primero desde la terminal como contraste y, sobre todo, mediante formularios HTTP. A continuación reutilizaremos esa lógica mediante funciones y, más adelante, mediante métodos de objetos sencillos.

**Resultado de aprendizaje relacionado: RA5 — Genera documentos web utilizando lenguajes de guiones de servidor.** Los criterios de evaluación vinculados a la unidad se identifican en el frontmatter. La programación orientada a objetos se introduce aquí como una herramienta para comprender bibliotecas y aplicaciones PHP; no supone un resultado de aprendizaje adicional.

![Camino de aprendizaje: primer PHP, datos, decisiones, bucles, colecciones, funciones, objetos y web]({{ '/assets/docencia/iaw/ut02/01_ruta_aprendizaje.png' | relative_url }})

**Método de trabajo.** En cada apartado encontraremos una pregunta inicial, un ejemplo corto explicado línea a línea, una prueba de escritorio (predecir el resultado), ejercicios graduados y una comprobación de lo aprendido. Una vez dominados esos elementos los utilizaremos juntos para desarrollar una aplicación sencilla de gestión de incidencias, *IAW Desk*.

> **Distingue dos cosas:** aprender la sintaxis de PHP y aprender a implantar una aplicación PHP. En IAW necesitamos ambas, pero avanzaremos de la primera a la segunda de manera gradual.
{: .notice--info}

### Puente hacia el Proyecto 1

Esta UT prepara varias piezas que después serán obligatorias en el proyecto PHP:

| Necesidad del proyecto | Dónde se prepara |
|---|---|
| Recibir, normalizar y validar datos | formularios y funciones incorporadas |
| Organizar lógica reutilizable | funciones propias y modularidad |
| Autenticación, roles y estado | cookies, sesiones y autorización |
| Protección CSRF | sesión + token + `hash_equals()` |
| Subida segura de ficheros | `$_FILES`, MIME real, tamaño y renombrado |
| Logs y diagnóstico | ficheros, `error_log()` y separación usuario/técnico |
| Correo electrónico | PHPMailer como integración complementaria |

> **Todavía no implementamos aquí todo el Proyecto 1.** PDO, CRUD persistente, búsqueda/paginación real, transacciones y auditoría vinculada a la base de datos se consolidarán en la UT03 con MariaDB. Esta separación evita mezclar demasiadas capas antes de dominar cada una.
{: .notice--warning}

---

## 1. Dónde y cómo ejecutamos PHP {#entorno}

### 1.1. Cliente, servidor y lenguaje del lado servidor

Imagina que escribimos en el navegador la dirección de una página llamada `hola.php`. El navegador **no interpreta las instrucciones PHP**. Realiza una petición HTTP al servidor web; allí se ejecuta PHP, se genera una respuesta y el navegador muestra el contenido recibido.

![Recorrido de una petición PHP, desde el navegador al servidor y de vuelta]({{ '/assets/docencia/iaw/ut02/02_peticion_php.png' | relative_url }})

| Elemento | Responsabilidad |
|---|---|
| Navegador | Solicita la página y representa el HTML recibido. |
| Apache | Recibe la petición HTTP y selecciona el sitio o recurso solicitado. |
| PHP-FPM | Ejecuta el programa PHP cuando Apache le deriva la petición. |
| Archivo `.php` | Contiene las instrucciones que escribimos. Está almacenado en el servidor. |
| HTML resultante | Es el contenido que recibirá el navegador. |

JavaScript ejecutado en el navegador y PHP ejecutado en el servidor **pueden colaborar**, pero no son equivalentes. El código PHP no debería enviarse al cliente como texto. Si abres una dirección HTTP y se muestran las etiquetas `<?php` literalmente, detén la práctica: hay un problema en la configuración del servidor.

### 1.2. Cómo trabajamos con VS Code

El entorno habitual del laboratorio separa el equipo desde el que desarrollamos y el servidor que ejecuta nuestra aplicación:

```text
Equipo del alumno (Windows o Linux con escritorio)
├── VS Code + extensión Remote - SSH
└── Navegador web
          │
          ├── SSH ───> Debian: editar los ficheros PHP
          └── HTTP ──> Apache: solicitar los resultados

Debian de trabajo (IAW-WEB01)
├── OpenSSH
├── Apache
├── PHP-FPM
└── /srv/iaw/php/public/      ← archivos publicados
```

**Remote - SSH** abre en VS Code una carpeta que está realmente en Debian. Guardar en el editor modifica el archivo del servidor; no es necesario subirlo manualmente mediante FTP después de cada cambio.

Antes de utilizar la extensión verifica la conexión SSH desde el equipo cliente. Sustituye `alumno` por tu usuario y la IP por la que tenga tu máquina Debian:

```bash
ssh alumno@192.168.60.10
```

Después, en VS Code, utiliza `Ctrl + Shift + P` → `Remote-SSH: Connect to Host…` → `alumno@192.168.60.10` → `File > Open Folder`. El servidor remoto necesita OpenSSH y los requisitos habituales de VS Code Server. La [documentación oficial de Remote - SSH](https://code.visualstudio.com/docs/remote/ssh) explica el procedimiento detallado.

### 1.3. Carpeta pública y código interno

Usaremos una estructura sencilla que podrá ampliarse posteriormente:

```text
/srv/iaw/php/
├── public/          ← DocumentRoot del sitio Apache
│   ├── 01_hola.php
│   └── index.php
├── src/             ← funciones y clases reutilizables
└── templates/       ← fragmentos HTML/PHP para presentación
```

Solo `public/` debe quedar expuesto a HTTP. La carpeta `src/` contiene código que se carga desde otros archivos PHP, pero **no se consulta directamente desde el navegador**. El VirtualHost y la integración de Apache con PHP-FPM se estudian y preparan en la [UT01]({{ '/docencia/asir/iaw/ut01/' | relative_url }}).

En un laboratorio donde el servidor ya está configurado, las comprobaciones más útiles son:

```bash
php -v                  # Versión de PHP disponible en la terminal
php -m                  # Extensiones cargadas para PHP CLI
systemctl status apache2
systemctl status php8.4-fpm  # En Debian 13 con el paquete PHP 8.4
```

`php -v` describe el intérprete de la terminal (**CLI**); no basta por sí solo para demostrar que Apache y PHP-FPM estén funcionando. El nombre concreto del servicio FPM debe comprobarse según la versión instalada. Un `php -S localhost:8000 -t public` permite hacer una prueba local controlada, pero el [servidor integrado de PHP está destinado a desarrollo y demostraciones, no a producción](https://www.php.net/manual/es/features.commandline.webserver.php).

> **Para comenzar a programar, el laboratorio debe estar preparado.** No confundas un error de SSH, de Apache, de permisos o de PHP-FPM con un error de sintaxis del programa que estás aprendiendo a escribir.
{: .notice--warning}

---

## 2. Tu primer programa PHP {#primer-php}

### 2.1. Una instrucción, un resultado

Crea el archivo `public/01_hola.php` y escribe exactamente:

```php
<?php

echo 'Hola desde PHP';
```

**Qué significa cada elemento:**

| Elemento | Explicación |
|---|---|
| `<?php` | Indica dónde comienzan las instrucciones PHP. |
| `echo` | Envía texto al resultado que se va a mostrar. |
| `'Hola desde PHP'` | Es una cadena de texto o *string*. |
| `;` | Finaliza esta instrucción. |

Guarda el archivo. En la terminal remota, desde la raíz de tu proyecto, comprueba la sintaxis:

```bash
php -l public/01_hola.php
```

Después ábrelo mediante la URL HTTP del sitio que publicó Apache, por ejemplo `http://php07.iaw.test/01_hola.php` si ese nombre está configurado para tu laboratorio. **No utilices `file:///…/01_hola.php`**: abrir un fichero local directamente en el navegador no ejecuta PHP.

El resultado visible será:

```text
Hola desde PHP
```

Si aparece una página en blanco o un mensaje de error, no avances todavía: comprueba que has guardado el archivo, que la URL corresponde al `DocumentRoot` correcto y que `php -l` no comunica errores de sintaxis.

### 2.2. Varias instrucciones y comentarios

```php
<?php

// Primera línea de salida.
echo 'Buenos días';
echo '<br>';

/*
   Este comentario puede ocupar
   varias líneas.
*/
echo 'Estoy aprendiendo PHP';
```

`echo '<br>';` escribe una etiqueta HTML para que, **al interpretarse como HTML en el navegador**, el siguiente texto aparezca en otra línea. Si ejecutas el mismo archivo con `php public/01_hola.php` desde la terminal, verás texto y etiquetas: la terminal no representa HTML como un navegador.

**Prueba de escritorio:** antes de ejecutar, escribe qué tres fragmentos emitirá PHP y cuáles no aparecerán por ser comentarios.

### 2.3. HTML y PHP en un mismo fichero

La extensión `.php` permite escribir HTML normal junto a pequeños fragmentos ejecutados en el servidor:

```php
<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mi primera página PHP</title>
</head>
<body>
    <h1>Mi primera página dinámica</h1>
    <p><?php echo 'Generado en el servidor'; ?></p>
</body>
</html>
```

El documento completo sigue siendo HTML. La etiqueta `<?php` cambia temporalmente a código PHP y `?>` permite volver al HTML. Si el archivo contiene **solo código PHP**, habitualmente se omite el cierre final `?>` para evitar generar espacios o líneas en blanco accidentalmente.

### 2.4. Qué ocurre cuando hay un error

Prueba **intencionadamente** este fragmento en una copia:

```php
<?php

echo 'Texto sin terminar'
```

Ejecuta `php -l archivo.php`. La herramienta señalará el problema; falta `;` al terminar la instrucción. Corrígelo, vuelve a ejecutar el comprobador y solo después consulta el navegador.

**Ejercicios 2.1–2.5.** Crea un saludo con tu nombre y número de puesto; genera tres párrafos; cambia el título HTML; explica por qué la terminal muestra `<p>` mientras el navegador lo representa; provoca y corrige un error por falta de `;`. El objetivo es distinguir **editor, intérprete y navegador**.

---

## 3. Variables, asignación y tipos {#variables}

### 3.1. ¿Por qué necesitamos variables?

Si necesitamos calcular el precio de distintas intervenciones, escribir siempre un número fijo dentro de la fórmula nos obliga a modificar el programa cada vez. Una **variable** permite asignar un nombre a un valor y reutilizarlo.

```php
<?php

$horas = 3;
$tarifa = 20;

$total = $horas * $tarifa;

echo $total;
```

**Lectura línea a línea:**

1. `$horas = 3;` guarda el valor `3` en la variable `horas`.
2. `$tarifa = 20;` guarda `20` en otra variable.
3. `$total = $horas * $tarifa;` multiplica los valores y almacena `60`.
4. `echo $total;` produce el resultado `60`.

La instrucción `=` se llama **asignación**: calcula el lado derecho y guarda el resultado en la variable del lado izquierdo. No equivale a plantear una igualdad matemática.

![Cómo cambia el contenido de una variable al asignarle y actualizarle un valor]({{ '/assets/docencia/iaw/ut02/03_asignacion.png' | relative_url }})

### 3.2. Reasignación: el valor puede cambiar

```php
<?php

$horas = 3;
$horas = 4;

echo $horas; // 4
```

En el segundo paso se sustituye el valor anterior. El mismo razonamiento permite aumentar un contador:

```php
<?php

$visitas = 1;
$visitas = $visitas + 1;

echo $visitas; // 2
```

| Momento | Instrucción | Valor de `$visitas` |
|---|---|---:|
| Inicial | `$visitas = 1;` | 1 |
| Actualización | `$visitas = $visitas + 1;` | 2 |
| Visualización | `echo $visitas;` | 2 |

Las variables se escriben con `$` y distinguen mayúsculas y minúsculas. `$nombre` y `$Nombre` **no son la misma variable**. Es preferible utilizar nombres expresivos (`$precioHora`, `$totalHoras`) en lugar de `$x` o `$dato1` cuando el significado no está claro.

### 3.3. Tipos de datos fundamentales

| Tipo | Qué representa | Ejemplo PHP |
|---|---|---|
| `int` | Entero sin parte decimal | `$puesto = 7;` |
| `float` | Número con parte decimal | `$tarifa = 18.50;` |
| `string` | Texto | `$nombre = 'Ana';` |
| `bool` | Verdadero o falso | `$activo = true;` |
| `null` | Ausencia de valor | `$responsable = null;` |

```php
<?php

$puesto = 7;
$tarifa = 18.50;
$nombre = 'Ana';
$urgente = false;
$responsable = null;

var_dump($puesto);
var_dump($tarifa);
var_dump($nombre);
var_dump($urgente);
var_dump($responsable);
```

`var_dump` sirve para **observar el tipo y el contenido durante el aprendizaje y la depuración**. No suele ser la presentación definitiva de una aplicación.

**Ojo con `bool`:** `echo false;` no escribe la palabra `false`. Para estudiar un valor booleano, utiliza `var_dump` y comprueba qué significa cada resultado.

### 3.4. Variables frente a constantes

Una variable puede cambiar. Una **constante** representa un valor que no queremos reasignar durante la ejecución:

```php
<?php

const IVA = 0.21;

$base = 100;
$total = $base * (1 + IVA);

echo $total; // 121
```

`IVA` no lleva `$`. PHP permite declarar constantes mediante `const` y también mediante `define()`. Por el momento utilizaremos `const` cuando el valor sea fijo y conocido al escribir el programa.

**Ejercicios 3.1–3.6.** Muestra tus datos utilizando variables; intercambia los valores de dos variables con ayuda de una tercera; calcula un salario; calcula la media de tres notas; crea un programa que convierta minutos a segundos; predice la salida tras tres reasignaciones. **Todos los datos estarán escritos inicialmente en el propio programa**, sin formularios ni lectura «por teclado».

---
## 4. Cadenas y operadores, con ejemplos {#operadores}

Una **expresión** es una combinación de valores, variables y operadores que PHP puede calcular. No es suficiente memorizar una tabla de símbolos: debemos entender **qué hace cada uno, qué resultado produce y de qué tipo es ese resultado**.

### 4.1. Comillas simples, dobles y concatenación

Las cadenas de texto se delimitan normalmente con comillas simples o dobles:

```php
<?php

$nombre = 'Ana';

echo 'Hola $nombre';  // Muestra literalmente: Hola $nombre
echo "Hola $nombre";  // Muestra: Hola Ana
```

En cadenas delimitadas por comillas dobles PHP puede interpolar variables sencillas. En cadenas delimitadas por comillas simples, `$nombre` se conserva como texto literal.

También podemos **concatenar**: unir textos mediante el punto `.`.

```php
<?php

$nombre = 'Ana';
$apellido = 'García';

$completo = $nombre . ' ' . $apellido;
echo $completo; // Ana García
```

Presta atención al espacio `' '`: sin él el resultado sería `AnaGarcía`.

| Expresión | Resultado | Explicación |
|---|---|---|
| `'IAW' . '02'` | `IAW02` | Se unen cadenas. |
| `2 + 3` | `5` | Se suman números. |
| `'2' . '3'` | `23` | Los dígitos son texto y se concatenan. |
| `'Hola ' . $nombre` | `Hola Ana` | Se une texto fijo y una variable. |

**Comprueba la diferencia:** `echo '2' . '3';` **no equivale** a `echo 2 + 3;`.

### 4.2. Operadores aritméticos

| Operador | Operación | Ejemplo | Resultado |
|---|---|---|---:|
| `+` | Suma | `7 + 3` | 10 |
| `-` | Resta | `7 - 3` | 4 |
| `*` | Multiplicación | `7 * 3` | 21 |
| `/` | División | `7 / 2` | 3.5 |
| `%` | Resto de división entera | `7 % 3` | 1 |
| `**` | Potencia | `2 ** 3` | 8 |

Prueba los operadores sin formularios:

```php
<?php

$a = 7;
$b = 3;

echo $a + $b;  // 10
echo '<br>';
echo $a - $b;  // 4
echo '<br>';
echo $a * $b;  // 21
echo '<br>';
echo $a / $b;  // 2.333...
echo '<br>';
echo $a % $b;  // 1
```

**El resto `%` merece una prueba propia.** `10 % 2` es `0`, porque `10` es divisible por `2`; `11 % 2` es `1`, porque sobra una unidad. Más adelante lo utilizaremos para detectar números pares e impares.

**División entre cero.** No ejecutaremos una división si el divisor es cero. Cuando estudiemos condiciones veremos cómo impedirla con `if`.

### 4.3. Orden de las operaciones

PHP aplica reglas de precedencia, como en matemáticas. Los paréntesis ayudan a indicar con claridad la operación deseada:

```php
<?php

echo 2 + 3 * 4;    // 14
echo '<br>';
echo (2 + 3) * 4;  // 20
```

**Cálculo guiado de una factura:**

```php
<?php

$precio = 25;
$unidades = 3;
$descuento = 5;

$subtotal = $precio * $unidades; // 75
$base = $subtotal - $descuento;  // 70
$total = $base * 1.21;          // 84.7

echo number_format($total, 2, ',', '.') . ' €'; // 84,70 €
```

`number_format` **da formato para mostrar** el número; no es el mecanismo con el que se garantiza la precisión de cálculos monetarios complejos. Para nuestros ejercicios iniciales utilizaremos importes sencillos.

### 4.4. Operadores de asignación abreviada

Ya conocemos `=`. Algunos operadores permiten escribir de manera más breve una actualización:

| Forma larga | Forma abreviada | Efecto |
|---|---|---|
| `$n = $n + 2;` | `$n += 2;` | Suma 2 al valor anterior. |
| `$n = $n - 2;` | `$n -= 2;` | Resta 2. |
| `$n = $n * 2;` | `$n *= 2;` | Multiplica por 2. |
| `$n = $n / 2;` | `$n /= 2;` | Divide entre 2. |
| `$texto = $texto . '!';` | `$texto .= '!';` | Añade texto. |

```php
<?php

$puntos = 10;
$puntos += 5;  // 15
$puntos -= 3;  // 12
$puntos *= 2;  // 24

echo $puntos; // 24
```

Los incrementos `$n++` y `$n--` aumentan o disminuyen una unidad. Por ahora los usaremos como instrucciones independientes, sin mezclar su resultado con otras expresiones:

```php
<?php

$contador = 0;
$contador++;
$contador++;
echo $contador; // 2
```

### 4.5. Operadores de comparación: producen `true` o `false`

Una comparación responde a una pregunta. **No guarda un valor ni muestra automáticamente un mensaje**. Produce un booleano que después podrá usar `if`.

| Operador | Pregunta | Ejemplo | Resultado |
|---|---|---|---|
| `===` | ¿Mismo valor y mismo tipo? | `7 === 7` | `true` |
| `!==` | ¿No son idénticos? | `7 !== 8` | `true` |
| `>` | ¿Es mayor? | `7 > 8` | `false` |
| `<` | ¿Es menor? | `7 < 8` | `true` |
| `>=` | ¿Mayor o igual? | `7 >= 7` | `true` |
| `<=` | ¿Menor o igual? | `5 <= 3` | `false` |

Existe además `==` (igualdad no estricta). Puede convertir tipos antes de comparar, por lo que conviene saber distinguirla de `===`:

```php
<?php

$numero = 7;
$texto = '7';

var_dump($numero == $texto);  // bool(true)
var_dump($numero === $texto); // bool(false)
```

El contenido representa el mismo número, pero **uno es entero y otro es texto**. En estos apuntes utilizaremos preferentemente comparación estricta cuando importe distinguir valores y tipos. `=` es asignación; `==` y `===` son comparaciones.

### 4.6. Operadores lógicos: AND, OR y NOT

Los operadores relacionales anteriores permiten formular preguntas sencillas: «¿la nota es al menos 5?», «¿la temperatura supera 35?» o «¿dos valores son idénticos?». Muchas decisiones reales necesitan **combinar varias preguntas**. Para eso utilizamos operadores lógicos.

| Idea lógica | Operador que usaremos | También existe | Resultado verdadero cuando… |
|---|---|---|---|
| AND (Y) | `&&` | `and` | **Todas** las condiciones combinadas son verdaderas. |
| OR (O) | `||` | `or` | **Al menos una** de las condiciones es verdadera. |
| NOT (NO) | `!` | — | Invierte un booleano: `true` pasa a `false` y viceversa. |

En estos apuntes utilizaremos normalmente `&&`, `||` y `!`. PHP también permite escribir `and` y `or`, pero **no tienen la misma precedencia que `&&` y `||`** cuando se mezclan con otras operaciones, especialmente con asignaciones. Para empezar es más seguro mantener una única forma y usar paréntesis cuando una expresión pueda resultar ambigua.

#### AND: todas las condiciones deben cumplirse

```php
<?php

$edad = 19;
$autorizado = true;

var_dump($edad >= 18);          // bool(true)
var_dump($autorizado === true); // bool(true)
var_dump($edad >= 18 && $autorizado === true); // bool(true)
```

La última expresión puede leerse así: **«la edad es al menos 18 Y además está autorizado»**. Si cualquiera de las dos partes fuese falsa, el resultado completo sería `false`.

| Primera condición | Segunda condición | `&&` |
|---|---|---|
| `true` | `true` | `true` |
| `true` | `false` | `false` |
| `false` | `true` | `false` |
| `false` | `false` | `false` |

#### OR: basta con que se cumpla una condición

```php
<?php

$prioridadAlta = true;
$servicioCaido = false;

var_dump($prioridadAlta || $servicioCaido); // bool(true)
```

Se lee: **«la prioridad es alta O el servicio está caído»**. Como la primera parte ya es verdadera, toda la expresión resulta verdadera.

| Primera condición | Segunda condición | `||` |
|---|---|---|
| `true` | `true` | `true` |
| `true` | `false` | `true` |
| `false` | `true` | `true` |
| `false` | `false` | `false` |

#### NOT: invertir una condición

```php
<?php

$activo = false;

var_dump($activo);  // bool(false)
var_dump(!$activo); // bool(true)
```

`!$activo` significa **«NO está activo»**. Conviene que el nombre de las variables booleanas permita leer la condición de forma natural.

### 4.7. Precedencia lógica y uso de paréntesis

Cuando una expresión contiene varios operadores, PHP no los evalúa simplemente de izquierda a derecha. Cada operador tiene una **precedencia**. Para las expresiones que estamos aprendiendo, recuerda esta simplificación útil:

1. Los paréntesis `()` fuerzan primero la evaluación de su contenido.
2. `!` se aplica antes que `&&` y `||`.
3. Las comparaciones como `===`, `>`, `<`, `>=` o `<=` producen los booleanos que después combinaremos.
4. `&&` se evalúa antes que `||`.

> **Importante:** los corchetes `[]` **no se utilizan para agrupar condiciones**. Más adelante los usaremos para acceder a posiciones o claves de arrays. Para controlar el orden lógico utilizamos paréntesis `()`.
{: .notice--info}

Compara estos dos casos:

```php
<?php

var_dump(true || false && false);   // bool(true)
var_dump((true || false) && false); // bool(false)
```

En la primera expresión, `&&` tiene prioridad sobre `||`, por lo que PHP interpreta la operación de forma equivalente a:

```text
true || (false && false)
true || false
true
```

En la segunda expresión, los paréntesis obligan a resolver primero `true || false`:

```text
(true || false) && false
true && false
false
```

#### Ejemplo profesional: una regla de acceso

Supongamos que una operación requiere que la cuenta esté activa y que el usuario tenga uno de dos perfiles permitidos. Todavía no necesitamos arrays ni sesiones para razonar la condición; utilizaremos valores fijos:

```php
<?php

$activo = true;
$esAdministrador = false;
$esTecnico = true;

$puedeAcceder = $activo && ($esAdministrador || $esTecnico);

var_dump($puedeAcceder); // bool(true)
```

Los paréntesis expresan exactamente la regla: **debe estar activo Y, además, ser administrador O técnico**. Sin esos paréntesis, la lectura sería menos clara y podría no representar la intención de negocio.

#### Otro ejemplo: negar un grupo completo

```php
<?php

$esFestivo = false;
$esFinDeSemana = true;

$esLaborable = !($esFestivo || $esFinDeSemana);

var_dump($esLaborable); // bool(false)
```

Primero se calcula si es festivo **o** fin de semana; después `!` invierte ese resultado. No equivale a negar solo una de las dos condiciones.

#### `&&` / `||` frente a `and` / `or`

Observa esta diferencia, que explica por qué usaremos preferentemente los operadores simbólicos:

```php
<?php

$a = true && false;
$b = true and false;

var_dump($a); // bool(false)
var_dump($b); // bool(true)
```

La segunda línea sorprende porque `=` tiene mayor precedencia que `and`: primero se asigna `true` a `$b` y después se evalúa el `and`. **No necesitamos memorizar toda la tabla de precedencias**; sí necesitamos saber que mezclar formas sin comprenderlas puede cambiar el resultado. En nuestras condiciones utilizaremos `&&`, `||`, `!` y paréntesis explícitos.

**Cortocircuito.** Con `&&`, si la primera parte ya es falsa, PHP no necesita evaluar la segunda para saber que el resultado será falso. Con `||`, si la primera parte ya es verdadera, tampoco necesita evaluar la segunda. Esta propiedad será útil más adelante para comprobar valores antes de realizar otras operaciones.

**Ejercicios 4.10–4.15.** Predice y comprueba las cuatro combinaciones posibles de `&&`; repite con `||`; invierte cinco booleanos con `!`; determina el resultado de `true || false && false` antes de ejecutarlo; añade paréntesis para obtener el resultado contrario; expresa con variables booleanas la regla «activo y (administrador o técnico)» y prueba al menos tres combinaciones distintas.

**Ejercicios 4.1–4.9.** Calcula el área de rectángulo y círculo; transforma Celsius a Fahrenheit; calcula el porcentaje de ocupación de un aula; convierte segundos a horas/minutos/segundos; calcula el importe de horas extraordinarias partiendo de valores fijos; demuestra la diferencia entre concatenar y sumar; predice cinco comparaciones con `var_dump`; modifica una factura mediante `+=` y `-=`; comprueba qué ocurre con `/` y `%` en casos distintos de cero.

---

## 5. Decisiones: `if`, `else` y `elseif`, sin saltarnos pasos {#condiciones}

Hasta ahora los programas han ejecutado las instrucciones en el orden en el que están escritas. Pero una aplicación debe tomar decisiones: **¿hay que mostrar una alerta? ¿la prioridad es alta? ¿el divisor es válido?**

![Evolución desde if simple a if/else y elseif]({{ '/assets/docencia/iaw/ut02/04_condicionales.png' | relative_url }})

### 5.1. Primero, un `if` simple

Lee la frase: **«Si la nota es al menos 5, muestra Aprobado»**. No se ha indicado qué hacer si la nota es menor. Esa es la función del `if` simple.

```php
<?php

$nota = 7;

if ($nota >= 5) {
    echo 'Aprobado';
}
```

| Elemento | Significado |
|---|---|
| `if` | Introduce una condición. |
| `($nota >= 5)` | Pregunta si la nota es mayor o igual que cinco. |
| `{` y `}` | Delimitan el bloque que se ejecutará cuando sea verdad. |
| `echo 'Aprobado';` | Solo se ejecuta si la condición resulta `true`. |

Prueba **dos valores**: con `$nota = 7` aparece `Aprobado`; con `$nota = 3` no aparece ese texto. El programa no tiene por qué mostrar un mensaje si la condición resulta falsa.

**Otro `if` simple:**

```php
<?php

$temperatura = 39;

if ($temperatura > 35) {
    echo 'Aviso: temperatura elevada';
}
```

### 5.2. Después, `if` con `else`: dos caminos

Ahora la regla sí exige un resultado para el otro caso: **«Si la nota es al menos 5, aprobado; en caso contrario, suspenso»**.

```php
<?php

$nota = 3;

if ($nota >= 5) {
    echo 'Aprobado';
} else {
    echo 'Suspenso';
}
```

**¿Cómo se lee?** Se evalúa una sola vez `$nota >= 5`. Si es verdadera se ejecuta el primer bloque. Si es falsa se ejecuta el segundo. **No se ejecutan ambos bloques en una misma evaluación**.

| `$nota` | ¿`$nota >= 5`? | Salida |
|---:|---|---|
| 3 | `false` | Suspenso |
| 5 | `true` | Aprobado |
| 9 | `true` | Aprobado |

### 5.3. `elseif`: tres o más alternativas excluyentes

Para distinguir **suspenso, aprobado y notable/sobresaliente**, necesitamos probar otra condición cuando la anterior sea falsa.

```php
<?php

$nota = 8;

if ($nota < 5) {
    echo 'Suspenso';
} elseif ($nota < 7) {
    echo 'Aprobado';
} else {
    echo 'Notable o sobresaliente';
}
```

Con `$nota = 8`, primero se comprueba `8 < 5` (falso); después `8 < 7` (falso); finalmente se ejecuta `else`. Con nota `6`, la primera comparación es falsa y la segunda verdadera: **no se llega a `else`**.

**Prueba de escritorio:** repite el recorrido para `4`, `5`, `6`, `7` y `10` antes de ejecutar. Anota qué condiciones se consultan realmente en cada caso.

### 5.4. Solo ahora: un `if` anidado

Anidar significa poner **una condición dentro del bloque de otra**. Primero debe cumplirse la condición externa; después se evalúa la interna.

```php
<?php

$usuarioActivo = true;
$esAdministrador = false;

if ($usuarioActivo) {
    echo 'Usuario activo. ';

    if ($esAdministrador) {
        echo 'Puede administrar.';
    } else {
        echo 'Puede consultar.';
    }
} else {
    echo 'Acceso deshabilitado.';
}
```

Para entenderlo, sigue los niveles:

1. ¿Está activa la cuenta?
2. **Solo si lo está**, ¿tiene permisos de administración?
3. La respuesta interna determina el mensaje final.

En este ejemplo, también podría utilizarse una condición lógica para un resultado más sencillo. Los anidamientos son útiles cuando queremos realizar varias acciones dentro de un caso, pero demasiados niveles hacen difícil comprender el programa.

### 5.5. Comprobación práctica: evitar dividir entre cero

```php
<?php

$dividendo = 12;
$divisor = 0;

if ($divisor === 0) {
    echo 'No se puede dividir entre cero';
} else {
    echo $dividendo / $divisor;
}
```

No se ejecuta la división si el divisor vale cero. Esta comprobación **no exige todavía formularios ni funciones**: estamos aprendiendo a decidir con valores previamente definidos.

### 5.6. `switch` y `match`: opciones para más adelante

Cuando una variable puede tomar varios valores concretos, `switch` permite agrupar casos:

```php
<?php

$prioridad = 'media';

switch ($prioridad) {
    case 'alta':
        echo 'Atención inmediata';
        break;
    case 'media':
        echo 'Planificar intervención';
        break;
    default:
        echo 'Revisión ordinaria';
}
```

`break` termina el `switch` cuando se ha resuelto un caso. Más adelante podrás reconocer `match`, que **devuelve un valor** y compara de forma estricta:

```php
<?php

$prioridad = 'alta';

$mensaje = match ($prioridad) {
    'alta' => 'Hoy',
    'media' => 'Esta semana',
    default => 'Sin urgencia',
};

echo $mensaje;
```

No es necesario introducir `switch` y `match` antes de dominar **`if` simple → `if/else` → `elseif`**.

**Ejercicios 5.1–5.11.** Determina si un número es positivo; comprueba si es par; muestra aprobado/suspenso; clasifica una nota en tres tramos; encuentra el mayor de dos números; encuentra el mayor de tres; calcula el salario con recargo de horas extraordinarias; clasifica un ticket por prioridad; comprueba si una cuenta está activa; valida que una nota esté entre 0 y 10; resuelve una calculadora con división protegida. **Para cada ejercicio prueba al menos un caso verdadero, uno falso y un límite**.

---

## 6. Repetir instrucciones: los bucles {#bucles}

Hasta ahora hemos elegido qué código ejecutar. En esta sección aprenderemos **cuántas veces repetirlo**. Antes de utilizar arrays, practicaremos con un simple contador.

![Estructuras for y while: inicialización, condición, cuerpo y actualización]({{ '/assets/docencia/iaw/ut02/05_bucles.png' | relative_url }})

### 6.1. ¿Por qué no escribir diez veces lo mismo?

```php
<?php

echo '1';
echo '2';
echo '3';
```

Para tres números podemos escribir tres instrucciones; para cien o diez mil es poco práctico. Un **bucle** ejecuta repetidamente un bloque mientras se cumpla una regla.

### 6.2. Bucle `for`: sabemos las vueltas que queremos hacer

```php
<?php

for ($i = 1; $i <= 5; $i++) {
    echo $i . '<br>';
}
```

El `for` contiene **tres partes**:

| Parte | Fragmento | Significado |
|---|---|---|
| Inicialización | `$i = 1` | Empieza contando en 1. |
| Condición | `$i <= 5` | Repite mientras sea verdadera. |
| Actualización | `$i++` | Suma 1 después de cada vuelta. |

**Traza del programa:**

| Vuelta | `$i` al comprobar | ¿`$i <= 5`? | ¿Qué escribe? |
|---:|---:|---|---:|
| 1 | 1 | Sí | 1 |
| 2 | 2 | Sí | 2 |
| 3 | 3 | Sí | 3 |
| 4 | 4 | Sí | 4 |
| 5 | 5 | Sí | 5 |
| — | 6 | No | Nada; termina |

Observa que **el último valor comprobado puede no llegar a mostrarse**. El bucle termina cuando la condición pasa a ser falsa.

**Tabla de multiplicar:**

```php
<?php

$numero = 7;

for ($i = 1; $i <= 10; $i++) {
    $producto = $numero * $i;
    echo $numero . ' × ' . $i . ' = ' . $producto . '<br>';
}
```

### 6.3. Bucle `while`: repetimos mientras se cumpla una condición

Un `while` comprueba la condición **antes** de entrar al bloque:

```php
<?php

$contador = 1;

while ($contador <= 5) {
    echo $contador . '<br>';
    $contador++;
}
```

Comparación con el `for`: la inicialización está fuera del bucle y la actualización está dentro. **Si olvidamos `$contador++`, la condición nunca dejará de cumplirse** y aparecerá un bucle infinito.

### 6.4. `do ... while`: al menos una ejecución

Este bucle comprueba al final:

```php
<?php

$contador = 8;

do {
    echo $contador;
    $contador++;
} while ($contador <= 5);
```

Aunque `8` no cumple la condición `<= 5`, el cuerpo ya se ha ejecutado una vez. Este es el rasgo que diferencia `do ... while` de `while`.

### 6.5. Contadores y acumuladores

Un **contador** suele aumentar una unidad por cada caso. Un **acumulador** suma valores para obtener un total.

```php
<?php

$suma = 0;

for ($i = 1; $i <= 4; $i++) {
    $suma += $i;
}

echo $suma; // 10
```

| Vuelta | `$i` | `$suma` antes | `$suma` después |
|---:|---:|---:|---:|
| 1 | 1 | 0 | 1 |
| 2 | 2 | 1 | 3 |
| 3 | 3 | 3 | 6 |
| 4 | 4 | 6 | 10 |

La variable `$suma` debe inicializarse **antes** del bucle. Si la reiniciamos a cero dentro de cada vuelta perderemos lo acumulado.

### 6.6. `break` y `continue`

`break` termina el bucle. `continue` salta el resto de la vuelta actual y continúa con la siguiente:

```php
<?php

for ($i = 1; $i <= 6; $i++) {
    if ($i === 3) {
        continue;
    }

    if ($i === 6) {
        break;
    }

    echo $i . ' ';
}
```

**Salida:** `1 2 4 5 `. El `3` se omite y el `6` provoca la salida antes de imprimirse.

**Ejercicios 6.1–6.11.** Muestra 1…20; cuenta de 10 a 1; escribe solo los pares; genera la tabla de multiplicar de tu puesto; suma 1…N; calcula un factorial iterativo; encuentra múltiplos de 3 hasta N; suma los cuadrados de los diez primeros naturales; calcula la media de cinco notas fijadas en el programa; identifica y corrige un bucle infinito; imprime los números de un rango sin mostrar un valor prohibido. **No empieces con 10 000 filas en el navegador: prueba primero un rango pequeño.**

---
## 7. Arrays y `foreach`: trabajar con varios datos {#arrays}

Ahora sabemos almacenar un valor, elegir un camino y repetir instrucciones. Podemos dar el siguiente paso: **almacenar varios valores relacionados en una misma estructura**.

### 7.1. El problema de utilizar muchas variables

Si necesitamos guardar tres prioridades, podríamos escribir:

```php
<?php

$prioridad1 = 'baja';
$prioridad2 = 'media';
$prioridad3 = 'alta';
```

Pero ¿qué pasaría si tuviéramos cien? Un **array** es una colección de valores que podemos guardar bajo un mismo nombre.

### 7.2. Array indexado: posiciones que empiezan en cero

```php
<?php

$prioridades = ['baja', 'media', 'alta'];

echo $prioridades[0]; // baja
echo $prioridades[1]; // media
echo $prioridades[2]; // alta
```

![Array indexado con las posiciones cero, uno y dos]({{ '/assets/docencia/iaw/ut02/06_arrays.png' | relative_url }})

| Posición | Valor |
|---:|---|
| `0` | baja |
| `1` | media |
| `2` | alta |

**El primer elemento se encuentra en la posición `0`**, no en la posición `1`. `count($prioridades)` devuelve `3`: el número de elementos, no el último índice.

Podemos modificar o añadir elementos:

```php
<?php

$prioridades = ['baja', 'media', 'alta'];
$prioridades[1] = 'normal';
$prioridades[] = 'crítica';

var_dump($prioridades);
```

No confundas `$prioridades[1] = 'normal'` (**modifica la posición 1**) con `$prioridades[] = 'crítica'` (**añade un elemento al final**).

### 7.3. Recorrer un array utilizando `for`

Como ya conocemos `for`, podemos utilizarlo para mostrar cada posición:

```php
<?php

$prioridades = ['baja', 'media', 'alta'];

for ($i = 0; $i < count($prioridades); $i++) {
    echo $prioridades[$i] . '<br>';
}
```

**Lee el recorrido:** `$i` vale 0, después 1, después 2. Al llegar a 3, la condición `3 < 3` resulta falsa y el bucle termina.

Esta construcción funciona para un array que tenga índices consecutivos de `0` a `count()-1`. No debemos dar por hecho que todos los arrays conservarán siempre esa forma si se eliminan elementos o se utilizan claves personalizadas.

### 7.4. `foreach`: recorrer sin administrar manualmente los índices

PHP dispone de una estructura especialmente práctica para colecciones:

```php
<?php

$prioridades = ['baja', 'media', 'alta'];

foreach ($prioridades as $prioridad) {
    echo $prioridad . '<br>';
}
```

Se lee: **«Por cada elemento de `$prioridades`, toma su valor en `$prioridad` y ejecuta el bloque»**. No hemos tenido que escribir `$i = 0` ni actualizar `$i++`.

| Vuelta | `$prioridad` |
|---:|---|
| 1 | baja |
| 2 | media |
| 3 | alta |

`foreach` trabaja igualmente si el array está vacío: en ese caso, el cuerpo no se ejecuta ninguna vez.

### 7.5. Array asociativo: claves con significado

A veces una posición numérica no basta para entender el contenido. Un ticket puede tener `codigo`, `asunto` y `prioridad`. Un **array asociativo** utiliza claves que describen cada dato:

```php
<?php

$ticket = [
    'codigo' => 'IAW-07',
    'asunto' => 'No carga la página',
    'prioridad' => 'alta',
];

echo $ticket['asunto']; // No carga la página
```

| Clave | Valor |
|---|---|
| `'codigo'` | `'IAW-07'` |
| `'asunto'` | `'No carga la página'` |
| `'prioridad'` | `'alta'` |

El símbolo `=>` asocia una clave con un valor. Para obtener un dato concreto necesitamos conocer su clave: `$ticket['asunto']`.

También podemos recorrer **clave y valor**:

```php
<?php

foreach ($ticket as $clave => $valor) {
    echo $clave . ': ' . $valor . '<br>';
}
```

### 7.6. Una lista de tickets: array de arrays

```php
<?php

$tickets = [
    ['codigo' => 'IAW-07', 'estado' => 'abierto'],
    ['codigo' => 'IAW-08', 'estado' => 'cerrado'],
    ['codigo' => 'IAW-09', 'estado' => 'abierto'],
];

$abiertos = 0;

foreach ($tickets as $ticket) {
    if ($ticket['estado'] === 'abierto') {
        $abiertos++;
    }
}

echo 'Tickets abiertos: ' . $abiertos; // 2
```

**Este ejemplo integra piezas ya aprendidas:** el array reúne datos; `foreach` recorre; `if` decide; `$abiertos++` actualiza el contador; `echo` muestra el resultado.

### 7.7. Comprobar claves y trabajar con valores opcionales

Si consultamos una clave inexistente como `$ticket['responsable']`, PHP puede avisar de que la clave no está definida. Cuando un dato puede faltar, utilizaremos una comprobación:

```php
<?php

$ticket = ['asunto' => 'Error de acceso'];

$responsable = $ticket['responsable'] ?? 'Sin asignar';
echo $responsable;
```

El operador `??` devuelve el valor de la izquierda si existe y no es `null`; en caso contrario, utiliza el valor alternativo. `isset($ticket['responsable'])` permite comprobar si la clave está definida y no es nula.

**Ejercicios 7.1–7.11.** Define cinco módulos; muestra el primero y el último; modifica un elemento; añade otro; recorre un array con `for`; recórrelo con `foreach`; calcula la media de notas de un array no vacío; encuentra el máximo mediante una variable auxiliar; crea un ticket asociativo; recorre un ticket mostrando claves y valores; cuenta cuántos tickets están abiertos en una lista. Ampliación: explica por qué acceder mediante `$i` a un array asociativo no equivale a recorrerlo con `foreach`.

---


## 8. Entrada de datos en PHP: terminal, formularios y peticiones HTTP {#formularios}

![Del campo name en HTML a la clave recibida por PHP]({{ '/assets/docencia/iaw/ut02/10_formularios.png' | relative_url }})

Hasta ahora muchos valores estaban escritos en el propio código. Una aplicación real necesita **recibir datos desde fuera**. En PHP pueden llegar por terminal, URL, formulario, fichero subido, cookie, sesión o cuerpo JSON. La secuencia de trabajo será siempre explícita:

```text
RECIBIR → COMPROBAR TIPO → NORMALIZAR → VALIDAR → USAR → ESCAPAR AL MOSTRAR
```

### 8.1. Entrada por terminal: `readline()`, `STDIN` y `$argv`

En CLI PHP sí puede esperar a que escribamos:

```php
<?php
$nombre = readline('Escribe tu nombre: ');
$nombre = trim($nombre);
echo 'Hola, ' . $nombre . PHP_EOL;
```

También:

```php
$linea = fgets(STDIN);
```

o argumentos de arranque:

```bash
php script.php Ana 7
```

```php
$nombre = $argv[1] ?? 'Sin nombre';
$puesto = $argv[2] ?? 'NN';
```

Esto sirve para scripts y automatización. **No es la forma habitual de recoger el teclado de un usuario web.**

### 8.2. En una aplicación web PHP no se queda esperando al usuario

```text
GET /contacto.php
      ↓
PHP genera HTML y termina
      ↓
usuario escribe en el navegador
      ↓
POST /contacto.php
      ↓
PHP vuelve a ejecutarse
      ↓
$_POST
```

Aunque utilicemos el **mismo fichero PHP**, son peticiones y ejecuciones diferentes.

### 8.3. Formulario y procesamiento en archivos distintos

`formulario.php`:

```html
<form action="procesar.php" method="post">
    <label for="nombre">Nombre</label>
    <input id="nombre" name="nombre">
    <button>Enviar</button>
</form>
```

`procesar.php`:

```php
<?php

$valor = $_POST['nombre'] ?? '';

if (!is_string($valor)) {
    http_response_code(422);
    exit('Formato incorrecto');
}

$nombre = trim($valor);

echo htmlspecialchars(
    $nombre,
    ENT_QUOTES | ENT_SUBSTITUTE,
    'UTF-8'
);
```

Es la opción más clara para comprender el recorrido inicial.

### 8.4. Formulario y procesamiento en el mismo fichero

También podemos utilizar una sola URL:

```php
<?php

$nombre = '';
$mensaje = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $valor = $_POST['nombre'] ?? '';

    if (is_string($valor)) {
        $nombre = trim($valor);

        if ($nombre !== '') {
            $mensaje = 'Hola, ' . $nombre;
        }
    }
}

function e(string $texto): string
{
    return htmlspecialchars(
        $texto,
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8'
    );
}
?>
<!doctype html>
<html lang="es">
<body>

<?php if ($mensaje !== ''): ?>
    <p><?= e($mensaje) ?></p>
<?php endif; ?>

<form method="post">
    <input name="nombre" value="<?= e($nombre) ?>">
    <button>Enviar</button>
</form>

</body>
</html>
```

Al omitir `action`, el formulario se envía a la URL actual.

| Diseño | Ventaja |
|---|---|
| Formulario + procesador separados | Flujo muy visible |
| Mismo fichero | Adecuado para formularios pequeños |
| Handler/controlador separado | Mejor separación en aplicaciones mayores |
| POST → 303 → GET | Evita reenvíos al recargar |

### 8.5. `id`, `name`, `action` y `method`

- `id`: identifica el control en HTML y lo relaciona con `label`.
- `name`: define la clave enviada a PHP.
- `action`: indica qué recurso recibirá el formulario.
- `method`: indica GET o POST.

```html
<input id="asunto" name="asunto">
```

se recupera como:

```php
$_POST['asunto']
```

si el formulario usa POST.

### 8.6. GET y POST

Con GET:

```text
/buscar.php?q=apache
```

```php
$q = $_GET['q'] ?? '';
```

Con POST:

```php
$asunto = $_POST['asunto'] ?? '';
```

| GET | POST |
|---|---|
| Parámetros en URL | Datos normalmente en el cuerpo |
| Búsquedas, filtros, navegación | Altas, ediciones, acciones |
| URL compartible | El cuerpo no forma parte de la URL visible |
| `$_GET` | `$_POST` |

**POST no cifra los datos. HTTPS protege el transporte.**

### 8.7. Superglobales que debes reconocer

| Superglobal | Contenido |
|---|---|
| `$_GET` | Parámetros de URL |
| `$_POST` | Campos POST compatibles |
| `$_FILES` | Ficheros subidos |
| `$_COOKIE` | Cookies |
| `$_SERVER` | Información de petición/servidor |
| `$_SESSION` | Estado de sesión tras `session_start()` |
| `$_ENV` | Variables de entorno disponibles |

Evitaremos `$_REQUEST` como atajo porque oculta de qué fuente procede un dato.

### 8.8. El navegador no convierte una entrada externa en dato fiable

```html
<input type="number" name="edad">
```

no evita que llegue una petición manipulada. En servidor:

```php
$raw = $_POST['edad'] ?? '';

if (!is_string($raw)) {
    exit('Formato incorrecto');
}

$edad = filter_var(
    trim($raw),
    FILTER_VALIDATE_INT
);

if ($edad === false || $edad < 0 || $edad > 130) {
    exit('Edad no válida');
}
```

La validación HTML mejora la experiencia, pero **no sustituye la validación PHP**.

### 8.9. El dato puede llegar con una forma distinta de la esperada

Esperamos:

```text
?nombre=Ana
```

pero pueden enviar:

```text
?nombre[]=Ana
```

Por eso:

```php
$raw = $_GET['nombre'] ?? '';

if (!is_string($raw)) {
    http_response_code(422);
    exit('Se esperaba texto');
}
```

es más robusto que llamar directamente `trim($_GET['nombre'])`.

### 8.10. Checkbox, radio, `select` y datos múltiples

Un checkbox no marcado normalmente no envía su clave:

```php
$acepta = ($_POST['acepta'] ?? '') === 'si';
```

Un valor seleccionado debe validarse:

```php
$prioridad = $_POST['prioridad'] ?? '';

if (
    !is_string($prioridad)
    || !in_array($prioridad, ['baja', 'media', 'alta'], true)
) {
    exit('Prioridad no válida');
}
```

Para varios valores:

```html
<input type="checkbox" name="etiquetas[]" value="apache">
<input type="checkbox" name="etiquetas[]" value="php">
```

esperamos:

```php
$etiquetas = $_POST['etiquetas'] ?? [];

if (!is_array($etiquetas)) {
    $etiquetas = [];
}
```

### 8.11. Normalizar, validar, escapar y almacenar

Son responsabilidades diferentes:

```text
NORMALIZAR  → trim(), formato coherente
VALIDAR     → aceptar/rechazar
ESCAPAR     → preparar para HTML u otro contexto
ALMACENAR   → fichero, sesión, MariaDB...
```

Ejemplo de salida HTML:

```php
echo htmlspecialchars(
    $asunto,
    ENT_QUOTES | ENT_SUBSTITUTE,
    'UTF-8'
);
```

`htmlspecialchars()` no valida un email ni una prioridad.

### 8.12. Método HTTP y códigos de respuesta

```php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Este recurso espera POST');
}
```

Códigos que iremos utilizando:

- `200`: correcto.
- `303`: redirección después de POST.
- `400`: petición mal formada.
- `401`: falta autenticación.
- `403`: sin autorización.
- `404`: recurso no encontrado.
- `405`: método no permitido.
- `422`: datos no aceptables.
- `500`: error interno.

### 8.13. POST/Redirect/GET

Después de una operación correcta:

```php
header('Location: confirmacion.php', true, 303);
exit;
```

```text
POST → procesar → 303 → GET → página final
```

Evita que `F5` repita accidentalmente el POST.

### 8.14. Ficheros subidos: `$_FILES`

Con:

```html
<form method="post" enctype="multipart/form-data">
    <input type="file" name="adjunto">
</form>
```

PHP recibe metadatos en:

```php
$_FILES['adjunto']
```

En el proyecto comprobaremos error de subida, tamaño, MIME real con `finfo`, nombre generado por la aplicación, `move_uploaded_file()` y almacenamiento fuera de `public/`.

### 8.15. JSON en el cuerpo de una petición

Un cliente puede enviar:

```http
Content-Type: application/json
```

Ese contenido no aparece automáticamente en `$_POST`.

```php
$cuerpo = file_get_contents('php://input');

$datos = json_decode(
    $cuerpo,
    true,
    512,
    JSON_THROW_ON_ERROR
);
```

Es una ampliación profesional; primero dominaremos formularios.

### 8.16. Comprobación de aprendizaje

Debes poder explicar:

1. Por qué `readline()` y un formulario web son escenarios distintos.
2. Relación entre `name="asunto"` y `$_POST['asunto']`.
3. Diferencia GET/POST.
4. Por qué mismo fichero no significa misma ejecución.
5. Por qué se comprueba el tipo antes de `trim()`.
6. Qué ocurre con un checkbox no marcado.
7. Cuándo esperamos un array.
8. Diferencia entre validar y escapar.
9. Por qué `type="number"` no basta.
10. Para qué sirve PRG.

---

## 9. Funciones incorporadas (*built-in functions*) {#builtins}

PHP proporciona miles de funciones. No hay que memorizarlas todas: hay que aprender a **buscar, leer parámetros, interpretar el retorno y comprobar casos límite**.

### 9.1. Función, construcción del lenguaje y método

```php
trim($texto);          // función incorporada
normalizar($texto);    // función propia
$ticket->cerrar();     // método de instancia
Ticket::crear();       // método estático
```

Mientras que:

```text
echo, include, require, isset, empty, exit
```

son construcciones del lenguaje.

### 9.2. Anatomía de una llamada

```php
$longitud = strlen($texto);
```

- `strlen`: nombre.
- `$texto`: argumento.
- `$longitud`: recibe el retorno.

Siempre preguntaremos: **qué recibe, qué devuelve, cómo indica fallo y si modifica algo**.

### 9.3. Cadenas

```text
trim()
strlen()
mb_strlen()
strtolower() / strtoupper()
mb_strtolower() / mb_strtoupper()
str_contains()
str_starts_with()
str_ends_with()
substr()
str_replace()
explode()
implode()
```

Ejemplo:

```php
$entrada = '  PHP,Apache,MariaDB  ';
$partes = explode(',', trim($entrada));
echo implode(' | ', $partes);
```

`strlen()` cuenta bytes. Para texto UTF-8 humano, `mb_strlen()` suele expresar mejor el número de caracteres esperado.

### 9.4. Arrays

```text
count()
in_array()
array_key_exists()
array_keys()
array_values()
array_merge()
array_map()
array_filter()
array_sum()
sort() / rsort()
usort()
```

Cuando proceda:

```php
in_array($prioridad, $permitidas, true);
```

utiliza comparación estricta.

### 9.5. Tipos y validación

```text
is_string()
is_int()
is_float()
is_bool()
is_array()
is_object()
is_null()
is_numeric()
filter_var()
```

`isset()` es una construcción del lenguaje. `array_key_exists()` comprueba una clave incluso cuando su valor es `null`.

### 9.6. Números, fechas y formato

```text
round()
min()
max()
abs()
pow()
sqrt()
number_format()
time()
date()
```

También veremos objetos:

```php
$fecha = new DateTimeImmutable(
    'now',
    new DateTimeZone('Europe/Madrid')
);

echo $fecha->format(DateTimeInterface::ATOM);
```

Aquí `format()` es un **método**.

### 9.7. Web, seguridad, JSON y ficheros

Funciones especialmente relevantes:

```text
htmlspecialchars()
header()
http_response_code()
setcookie()
session_start()
session_regenerate_id()
password_hash()
password_verify()
random_bytes()

json_encode()
json_decode()

file_get_contents()
file_put_contents()
fopen()
fwrite()
fclose()
```

### 9.8. Depuración

```php
var_dump($dato);
print_r($array);
```

Son útiles en desarrollo. No debemos publicar volcados con secretos o datos sensibles.

### 9.9. Cómo estudiar una built-in

Ejemplo:

```text
NOMBRE: trim
RECIBE: string
DEVUELVE: string
MODIFICA ORIGINAL: no
FALLO: no aplicable en uso normal
CASO LÍMITE: cadena vacía
```

Ese método de análisis es más importante que memorizar listas.

### 9.10. Built-ins que reutilizaremos en el Proyecto 1

A partir de ahora no estudiaremos las funciones incorporadas como un catálogo. Las reutilizaremos cuando aparezca una necesidad concreta del proyecto.

| Necesidad | Funciones / recursos que aparecerán |
|---|---|
| Normalizar y comprobar texto | `trim()`, `mb_strlen()`, `str_contains()` |
| Comprobar valores admitidos | `in_array(..., true)`, `array_key_exists()` |
| Validar email o entero | `filter_var()` |
| Escapar salida HTML | `htmlspecialchars()` |
| Depurar durante desarrollo | `var_dump()`, `print_r()`, `get_debug_type()` |
| Calcular páginas | `ceil()`, `max()`, `min()` |
| Contraseñas | `password_hash()`, `password_verify()` |
| Tokens aleatorios | `random_bytes()`, `bin2hex()` |
| Comparar tokens CSRF | `hash_equals()` |
| Sesiones | `session_start()`, `session_regenerate_id()` |
| Redirección PRG | `header()` |
| Tipo real de un fichero | `finfo` / `finfo_file()` |
| Subida HTTP | `move_uploaded_file()` |
| Comprobar almacenamiento | `file_exists()`, `is_file()`, `is_readable()` |
| JSON | `json_encode()`, `json_decode()` |
| Registro técnico | `error_log()` |

#### Ejemplo 1 · Validar una prioridad

```php
$permitidas = ['baja', 'media', 'alta'];

if (!in_array($prioridad, $permitidas, true)) {
    exit('Prioridad no permitida');
}
```

El tercer argumento `true` exige comparación estricta. En validaciones no queremos que una conversión automática de tipos haga coincidir valores inesperados.

#### Ejemplo 2 · Validar un email

```php
$email = trim($email);

if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    $errores[] = 'Email no válido';
}
```

Validar y escapar siguen siendo operaciones distintas. `filter_var()` decide si el dato cumple una regla; `htmlspecialchars()` se utiliza al incluir texto en HTML.

#### Ejemplo 3 · Número total de páginas

```php
$totalRegistros = 73;
$porPagina = 10;

$totalPaginas = (int) ceil(
    $totalRegistros / $porPagina
);
```

En UT03, `$totalRegistros` procederá de una consulta `COUNT(*)` y cada página se obtendrá con `LIMIT` y `OFFSET`. No cargaremos todos los registros para ocultarlos después con JavaScript.

#### Ejemplo 4 · Contraseñas

```php
$hash = password_hash(
    $password,
    PASSWORD_DEFAULT
);

if (password_verify($passwordRecibida, $hash)) {
    // Credencial correcta.
}
```

La aplicación almacena el **hash**, no la contraseña original. El Proyecto 1 utilizará esta pareja de funciones durante el registro/creación de usuarios y el login.

#### Ejemplo 5 · Token aleatorio y comparación segura

```php
$token = bin2hex(
    random_bytes(32)
);

if (!hash_equals($tokenGuardado, $tokenRecibido)) {
    http_response_code(403);
    exit('Token incorrecto');
}
```

Este patrón aparecerá de nuevo cuando implementemos protección CSRF con un token asociado a la sesión.

#### Ejemplo 6 · Nombre de fichero generado por la aplicación

```php
$nombreSeguro = bin2hex(
    random_bytes(16)
) . '.pdf';
```

El nombre original proporcionado por el navegador no debe utilizarse como nombre final del fichero almacenado. Antes habrá que validar tamaño y **MIME real**.

#### Ejemplo 7 · Comprobar el MIME real de una subida

```php
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($rutaTemporal);

$permitidos = [
    'image/jpeg',
    'image/png',
    'application/pdf',
];

if (!is_string($mime)
    || !in_array($mime, $permitidos, true)) {
    exit('Tipo de fichero no permitido');
}
```

La extensión `.jpg` escrita en el nombre no demuestra que el contenido sea realmente una imagen JPEG.

#### Ejemplo 8 · Registrar un fallo sin mostrarlo al usuario

```php
error_log(
    'IAW Desk: error al guardar un ticket'
);
```

El mensaje que ve el usuario y el detalle técnico de diagnóstico no tienen por qué ser el mismo. Nunca escribiremos contraseñas, tokens de sesión ni credenciales SQL en un log.

> **Regla de estudio:** no memorices veinte firmas. Localiza la necesidad, busca la función adecuada en el manual, revisa sus parámetros y su valor de retorno, prueba un caso normal y uno límite y después intégrala en tu código.
{: .notice--info}

**Ejercicios 9.1–9.10.** Limpia y mide una cadena; divide una lista separada por comas y vuelve a unirla; diferencia `isset()` de `array_key_exists()` cuando el valor es `null`; valida un email; calcula las páginas necesarias para 73 registros a 10 por página; genera y verifica un hash de contraseña; genera un token aleatorio hexadecimal; compara dos tokens con `hash_equals()`; identifica el MIME real de un fichero de prueba; registra mediante `error_log()` una incidencia que no contenga información sensible.

---

## 10. Funciones propias y procedimientos {#funciones}

![Función con parámetros y valor devuelto]({{ '/assets/docencia/iaw/ut02/07_funciones.png' | relative_url }})

Una función da nombre a una operación reutilizable.

### 10.1. Definir y llamar

```php
function mostrarSaludo(): void
{
    echo 'Bienvenido a IAW';
}

mostrarSaludo();
```

Definir no es ejecutar.

### 10.2. Parámetro y argumento

```php
function saludar(string $nombre): string
{
    return 'Hola, ' . $nombre;
}

saludar('Ana');
```

`$nombre` es parámetro; `'Ana'` es argumento.

### 10.3. `return`, `echo` y «procedimiento»

```php
function sumar(int $a, int $b): int
{
    return $a + $b;
}
```

`return` entrega el resultado al llamador.

```php
function mostrarMensaje(string $texto): void
{
    echo $texto;
}
```

En terminología didáctica tradicional podemos llamar **procedimiento** a una función orientada a realizar una acción y sin valor de retorno útil. PHP no tiene una palabra `procedure`: sigue siendo una función, normalmente con retorno `void`.

### 10.4. Responsabilidad única

Preferimos:

```text
normalizarTexto()
validarTicket()
prioridadValida()
calcularImporte()
```

a una función `procesarTodo()` que lea POST, valide, consulte BBDD, genere HTML y escriba logs al mismo tiempo.

### 10.5. Tipos y `strict_types`

```php
declare(strict_types=1);

function calcularCoste(
    float $horas,
    float $tarifa
): float {
    return $horas * $tarifa;
}
```

El tipado ayuda a expresar contratos. **No sustituye la validación de la entrada HTTP.**

### 10.6. Parámetros opcionales

```php
function saludar(
    string $nombre,
    string $prefijo = 'Hola'
): string {
    return $prefijo . ', ' . $nombre;
}
```

### 10.7. Argumentos con nombre

```php
crearCodigo(
    modulo: 'IAW',
    puesto: 7,
    prefijo: 'TICKET'
);
```

Mejoran legibilidad en ciertos casos, aunque convierten los nombres de parámetros en parte práctica de la API.

### 10.8. Variádicos y desempaquetado

```php
function sumarTodo(int ...$numeros): int
{
    return array_sum($numeros);
}

echo sumarTodo(1, 2, 3);
```

Y:

```php
$valores = [4, 5, 6];
echo sumarTodo(...$valores);
```

### 10.9. Paso por valor

```php
function duplicar(int $numero): int
{
    return $numero * 2;
}

$original = 5;
$doble = duplicar($original);
```

`$original` sigue valiendo `5`.

### 10.10. Paso por referencia

```php
function incrementar(int &$numero): void
{
    $numero++;
}
```

El `&` permite modificar deliberadamente la variable del llamador. Para cálculos suele ser más claro `return`.

### 10.11. Arrays de entrada y salida

```php
function validarTicket(
    string $asunto,
    string $prioridad
): array {
    $errores = [];

    if (trim($asunto) === '') {
        $errores['asunto'] = 'Obligatorio';
    }

    if (
        !in_array(
            $prioridad,
            ['baja', 'media', 'alta'],
            true
        )
    ) {
        $errores['prioridad'] = 'No válida';
    }

    return $errores;
}
```

Las funciones booleanas son especialmente expresivas:

```php
function prioridadValida(string $prioridad): bool
{
    return in_array(
        $prioridad,
        ['baja', 'media', 'alta'],
        true
    );
}
```

### 10.12. Ámbito

Las variables declaradas dentro de una función tienen ámbito local.

Evitaremos `global` como mecanismo habitual; preferiremos parámetros y retornos.

### 10.13. Callbacks y `callable`

```php
function transformar(
    array $valores,
    callable $operacion
): array {
    return array_map($operacion, $valores);
}
```

Una función entregada a otra para que la ejecute es un **callback**.

Aparece en:

```text
array_map()
array_filter()
usort()
```

### 10.14. Funciones anónimas y closures

```php
$doble = function (int $n): int {
    return $n * 2;
};
```

Captura de variables externas:

```php
$iva = 0.21;

$calcular = function (float $base) use ($iva): float {
    return $base * (1 + $iva);
};
```

### 10.15. Arrow functions

```php
$doble = fn(int $n): int => $n * 2;
```

Son adecuadas para expresiones breves:

```php
$dobles = array_map(
    fn(int $n): int => $n * 2,
    [1, 2, 3]
);
```

### 10.16. Recursividad

```php
function factorial(int $n): int
{
    if ($n <= 1) {
        return 1;
    }

    return $n * factorial($n - 1);
}
```

Debe existir un caso base. La mayoría del proyecto no necesitará recursividad, pero conviene reconocerla.

### 10.17. Efectos secundarios y diseño

Una función puede modificar sesión, fichero, BBDD o argumentos por referencia. Cuando sea razonable preferiremos operaciones predecibles que reciban datos y devuelvan resultados.

Una buena función intenta tener:

```text
nombre claro
una responsabilidad
parámetros comprensibles
retorno conocido
pocos efectos secundarios
casos límite comprobables
```

### 10.18. Funciones que aparecerán en el proyecto

```text
normalizarTexto()
validarTicket()
prioridadValida()
puedeEditar()
generarNombreSeguro()
obtenerConexion()
buscarTickets()
crearTicket()
registrarAuditoria()
generarCsrfToken()
validarCsrf()
```

No las implementaremos todas ahora, pero debemos entender el patrón.

---

## 11. Modularidad: repartir responsabilidades {#modularidad}

![Tres archivos y sus responsabilidades: entrada, lógica y presentación]({{ '/assets/docencia/iaw/ut02/08_modulos.png' | relative_url }})

Una aplicación no debe crecer dentro de un único `index.php`.

```text
/srv/iaw/php/
├── public/
│   ├── index.php
│   └── procesar.php
├── src/
│   └── funciones.php
├── templates/
│   └── resultado.php
└── var/
    ├── data/
    ├── logs/
    └── uploads/
```

### 11.1. `include`, `require` y variantes `_once`

| Recurso | Idea |
|---|---|
| `include` | Incluye; el programa puede continuar tras ciertos fallos |
| `require` | El archivo es imprescindible |
| `include_once` | Incluye una vez |
| `require_once` | Requiere una vez |

```php
require_once
    __DIR__
    . '/../src/funciones.php';
```

### 11.2. `__DIR__`

Contiene el directorio del archivo actual y ayuda a construir rutas fiables.

### 11.3. Entrada, lógica y presentación

```text
public/procesar.php   → recibe HTTP
src/funciones.php     → lógica reutilizable
templates/*.php       → HTML
```

No buscamos muchos archivos: buscamos responsabilidades localizables.

---

## 12. Métodos y programación orientada a objetos {#poo}

Una **función** puede existir de forma independiente. Un **método** se declara dentro de una clase.

```php
trim($texto);          // función incorporada
normalizar($texto);    // función propia
$ticket->cerrar();     // método de instancia
Validador::email();    // método estático
```

![Distinción entre clase Ticket y dos objetos con estados independientes]({{ '/assets/docencia/iaw/ut02/09_objetos.png' | relative_url }})

### 12.1. Clase, objeto, propiedad y método

```php
class Ticket
{
    public string $asunto = '';

    public function resumen(): string
    {
        return 'Ticket: ' . $this->asunto;
    }
}
```

```php
$ticket = new Ticket();
$ticket->asunto = 'Apache no responde';

echo $ticket->resumen();
```

### 12.2. `$this`

Dentro de un método de instancia, `$this` representa el objeto concreto que ejecuta el método.

### 12.3. Constructor

```php
class Ticket
{
    public function __construct(
        public string $asunto,
        public string $estado = 'abierto'
    ) {
    }
}
```

La promoción de propiedades anterior es compacta; antes conviene comprender la versión explícita:

```php
public string $asunto;

public function __construct(string $asunto)
{
    $this->asunto = $asunto;
}
```

### 12.4. Visibilidad y encapsulación

```text
public     → accesible desde fuera
private    → solo desde la clase
protected  → clase y descendientes
```

```php
private string $estado = 'abierto';

public function cerrar(): void
{
    $this->estado = 'cerrado';
}
```

La encapsulación protege reglas del objeto.

### 12.5. Métodos que devuelven y métodos `void`

```php
public function resumen(): string
{
    return $this->asunto;
}
```

frente a:

```php
public function cerrar(): void
{
    $this->estado = 'cerrado';
}
```

### 12.6. Métodos estáticos y `::`

```php
class Validador
{
    public static function emailValido(string $email): bool
    {
        return filter_var(
            $email,
            FILTER_VALIDATE_EMAIL
        ) !== false;
    }
}
```

```php
Validador::emailValido('ana@example.com');
```

Un método `static` no dispone de `$this`.

### 12.7. `self::`, `parent::`, herencia y sobrescritura

```php
class Ticket
{
    public function etiqueta(): string
    {
        return 'Ticket';
    }
}

class IncidenciaCritica extends Ticket
{
    public function etiqueta(): string
    {
        return parent::etiqueta() . ' CRÍTICO';
    }
}
```

La clase hija sobrescribe el método. No construiremos jerarquías profundas sin necesidad.

### 12.8. Interfaces

```php
interface Exportable
{
    public function exportar(): string;
}
```

Una interfaz expresa un contrato que una clase puede implementar.

### 12.9. Traits

```php
trait MarcaTemporal
{
    public function ahoraIso(): string
    {
        return date(DATE_ATOM);
    }
}
```

Un trait permite reutilizar miembros entre clases sin crear una relación de herencia.

### 12.10. Métodos mágicos

Conviene reconocer:

```text
__construct()
__destruct()
__toString()
__get()
__set()
__call()
```

Dominaremos `__construct()`. El resto se estudiará cuando exista una necesidad real.

### 12.11. PHP no sobrecarga métodos por firma como Java

No declararemos dos métodos con el mismo nombre diferenciados únicamente por sus parámetros. PHP resuelve necesidades similares con parámetros opcionales, variádicos u otros mecanismos.

### 12.12. ¿Función o método?

Función:

```text
recibe datos → calcula/valida → devuelve
```

Método:

```text
la operación pertenece a un objeto concreto
```

Ejemplos:

```text
prioridadValida()      → función
normalizarTexto()      → función
$ticket->cerrar()      → método
$usuario->cambiarClave() → método
```

No todo necesita una clase.

### 12.13. Comprobación de aprendizaje

Debes poder explicar:

1. Función incorporada vs propia.
2. Procedimiento como función `void`.
3. Parámetro vs argumento.
4. `echo` vs `return`.
5. Paso por valor vs referencia.
6. Parámetro opcional, variádico y argumento con nombre.
7. Callback, función anónima y arrow function.
8. Función vs método.
9. `$this`.
10. Constructor y visibilidad.
11. Método de instancia vs estático.
12. Herencia, interfaz y trait a nivel de reconocimiento.
13. Por qué no todo debe convertirse en una clase.

**Ejercicios integradores.** Convierte validaciones repetidas en funciones; crea funciones que reciban y devuelvan arrays; prueba valor/referencia; utiliza `array_filter()` con callback; reescribe un callback simple mediante `fn`; separa validadores en `src/funciones.php`; crea una clase `Ticket` con constructor, `cerrar()` y `estaCerrado()`; compara `prioridadValida()` con `$ticket->cerrar()` y justifica su ubicación.

---

## 13. Persistencia ligera, logs y ficheros seguros {#ficheros}

Hasta ahora, las variables existen mientras se ejecuta una petición. Cuando termina el script, una variable normal desaparece. Antes de introducir MariaDB conviene conocer una forma de **persistencia sencilla**: guardar datos en el sistema de ficheros del servidor.

Un fichero puede ser útil para un registro de actividad, una configuración sencilla, una exportación o una pequeña colección de datos. No sustituye a una base de datos cuando necesitamos consultas complejas, relaciones, muchos accesos concurrentes o transacciones. Precisamente por eso resulta útil estudiarlo primero: nos permite distinguir **memoria, fichero, sesión y base de datos**.

| Mecanismo | ¿Sobrevive a otra petición? | ¿Dónde vive principalmente? | Uso didáctico |
|---|---|---|---|
| Variable PHP normal | No | Memoria del proceso durante la petición | Cálculos temporales |
| Fichero | Sí, mientras el almacenamiento permanezca | Disco del servidor | Logs, JSON, CSV, datos sencillos |
| Sesión | Sí, entre peticiones de una sesión | Servidor + identificador en cliente | Estado de navegación e identidad |
| Base de datos | Sí | SGBD | Datos estructurados y concurrentes |

### 13.1. Dónde guardar datos que no deben ser públicos

No escribiremos logs ni datos internos dentro del `DocumentRoot`. Amplía la estructura del proyecto:

```text
/srv/iaw/php/
├── public/
│   └── index.php        ← accesible por HTTP
├── src/
├── templates/
└── var/                 ← NO accesible directamente por HTTP
    ├── data/
    ├── logs/
    └── uploads/
```

En el laboratorio, el administrador puede preparar las carpetas con permisos de escritura para el usuario de desarrollo y para el grupo utilizado por el servicio web, sin recurrir a `chmod 777`:

```bash
sudo install -d -m 2770 -o "$USER" -g www-data /srv/iaw/php/var
sudo install -d -m 2770 -o "$USER" -g www-data /srv/iaw/php/var/data
sudo install -d -m 2770 -o "$USER" -g www-data /srv/iaw/php/var/logs
sudo install -d -m 2770 -o "$USER" -g www-data /srv/iaw/php/var/uploads
```

Después comprueba las rutas y permisos con `namei -l` y `ls -ld`. Si PHP-FPM no puede escribir, no abras los permisos a todo el sistema: identifica qué usuario/grupo ejecuta el proceso y corrige la propiedad o los permisos necesarios.

### 13.2. Primer fichero: escribir una línea

`file_put_contents()` permite escribir una cadena completa en un fichero. Empezaremos con un registro muy pequeño:

```php
<?php

$ruta = __DIR__ . '/../var/logs/app.log';
$linea = date('c') . " inicio_aplicacion\n";

$resultado = file_put_contents($ruta, $linea);

if ($resultado === false) {
    echo 'No se pudo escribir el log';
}
```

`date('c')` genera una fecha y hora en formato ISO 8601. `__DIR__` representa la carpeta del archivo PHP actual; al partir de un script situado en `public/`, `../var/logs/app.log` apunta fuera de la carpeta publicada.

**Atención:** sin opciones adicionales, `file_put_contents()` reemplaza el contenido anterior del fichero. Para un log normalmente queremos **añadir**, no borrar.

### 13.3. Añadir al final: un log acumulativo

```php
<?php

$ruta = __DIR__ . '/../var/logs/app.log';
$codigo = 'IAW-07';
$linea = date('c') . " ticket=$codigo accion=consulta\n";

$resultado = file_put_contents(
    $ruta,
    $linea,
    FILE_APPEND | LOCK_EX
);

if ($resultado === false) {
    http_response_code(500);
    echo 'No se pudo registrar la operación';
}
```

- `FILE_APPEND` añade la cadena al final en lugar de truncar el fichero.
- `LOCK_EX` solicita un bloqueo exclusivo durante la escritura para reducir problemas cuando dos escrituras coinciden.
- El valor devuelto es el número de bytes escritos o `false` si la operación falla.

Un bloqueo de fichero **no convierte un archivo de texto en una base de datos transaccional**. Sirve para un caso pequeño y controlado; después compararemos sus límites con MariaDB.

### 13.4. Leer un fichero de texto

`file_get_contents()` devuelve el contenido completo como cadena o `false` si no puede leerlo:

```php
<?php

$ruta = __DIR__ . '/../var/logs/app.log';
$contenido = file_get_contents($ruta);

if ($contenido === false) {
    http_response_code(500);
    exit('No se pudo leer el log');
}

echo '<pre>' . htmlspecialchars(
    $contenido,
    ENT_QUOTES | ENT_SUBSTITUTE,
    'UTF-8'
) . '</pre>';
```

Escapamos el texto antes de mostrarlo en HTML. Un log puede contener caracteres enviados por usuarios o por otros sistemas; no debemos convertir accidentalmente esas cadenas en marcado ejecutable.

### 13.5. Datos estructurados sencillos con JSON

Un log es una sucesión de líneas. Para conservar una pequeña estructura de datos podemos serializar un array como JSON. Supongamos que todavía no existe MariaDB y queremos guardar dos tickets de prueba:

```php
<?php

$tickets = [
    [
        'codigo' => 'IAW-07',
        'asunto' => 'Apache no responde',
        'estado' => 'abierto',
    ],
    [
        'codigo' => 'IAW-08',
        'asunto' => 'Error de acceso',
        'estado' => 'cerrado',
    ],
];

$json = json_encode(
    $tickets,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
);

if ($json === false) {
    exit('No se pudieron convertir los datos a JSON');
}

$ruta = __DIR__ . '/../var/data/tickets.json';

if (file_put_contents($ruta, $json, LOCK_EX) === false) {
    exit('No se pudieron guardar los datos');
}
```

`json_encode()` transforma el array PHP en texto JSON. Guardar ese texto permite recuperarlo en otra petición. Para leerlo:

```php
<?php

$ruta = __DIR__ . '/../var/data/tickets.json';
$contenido = file_get_contents($ruta);

if ($contenido === false) {
    exit('No se pudo leer el fichero de datos');
}

$tickets = json_decode($contenido, true);

if (!is_array($tickets)) {
    exit('El JSON no contiene la estructura esperada');
}

foreach ($tickets as $ticket) {
    echo htmlspecialchars(
        (string) ($ticket['codigo'] ?? 'sin-codigo'),
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8'
    ) . '<br>';
}
```

El segundo argumento `true` de `json_decode()` pide arrays asociativos. Aquí reutilizamos arrays y `foreach`: la persistencia no introduce otra forma de programar, sino otra **fuente y destino de los datos**.

### 13.6. `fopen`, modos de apertura y escritura por flujo

Las funciones anteriores resuelven muchos casos sencillos. Cuando necesitamos más control podemos abrir explícitamente un recurso con `fopen()`. Los modos básicos que conviene reconocer son:

| Modo | Significado | Riesgo principal |
|---|---|---|
| `r` | Solo lectura; el fichero debe existir | Falla si no existe |
| `w` | Escritura desde el principio | **Trunca** el contenido anterior |
| `a` | Escritura al final | Siempre añade |

Ejemplo equivalente de log con apertura en modo de anexado:

```php
<?php

$ruta = __DIR__ . '/../var/logs/app.log';
$recurso = fopen($ruta, 'a');

if ($recurso === false) {
    exit('No se pudo abrir el log');
}

fwrite($recurso, date('c') . " accion=prueba\n");
fclose($recurso);
```

Abrir, utilizar y cerrar explícitamente ayuda a comprender el ciclo de trabajo con un fichero. Para operaciones pequeñas preferiremos la solución más simple que permita controlar correctamente los errores.

### 13.7. Log de aplicación y log de errores no son lo mismo

Un **log de aplicación** puede registrar hechos previstos: creación de un ticket, cambio de estado o una importación. Un **log de errores** registra problemas técnicos que interesa diagnosticar. PHP ofrece `error_log()` para enviar un mensaje al mecanismo de registro configurado por el entorno:

```php
<?php

$ok = false;

if (!$ok) {
    error_log('IAW Desk: fallo controlado durante una prueba');
}
```

En nuestro laboratorio, según la configuración de Apache y PHP-FPM, esos mensajes podrán aparecer en los logs del sitio o del servicio. No debemos mostrar al usuario una traza interna completa cuando la aplicación está en un entorno de producción.

**Nunca registres contraseñas, cookies de sesión, claves API ni secretos de base de datos.** Un log también es un dato que debe protegerse, limitarse y rotarse cuando crece.

### 13.8. ¿Cuándo deja de ser buena idea un fichero?

Los ficheros son apropiados para aprender persistencia ligera y para algunos usos reales, especialmente logs, exportaciones y configuraciones. Empiezan a resultar incómodos cuando necesitamos:

- buscar y filtrar muchos registros;
- relacionar usuarios, tickets y estados;
- evitar actualizaciones concurrentes conflictivas;
- imponer restricciones como claves únicas;
- ejecutar varias operaciones como una unidad atómica;
- mantener índices, consultas y permisos de datos de forma estructurada.

Ese problema prepara la siguiente unidad: **UT03 introduce PDO y MariaDB**. No sustituimos un fichero porque sea «malo»; elegimos otro mecanismo porque cambian los requisitos.

**Ejercicios 13.1–13.8.** Escribe una línea con fecha en `app.log`; añade cinco operaciones sin borrar las anteriores; muestra el log escapado en una página; crea un contador persistente en un fichero; guarda un array de tickets en JSON; léelo y genera una lista HTML; provoca un JSON incorrecto y controla el fallo; explica qué datos guardarías en variable, fichero, sesión o base de datos y justifica cada decisión.

---


### 13.9. Subida de ficheros: `$_FILES` no basta por sí solo

Un formulario de subida necesita `enctype="multipart/form-data"`:

```html
<form method="post" enctype="multipart/form-data">
  <input type="file" name="adjunto">
  <button>Subir</button>
</form>
```

PHP expone la información recibida en `$_FILES`. Para un campo llamado `adjunto` aparecen datos como `name`, `tmp_name`, `error` y `size`. El nombre que envía el navegador es **un dato aportado por el cliente**, no un nombre de almacenamiento fiable.

La secuencia segura que utilizaremos en el Proyecto 1 será:

```text
$_FILES
   ↓
comprobar error
   ↓
comprobar tamaño
   ↓
detectar MIME real
   ↓
comprobar tipo permitido
   ↓
generar nombre interno
   ↓
move_uploaded_file()
   ↓
guardar metadatos
```

Ejemplo reducido:

```php
<?php

$fichero = $_FILES['adjunto'] ?? null;

if (!is_array($fichero)) {
    exit('No llegó el fichero');
}

if (($fichero['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    exit('Error durante la subida');
}

if ((int) $fichero['size'] > 2 * 1024 * 1024) {
    exit('Fichero demasiado grande');
}

$tmp = $fichero['tmp_name'] ?? '';

if (!is_string($tmp) || !is_uploaded_file($tmp)) {
    exit('La subida temporal no es válida');
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($tmp);

$permitidos = [
    'application/pdf' => 'pdf',
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
];

if (!is_string($mime) || !isset($permitidos[$mime])) {
    exit('Tipo no permitido');
}

$nombreInterno =
    bin2hex(random_bytes(16))
    . '.'
    . $permitidos[$mime];

$directorio =
    __DIR__
    . '/../var/uploads';

if (!is_dir($directorio) || !is_writable($directorio)) {
    error_log('IAW Desk: directorio de subidas no disponible');
    exit('No se puede almacenar el fichero');
}

$destino =
    $directorio
    . '/'
    . $nombreInterno;

if (!move_uploaded_file($tmp, $destino)) {
    error_log('IAW Desk: move_uploaded_file() ha fallado');
    exit('No se pudo almacenar el fichero');
}
```

**No confundas tres nombres:** el nombre original puede conservarse como metadato para mostrarlo al usuario; el fichero temporal lo crea PHP durante la subida; el nombre físico definitivo debe decidirlo la aplicación.

### 13.10. Descarga controlada: el cliente no debe escoger una ruta del servidor

No construiremos una descarga aceptando directamente:

```text
download.php?file=../../algo
```

La aplicación recibirá un **identificador lógico** y decidirá qué fichero corresponde a él después de comprobar identidad y permisos.

```text
GET /download.php?id=17
          ↓
validar id
          ↓
buscar metadatos
          ↓
comprobar autorización
          ↓
resolver ruta controlada
          ↓
enviar fichero
```

Cuando incorporemos MariaDB, los metadatos del adjunto —registro al que pertenece, nombre interno, nombre original, MIME, tamaño y propietario— podrán persistirse en la base de datos mientras los bytes permanecen en un almacenamiento controlado.

### 13.11. Qué papel tendrán los ficheros en el Proyecto 1

El requisito del proyecto no consiste únicamente en «subir un archivo». El alumno deberá poder explicar y demostrar:

- que existe un tamaño máximo;
- que se comprueba el MIME real;
- que el nombre físico no es el proporcionado por el navegador;
- que el fichero queda vinculado a un registro;
- que una descarga privada comprueba autorización;
- que los errores no exponen rutas internas innecesarias.

---

## 14. Estado entre peticiones: cookies, sesiones y autenticación {#estado}

![Relación entre peticiones HTTP, cookie de sesión y estado conservado en el servidor]({{ '/assets/docencia/iaw/ut02/11_estado_http.png' | relative_url }})

### 14.1. El problema: una petición PHP termina

Una variable PHP ordinaria vive durante una ejecución. Si cada petición ejecuta:

```php
<?php

$contador = 0;
$contador++;

echo $contador;
```

veremos `1` en cada recarga. La nueva petición vuelve a empezar desde el principio.

```text
PETICIÓN 1                    PETICIÓN 2
GET /pagina.php               GET /pagina.php
      ↓                             ↓
PHP comienza                  PHP comienza de nuevo
      ↓                             ↓
$contador = 0                 $contador = 0
      ↓                             ↓
respuesta                     respuesta
      ↓                             ↓
FIN                           FIN
```

Para recordar información entre peticiones necesitamos mecanismos específicos.

### 14.2. Primero: cookies

Una **cookie** es un pequeño dato que el navegador conserva y puede enviar en peticiones posteriores.

```text
RESPUESTA
Set-Cookie: tema=oscuro
        ↓
NAVEGADOR
guarda tema=oscuro
        ↓
PETICIÓN POSTERIOR
Cookie: tema=oscuro
        ↓
PHP
$_COOKIE['tema']
```

Crear una cookie:

```php
<?php

setcookie('tema', 'oscuro', [
    'expires' => time() + 3600,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);
```

`setcookie()` prepara una **cabecera HTTP de respuesta**. Por eso no debemos pensar que la nueva cookie aparecerá inmediatamente en `$_COOKIE` durante la misma ejecución: normalmente PHP la verá cuando el navegador la devuelva en una petición posterior.

> **Orden importante:** `setcookie()`, `header()` y el inicio de una sesión que necesite enviar su cookie deben ejecutarse antes de haber enviado contenido al navegador. Si aparece `headers already sent`, busca primero HTML, `echo`, espacios o saltos de línea enviados demasiado pronto.
{: .notice--warning}

### 14.3. Opciones importantes de una cookie

| Opción | Idea |
|---|---|
| `expires` | momento de caducidad |
| `path` | rutas en las que se enviará |
| `domain` | dominio al que pertenece |
| `secure` | solo se envía mediante HTTPS |
| `httponly` | JavaScript no puede leerla mediante las API habituales |
| `samesite` | limita determinados envíos entre sitios |

En un laboratorio HTTP local no podemos exigir siempre `secure=true`; en una web pública bajo HTTPS sí debe valorarse.

### 14.4. Una cookie procede del cliente: validar antes de utilizar

El usuario puede inspeccionar o modificar sus cookies. Por ello una preferencia debe validarse igual que otros datos externos:

```php
<?php

$permitidos = ['claro', 'oscuro'];

$tema = $_COOKIE['tema'] ?? 'claro';

if (
    !is_string($tema)
    ||
    !in_array($tema, $permitidos, true)
) {
    $tema = 'claro';
}
```

Una cookie puede ser útil para preferencias no sensibles. **No guardaremos contraseñas ni `password_hash` en cookies.**

### 14.5. Eliminar una cookie

Pedimos al navegador que reemplace la cookie por otra equivalente con caducidad pasada:

```php
<?php

setcookie('tema', '', [
    'expires' => time() - 3600,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);
```

El `path` y los atributos de alcance deben ser coherentes con los utilizados al crearla.

### 14.6. De la cookie a la sesión

Una sesión PHP utiliza normalmente una cookie para transportar un **identificador**, mientras los datos de `$_SESSION` se mantienen del lado servidor según el almacenamiento configurado.

```text
NAVEGADOR
PHPSESSID=abc123
        │
        ▼
SERVIDOR
sesión abc123
visitas = 4
user_id = 7
role = usuario
```

Cookie y sesión no son sinónimos:

| Aspecto | Cookie | Sesión |
|---|---|---|
| Dato principal | navegador | servidor |
| El cliente puede modificarlo directamente | sí | no directamente |
| Uso típico | preferencias / identificadores | estado de aplicación |
| Contraseña | no | tampoco |

### 14.7. `session_start()` y `$_SESSION`

Antes de iniciar una sesión debemos conocer también la política de su cookie. En un sitio servido exclusivamente mediante HTTPS podríamos preparar:

```php
<?php

ini_set('session.use_strict_mode', '1');

session_set_cookie_params([
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
]);

session_start();
```

En un laboratorio que todavía utilice HTTP, `secure => true` impediría que el navegador devolviera esa cookie por HTTP. **No desactives seguridad por costumbre:** adapta este atributo al entorno y exige HTTPS cuando la aplicación pase a un escenario público.

Para crear o recuperar una sesión:

```php
<?php

session_start();

$_SESSION['visitas']
    = ($_SESSION['visitas'] ?? 0) + 1;

echo $_SESSION['visitas'];
```

Cada script que necesite los datos de esa sesión debe iniciarla antes de utilizarlos.

### 14.8. Compartir datos entre páginas

`guardar.php`:

```php
<?php

session_start();

$_SESSION['modulo'] = 'IAW';

echo '<a href="consultar.php">Consultar</a>';
```

`consultar.php`:

```php
<?php

session_start();

$modulo = $_SESSION['modulo'] ?? 'Sin módulo';

echo htmlspecialchars(
    is_string($modulo)
        ? $modulo
        : 'Sin módulo'
);
```

Prueba la misma secuencia en una ventana privada: normalmente utilizará un contexto de cookies diferente.

### 14.9. Diagnosticar una sesión

Podemos observar:

```php
<?php

session_start();

var_dump([
    'name' => session_name(),
    'id' => session_id(),
    'status' => session_status(),
    'cookie' => session_get_cookie_params(),
]);
```

El objetivo es comprender el mecanismo, no manipular manualmente IDs.

### 14.10. Duración: cookie, datos de sesión y caché son conceptos distintos

No debemos mezclar:

| Concepto | Qué controla |
|---|---|
| cookie de sesión | cuánto conserva el navegador el identificador |
| datos de sesión del servidor | ciclo de vida según almacenamiento/configuración |
| caché HTTP | cuánto puede almacenarse una respuesta en caché |
| timeout de la aplicación | regla creada por nuestro código |

Por ejemplo, una política explícita de inactividad:

```php
<?php

const MAX_INACTIVIDAD = 900;

$ahora = time();

if (
    isset($_SESSION['ultima_actividad'])
    &&
    $ahora - (int) $_SESSION['ultima_actividad']
        > MAX_INACTIVIDAD
) {
    $_SESSION = [];
    session_destroy();

    exit('Sesión cerrada por inactividad');
}

$_SESSION['ultima_actividad'] = $ahora;
```

### 14.11. Sesión, autenticación y autorización no son lo mismo

![Relación entre sesión, autenticación y autorización]({{ '/assets/docencia/iaw/ut02/03_sesion_autorizacion.svg' | relative_url }})

| Concepto | Pregunta |
|---|---|
| Sesión | ¿cómo conservamos estado? |
| Autenticación | ¿quién eres? |
| Autorización | ¿puedes ejecutar esta acción? |

Una sesión puede existir sin que nadie haya iniciado sesión.

Después de verificar unas credenciales:

```php
<?php

session_start();

session_regenerate_id();

$_SESSION['user'] = [
    'id' => 7,
    'username' => 'ana',
    'role' => 'usuario',
];
```

No necesitamos guardar contraseña ni hash en `$_SESSION`.

La regeneración se realiza **después de verificar las credenciales y antes de guardar el estado autenticado**. En este ejemplo no utilizamos `session_regenerate_id(true)`: borrar inmediatamente los datos asociados al identificador anterior puede provocar problemas en peticiones concurrentes o conexiones inestables. La política completa de caducidad se controla con timestamps y configuración de sesión, no únicamente destruyendo IDs.

### 14.12. Modularizar autenticación

En lugar de repetir la misma comprobación en cada página podemos crear `src/auth.php`:

```php
<?php

function currentUser(): ?array
{
    $user = $_SESSION['user'] ?? null;

    return is_array($user)
        ? $user
        : null;
}

function requireLogin(): void
{
    if (currentUser() === null) {
        header('Location: /login.php', true, 303);
        exit;
    }
}

function requireRole(string $role): void
{
    requireLogin();

    if ((currentUser()['role'] ?? null) !== $role) {
        http_response_code(403);
        exit('Acceso denegado');
    }
}
```

Una página privada podrá limitarse a:

```php
session_start();

require_once __DIR__ . '/../src/auth.php';

requireLogin();
```

y una página administrativa:

```php
requireRole('admin');
```

Esto conecta directamente con la programación modular estudiada anteriormente.

### 14.13. Ocultar un botón no es autorización

Podemos ocultar el enlace de administración a un usuario normal, pero alguien puede escribir la URL manualmente. La comprobación de permisos debe ejecutarse **en el servidor**.

Más adelante también comprobaremos la propiedad del recurso:

```text
usuario autenticado
      ↓
rol
      ↓
owner_id del registro
      ↓
¿puede modificar ESTE recurso?
```

### 14.14. Logout completo

Un cierre de sesión debe distinguir datos, cookie identificadora y almacenamiento de sesión:

```php
<?php

session_start();

$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();

    setcookie(session_name(), '', [
        'expires' => time() - 42000,
        'path' => $params['path'],
        'domain' => $params['domain'],
        'secure' => $params['secure'],
        'httponly' => $params['httponly'],
        'samesite' => $params['samesite'] ?? 'Lax',
    ]);
}

session_destroy();

header('Location: /login.php', true, 303);
exit;
```

### 14.15. Seguridad básica de la cookie de sesión

Debemos reconocer conceptos como:

- `HttpOnly`;
- `Secure` bajo HTTPS;
- `SameSite`;
- `session.use_only_cookies`;
- `session.use_strict_mode`.

No se trata de memorizar directivas; hay que comprender qué riesgo pretende reducir cada una.

### 14.16. Primer contacto con CSRF

Las sesiones también nos permiten guardar un token que viaje oculto en formularios de modificación:

```php
<?php

session_start();

if (!isset($_SESSION['csrf'])) {
    $_SESSION['csrf']
        = bin2hex(random_bytes(32));
}
```

Formulario:

```html
<input
  type="hidden"
  name="csrf"
  value="<?= htmlspecialchars($_SESSION['csrf']) ?>"
>
```

Al recibir POST:

```php
$tokenSesion = $_SESSION['csrf'] ?? null;
$tokenRecibido = $_POST['csrf'] ?? null;

if (
    !is_string($tokenSesion)
    || !is_string($tokenRecibido)
    || !hash_equals($tokenSesion, $tokenRecibido)
) {
    http_response_code(403);
    exit('Token CSRF incorrecto');
}
```

Lo desarrollaremos de nuevo cuando las operaciones CRUD modifiquen datos persistentes.

### 14.17. Puente hacia PDO y MariaDB

Ahora los usuarios de demostración pueden estar definidos temporalmente en PHP. Con PDO cambia la **fuente de los datos**, no el concepto:

```text
POST login
   ↓
SELECT usuario con PDO
   ↓
password_verify()
   ↓
session_regenerate_id()
   ↓
$_SESSION['user']
   ↓
autorización
```

---

## 15. Correo electrónico desde PHP con PHPMailer {#email}

El correo electrónico es una funcionalidad complementaria. No sustituye a la persistencia ni debe bloquear el aprendizaje del Proyecto 1. Lo utilizaremos para comprender cómo una aplicación PHP se integra con otro servicio.

### 15.1. Primero: separar preparación de mensaje y transporte

Antes de hablar de SMTP debemos poder:

1. recibir un formulario;
2. validar nombre, dirección, asunto y mensaje;
3. construir el contenido;
4. registrar errores;
5. solo entonces intentar el envío.

Durante la explicación podemos simular el envío escribiendo un log:

```php
<?php

$linea =
    date('c')
    . ' | correo preparado'
    . ' | '
    . $email
    . PHP_EOL;

file_put_contents(
    __DIR__ . '/../var/logs/mail.log',
    $linea,
    FILE_APPEND | LOCK_EX
);
```

Así distinguimos la lógica de nuestra aplicación de los problemas de red, DNS, TLS, autenticación SMTP o disponibilidad del proveedor.

### 15.2. PHPMailer como biblioteca

Para trabajar con una biblioteca mantenida utilizaremos Composer. Primero comprueba que el comando existe:

```bash
composer --version
```

Desde la raíz del proyecto:

```bash
composer require phpmailer/phpmailer
composer show phpmailer/phpmailer
```

Composer crea o actualiza `composer.json`, `composer.lock` y el directorio `vendor/`. En una aplicación conviene conservar `composer.json` y `composer.lock` en el repositorio y regenerar dependencias mediante `composer install`; `vendor/` es código generado por Composer y normalmente no es necesario versionarlo.

Cargaremos las clases mediante el autoloader:

```php
<?php

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require __DIR__ . '/../vendor/autoload.php';

$mail = new PHPMailer(true);
```

Aquí reaparecen conceptos de POO: `PHPMailer` es una clase, `$mail` es un objeto y `isSMTP()`, `addAddress()` o `send()` son métodos. El argumento `true` hace que PHPMailer pueda lanzar excepciones que después controlaremos.

> Si Composer todavía no está preparado en el laboratorio, el envío real queda como ampliación. No descargues copias aleatorias de la biblioteca ni incrustes clases manualmente sin comprender su procedencia.
{: .notice--info}

### 15.3. Las credenciales no pertenecen al código

No escribiremos en el repositorio:

```php
$mail->Password = 'mi-clave-real';
```

La aplicación leerá configuración externa:

```php
$host = getenv('SMTP_HOST');
$user = getenv('SMTP_USER');
$pass = getenv('SMTP_PASS');
```

El mismo principio se reutilizará para credenciales de MariaDB.

### 15.4. Ejemplo de transporte SMTP

Antes de crear el objeto, comprobamos que la configuración mínima existe. No queremos descubrir un `false` de `getenv()` varias líneas después:

```php
<?php

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require __DIR__ . '/../vendor/autoload.php';

$host = getenv('SMTP_HOST');
$user = getenv('SMTP_USER');
$pass = getenv('SMTP_PASS');
$from = getenv('SMTP_FROM');
$to = getenv('SMTP_TO');

if (
    !is_string($host) || $host === ''
    || !is_string($user) || $user === ''
    || !is_string($pass) || $pass === ''
    || !is_string($from) || $from === ''
    || !is_string($to) || $to === ''
) {
    throw new RuntimeException(
        'Falta configuración SMTP'
    );
}

$mail = new PHPMailer(true);

try {
    $mail->CharSet = 'UTF-8';

    $mail->isSMTP();
    $mail->Host = $host;
    $mail->SMTPAuth = true;
    $mail->Username = $user;
    $mail->Password = $pass;

    $mail->SMTPSecure =
        PHPMailer::ENCRYPTION_STARTTLS;

    $mail->Port =
        (int) (getenv('SMTP_PORT') ?: 587);

    $mail->setFrom(
        $from,
        'IAW · Aplicación'
    );

    $mail->addAddress($to);

    $mail->isHTML(true);
    $mail->Subject = 'Prueba IAW';
    $mail->Body = '<p>Mensaje HTML</p>';
    $mail->AltBody = 'Mensaje en texto plano';

    $mail->send();

    echo 'Correo enviado';
} catch (Exception $e) {
    error_log(
        'IAW Desk: fallo durante el envío SMTP'
    );

    http_response_code(502);
    echo 'No se pudo enviar la notificación';
}
```

El ejemplo utiliza STARTTLS y el puerto `587` porque es una configuración habitual, **no una regla universal**. Utiliza siempre los parámetros del servidor SMTP de laboratorio o del proveedor. No desactives la verificación TLS como forma de «arreglar» un error de certificados.

En el laboratorio se utilizarán únicamente credenciales proporcionadas para la práctica o un servidor de pruebas. No utilizaremos contraseñas personales incrustadas en el proyecto.

### 15.5. Adjuntos: validar antes de enviar

Un fichero recibido no se convierte automáticamente en adjunto válido. Primero aplicaremos las mismas comprobaciones de subida segura:

```text
error
↓
tamaño
↓
MIME real
↓
tipo permitido
↓
añadir a PHPMailer
```

Una notificación por correo es una consecuencia de una operación; el dato principal seguirá persistiendo en la aplicación. En el Proyecto 1, un fallo de SMTP **no debe deshacer silenciosamente una operación de negocio que ya se confirmó en la base de datos**. La aplicación debe decidir y documentar qué ocurre si la notificación falla.

### 15.6. Errores

Ante un fallo de correo:

```text
usuario
→ mensaje comprensible

log
→ detalle técnico
```

No mostraremos contraseñas, rutas sensibles ni configuración SMTP.

### 15.7. Qué debes ser capaz de explicar

- diferencia entre preparar un mensaje y transportarlo por SMTP;
- por qué usamos una biblioteca;
- relación entre PHPMailer y POO;
- por qué las credenciales deben estar fuera del código;
- por qué un adjunto debe validarse;
- por qué el fallo del correo no debe corromper los datos principales de la aplicación.

---

## 16. Banco de ejercicios progresivos {#ejercicios}

Los ejemplos resueltos de los apartados anteriores muestran **cómo razonar cada construcción**. Los ejercicios siguientes permiten practicar sin limitarse a copiar el ejemplo: primero realizan una modificación pequeña, después plantean una variación y finalmente integran varias técnicas conocidas.

**Regla de personalización.** Donde se indique `NN`, utiliza tu número de puesto con dos cifras: `07`, `12`, `25`… Por ejemplo, el ticket del puesto 07 se identifica como `IAW-07`. Esta variable modifica los datos de prueba, no la dificultad del ejercicio. No incluyas contraseñas reales ni datos personales de terceras personas en los repositorios.

### Bloque A · Primeros programas, variables y operadores

1. Crea `01_saludo.php` e imprime una presentación utilizando `echo` y una etiqueta `<h1>`.
2. Declara nombre, módulo, puesto y edad como variables; muestra una frase completa.
3. Define dos números distintos y muestra suma, resta, producto y división si el segundo no es cero.
4. Calcula el importe de una intervención con horas y tarifa; añade un IVA constante.
5. Calcula la media aritmética de tres notas y muéstrala con dos decimales.
6. Convierte una cantidad de segundos a minutos y segundos restantes mediante `/`, `intdiv()` y `%`; compara sus resultados.
7. Comprueba con `var_dump` qué diferencias hay entre `'8'`, `8`, `8.0` y `true`.
8. Define una cadena con el código `IAW-NN`; concatena descripción y prioridad de una incidencia.

### Bloque B · Condiciones

9. Con `if` simple muestra un aviso si la temperatura supera un límite.
10. Amplía el ejercicio anterior a `if/else` para informar en ambos casos.
11. Clasifica una nota en suspenso, aprobado, notable o sobresaliente mediante `elseif`.
12. Calcula el recargo de horas extraordinarias solo cuando se supera un límite fijado.
13. Comprueba con `&&` si el número pertenece a un rango y con `||` si corresponde a uno de dos casos especiales.
14. Construye una calculadora que no divida por cero.
15. Reescribe una clasificación de prioridad usando `switch`, una vez que funcione mediante `elseif`.

### Bloque C · Repeticiones y colecciones

16. Genera los números del 1 hasta `NN` mediante `for`.
17. Muestra los múltiplos de tres sin utilizar HTML repetido a mano.
18. Calcula el factorial de un entero pequeño mediante un acumulador.
19. Genera la tabla de multiplicar de tu número de puesto.
20. Crea un array de notas, recórrelo con `foreach` y muestra la media.
21. Crea un array asociativo con los datos de un ticket `IAW-NN`.
22. Construye un array con varios tickets y cuenta cuántos siguen abiertos.
23. Genera una tabla HTML a partir de ese array sin copiar y pegar filas.
24. Identifica en un código dado un bucle que no termina y explica qué variable debe actualizarse.

### Bloque D · Funciones, modularidad y ficheros

25. Implementa `esPar(int $n): bool` y pruébala con valores pares e impares.
26. Implementa `calcularImporte(float $horas, float $tarifa): float`.
27. Implementa `contarAbiertos(array $tickets): int`.
28. Separa dos funciones en `src/funciones.php` y utilízalas desde `public/index.php`.
29. Extrae un fragmento repetido de HTML a `templates/cabecera.php`.
30. Crea `var/logs/app.log` y añade una línea con fecha, código `IAW-NN` y una acción de prueba.
31. Añade varias líneas al log utilizando `FILE_APPEND | LOCK_EX` y demuestra que no se borra el contenido anterior.
32. Lee el log y muéstralo dentro de `<pre>` escapando su contenido.
33. Guarda un pequeño array de tickets en `var/data/tickets.json` y recupéralo en otra ejecución.
34. Explica qué limitaciones tendría ese JSON si veinte usuarios intentasen actualizar tickets simultáneamente.

### Bloque E · Primeros objetos

35. Crea la clase `Ticket`; instancia dos objetos con asuntos diferentes.
36. Añade un método que cierre un ticket sin dejar modificar libremente su estado.
37. Añade un constructor y demuestra que dos objetos conservan valores independientes.
38. Explica mediante un esquema qué responsabilidad corresponde a cada archivo, fichero de datos o clase.

### Bloque F · Formularios y estado

39. Crea `formulario.php` y `procesar.php`: el primero muestra un campo `asunto` y el segundo recibe el POST.
40. Convierte el ejercicio anterior en un único `formulario.php` que muestre y procese los datos según `$_SERVER['REQUEST_METHOD']`.
41. Dibuja las peticiones HTTP de ambos ejercicios y explica por qué «mismo fichero» no significa «misma petición».
42. Conserva el valor escrito en el formulario cuando la validación detecte un error.
43. Valida en PHP que el asunto no sea una cadena vacía ni un array.
44. Añade prioridad y comprueba que pertenezca a la lista permitida.
45. Realiza una petición GET de búsqueda a la misma página y compara sus datos con el POST de creación.
46. Recibe un `input type="number"`, demuestra con `var_dump` qué llega y valida el entero en servidor.
47. Muestra un asunto que contenga `<b>` y comprueba que aparece como texto mediante `htmlspecialchars`.
48. Extrae la normalización y validación del asunto a funciones propias.
49. Registra en un log una operación de formulario válida sin guardar datos sensibles.
50. Crea un contador de sesión independiente de un contador local reiniciado en cada petición.
51. Guarda y recupera una preferencia no sensible mediante cookie.
52. Integra un formulario validado y una página de confirmación **sin** almacenar todavía el ticket en MariaDB.

> **Antes de entregar o publicar una aplicación:** comprueba al menos el caso esperado, el caso incorrecto y un valor límite; explica qué ocurre y por qué. No es suficiente obtener una captura de pantalla de un resultado casualmente correcto.
{: .notice--info}

---


### Bloque G · Seguridad, correo y ficheros seguros

53. Manipula manualmente una cookie de preferencia y demuestra por qué el servidor debe validar también su contenido.
54. Implementa un login temporal separado en `login.php`, `panel.php` y `src/auth.php`; protege una página con `requireLogin()` y otra con `requireRole('admin')`.
55. Añade logout y un timeout de inactividad. Explica qué problema resuelve cada mecanismo.
56. Añade un token CSRF a un formulario POST e intenta enviarlo después de modificar el token desde las herramientas del navegador.
57. Configura las opciones de la cookie de sesión y justifica `HttpOnly`, `SameSite` y el uso de `Secure` cuando exista HTTPS.
58. Crea un formulario de contacto que valide los datos y simule el correo mediante un log. Como ampliación, sustituye el simulador por PHPMailer y SMTP de laboratorio.
59. Sube un PDF/JPEG/PNG validando error, tamaño y MIME real; genera un nombre interno aleatorio y almacénalo fuera de `public/`.
60. Diseña una descarga controlada que reciba un ID lógico y nunca una ruta arbitraria proporcionada por el cliente.
61. Explica qué información de cookies, sesiones y ficheros permanecerá cuando el proyecto migre a MariaDB y qué información pasará a la base de datos.

---

## 17. Diagnóstico y buenas prácticas {#diagnostico}

Los errores proporcionan información sobre **qué capa** está fallando. No empieces a modificar PHP si todavía no has comprobado que la página correcta llega al servidor.

| Síntoma | Primera comprobación |
|---|---|
| No conecta por SSH | IP de Debian, red, servidor SSH y credenciales. |
| El navegador no accede al sitio | IP, DNS/hosts, Apache y VirtualHost. |
| Aparece el PHP como texto | La integración con PHP-FPM no se está aplicando correctamente. Suspende la publicación. |
| HTTP 404 | Nombre de archivo, ruta y `DocumentRoot`. |
| HTTP 500 | `php -l`, registro de error de Apache y registro de PHP-FPM. |
| `Undefined array key` | Una clave que estás consultando no existe en el array. |
| `TypeError` | Una función recibió un tipo no admitido o una operación no puede realizarse con ese dato. |
| El resultado numérico es incorrecto | Comprueba asignaciones, precedencia y tipos con una traza. |
| El bucle no termina | Busca la condición de salida y la variable que debería actualizarse. |
| Los datos desaparecen en otra página | Revisa primero qué se conserva por petición y qué se ha guardado en sesión. |
| `headers already sent` | Busca salida enviada antes de `header()`, `setcookie()` o del inicio de sesión. |
| La sesión desaparece | Comprueba `session_start()`, cookie de sesión, `path`, `Secure`, `SameSite` y timeout. |
| La subida falla | Revisa `$_FILES['error']`, límites PHP, tamaño, MIME, ruta y permisos de `var/uploads/`. |
| El correo no sale | Separa primero lógica de aplicación de DNS, puerto, TLS, autenticación y disponibilidad SMTP. |

Comandos básicos desde la terminal remota:

```bash
php -l public/01_hola.php
php -v
sudo apache2ctl configtest
sudo systemctl status apache2
sudo systemctl status php8.4-fpm
sudo tail -n 30 /var/log/apache2/error.log
```

Los nombres de servicio y las rutas de registros pueden variar según la instalación y el VirtualHost. No necesitas ejecutar todos los comandos ante cualquier error: selecciona la prueba que corresponda al síntoma.

**Reglas que conservaremos en las siguientes unidades:** utilizar variables descriptivas; comprobar casos límite; separar cálculos de presentación cuando aporte claridad; no confiar en datos del navegador; no publicar secretos; evitar editar como `root` o dar permisos `777`; escapar contenido no confiable al generar HTML; y comprender la responsabilidad de cada servicio antes de reiniciarlo.

---

## 18. Glosario y referencias {#fuentes}

| Término | Significado breve |
|---|---|
| Intérprete | Programa que ejecuta instrucciones PHP. |
| CLI | Ejecución desde la terminal. |
| PHP-FPM | Gestor de procesos que ejecuta PHP en el servicio web. |
| Variable | Identificador al que asignamos un valor. |
| Expresión | Combinación de datos y operadores que produce un resultado. |
| Booleano | Valor verdadero o falso. |
| Condición | Expresión que permite decidir qué bloque ejecutar. |
| Bucle | Estructura que repite instrucciones. |
| Array | Colección de valores accesibles mediante claves. |
| Función | Bloque reutilizable que puede recibir argumentos y devolver un valor. |
| Clase / objeto | Modelo y una instancia concreta de ese modelo. |
| GET / POST | Métodos de petición HTTP con usos distintos. |
| Cookie | Dato gestionado por el navegador y enviado bajo ciertas condiciones. |
| Fichero persistente | Archivo del servidor que conserva información entre ejecuciones mientras permanezca el almacenamiento. |
| Log | Registro cronológico de eventos o errores utilizado para operación y diagnóstico. |
| JSON | Formato textual estructurado que puede representar arrays y objetos simples. |
| Sesión | Estado asociado a peticiones relacionadas, administrado por el servidor. |
| Función incorporada | Función proporcionada por PHP que reutilizamos conociendo parámetros, retorno y casos límite. |
| Callback | Función o `callable` entregado a otra operación para que pueda ejecutarlo. |
| Autenticación | Proceso de comprobar la identidad de un usuario. |
| Autorización | Decisión sobre si una identidad puede realizar una acción concreta. |
| CSRF | Ataque que intenta provocar una acción autenticada desde una petición no deseada; se mitiga, entre otras medidas, con tokens y políticas de cookie. |
| MIME | Tipo de contenido utilizado para identificar la naturaleza de datos o ficheros; en subidas debe comprobarse del lado servidor. |
| Composer | Gestor de dependencias utilizado para instalar y reproducir bibliotecas PHP. |
| SMTP | Protocolo utilizado para transportar correo electrónico entre sistemas. |

**Documentación para ampliar y contrastar ejemplos:**

- [Manual oficial de PHP: introducción y sintaxis](https://www.php.net/manual/es/language.basic-syntax.php).
- [Variables, tipos de datos y operadores](https://www.php.net/manual/es/language.variables.php), [tipos](https://www.php.net/manual/es/language.types.php) y [operadores](https://www.php.net/manual/es/language.operators.php).
- [Estructuras de control de PHP](https://www.php.net/manual/es/language.control-structures.php).
- [Arrays](https://www.php.net/manual/es/language.types.array.php) y [`foreach`](https://www.php.net/manual/es/control-structures.foreach.php).
- [Funciones](https://www.php.net/manual/es/language.functions.php) y [clases/objetos](https://www.php.net/manual/es/language.oop5.php).
- [Superglobales](https://www.php.net/manual/es/language.variables.superglobals.php), [`htmlspecialchars`](https://www.php.net/manual/es/function.htmlspecialchars.php) y [sesiones](https://www.php.net/manual/es/book.session.php).
- [PHP: seguridad de sesiones](https://www.php.net/manual/es/features.session.security.management.php), [`setcookie()`](https://www.php.net/manual/es/function.setcookie.php) y [`session_regenerate_id()`](https://www.php.net/manual/es/function.session-regenerate-id.php).
- [PHP: subida de ficheros](https://www.php.net/manual/es/features.file-upload.php), [`move_uploaded_file()`](https://www.php.net/manual/es/function.move-uploaded-file.php) y [Fileinfo](https://www.php.net/manual/es/book.fileinfo.php).
- [Composer: uso básico](https://getcomposer.org/doc/01-basic-usage.md).
- [PHPMailer: repositorio y documentación oficial](https://github.com/PHPMailer/PHPMailer).
- [VS Code Remote - SSH](https://code.visualstudio.com/docs/remote/ssh).
- [OWASP: prevención de XSS](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).
- [OWASP: prevención de CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

**Continuación:** UT03 · PHP y bases de datos. Tras dominar variables, control de flujo, funciones, formularios y estado, incorporaremos PDO y MariaDB para conservar datos de manera estructurada y duradera.

