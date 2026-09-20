---
title: "UT03 · PHP y MariaDB desde cero con PDO"
description: "Evolución del formulario PHP a una aplicación persistente: SQL, PDO, CRUD, autorización, transacciones y diagnóstico."
summary: "De arrays y sesión a datos persistentes seguros en MariaDB separada."
module_key: iaw
cycle_key: asir
order: 3
module_title: "Implantación de Aplicaciones Web"
module_code: "0376"
cycle_title: "Administración de Sistemas Informáticos en Red"
course: "2.º ASIR"
unit: "UT03"
hours: 20
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
  - "RA6"
ce:
  - "RA6.a"
  - "RA6.b"
  - "RA6.c"
  - "RA6.d"
  - "RA6.e"
  - "RA6.f"
  - "RA6.g"

tags:
  - php
  - desarrollo-servidor
  - asir
permalink: /docencia/asir/iaw/ut03/
published: true
---

# UT03 · PHP + bases de datos: de la memoria al dato persistente

> **Plan de 20 h propuesto y pendiente de cerrar en programación.** No comenzar esta UT hasta que se haya trabajado de forma suficiente variables, `foreach`, funciones, formularios, sesión e identidad.

**RA6 — Genera documentos Web con acceso a bases de datos utilizando lenguajes de guiones de servidor.** Aquí no se repite todo PHP: se reutiliza la aplicación construida en UT02.

| Capítulo | Horas | Evidencia |
|---|---:|---|
| 1. Persistencia y arquitectura | 4 | Modelo y preflight |
| 2. PDO y esquema | 6 | Conexión, migración, SELECT |
| 3. CRUD + POO | 6 | Tickets persistidos y autorizados |
| 4. Operación segura | 4 | Incidente, rendimiento, pruebas |
| **Total** | **20** | **RA6** |


## Capítulo 1 · Qué cambia al introducir persistencia (4 h)

**Hasta ahora:** un array existe durante una petición y una sesión conserva cierta información entre peticiones. **Ahora:** hace falta guardar tickets, usuarios y estados de forma duradera y consultable: el SGBD se aloja en `IAW-DB01`; el PHP permanece en `IAW-WEB01`.

```text
PC alumno ── HTTP ──> Apache ── FastCGI ──> PHP
                                             │
                                             │ PDO / TCP 3306
                                             ▼
                                      MariaDB en IAW-DB01
```

**Antes de SQL:** datos estructurados en tabla, claves PK/FK, restricción UNIQUE, relación usuario→tickets. Presentar `users(id, username, password_hash, role)` y `tickets(id, owner_id, asunto, prioridad, estado)`. Prohibido usar contraseñas reales o `root` en aplicaciones. Diferenciar usuario Linux, usuario web y usuario SQL.

**Preflight desde WEB:** `php -v`, `php -m | grep -Ei 'pdo|mysql'`, `nc -vz 192.168.60.20 3306` si disponible y prueba con cliente SQL permitido. El comando `php -m` comprueba **CLI**; verificar la configuración del SAPI FPM usado por Apache de forma independiente.

**Ejercicios web:** dibujar capas; identificar si un 1045 es red o cuenta; comparar sesión y BBDD; esquema de tickets con owner; mostrar un diagrama de componentes; proponer datos de prueba `IAW-NN`.



### Lo que aprendimos en RA5 se transforma, no desaparece

En RA5 había tres posibles lugares para datos: una variable local, un array y la sesión. Pregunta a la clase qué ocurriría si reiniciamos el servidor, entran 50 usuarios o necesitamos buscar tickets de la semana anterior. El SGBD resuelve necesidades diferentes; eso no significa que las sesiones dejen de existir.

```sql
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);
CREATE TABLE tickets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id INT UNSIGNED NOT NULL,
  asunto VARCHAR(180) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'abierto',
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

Este SQL describe **la estructura a obtener**. Para cubrir explícitamente el CE6.d, el alumno prepara posteriormente un script PHP que ejecuta la creación con `PDO::exec` empleando una credencial de despliegue autorizada. La cuenta de aplicación no necesita privilegios globales de creación de esquemas; separa despliegue de operación.

**Prueba por capas:** antes de escribir SELECT comprueba si MariaDB escucha, si PHP tiene driver, si la cuenta conecta, si existe el esquema y finalmente si la consulta está bien. Un error en el primer eslabón no se arregla reescribiendo formularios.

## Capítulo 2 · PDO con progresión paso a paso (6 h)

**¿Por qué PDO?** Es una API PHP orientada a objetos para acceder a SGBD; requiere el driver concreto (`pdo_mysql` para MariaDB/MySQL). `could not find driver` no es un fallo de SQL: el entorno PHP no tiene cargado ese driver para la SAPI que ejecutó la petición.

```php
<?php
// Fichero de configuración FUERA de public/. Valores ficticios.
$pdo = new PDO(
    'mysql:host=192.168.60.20;port=3306;dbname=iawdesk_07;charset=utf8mb4',
    'iawapp_07',
    'CAMBIAR_EN_ENTORNO',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
     PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);
```

**Escalera didáctica:** primero conexión (no SELECT); después una consulta fija; luego `prepare`/`execute` con parámetro; `fetch`/`fetchAll`; diferencias entre texto de SQL y datos del usuario. Nunca interpolar valores de formulario en SQL.

```php
<?php
$stmt = $pdo->prepare('SELECT id, asunto, estado FROM tickets WHERE owner_id = :owner');
$stmt->execute(['owner' => $ownerId]);
$tickets = $stmt->fetchAll();
```

**CE6.d:** crear estructura de BD y tablas **desde PHP** mediante un script de migración ejecutado con una cuenta de despliegue autorizada; la cuenta de ejecución diaria debe tener solo permisos necesarios.

**Ejercicios web:** `PDO::getAvailableDrivers()`, conexión mínima, error por BD inexistente, crear tabla con migración, insertar semilla con script, listar, filtrar, verificar dos cuentas SQL y explicar por qué separar privilegios.



### Ruta de aprendizaje de PDO, sin copiar una cadena misteriosa

El constructor `new PDO($dsn, $user, $password, $options)` crea un objeto que representa una conexión. Descompón el DSN: **driver** mysql, host de la DB, puerto, nombre de esquema, charset. No se pone `http://` porque PHP habla protocolo MySQL/MariaDB, no HTTP. El cliente de navegador nunca conecta a 3306.

**Primera salida:** conexión OK (sin consulta). **Segunda:** SELECT estático del esquema ya preparado. **Tercera:** un parámetro `:owner` que se suministra en `execute`; el SGBD distingue el texto de consulta de los datos. **Cuarta:** mover el código a una función o repositorio.

```php
<?php
// Con un PDO válido y cuenta SQL de aplicación:
$stmt = $pdo->prepare('SELECT id, asunto FROM tickets WHERE owner_id=:owner');
$stmt->execute(['owner' => $ownerId]);
$filas = $stmt->fetchAll(PDO::FETCH_ASSOC);
```

Los resultados SQL son datos, no HTML seguro. Si el asunto contiene `<script>`, se escapa al insertarlo en la vista. Si no hay filas, mostrar lista vacía es una salida válida. Evita normalizar `root` en el código: aunque una práctica anterior lo usase para simplificar el arranque, este curso distingue deliberadamente privilegios de infraestructura y privilegios de aplicación.

## Capítulo 3 · CRUD desde formularios y POO útil (6 h)

No inventamos otra aplicación: el formulario de tickets de UT02 ahora trabaja con MariaDB. La secuencia será leer → insertar → modificar → archivar → mostrar; cada operación corresponde a una necesidad y a una acción HTTP.

```php
<?php
// $ownerId SIEMPRE procede de la sesión autenticada, no de un hidden ni GET.
$stmt = $pdo->prepare(
  'INSERT INTO tickets(owner_id, asunto, prioridad, estado)
   VALUES (:owner, :asunto, :prioridad, :estado)'
);
$stmt->execute([
  'owner'=>$ownerId,
  'asunto'=>$asuntoValidado,
  'prioridad'=>$prioridadValidada,
  'estado'=>'abierto'
]);
header('Location: /tickets.php', true, 303);
exit;
```

**Relación POO real:** `Ticket` representa un dato/comportamiento y `TicketRepository` concentra acceso a datos; no mezclar HTML, contraseñas, consultas y redirecciones en un método monolítico. Un constructor puede recibir PDO (`__construct(private PDO $pdo)`), pero explica primero sus responsabilidades.

**Autorización por recurso:** `UPDATE tickets SET estado = :estado WHERE id = :id AND owner_id = :owner`; si otro usuario manipula un ID, el servidor debe impedir la modificación aunque el botón esté oculto.

**Ejercicios web:** listado por dueño, insertar validando asunto, cambio de estado, archivar vía POST, filtrar por prioridad, modificar solo ticket propio, contador de abiertos en SQL, refactorizar SELECT a `TicketRepository`, verificar redirect tras POST.



### Evolución del formulario antiguo en cinco commits mentales

**Versión 1:** HTML estático con botón. **Versión 2:** `procesar.php` valida. **Versión 3:** utiliza una sesión para saber el usuario autenticado. **Versión 4:** PDO inserta un registro con `owner_id` obtenido de sesión. **Versión 5:** listado GET muestra únicamente lo propio y formularios POST permiten cambios autorizados.

```php
<?php
function cerrarTicket(PDO $pdo, int $id, int $ownerId): void {
    $stmt = $pdo->prepare(
        'UPDATE tickets SET estado=:estado WHERE id=:id AND owner_id=:owner'
    );
    $stmt->execute(['estado'=>'cerrado','id'=>$id,'owner'=>$ownerId]);
}
```

**No equivalencia:** un `input type="hidden" name="owner_id"` sigue siendo manipulable por el cliente; no es una prueba de identidad. La sesión tampoco basta sin verificar que la cuenta está activa y que el recurso le pertenece. Conviene introducir PRG después del INSERT y actualizar la tabla al volver por GET.

**POO aplicada y medible:** extraer `TicketRepository` cuando ya hay varios SELECT/INSERT/UPDATE repetidos, no antes. Explica su responsabilidad: ejecutar operaciones de persistencia; una clase Ticket representa el dominio; una plantilla muestra el resultado. No exijas patrón MVC completo a alumnado que acaba de descubrir `new`.

## Capítulo 4 · Seguridad, rendimiento, fallos y transferencia (4 h)

**Tres fronteras distintas:** validar entrada (negocio), usar SQL parametrizado (consulta), escapar salida HTML (`htmlspecialchars`) (presentación). Una no sustituye a otra. Passwords: `password_hash` y `password_verify`, nunca texto claro. Sesión tras login: `session_regenerate_id(true)`; control de rol y propietario en servidor. CSRF para acciones que cambian estado.

**Una transacción** agrupa cambios de BD que deben confirmarse juntos: por ejemplo cierre de ticket y alta en auditoría. Para medir rendimiento registra duración y filas, y observa un `EXPLAIN` simple; no hacer tuning avanzado sin contexto.

| Síntoma | Primera capa a comprobar |
|---|---|
| `could not find driver` | Extensión PDO para SAPI concreta |
| `Connection refused` | Red, servicio y escucha |
| `Access denied` | Cuenta SQL / host / privilegios |
| `Unknown database` | Nombre / migración |
| `Table doesn't exist` | Esquema y despliegue |
| HTTP 500 | Log de Apache y PHP-FPM |

**Ejercicios web:** replicar fallo controlado; crear runbook de recuperación; dos usuarios y dos conjuntos de tickets; prueba de inyección rechazada con consultas parametrizadas; repetir instalación en una nueva VM; distinguir error para usuario y detalle para log.

**Cierre RA6:** entregar aplicación con datos, pruebas, privilegios mínimos, separación de `public/`, plan de copia y explicación del recorrido completo.


### Ticket de incidencia con método y evidencia

Cada incidencia se entrega con cinco líneas: **síntoma → hipótesis → prueba → observación → cambio mínimo**. Dado `could not find driver`, el alumno debe comprobar PHP CLI y FPM por separado; con `Access denied`, comprobar usuario SQL, origen autorizado y grants; con `Unknown database`, nombre de esquema y migración.

**Transacción:** con PDO, `beginTransaction`, dos operaciones y `commit`. Ante excepción, si hay transacción activa, `rollBack` y registro de error sin exponer credenciales. La prueba real consiste en inducir el fallo de la segunda operación y demostrar que la primera no queda a medias.

**Rendimiento:** compara un SELECT del propietario antes y después de un índice razonable únicamente si hay datos suficientes para observarlo; registra filas, tiempo, consulta y entorno. Un `EXPLAIN` de juguete con 4 filas no justifica conclusiones generales de rendimiento. Cierra con restauración desde copia, comprobación HTTP, control de acceso y documentación.

## Frameworks y empleabilidad: dónde encajan sin atropellar el nivel

**Laravel** como demostración opcional posterior: una vez que sepan crear una clase, usar Composer, comprender rutas/plantillas, formularios, sesión y PDO, podemos inspeccionar un esqueleto Laravel, una ruta, un controlador y `.env` sin convertir RA5/RA6 en «memorizar comandos de Laravel». [Documentación oficial de Laravel](https://laravel.com/docs).

**Ejemplos reales de ofertas consultadas en septiembre de 2026:** [Grupo Inprex (Programador Junior PHP Full Stack, Sevilla)](https://es.indeed.com/q-programador-php-l-sevilla%2C-sevilla-provincia-empleos.html) solicita PHP y CodeIgniter, y valora Laravel/Symfony, ASIR y administración Linux; [dnoise (Full Stack, Madrid)](https://es.indeed.com/q-laravel-l-ciudad-de-la-imagen%2C-madrid-provincia-empleos.html) incluye PHP, Laravel, WordPress, HTML/CSS y SQL. Son ejemplos de requisitos, **no una encuesta del mercado ni una promesa de disponibilidad futura**.

**Symfony** como segunda referencia que pueden reconocer en ofertas y repositorios: comparar rutas/controlador/configuración con los mismos conceptos; no obligar a dominar dos frameworks. [Documentación oficial de Symfony](https://symfony.com/doc/current/index.html). **WordPress/CMS**, objeto principal de las siguientes UT, también da aplicación inmediata a PHP, hooks y clases.

> En nuestro curso el framework es **transferencia/ampliación**, no sustituto de fundamentos ni nuevo RA oficial. Se revisará una oferta real fechada cuando se programe la actividad, no se inventarán estadísticas de empleo ni vacantes.

**Prácticas integradoras privadas:** PDF del aula virtual. **Siguiente:** [UT04 · Selección e implantación de CMS](/docencia/asir/iaw/ut04/).

**Fuentes:** [PDO PHP](https://www.php.net/manual/es/book.pdo.php), [consultas preparadas](https://www.php.net/manual/es/pdo.prepared-statements.php), [sesiones](https://www.php.net/manual/es/book.session.php), [seguridad OWASP SQLi](https://owasp.org/www-community/attacks/SQL_Injection), [documentación MariaDB](https://mariadb.com/docs/).
