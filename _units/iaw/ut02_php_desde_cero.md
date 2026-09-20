---
title: "UT02 · Introducción a PHP: de los primeros programas a una aplicación web"
description: "PHP desde cero: ejecución en servidor, variables, tipos, operadores, condiciones, bucles, arrays, funciones, modularidad, POO, formularios, cookies y sesiones."
summary: "Aprender a razonar, escribir, ejecutar y comprobar pequeños programas PHP antes de construir una aplicación web con estado."

module_key: iaw
cycle_key: asir
order: 2
module_title: "Implantación de Aplicaciones Web"
module_code: "0376"
cycle_title: "Administración de Sistemas Informáticos en Red"
course: "2.º ASIR"
unit: "UT02"
level: "iniciacion"

authors:
  - fjcano
reviewers:
  - fjcano
rights: all-rights-reserved
version: "3.0"
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
  - servidor
  - programacion-estructurada
  - funciones
  - poo
  - formularios
  - sesiones
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
  - title: Funciones
    id: funciones
  - title: Organizar varios archivos
    id: modularidad
  - title: Primeros objetos
    id: poo
  - title: Formularios y PHP
    id: formularios
  - title: Cookies y sesiones
    id: estado
  - title: Ejercicios progresivos
    id: ejercicios
  - title: Diagnóstico y buenas prácticas
    id: diagnostico
  - title: Glosario y referencias
    id: fuentes
---

# UT02 · Introducción a PHP: de los primeros programas a una aplicación web

## Qué aprenderás {#objetivos}

Una página HTML es un documento que el navegador interpreta y muestra. Una aplicación web puede necesitar **calcular un precio, escoger qué contenido mostrar, procesar los datos de un formulario o recordar qué usuario ha iniciado sesión**. PHP permite desarrollar esa lógica en el servidor.

En esta unidad aprenderemos PHP desde sus elementos más sencillos. No es necesario haber programado antes en PHP; sí conviene recordar la estructura básica de HTML y los atributos `name`, `action` y `method` de los formularios. Comenzaremos con valores escritos directamente en el código. Cuando esos valores ya no presenten dificultades, aprenderemos a recibirlos del navegador.

**Resultado de aprendizaje relacionado: RA5 — Genera documentos web utilizando lenguajes de guiones de servidor.** Los criterios de evaluación vinculados a la unidad se identifican en el frontmatter. La programación orientada a objetos se introduce aquí como una herramienta para comprender bibliotecas y aplicaciones PHP; no supone un resultado de aprendizaje adicional.

![Camino de aprendizaje: primer PHP, datos, decisiones, bucles, colecciones, funciones, objetos y web]({{ '/assets/docencia/iaw/ut02/01_ruta_aprendizaje.svg' | relative_url }})

**Método de trabajo.** En cada apartado encontraremos una pregunta inicial, un ejemplo corto explicado línea a línea, una prueba de escritorio (predecir el resultado), ejercicios graduados y una comprobación de lo aprendido. Una vez dominados esos elementos los utilizaremos juntos para desarrollar una aplicación sencilla de gestión de incidencias, *IAW Desk*.

> **Distingue dos cosas:** aprender la sintaxis de PHP y aprender a implantar una aplicación PHP. En IAW necesitamos ambas, pero avanzaremos de la primera a la segunda de manera gradual.
{: .notice--info}

---

## 1. Dónde y cómo ejecutamos PHP {#entorno}

### 1.1. Cliente, servidor y lenguaje del lado servidor

Imagina que escribimos en el navegador la dirección de una página llamada `hola.php`. El navegador **no interpreta las instrucciones PHP**. Realiza una petición HTTP al servidor web; allí se ejecuta PHP, se genera una respuesta y el navegador muestra el contenido recibido.

![Recorrido de una petición PHP, desde el navegador al servidor y de vuelta]({{ '/assets/docencia/iaw/ut02/02_peticion_php.svg' | relative_url }})

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

![Cómo cambia el contenido de una variable al asignarle y actualizarle un valor]({{ '/assets/docencia/iaw/ut02/03_asignacion.svg' | relative_url }})

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

**Ejercicios 4.1–4.9.** Calcula el área de rectángulo y círculo; transforma Celsius a Fahrenheit; calcula el porcentaje de ocupación de un aula; convierte segundos a horas/minutos/segundos; calcula el importe de horas extraordinarias partiendo de valores fijos; demuestra la diferencia entre concatenar y sumar; predice cinco comparaciones con `var_dump`; modifica una factura mediante `+=` y `-=`; comprueba qué ocurre con `/` y `%` en casos distintos de cero.

---

## 5. Decisiones: `if`, `else` y `elseif`, sin saltarnos pasos {#condiciones}

Hasta ahora los programas han ejecutado las instrucciones en el orden en el que están escritas. Pero una aplicación debe tomar decisiones: **¿hay que mostrar una alerta? ¿la prioridad es alta? ¿el divisor es válido?**

![Evolución desde if simple a if/else y elseif]({{ '/assets/docencia/iaw/ut02/04_condicionales.svg' | relative_url }})

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

### 5.4. Operadores lógicos: combinar condiciones

A veces una decisión exige comprobar **varias condiciones simultáneamente**:

| Operador | Se lee | Resultado verdadero cuando… |
|---|---|---|
| `&&` | Y | Ambas condiciones son verdaderas. |
| `||` | O | Al menos una es verdadera. |
| `!` | NO | Se invierte el resultado booleano. |

Ejemplo con `&&`:

```php
<?php

$edad = 19;
$autorizado = true;

if ($edad >= 18 && $autorizado === true) {
    echo 'Acceso permitido';
}
```

Ejemplo con `||`:

```php
<?php

$prioridad = 'alta';
$servicioCaido = false;

if ($prioridad === 'alta' || $servicioCaido === true) {
    echo 'Revisar inmediatamente';
}
```

Ejemplo con `!`:

```php
<?php

$activo = false;

if (!$activo) {
    echo 'Cuenta desactivada';
}
```

**Cortocircuito:** con `&&`, si la primera condición ya es falsa, PHP no necesita evaluar la segunda para decidir el resultado. Con `||`, si la primera ya es verdadera, tampoco necesita comprobar la segunda.

### 5.5. Solo ahora: un `if` anidado

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

### 5.6. Comprobación práctica: evitar dividir entre cero

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

### 5.7. `switch` y `match`: opciones para más adelante

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

![Estructuras for y while: inicialización, condición, cuerpo y actualización]({{ '/assets/docencia/iaw/ut02/05_bucles.svg' | relative_url }})

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

![Array indexado con las posiciones cero, uno y dos]({{ '/assets/docencia/iaw/ut02/06_arrays.svg' | relative_url }})

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

## 8. Funciones: reutilizar lo que ya sabemos programar {#funciones}

Hemos escrito cálculos que pueden necesitarse en varios lugares. Si copiamos el mismo bloque una y otra vez, cualquier corrección tendrá que repetirse. Una **función** da nombre a una operación y permite utilizarla con distintos datos.

### 8.1. Primero, una función sin parámetros

```php
<?php

function mostrarSaludo(): void {
    echo 'Bienvenido a IAW';
}

mostrarSaludo();
```

**Partes de la función:**

| Fragmento | Función |
|---|---|
| `function` | Indica que estamos definiendo una función. |
| `mostrarSaludo` | Es su nombre. |
| `()` | Zona reservada a parámetros; por ahora no recibe ninguno. |
| `: void` | Indica que no devuelve un valor mediante `return`. |
| `{ ... }` | Contiene las instrucciones que ejecutará al llamarla. |
| `mostrarSaludo();` | Invoca la función. |

**Definir no es ejecutar:** si escribimos la definición pero nunca llamamos a `mostrarSaludo()`, el mensaje no aparecerá.

### 8.2. Una función con parámetros

Ahora queremos saludar a distintas personas. En vez de definir varias funciones, recibimos el nombre como **parámetro**:

```php
<?php

function saludar(string $nombre): void {
    echo 'Hola, ' . $nombre . '<br>';
}

saludar('Ana');
saludar('Luis');
```

Al llamar `saludar('Ana')`, el valor `'Ana'` se entrega al parámetro `$nombre`. En la segunda llamada se entrega `'Luis'`. El **parámetro** es la variable declarada en la función; el **argumento** es el dato con el que la llamamos.

### 8.3. La diferencia entre `echo` y `return`

Una función puede **mostrar** un resultado o **devolverlo** para que otras partes del programa lo utilicen. No es lo mismo:

```php
<?php

function sumar(int $a, int $b): int {
    return $a + $b;
}

$resultado = sumar(4, 5);
echo $resultado; // 9
```

Aquí sucede lo siguiente:

1. `sumar(4, 5)` ejecuta la función con `$a = 4` y `$b = 5`.
2. `return $a + $b;` devuelve `9` al lugar de la llamada.
3. `$resultado` recibe ese `9`.
4. `echo $resultado;` lo muestra.

![Función con parámetros y valor devuelto]({{ '/assets/docencia/iaw/ut02/07_funciones.svg' | relative_url }})

Esta separación será útil cuando una aplicación necesite mostrar una cantidad en pantalla, guardarla en un archivo o enviarla a otro sistema: **el cálculo no tiene por qué decidir cómo se presenta**.

### 8.4. Tipos de los parámetros y valor devuelto

```php
<?php

declare(strict_types=1);

function calcularCoste(float $horas, float $tarifa): float {
    return $horas * $tarifa;
}

$total = calcularCoste(2.5, 18.0);
echo $total; // 45
```

`float` indica que esperamos números con parte decimal (también se aceptan enteros en los contextos compatibles de PHP). `: float` indica qué tipo devolverá la función. `declare(strict_types=1);` permite utilizar un modo más estricto para ciertas conversiones automáticas de tipos en las llamadas realizadas desde ese archivo; **no sustituye la validación de formularios**.

### 8.5. Parámetros opcionales

```php
<?php

function saludar(string $nombre, string $prefijo = 'Hola'): string {
    return $prefijo . ', ' . $nombre;
}

echo saludar('Ana');             // Hola, Ana
echo saludar('Ana', 'Buenos días'); // Buenos días, Ana
```

Cuando falta el segundo argumento, la función utiliza el valor predeterminado `'Hola'`.

### 8.6. Ámbito local: una variable dentro y otra fuera

```php
<?php

$tarifa = 20;

function calcularDoble(int $numero): int {
    $resultado = $numero * 2;
    return $resultado;
}

echo calcularDoble(3); // 6
// $resultado pertenece a la función; no se utiliza aquí fuera.
```

Las variables definidas dentro de una función tienen normalmente **ámbito local**. Para comunicar un resultado al resto del programa utilizaremos `return` en lugar de depender de variables globales.

### 8.7. Caso resuelto: de un bloque repetido a una función

**Situación.** Debemos calcular el importe de una intervención para distintas parejas de horas y tarifas. Sin funciones podríamos copiar varias veces `$horas * $tarifa`. Con una función centralizamos la operación:

```php
<?php

declare(strict_types=1);

function calcularImporte(float $horas, float $tarifa): float {
    return $horas * $tarifa;
}

$importeAna = calcularImporte(2.0, 20.0);
$importeLuis = calcularImporte(3.5, 25.0);

echo 'Ana: ' . $importeAna . ' €<br>';
echo 'Luis: ' . $importeLuis . ' €';
```

**Prueba de escritorio:** indica el valor de ambos importes, modifica solo la segunda tarifa y comprueba qué salida cambia.

**Ejercicios 8.1–8.12.** Escribe `saludar`; convierte una cantidad de minutos a segundos; crea `esPar(int): bool`; crea `areaRectangulo`; crea `calcularIVA`; crea `mayorDeDos`; crea `factorial` con `for`; crea `esPrimo`; crea `contarAbiertos(array): int`; modifica una función para recibir un parámetro opcional; separa una función de cálculo de su `echo`; prueba cada función con un valor típico y uno límite. **No necesitas POO para realizar estos ejercicios.**

---

## 9. Organizar una aplicación con varios archivos {#modularidad}

Una página pequeña puede escribirse en un único `.php`. Cuando crece, resulta conveniente separar **el archivo al que entra la petición, las funciones reutilizables y el HTML de presentación**.

### 9.1. Nuestro primer proyecto modular

```text
/srv/iaw/php/
├── public/
│   └── index.php
├── src/
│   └── calculos.php
└── templates/
    └── resultado.php
```

En `src/calculos.php`:

```php
<?php

declare(strict_types=1);

function calcularImporte(float $horas, float $tarifa): float {
    return $horas * $tarifa;
}
```

En `public/index.php`:

```php
<?php

require_once __DIR__ . '/../src/calculos.php';

$importe = calcularImporte(3.0, 22.5);

require __DIR__ . '/../templates/resultado.php';
```

En `templates/resultado.php`:

```php
<!doctype html>
<html lang="es">
<head><meta charset="UTF-8"><title>Resultado</title></head>
<body>
    <h1>Importe del servicio</h1>
    <p><?= number_format($importe, 2, ',', '.') ?> €</p>
</body>
</html>
```

![Tres archivos y sus responsabilidades: entrada, lógica y presentación]({{ '/assets/docencia/iaw/ut02/08_modulos.svg' | relative_url }})

**¿Qué ocurre en orden?** Apache solicita `public/index.php`; el PHP de entrada carga `src/calculos.php`; ejecuta `calcularImporte`; guarda el importe; y carga la plantilla que generará el HTML.

### 9.2. `include`, `require`, `_once` y `__DIR__`

| Recurso | Para qué sirve |
|---|---|
| `include 'archivo.php';` | Carga otro archivo; si falla, emite una advertencia y el programa puede continuar. |
| `require 'archivo.php';` | Carga un archivo necesario; si falla, se detiene la ejecución. |
| `require_once 'archivo.php';` | Evita cargarlo más de una vez en la misma petición. |
| `__DIR__` | Carpeta en la que se encuentra el archivo actual; ayuda a construir rutas fiables. |

Para las funciones indispensables del proyecto usaremos normalmente `require_once`. La estructura modular **no exige crear decenas de archivos sin razón**; exige que sea fácil localizar una responsabilidad.

**Ejercicios 9.1–9.5.** Divide una calculadora en `index.php` y `src/calculos.php`; añade una plantilla HTML; mueve el CSS a `public/css/`; comprueba con el navegador que `src/` no está publicado directamente; cambia una tarifa y señala qué archivo debe modificarse y cuáles deben permanecer iguales.

---

## 10. Primeros pasos en programación orientada a objetos {#poo}

Hasta ahora hemos agrupado instrucciones en funciones. En aplicaciones mayores también puede ser útil reunir **datos y operaciones relacionadas** en un mismo tipo de objeto. Lo estudiaremos con un ejemplo pequeño, sin comenzar directamente por herencia o interfaces.

### 10.1. De un ticket descrito con variables a una clase

Un ticket puede tener datos como `asunto` y `estado`, y comportamientos como `cerrar()`. La **clase** define el modelo; el **objeto** es una instancia concreta creada a partir de ese modelo.

![Distinción entre clase Ticket y dos objetos con estados independientes]({{ '/assets/docencia/iaw/ut02/09_objetos.svg' | relative_url }})

Primero vamos a escribir una clase muy sencilla:

```php
<?php

class Ticket {
    public string $asunto = '';
}

$ticket1 = new Ticket();
$ticket1->asunto = 'No carga Apache';

$ticket2 = new Ticket();
$ticket2->asunto = 'Error de contraseña';

echo $ticket1->asunto; // No carga Apache
```

**Lectura:**

- `class Ticket` define el tipo de objetos que podemos crear.
- `public string $asunto` define una propiedad donde cada objeto podrá guardar texto.
- `new Ticket()` crea un objeto distinto cada vez.
- `->` permite acceder a una propiedad o llamar a un método de ese objeto.

Aunque ambos objetos pertenecen a la clase `Ticket`, **cada uno tiene su propio asunto**.

### 10.2. Métodos: una acción que puede realizar el objeto

```php
<?php

class Ticket {
    public string $asunto = '';

    public function mostrarResumen(): string {
        return 'Ticket: ' . $this->asunto;
    }
}

$ticket = new Ticket();
$ticket->asunto = 'No carga Apache';

echo $ticket->mostrarResumen();
```

`$this` representa **el objeto concreto cuyo método se está ejecutando**. Si existen dos objetos, `$this->asunto` puede contener un valor distinto en cada uno.

### 10.3. Constructor: datos al crear el objeto

No queremos crear primero un ticket vacío y después recordar que hay que asignarle siempre su asunto. Un **constructor** permite establecer sus valores iniciales:

```php
<?php

class Ticket {
    public string $asunto;
    public string $estado;

    public function __construct(string $asunto, string $estado = 'abierto') {
        $this->asunto = $asunto;
        $this->estado = $estado;
    }

    public function resumen(): string {
        return $this->asunto . ' (' . $this->estado . ')';
    }
}

$ticket = new Ticket('Apache no responde');
echo $ticket->resumen(); // Apache no responde (abierto)
```

El constructor recibe el argumento `$asunto` y **lo guarda en la propiedad del mismo nombre de este objeto** mediante `$this->asunto = $asunto;`. Observa que **el parámetro `$asunto` y la propiedad `$this->asunto` no son lo mismo**: la variable del parámetro existe durante la llamada, mientras la propiedad pertenece al objeto. El segundo argumento es opcional porque tiene un valor por defecto. PHP también ofrece una sintaxis más corta llamada *promoción de propiedades*; conviene conocer primero esta versión explícita.

### 10.4. Encapsulación: no permitir cualquier cambio

Si un programa puede cambiar libremente `$estado` a `'volando'`, el objeto representará una situación sin sentido. Podemos ocultar la propiedad y ofrecer métodos controlados:

```php
<?php

class Ticket {
    private string $asunto;
    private string $estado = 'abierto';

    public function __construct(string $asunto) {
        $this->asunto = $asunto;
    }

    public function cerrar(): void {
        $this->estado = 'cerrado';
    }

    public function resumen(): string {
        return $this->asunto . ' (' . $this->estado . ')';
    }
}

$ticket = new Ticket('Error de acceso');
$ticket->cerrar();
echo $ticket->resumen(); // Error de acceso (cerrado)
```

La propiedad `private` solo puede modificarse directamente desde la clase. El método público `cerrar()` expresa una acción reconocible. **Encapsular** no significa esconder todo sin criterio: significa exponer operaciones que conserven las reglas del objeto.

### 10.5. Antes de añadir más POO, comprueba estos conceptos

| Concepto | Pregunta que debes poder responder |
|---|---|
| Clase | ¿Qué modelo representa `Ticket`? |
| Objeto | ¿Qué crea `new Ticket()`? |
| Propiedad | ¿Dónde guarda un ticket su asunto? |
| Método | ¿Qué hace `cerrar()`? |
| Constructor | ¿Cómo llegan los valores iniciales? |
| `$this` | ¿A qué objeto se refiere? |
| `public` / `private` | ¿Quién puede acceder al miembro? |

**Ampliación de lectura.** La herencia con `extends` permite especializar una clase; una interfaz con `implements` define operaciones que distintas clases deben proporcionar. Las veremos cuando tengamos una necesidad concreta, no antes de comprender la clase anterior. Composer y los frameworks aparecerán después: son herramientas para organizar aplicaciones, no sustitutos de la comprensión del lenguaje.

**Ejercicios 10.1–10.8.** Crea dos objetos `Modulo`; añade una propiedad y un método; crea un `Ticket` con asunto obligatorio; implementa `cerrar()` y `reabrir()`; prueba dos objetos que cambian independientemente; sustituye una propiedad pública por una privada; crea un método de resumen sin HTML; explica por qué una clase `Ticket` no debería encargarse también de configurar Apache.

---
## 11. Recuperamos el formulario HTML: PHP recibe datos {#formularios}

Ahora sí es el momento de utilizar el formulario creado en el repaso de HTML. Ya conocemos variables, arrays asociativos, condiciones, bucles, funciones y organización por archivos. Así podremos comprender **qué datos llegan, cómo comprobarlos y qué respuesta generar**.

![Del campo name en HTML a la clave del array POST en PHP]({{ '/assets/docencia/iaw/ut02/10_formularios.svg' | relative_url }})

### 11.1. Un formulario muy pequeño

Crea `public/formulario.html`:

```html
<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Formulario de prueba</title>
</head>
<body>
    <form action="procesar.php" method="post">
        <label for="nombre">Nombre</label>
        <input type="text" id="nombre" name="nombre" required>
        <button type="submit">Enviar</button>
    </form>
</body>
</html>
```

Distingue tres atributos:

| Atributo | Función |
|---|---|
| `id="nombre"` | Identifica ese control dentro del HTML y lo asocia al `label`. |
| `name="nombre"` | Define la **clave** con la que se enviará su valor. |
| `action="procesar.php"` | Señala el recurso al que el navegador enviará el formulario. |

`method="post"` indica el método HTTP utilizado para enviar los datos. **No cifra por sí mismo el contenido**: para proteger el transporte de información sensible se utiliza HTTPS.

### 11.2. PHP recibe el valor mediante `$_POST`

Crea `public/procesar.php`:

```php
<?php

$nombre = $_POST['nombre'] ?? '';

echo 'Hola, ' . htmlspecialchars(
    $nombre,
    ENT_QUOTES | ENT_SUBSTITUTE,
    'UTF-8'
);
```

`$_POST` es un **array superglobal** que contiene valores recibidos normalmente en el cuerpo de una petición de formulario POST. **No es una función ni un objeto**, y sus claves dependen de los nombres `name` que se hayan enviado.

| En HTML | En PHP |
|---|---|
| `name="nombre"` | `$_POST['nombre']` |
| `name="email"` | `$_POST['email']` |
| `name="prioridad"` | `$_POST['prioridad']` |

El operador `?? ''` evita asumir que la clave existe: utiliza una cadena vacía si falta o es nula. Una entrada HTTP no debe considerarse automáticamente correcta o segura.

### 11.3. GET y POST: dos formas de enviar valores

Cambia **temporalmente** el método del formulario a `get`, envía `Ana` y observa la URL:

```text
http://php07.iaw.test/procesar.php?nombre=Ana
```

Con `method="get"`, el programa consultaría `$_GET['nombre']`. Con `method="post"`, los datos se envían normalmente en el cuerpo de la petición y se consultan mediante `$_POST['nombre']`.

| Aspecto | GET | POST |
|---|---|---|
| Uso frecuente | Consulta, búsqueda, filtros y navegación. | Envío de formularios que producen cambios. |
| Dónde viajan valores de formulario típicos | En la cadena de consulta de la URL. | En el cuerpo de la petición. |
| ¿Aparecen en la barra de direcciones? | Normalmente, sí. | Normalmente, no. |
| ¿Cifra el contenido? | No. HTTPS protege el transporte en ambos casos. |

**Experimento:** utiliza las herramientas del navegador → *Network* → selecciona la petición y compara `Request Method`, URL y los datos enviados. Vuelve después a POST y adapta `procesar.php` a `$_POST`.

### 11.4. Validación paso a paso

En el formulario podemos escribir `required`, pero el navegador no es una frontera de confianza. Un usuario puede modificar HTML, desactivar validaciones o enviar peticiones construidas por otros medios.

Primero validaremos **un solo campo**. Además de comprobar su contenido, comprobaremos que recibimos el tipo esperado:

```php
<?php

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Este recurso espera un formulario POST');
}

$valor = $_POST['nombre'] ?? '';

if (!is_string($valor)) {
    http_response_code(422);
    exit('Nombre no válido');
}

$nombre = trim($valor);

if ($nombre === '') {
    http_response_code(422);
    exit('Debes escribir tu nombre');
}

echo 'Hola, ' . htmlspecialchars(
    $nombre,
    ENT_QUOTES | ENT_SUBSTITUTE,
    'UTF-8'
);
```

**Recorrido:** (1) comprobar el método; (2) leer la clave; (3) comprobar el tipo; (4) eliminar espacios iniciales y finales; (5) rechazar contenido vacío; (6) mostrar el texto como HTML seguro. Con `name="nombre[]"` podría llegar un array en lugar de una cadena, por lo que no conviene llamar a `trim()` sin comprobar el tipo de un valor externo.

### 11.5. Un formulario de tickets con varios campos

Cuando el primer formulario funcione, añade `asunto`, `prioridad` y `descripcion`. La prioridad debe seleccionarse entre las opciones admitidas:

```php
<?php

$prioridad = $_POST['prioridad'] ?? '';
$permitidas = ['baja', 'media', 'alta'];

if (!is_string($prioridad) || !in_array($prioridad, $permitidas, true)) {
    http_response_code(422);
    exit('Prioridad no permitida');
}
```

`in_array(..., true)` utiliza comparación estricta. **No basta con que un `select` HTML presente solo tres opciones**: el servidor tiene que controlar los valores realmente recibidos.

Los checkbox no marcados normalmente **no envían su clave**. Por eso, para una casilla de confirmación:

```php
<?php

$acepta = ($_POST['acepta'] ?? '') === 'si';
```

En HTML es conveniente declarar expresamente `value="si"` para que el valor esperado sea conocido.

### 11.6. Validar, escapar y almacenar son tres responsabilidades distintas

- **Validar:** ¿el asunto no está vacío?, ¿la prioridad pertenece a las opciones?, ¿el email tiene el formato requerido?
- **Escapar al mostrar HTML:** ¿el asunto enviado se representará como texto aunque contenga etiquetas?
- **Almacenar:** ¿dónde permanecerá el ticket cuando otra petición lo necesite? Esto se desarrollará en la UT03 mediante PDO y MariaDB.

Ejemplo de salida HTML segura:

```php
<?php

$asunto = '<b>Problema de acceso</b>';

echo htmlspecialchars(
    $asunto,
    ENT_QUOTES | ENT_SUBSTITUTE,
    'UTF-8'
);
```

El navegador mostrará literalmente `<b>Problema de acceso</b>` como texto, en lugar de interpretarlo como una etiqueta del usuario. `htmlspecialchars` sirve para **escapar en un contexto HTML apropiado**; no valida una dirección de correo ni sustituye las consultas preparadas SQL.

### 11.7. Qué hacer después de un POST correcto

Una aplicación que recibe un formulario puede redirigir al navegador a una página de confirmación para evitar que actualizar la página reenvíe accidentalmente el mismo POST. El patrón se conoce como **POST/Redirect/GET (PRG)**.

```php
<?php

// Fragmento que se ejecuta únicamente tras validar y procesar el POST.
header('Location: confirmado.php', true, 303);
exit;
```

`header()` debe ejecutarse **antes de enviar contenido** que comprometa las cabeceras HTTP; después de enviar la redirección, `exit` impide continuar la ejecución. No pondremos este fragmento en el primer formulario hasta entender sus pasos previos.

**Ejercicios 11.1–11.10.** Procesa un nombre; explica `id` frente a `name`; compara GET y POST; procesa un número entero válido; calcula un área a partir de formulario; valida la nota 0…10; comprueba casilla marcada/desmarcada; rechaza una prioridad inventada; recupera los valores de un formulario tras un error; procesa un ticket con nombre, asunto y prioridad mostrando los datos escapados. **No utilizaremos aún una base de datos.**

---

## 12. Estado entre peticiones: cookies y sesiones {#estado}

### 12.1. ¿Qué ocurre cuando visitamos otra página?

Una petición web no conserva automáticamente las variables PHP de una petición anterior. Por ejemplo, si un script ejecuta `$visitas = 1;` en cada petición, el valor vuelve a empezar cuando se solicita otra vez la página.

Este comportamiento plantea preguntas reales: ¿cómo recordar la preferencia de idioma?, ¿cómo reconocer que dos peticiones pertenecen al mismo navegador?, ¿cómo mantener una identidad autenticada?

![Tres peticiones HTTP y relación entre cookie de sesión y datos en servidor]({{ '/assets/docencia/iaw/ut02/11_estado_http.svg' | relative_url }})

### 12.2. Primera pieza: una cookie de preferencia

Una cookie es un pequeño dato que el servidor solicita guardar al navegador y que este puede devolver en peticiones posteriores, de acuerdo con sus políticas y configuración.

Ejemplo simplificado de una preferencia **no sensible**:

```php
<?php

setcookie('tema', 'oscuro', [
    'expires' => time() + 3600,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);

echo 'Preferencia enviada al navegador';
```

**Lectura de las opciones:** `expires` indica una fecha de caducidad expresada como marca temporal; `time() + 3600` representa aproximadamente una hora desde ahora. `path` indica las rutas del sitio a las que se enviará; `httponly` impide que JavaScript del navegador acceda a la cookie mediante las API habituales; `samesite` limita determinados envíos entre sitios. Una cookie de preferencia no debe utilizarse como mecanismo de autenticación.

`setcookie()` prepara una cabecera HTTP. La cookie no tiene por qué aparecer inmediatamente en `$_COOKIE` durante esa misma petición; normalmente se leerá cuando el navegador la envíe en una petición posterior:

```php
<?php

$tema = $_COOKIE['tema'] ?? 'claro';

echo 'Tema: ' . htmlspecialchars(
    is_string($tema) ? $tema : 'claro',
    ENT_QUOTES | ENT_SUBSTITUTE,
    'UTF-8'
);
```

En una web pública con HTTPS, deberá valorarse además la opción `'secure' => true` para cookies que solo deban viajar por conexiones cifradas. Los navegadores pueden eliminar cookies antes de su caducidad prevista. **Nunca guardes contraseñas ni hashes de contraseña en cookies de preferencias.**

### 12.3. Segunda pieza: una sesión en el servidor

PHP proporciona `$_SESSION`, un array donde podemos conservar datos entre peticiones pertenecientes a la misma sesión.

Crea `public/contador.php`:

```php
<?php

session_start();

$_SESSION['visitas'] = ($_SESSION['visitas'] ?? 0) + 1;

echo 'Número de visitas de esta sesión: ' . $_SESSION['visitas'];
```

**Primera visita:** si no existe `visitas`, `?? 0` toma cero y se suma una unidad. **Segunda visita con la misma sesión:** se recupera el valor anterior y vuelve a incrementarse.

El identificador de sesión viaja normalmente en una cookie, mientras que los datos de `$_SESSION` se conservan del lado servidor según el almacenamiento configurado. **Una sesión no es una base de datos duradera ni equivale por sí sola a una cuenta autenticada.**

### 12.4. Dos páginas que comparten una sesión

Archivo `public/guardar.php`:

```php
<?php

session_start();

$_SESSION['modulo'] = 'IAW';

echo '<a href="consultar.php">Consultar otra página</a>';
```

Archivo `public/consultar.php`:

```php
<?php

session_start();

$modulo = $_SESSION['modulo'] ?? 'Sin módulo';

echo htmlspecialchars(
    is_string($modulo) ? $modulo : 'Sin módulo',
    ENT_QUOTES | ENT_SUBSTITUTE,
    'UTF-8'
);
```

Observa que ambos archivos llaman a `session_start()` porque cada petición necesita abrir o recuperar la sesión. Pruébalo también en una ventana privada: normalmente utilizará cookies separadas.

### 12.5. Inicio de sesión, autorización y cierre

Una aplicación puede utilizar una sesión para recordar la identidad **después de comprobar las credenciales**. Debemos diferenciar:

| Concepto | Pregunta |
|---|---|
| Autenticación | ¿Quién eres y cómo se ha comprobado? |
| Autorización | ¿Puedes realizar esta operación sobre este recurso? |
| Sesión | ¿Cómo se conserva el estado entre peticiones relacionadas? |

Después de un login correctamente verificado se debe regenerar el identificador de sesión para dificultar ataques de fijación:

```php
<?php

// Fragmento: solo después de verificar las credenciales.
session_start();
session_regenerate_id(true);
$_SESSION['usuario_id'] = 7;
```

Para almacenar y verificar contraseñas cuando llegue el bloque de persistencia utilizaremos `password_hash()` y `password_verify()`, **no contraseñas en texto claro**. En un sistema real la autorización debe comprobarse en cada operación; ocultar un botón no impide acceder directamente a una URL.

Para cerrar la sesión de forma completa habrá que eliminar sus datos, invalidarla y tratar adecuadamente su cookie de identificación. `session_destroy()` elimina los datos de sesión del almacenamiento, pero no borra automáticamente todas las variables ya presentes en memoria ni la cookie del navegador. El cierre completo se practicará como una operación diferenciada.

**Ejercicios 12.1–12.7.** Crea un contador; compara la primera y segunda visita; abre otra ventana privada; guarda el nombre de un módulo y recupéralo en otra página; implementa una preferencia visual sin guardar datos sensibles; explica qué ocurre cuando no llega la cookie; distingue autenticación de autorización en un supuesto de tickets de dos usuarios.

---

## 13. Banco de ejercicios progresivos {#ejercicios}

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

### Bloque D · Funciones, modularidad y objetos

25. Implementa `esPar(int $n): bool` y pruébala con valores pares e impares.
26. Implementa `calcularImporte(float $horas, float $tarifa): float`.
27. Implementa `contarAbiertos(array $tickets): int`.
28. Separa dos funciones en `src/funciones.php` y utilízalas desde `public/index.php`.
29. Extrae un fragmento repetido de HTML a `templates/cabecera.php`.
30. Crea la clase `Ticket`; instancia dos objetos con asuntos diferentes.
31. Añade un método que cierre un ticket sin dejar modificar libremente su estado.
32. Explica mediante un esquema qué responsabilidad corresponde a cada archivo o clase.

### Bloque E · Formularios y estado

33. Reutiliza el formulario HTML ya construido para enviar el asunto de una incidencia.
34. Valida en PHP que el asunto no sea una cadena vacía ni un array.
35. Añade prioridad y comprueba que pertenezca a la lista permitida.
36. Realiza una petición GET de búsqueda y compara sus datos con el POST de creación.
37. Muestra un asunto que contenga `<b>` y comprueba que aparece como texto.
38. Crea un contador de sesión independiente de un contador local reiniciado en cada petición.
39. Guarda y recupera una preferencia no sensible mediante cookie.
40. Integra un formulario validado y una página de confirmación **sin** almacenar todavía el ticket en MariaDB.

> **Antes de entregar o publicar una aplicación:** comprueba al menos el caso esperado, el caso incorrecto y un valor límite; explica qué ocurre y por qué. No es suficiente obtener una captura de pantalla de un resultado casualmente correcto.
{: .notice--info}

---

## 14. Diagnóstico y buenas prácticas {#diagnostico}

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

## 15. Glosario y referencias {#fuentes}

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
| Sesión | Estado asociado a peticiones relacionadas, administrado por el servidor. |

**Documentación para ampliar y contrastar ejemplos:**

- [Manual oficial de PHP: introducción y sintaxis](https://www.php.net/manual/es/language.basic-syntax.php).
- [Variables, tipos de datos y operadores](https://www.php.net/manual/es/language.variables.php), [tipos](https://www.php.net/manual/es/language.types.php) y [operadores](https://www.php.net/manual/es/language.operators.php).
- [Estructuras de control de PHP](https://www.php.net/manual/es/language.control-structures.php).
- [Arrays](https://www.php.net/manual/es/language.types.array.php) y [`foreach`](https://www.php.net/manual/es/control-structures.foreach.php).
- [Funciones](https://www.php.net/manual/es/language.functions.php) y [clases/objetos](https://www.php.net/manual/es/language.oop5.php).
- [Superglobales](https://www.php.net/manual/es/language.variables.superglobals.php), [`htmlspecialchars`](https://www.php.net/manual/es/function.htmlspecialchars.php) y [sesiones](https://www.php.net/manual/es/book.session.php).
- [VS Code Remote - SSH](https://code.visualstudio.com/docs/remote/ssh).
- [OWASP: prevención de XSS](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

**Continuación:** [UT03 · PHP y bases de datos]({{ '/docencia/asir/iaw/ut03/' | relative_url }}). Después de comprender variables, control de flujo, funciones, formularios y estado, incorporaremos PDO y MariaDB para conservar datos de manera estructurada y duradera.
