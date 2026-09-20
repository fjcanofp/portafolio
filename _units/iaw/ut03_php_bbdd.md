---
title: UT03 · PHP y MariaDB desde cero con PDO
description: 'Evolución de IAW Desk a una aplicación persistente: modelo de datos, PDO, CRUD, autorización, transacciones y diagnóstico.'
summary: Aplicación PHP con datos persistentes y accesibles de manera controlada desde MariaDB remota.
module_key: iaw
cycle_key: asir
order: 3
module_title: Implantación de Aplicaciones Web
module_code: '0376'
cycle_title: Administración de Sistemas Informáticos en Red
course: 2.º ASIR
unit: UT03
level: iniciacion
authors:
- fjcano
reviewers:
- fjcano
rights: all-rights-reserved
version: '2.1'
last_reviewed: '2026-09-21'
visibility: public
ra:
- RA6
ce:
- RA6.a
- RA6.b
- RA6.c
- RA6.d
- RA6.e
- RA6.f
- RA6.g
tags:
- php
- mariadb
- pdo
- sql
- crud
- seguridad
- asir
permalink: /docencia/asir/iaw/ut03/
published: false
toc:
- title: Persistencia y arquitectura
  id: persistencia
- title: PDO y migraciones
  id: pdo
- title: CRUD y POO
  id: crud
- title: Seguridad y diagnóstico
  id: operacion
- title: Frameworks y empleabilidad
  id: empleabilidad
---

> **Prerrequisitos y ritmo.** Antes de esta unidad se deben haber trabajado variables, `foreach`, funciones, formularios, sesión e identidad. La distribución temporal y el trabajo evaluable se comunicarán en el aula virtual; los apartados siguientes son una ruta de aprendizaje, no una programación aprobada.

**RA6 — Genera documentos Web con acceso a bases de datos utilizando lenguajes de guiones de servidor.** Aquí no se repite todo PHP: se reutiliza la aplicación construida en UT02.

| Etapa | Qué añadimos | Comprobación de aprendizaje |
|---|---|---|
| 1. Persistencia y arquitectura | SGBD, datos y responsabilidades | Modelo y comprobaciones previas |
| 2. PDO y esquema | Conexión y creación del esquema desde PHP | SELECT y migración controlada |
| 3. CRUD + POO | Datos persistentes por usuario | Tickets autorizados |
| 4. Operación segura | Diagnóstico, transacciones y rendimiento | Prueba y recuperación |

![Aplicación PHP con MariaDB remota y separación de responsabilidades]({{ '/assets/docencia/iaw/ut03/01_arquitectura_pdo.svg' | relative_url }})

> **Continuidad con UT01 y UT02.** El despliegue de `iaw-demo` en UT01 y el proyecto `IAW Desk` de UT02 son proyectos distintos: aquí ampliamos **IAW Desk**, no modificamos el esquema `iaw_demo_NN` del artefacto inicial.

## Capítulo 1 · Qué cambia al introducir persistencia {#persistencia}

**Hasta ahora:** un array existe durante una petición y una sesión conserva cierta información entre peticiones. **Ahora:** hace falta guardar tickets, usuarios y estados de forma duradera y consultable: el SGBD se aloja en `iaw-dbNN`; el PHP permanece en `iaw-webNN`.

```text
PC alumno ── HTTP ──> Apache ── FastCGI ──> PHP-FPM en iaw-webNN
                                                   │
                                                   │ PDO / TCP 3306
                                                   ▼
                                            MariaDB en iaw-dbNN
```

**Antes de SQL:** datos estructurados en tabla, claves PK/FK, restricción UNIQUE, relación usuario→tickets. Presentar `users(id, username, password_hash, role)` y `tickets(id, owner_id, asunto, prioridad, estado)`. Prohibido usar contraseñas reales o `root` en aplicaciones. Diferenciar usuario Linux, usuario web y usuario SQL.

**Comprobaciones desde `iaw-webNN`:** `php -v`, `php -m | grep -Ei 'pdo|mysql'`, `nc -vz 192.168.60.20 3306` (si `nc` está instalado) y prueba con un cliente SQL autorizado. **`php -m` comprueba CLI, no garantiza que el pool PHP-FPM utilizado por Apache tenga el driver cargado.**

En Debian 13, si falta el driver, se instala el paquete adecuado (`php-mysql` o su paquete versionado de la distribución) y se comprueba el servicio FPM de la versión realmente instalada. Desde el servidor de BD, verifica que MariaDB escucha solo donde debe y que el cortafuegos deja acceder desde `iaw-webNN` al puerto 3306, no desde cualquier red.

```bash
php -v
php -m | grep -Ei 'pdo|mysql'
systemctl --no-pager status php8.4-fpm
# Comprueba el puerto TCP únicamente si 'nc' está instalado:
nc -vz 192.168.60.20 3306
```

Si tu versión de PHP-FPM no es 8.4, sustituye el nombre del servicio por el instalado. Nunca abras `phpinfo()` permanentemente en una ruta pública.

**Ejercicios web:** dibujar capas; identificar si un 1045 es red o cuenta; comparar sesión y BBDD; esquema de tickets con owner; mostrar un diagrama de componentes; proponer datos de prueba `IAW-NN`.



### Lo que aprendimos en RA5 se transforma, no desaparece

En RA5 había tres posibles lugares para datos: una variable local, un array y la sesión. Pregunta a la clase qué ocurriría si reiniciamos el servidor, entran 50 usuarios o necesitamos buscar tickets de la semana anterior. El SGBD resuelve necesidades diferentes; eso no significa que las sesiones dejen de existir.

```sql
-- Esquema del proyecto IAW Desk. NN=07 en este ejemplo.
CREATE DATABASE IF NOT EXISTS iawdesk_07
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iawdesk_07;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'usuario'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tickets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id INT UNSIGNED NOT NULL,
  asunto VARCHAR(180) NOT NULL,
  prioridad VARCHAR(10) NOT NULL DEFAULT 'media',
  estado VARCHAR(20) NOT NULL DEFAULT 'abierto',
  INDEX idx_tickets_owner (owner_id),
  CONSTRAINT fk_tickets_owner FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB;
```

Este SQL muestra **la estructura objetivo**, no se ejecutará automáticamente desde una página pública. El modelo incluye ahora las columnas `role` y `prioridad`, utilizadas por los capítulos siguientes: sin ellas, el `INSERT INTO tickets(...prioridad...)` fallaría.

Para trabajar **RA6.d** también crearemos estructura **desde PHP**, con `PDO::exec`, mediante un script de instalación que se ejecuta solo en consola con credenciales de despliegue. La cuenta habitual de la aplicación no tendrá permisos `CREATE` ni usará `root`.

**Comprobación del modelo:** `SHOW COLUMNS FROM users;`, `SHOW COLUMNS FROM tickets;` y `SHOW CREATE TABLE tickets;` deben mostrar la columna `prioridad` y la clave ajena hacia `users`.

**Prueba por capas:** antes de escribir SELECT comprueba si MariaDB escucha, si PHP tiene driver, si la cuenta conecta, si existe el esquema y finalmente si la consulta está bien. Un error en el primer eslabón no se arregla reescribiendo formularios.

## Capítulo 2 · PDO con progresión paso a paso {#pdo}

**¿Por qué PDO?** Es una API PHP orientada a objetos para acceder a SGBD; requiere el driver concreto (`pdo_mysql` para MariaDB/MySQL). `could not find driver` no es un fallo de SQL: el entorno PHP no tiene cargado ese driver para la SAPI que ejecutó la petición.

```php
<?php
// Fichero de configuración FUERA de public/. Datos de laboratorio.
$pdo = new PDO(
    'mysql:host=192.168.60.20;port=3306;dbname=iawdesk_07;charset=utf8mb4',
    'iawapp_07',
    getenv('IAW_DESK_DB_PASS') ?: throw new RuntimeException('Falta clave SQL'),
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
     PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);
```

**Escalera didáctica:** primero conexión (no SELECT); después una consulta fija; luego `prepare`/`execute` con parámetro; `fetch`/`fetchAll`; diferencias entre texto de SQL y datos del usuario. Nunca interpolar valores de formulario en SQL.

**Clave fuera del repositorio:** `getenv('IAW_DESK_DB_PASS')` presupone que la variable existe **en el entorno del proceso PHP que ejecuta la petición**. El entorno de una terminal SSH no se transmite automáticamente a PHP-FPM: se configura también para el servicio/pool o se carga desde un archivo de servidor protegido, fuera de `public/`. No guardes contraseñas reales en el Markdown ni en GitHub.

![Diagnóstico del acceso a datos por capas: red, driver, credenciales, esquema y consulta]({{ '/assets/docencia/iaw/ut03/02_diagnostico_bd.svg' | relative_url }})

```php
<?php
$stmt = $pdo->prepare('SELECT id, asunto, estado FROM tickets WHERE owner_id = :owner');
$stmt->execute(['owner' => $ownerId]);
$tickets = $stmt->fetchAll();
```

### Crear base de datos y tablas desde PHP (RA6.d)

El ejemplo siguiente se ejecuta **una vez y desde CLI en un entorno aislado de prácticas**, con una cuenta de despliegue. Recoge las credenciales de variables de entorno; nunca lo sitúes en `public/`, ni publiques sus contraseñas. Ajusta `NN` y el nombre del esquema a tu variante.

```php
<?php
declare(strict_types=1);

// scripts/instalar.php (FUERA del DocumentRoot)
$usuario = getenv('IAW_DB_DEPLOY_USER');
$clave = getenv('IAW_DB_DEPLOY_PASS');
if ($usuario === false || $clave === false || $usuario === '') {
    throw new RuntimeException('Faltan credenciales de despliegue');
}

$admin = new PDO(
    'mysql:host=192.168.60.20;port=3306;charset=utf8mb4',
    $usuario, $clave,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
$admin->exec('CREATE DATABASE IF NOT EXISTS iawdesk_07
              CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
$admin->exec('CREATE TABLE IF NOT EXISTS iawdesk_07.users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT \'usuario\'
) ENGINE=InnoDB');
$admin->exec('CREATE TABLE IF NOT EXISTS iawdesk_07.tickets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id INT UNSIGNED NOT NULL,
    asunto VARCHAR(180) NOT NULL,
    prioridad VARCHAR(10) NOT NULL DEFAULT \'media\',
    estado VARCHAR(20) NOT NULL DEFAULT \'abierto\',
    INDEX idx_tickets_owner (owner_id),
    CONSTRAINT fk_tickets_owner
      FOREIGN KEY (owner_id) REFERENCES iawdesk_07.users(id)
) ENGINE=InnoDB');
echo "Esquema de IAW Desk preparado\n";
```

> **No mezclar cuentas:** la cuenta de despliegue realiza migraciones controladas; la cuenta `iawapp_07` se conecta únicamente para operaciones normales de la aplicación. La cuenta de despliegue se retira del entorno web una vez terminada la instalación.

**Diseño orientativo de privilegios** (ejecutado por el administrador en `iaw-dbNN`, con contraseña de práctica privada y origen limitado al nodo web):

```sql
CREATE USER 'iawapp_07'@'192.168.60.10' IDENTIFIED BY 'CLAVE_PRIVADA_LAB';
GRANT SELECT, INSERT, UPDATE, DELETE ON iawdesk_07.*
  TO 'iawapp_07'@'192.168.60.10';
```

No hay que copiar la clave de ejemplo a ningún repositorio o captura pública. Si la cuenta ya existe, comprueba primero su host y permisos: no repitas `CREATE USER` sin entender el error.


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

## Capítulo 3 · CRUD desde formularios y POO útil {#crud}

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

## Capítulo 4 · Seguridad, rendimiento, fallos y transferencia {#operacion}

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

**Cierre RA6:** comprobar aplicación con datos, pruebas, privilegios mínimos, separación de `public/`, plan de copia y explicación del recorrido completo.


### Ticket de incidencia con método y evidencia

Cada incidencia se documenta con cinco líneas: **síntoma → hipótesis → prueba → observación → cambio mínimo**. Dado `could not find driver`, el alumno debe comprobar PHP CLI y FPM por separado; con `Access denied`, comprobar usuario SQL, origen autorizado y grants; con `Unknown database`, nombre de esquema y migración.

**Transacción:** con PDO, `beginTransaction`, dos operaciones y `commit`. Ante excepción, si hay transacción activa, `rollBack` y registro de error sin exponer credenciales. La prueba real consiste en inducir el fallo de la segunda operación y demostrar que la primera no queda a medias.

**Rendimiento:** compara un SELECT del propietario antes y después de un índice razonable únicamente si hay datos suficientes para observarlo; registra filas, tiempo, consulta y entorno. Un `EXPLAIN` de juguete con 4 filas no justifica conclusiones generales de rendimiento. Cierra con restauración desde copia, comprobación HTTP, control de acceso y documentación.

## Frameworks y empleabilidad: dónde encajan sin atropellar el nivel {#empleabilidad}

**Laravel** como demostración opcional posterior: una vez que sepan crear una clase, usar Composer, comprender rutas/plantillas, formularios, sesión y PDO, podemos inspeccionar un esqueleto Laravel, una ruta, un controlador y `.env` sin convertir RA5/RA6 en «memorizar comandos de Laravel». [Documentación oficial de Laravel](https://laravel.com/docs).

**Ejemplo profesional consultado en septiembre de 2026:** [Full Stack Developer (Laravel + React) — Integración Tecnológica Empresarial, Madrid](https://es.linkedin.com/jobs/view/full-stack-developer-laravel-%2B-react-at-integraci%C3%B3n-tecnol%C3%B3gica-empresarial-s-l-4461149869). El anuncio cita PHP, Laravel/Symfony, MySQL/MariaDB, SQL, Linux y Apache/Nginx como parte del perfil. Sirve para identificar competencias transferibles; una oferta puede caducar y sus requisitos no equivalen al temario oficial. El puesto exige experiencia y tecnologías que aquí solo introducimos.

**Symfony** como segunda referencia que pueden reconocer en ofertas y repositorios: comparar rutas/controlador/configuración con los mismos conceptos; no obligar a dominar dos frameworks. [Documentación oficial de Symfony](https://symfony.com/doc/current/index.html). **WordPress/CMS**, objeto principal de las siguientes UT, también da aplicación inmediata a PHP, hooks y clases.

> En nuestro curso el framework es **transferencia/ampliación**, no sustituto de fundamentos ni nuevo RA oficial. Se revisará una oferta real fechada cuando se programe la actividad, no se inventarán estadísticas de empleo ni vacantes.

**Actividades integradoras evaluables:** exclusivamente en el aula virtual; los ejemplos de esta web son de entrenamiento. **Siguiente itinerario:** selección e implantación de CMS (UT04, según publicación progresiva).

**Fuentes:** [PDO PHP](https://www.php.net/manual/es/book.pdo.php), [consultas preparadas](https://www.php.net/manual/es/pdo.prepared-statements.php), [sesiones](https://www.php.net/manual/es/book.session.php), [seguridad OWASP SQLi](https://owasp.org/www-community/attacks/SQL_Injection), [documentación MariaDB](https://mariadb.com/docs/).
