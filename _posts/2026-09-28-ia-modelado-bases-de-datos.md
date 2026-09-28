---
layout: post
title: "La IA puede escribir tu SQL, pero primero tienes que entender el problema"
description: "Diseño de bases de datos con IA: cómo pasar de requisitos ambiguos a entidades, relaciones, PK, FK, restricciones, datos derivados y un modelo que represente de verdad el dominio."
date: 2026-09-28
categories:
  - Bases de Datos
  - Ingeniería del Software
tags:
  - bases-de-datos
  - sql
  - postgresql
  - supabase
  - inteligencia-artificial
  - modelado
  - ingenieria-del-software
---

Las herramientas actuales permiten construir aplicaciones a una velocidad que hace pocos años habría resultado difícil de imaginar. Podemos describir una necesidad a una inteligencia artificial, obtener SQL, crear las tablas en PostgreSQL y conectar una interfaz *low-code* en muy poco tiempo.

Eso es una ventaja enorme.

Pero también puede producir una falsa sensación de seguridad:

> **Que una base de datos acepte nuestros datos no significa que represente correctamente nuestro problema.**

Este artículo parte de un caso práctico simplificado: una aplicación que debe gestionar empresas, elementos y obligaciones periódicas, mostrando un semáforo con lo vencido, lo próximo a vencer y lo que está al día. El ejemplo es deliberadamente pequeño, porque lo importante no es la aplicación concreta, sino **el proceso de razonamiento que existe antes de escribir SQL**.

## Qué aprenderás

Al terminar deberías ser capaz de:

- distinguir requisitos de interfaz y requisitos de datos;
- identificar entidades, relaciones y cardinalidades;
- explicar qué aportan una PK y una FK más allá de su sintaxis;
- decidir qué datos conviene almacenar y cuáles es mejor calcular;
- modelar correctamente hechos repetidos en el tiempo;
- utilizar restricciones para proteger reglas del dominio;
- decidir qué lógica pertenece a la base de datos y cuál a la aplicación;
- utilizar una IA como apoyo al análisis, no solo como generador de código.

---

## 1. El diseño empieza antes del SQL

Antes de crear una tabla deberíamos ser capaces de explicar **qué representa**.

Supongamos que en los requisitos aparece una «tarea» o una «obligación». Antes de decidir columnas conviene preguntar:

- ¿se realiza una sola vez o se repite?;
- ¿tiene fecha de vencimiento?;
- ¿tiene un responsable?;
- ¿puede cambiar de responsable?;
- ¿pertenece directamente a una empresa o a un elemento de esa empresa?;
- ¿necesitamos saber quién la realizó?;
- ¿necesitamos conservar un histórico?;
- ¿el siguiente vencimiento depende de la fecha prevista o de la fecha real de realización?;
- ¿qué ocurre si se realiza con retraso?;
- ¿qué ocurre si todavía no tiene fecha configurada?;
- ¿puede haber más de una persona responsable?;
- ¿qué debe ocurrir al eliminar la empresa o el elemento relacionado?

Hasta responder a estas preguntas no tenemos realmente un modelo.

Tenemos una idea.

Si a una IA únicamente le pedimos:

> «Créame una base de datos para gestionar tareas»

tendrá que completar todo lo que no le hemos explicado. Puede generar SQL perfectamente válido y, sin embargo, estar resolviendo **un problema diferente al nuestro**.

> **Pausa didáctica:** antes de pedir a la IA una solución, pídele que enumere las preguntas que necesita resolver para comprender el dominio.

---

## 2. Del lenguaje del usuario al modelo de datos

Un usuario puede explicar perfectamente lo que quiere ver:

> «Quiero ver en rojo lo que tengo vencido, en amarillo lo que vence pronto y en verde lo que está al día.»

Eso describe muy bien una **necesidad de interfaz**.

Todavía no describe por completo el modelo de datos.

El analista tiene que transformar esa frase en preguntas concretas:

- ¿qué significa «vence pronto»?;
- ¿14 días, 30 días o un valor configurable?;
- ¿es igual para todas las obligaciones?;
- ¿qué fecha determina el vencimiento?;
- ¿qué sucede cuando se marca una obligación como realizada?;
- ¿el color debe almacenarse o calcularse?;
- ¿qué estado tiene algo que todavía no dispone de fecha?

El proceso es más parecido a esto:

```text
NECESIDAD DEL USUARIO
        ↓
PREGUNTAS Y ACLARACIONES
        ↓
CONCEPTOS DEL DOMINIO
        ↓
ENTIDADES + RELACIONES + REGLAS
        ↓
MODELO RELACIONAL
        ↓
SQL
        ↓
INTERFAZ
```

Saltarse las preguntas no elimina la ambigüedad. Solo la desplaza hacia las tablas.

---

## 3. Primero el dominio: entidades y relaciones

Para nuestro ejemplo podrían aparecer cuatro conceptos principales:

```text
EMPRESA
   │
   └── tiene → ELEMENTOS
                   │
                   └── tienen → OBLIGACIONES
                                      │
                                      └── generan → EJECUCIONES
```

Una interpretación posible sería:

- **Empresa**: organización sobre la que gestionamos información.
- **Elemento**: vehículo, instalación, máquina, contrato u otro objeto gestionado.
- **Obligación**: regla que indica algo que debe realizarse, cuándo y con qué periodicidad.
- **Ejecución**: hecho real que registra que una obligación se realizó en una fecha concreta.

Las cardinalidades básicas podrían expresarse así:

```text
EMPRESA      1 ───── N ELEMENTO
ELEMENTO     1 ───── N OBLIGACION
OBLIGACION   1 ───── N EJECUCION
```

Esto ya nos obliga a pensar.

¿Una obligación pertenece siempre a un único elemento?  
¿Puede existir una obligación general de empresa?  
¿Puede una misma obligación tener varios responsables?

Si la respuesta cambia, el modelo también.

### ¿Y si una obligación tiene varios responsables?

Una FK `responsable_id` solo permite representar cómodamente **un responsable**.

Si una obligación puede asignarse a varias personas y una persona puede participar en varias obligaciones, tenemos una relación **N:M** y probablemente necesitaremos una tabla intermedia:

```text
OBLIGACION
    │
    N
    │
OBLIGACION_TRABAJADOR
    │
    N
    │
TRABAJADOR
```

La cardinalidad no es un detalle de implementación. Es una afirmación sobre el mundo que estamos modelando.

---

## 4. PK y FK: identidad y relaciones

Dos conceptos fundamentales del modelo relacional son la **clave primaria** y la **clave foránea**.

### Clave primaria — PK

Una *Primary Key* identifica de forma única una fila:

```text
EMPRESA

id                                     nombre
------------------------------------   ----------------
6e64...                                Empresa A
a12f...                                Empresa B
```

El `id` no es solo «un UUID».

Representa la **identidad** de esa entidad dentro del sistema.

### Clave foránea — FK

Una *Foreign Key* expresa una relación:

```text
ELEMENTO

id        empresa_id    nombre
--------  ------------  ----------------
e501...   6e64...       Vehículo A
e502...   6e64...       Vehículo B
```

`empresa_id = 6e64...` significa:

> Este elemento pertenece a esa empresa.

La FK permite además que PostgreSQL compruebe que la empresa referenciada exista.

Eso es **integridad referencial**.

### Un UUID válido no implica una relación válida

Este UUID puede ser sintácticamente correcto:

```text
550e8400-e29b-41d4-a716-446655440000
```

Pero si no existe ninguna empresa con ese identificador, utilizarlo como `empresa_id` no crea mágicamente una relación válida.

```text
UUID válido ≠ relación válida
```

La sintaxis del dato y su significado son problemas distintos.

---

## 5. Los tipos de datos también describen el problema

No elegimos un tipo únicamente porque «el dato cabe».

Elegimos un tipo porque **representa una determinada semántica**.

Por ejemplo:

```text
12:30
```

no significa lo mismo que:

```text
2026-09-28
```

ni que:

```text
2026-09-28 12:30:00+02
```

En PostgreSQL podríamos utilizar:

| Necesidad | Tipo orientativo | Motivo |
|---|---|---|
| Fecha de vencimiento sin hora | `date` | Nos interesa el día |
| Momento exacto de una ejecución | `timestamptz` | Conserva un instante temporal con zona horaria |
| Cantidad de días de aviso | `integer` | Es una magnitud numérica |
| Nombre o descripción | `text` | Contenido textual |
| Identificador | `uuid` | Identidad técnica del registro |
| Activado/desactivado | `boolean` | Dos estados lógicos |

Elegir mal los tipos acaba apareciendo después en filtros, ordenación, comparaciones, validación y automatización.

---

## 6. No todo lo que se muestra debe almacenarse

Volvamos al semáforo:

```text
🔴 Vencida
🟡 Próxima
🟢 Vigente
```

Una primera idea podría ser guardar:

```text
estado = "verde"
```

Pero el tiempo avanza aunque nadie modifique la fila.

Una obligación puede pasar de verde a amarillo y después a rojo simplemente porque cambia la fecha actual.

Por eso el color suele ser mejor candidato a **dato derivado**.

Podríamos almacenar:

```text
fecha_proxima
dias_aviso
```

y calcular el estado:

| Condición | Estado |
|---|---|
| `fecha_proxima IS NULL` | Sin configurar |
| `fecha_proxima < hoy` | 🔴 Vencida |
| `fecha_proxima <= hoy + dias_aviso` | 🟡 Próxima |
| En otro caso | 🟢 Vigente |

La regla podría expresarse de forma aproximada en PostgreSQL:

```sql
CASE
    WHEN fecha_proxima IS NULL THEN 'sin_configurar'
    WHEN fecha_proxima < CURRENT_DATE THEN 'vencida'
    WHEN fecha_proxima <= CURRENT_DATE + dias_aviso THEN 'proxima'
    ELSE 'vigente'
END
```

> **Idea clave:** si un valor puede obtenerse de manera fiable a partir de otros datos, antes de almacenarlo conviene preguntarse si realmente necesitamos duplicarlo.

### Otro ejemplo: contadores

Una interfaz puede mostrar:

```text
KUBOTA
3 obligaciones
```

No necesariamente necesitamos una columna:

```text
numero_obligaciones = 3
```

Si la relación ya existe, PostgreSQL puede calcularlo:

```sql
SELECT COUNT(*)
FROM obligacion
WHERE elemento_id = :id_elemento;
```

Mañana añadimos una cuarta obligación y el contador cambia sin mantener otro dato manualmente.

---

## 7. Una obligación y una ejecución son conceptos diferentes

Esta separación es una de las decisiones más importantes del ejemplo.

### Obligación

Representa una regla:

> «Esta inspección debe realizarse periódicamente.»

### Ejecución

Representa un hecho:

> «Esta inspección se realizó el 28 de septiembre a las 10:42.»

Si cada vez que realizamos una tarea sobrescribimos simplemente `fecha_proxima`, perdemos parte de la historia.

Separando ambas entidades podemos conservar:

- cuándo debía realizarse;
- cuándo se realizó realmente;
- cuántas veces se ha realizado;
- observaciones;
- documentación asociada;
- quién la realizó, si el modelo lo requiere;
- el retraso respecto a la fecha prevista.

El patrón es:

```text
OBLIGACION
   │
   ├── periodicidad
   ├── fecha_proxima
   └── regla de negocio
          │
          └───────────────┐
                          ↓
                     EJECUCION
                     2026-09-28
                     2027-09-30
                     2028-09-27
```

Un buen modelo no intenta adivinar todas las funciones futuras.

Intenta **no destruir información que ya tiene significado en el presente**.

---

## 8. La periodicidad necesita estructura

Para una persona pueden parecer equivalentes:

```text
anual
cada año
1 año
12 meses
365 días
```

Para una aplicación no lo son necesariamente.

Una representación más estructurada puede ser:

```text
periodicidad_valor  = 1
periodicidad_unidad = anio
```

o:

```text
periodicidad_valor  = 6
periodicidad_unidad = mes
```

Esto permite validar, filtrar y calcular.

Además aparece una cuestión interesante:

> ¿«1 año» significa exactamente «365 días»?

No siempre. Atraviesa años bisiestos y meses con duraciones distintas. El modelo debe expresar la regla que realmente quiere el dominio, no una aproximación cómoda.

### Un `CHECK` puede proteger esa regla

```sql
CHECK (periodicidad_valor > 0)
```

Y podemos limitar las unidades admitidas:

```sql
CHECK (periodicidad_unidad IN ('dia', 'mes', 'anio'))
```

Las restricciones no son obstáculos para el desarrollador.

Son **reglas que impiden almacenar estados imposibles**.

---

## 9. Del modelo al SQL: un ejemplo mínimo

El siguiente esquema es deliberadamente reducido. No pretende ser «el diseño universal correcto», sino mostrar cómo las decisiones conceptuales empiezan a aparecer en SQL.

```sql
CREATE TABLE empresa (
    id uuid PRIMARY KEY,
    nombre text NOT NULL
);

CREATE TABLE elemento (
    id uuid PRIMARY KEY,
    empresa_id uuid NOT NULL
        REFERENCES empresa(id)
        ON DELETE RESTRICT,
    nombre text NOT NULL
);

CREATE TABLE obligacion (
    id uuid PRIMARY KEY,
    elemento_id uuid NOT NULL
        REFERENCES elemento(id)
        ON DELETE RESTRICT,
    nombre text NOT NULL,
    fecha_proxima date,
    dias_aviso integer NOT NULL DEFAULT 30
        CHECK (dias_aviso >= 0),
    periodicidad_valor integer,
    periodicidad_unidad text,
    CHECK (
        (periodicidad_valor IS NULL AND periodicidad_unidad IS NULL)
        OR
        (
            periodicidad_valor > 0
            AND periodicidad_unidad IN ('dia', 'mes', 'anio')
        )
    )
);

CREATE TABLE ejecucion (
    id uuid PRIMARY KEY,
    obligacion_id uuid NOT NULL
        REFERENCES obligacion(id)
        ON DELETE RESTRICT,
    fecha_realizada timestamptz NOT NULL DEFAULT now(),
    observaciones text
);
```

Hay varias decisiones detrás de estas pocas líneas:

- una obligación pertenece a un elemento;
- una ejecución pertenece a una obligación;
- `dias_aviso` no puede ser negativo;
- periodicidad y unidad aparecen juntas o no aparecen;
- borrar una entidad referenciada no provoca una cascada automática.

### `ON DELETE` también es una decisión de negocio

Usar `CASCADE`, `RESTRICT` o `SET NULL` no debería decidirse «porque funciona».

Pregúntate qué significa borrar.

Si desaparece una empresa:

- ¿deben desaparecer sus elementos?;
- ¿también sus obligaciones?;
- ¿y el histórico de ejecuciones?;
- ¿la legislación o el negocio exige conservarlo?

La respuesta pertenece al dominio.

---

## 10. Vistas, funciones y triggers: ¿dónde debe vivir la lógica?

PostgreSQL no es únicamente un almacén de filas. Puede ayudarnos a mantener reglas y reutilizar cálculos.

### Vista: buena candidata para datos derivados

Podemos encapsular el estado del semáforo en una vista:

```sql
CREATE VIEW v_obligacion_estado AS
SELECT
    o.*,
    CASE
        WHEN o.fecha_proxima IS NULL THEN 'sin_configurar'
        WHEN o.fecha_proxima < CURRENT_DATE THEN 'vencida'
        WHEN o.fecha_proxima <= CURRENT_DATE + o.dias_aviso THEN 'proxima'
        ELSE 'vigente'
    END AS estado
FROM obligacion AS o;
```

El frontend consulta un estado coherente sin duplicarlo en cada cliente.

### Función: útil para una operación con una regla clara

Una función puede encapsular una operación como:

```text
registrar ejecución
        ↓
validar datos
        ↓
insertar histórico
        ↓
calcular siguiente fecha
```

### Trigger: útil, pero no invisible por defecto

Un trigger puede reaccionar a un `INSERT`, `UPDATE` o `DELETE`.

Es potente, pero conviene utilizarlo con intención. Si abusamos de triggers, parte del comportamiento queda escondido para quien solo está leyendo el código de la aplicación.

Una regla práctica:

| Tipo de lógica | Lugar habitual |
|---|---|
| Integridad, FK, `CHECK`, `UNIQUE`, `NOT NULL` | Base de datos |
| Cálculos derivados reutilizados por varios clientes | Vista o función |
| Reacción automática imprescindible ante cambios de datos | Trigger, si aporta claridad |
| Flujo de interfaz, navegación, presentación | Aplicación |
| Procesos de negocio complejos con muchas integraciones | Servicio/aplicación, según arquitectura |

La pregunta no es «¿base de datos o aplicación?».

La pregunta es:

> **¿Dónde puede esta regla mantenerse de forma más clara, consistente, comprobable y reutilizable?**

---

## 11. La IA entra después del problema, no antes

La IA puede ser extraordinariamente útil durante todo este proceso.

Puede ayudarnos a:

- descubrir preguntas que no hemos hecho;
- revisar cardinalidades;
- detectar información redundante;
- proponer restricciones;
- comparar alternativas;
- generar SQL;
- preparar datos de prueba;
- buscar casos límite;
- revisar índices;
- documentar decisiones.

Pero necesita contexto.

El ciclo útil es:

```text
USUARIO
   ↓ necesidades
ANÁLISIS HUMANO
   ↓ especificación
IA
   ↓ propuesta
REVISIÓN TÉCNICA
   ↓
VALIDACIÓN CON EL USUARIO
   ↺
```

Cada flecha es un lugar donde podemos perder información.

### Tres modelos mentales deben aproximarse

Cuando trabajamos con IA existen, como mínimo:

```text
1. Lo que el usuario necesita
2. Lo que el desarrollador ha entendido
3. Lo que la IA interpreta de la especificación
```

El objetivo no es escribir el prompt más largo.

Es reducir la distancia entre esos tres modelos.

---

## 12. Mejor que «genérame el SQL»: un prompt de análisis

Antes de pedir código, podemos utilizar un prompt como este:

```text
Actúa como analista y diseñador de bases de datos.

Todavía NO generes SQL.

Necesito modelar un sistema que gestiona empresas, elementos y
obligaciones periódicas. La interfaz mostrará un semáforo con
obligaciones vencidas, próximas y vigentes.

1. Enumera las ambigüedades de los requisitos.
2. Hazme las preguntas que necesito responder antes de diseñar.
3. Identifica posibles entidades y relaciones.
4. Señala qué cardinalidades todavía no pueden decidirse.
5. Distingue datos almacenados de datos derivados.
6. Indica qué histórico podríamos perder con un diseño ingenuo.
7. Propón restricciones del dominio que deberían protegerse.
8. Expón claramente todos los supuestos que estés haciendo.

No diseñes todavía la solución final hasta que respondamos
las preguntas abiertas.
```

Después de aclarar el dominio, sí tiene sentido pedir:

```text
Ahora propone dos modelos alternativos, compara sus ventajas
y riesgos y, finalmente, genera el DDL de PostgreSQL de la
opción elegida.
```

Aquí la IA ya no es solamente una máquina de escribir SQL.

Se convierte en un **segundo par de ojos para el análisis**.

---

## 13. Actividad didáctica: diseña antes de ver la solución

Una forma interesante de trabajar este caso en clase es **no enseñar inicialmente las tablas**.

### Fase A · Solo requisitos

Entrega al alumnado algo parecido a esto:

> Una empresa quiere gestionar elementos que requieren obligaciones periódicas. Cada obligación puede tener una próxima fecha y unos días de aviso. Cuando se realiza debe quedar constancia. La aplicación mostrará en rojo lo vencido, en amarillo lo próximo y en verde lo vigente.

Pídeles que respondan:

1. ¿Qué entidades crearías?
2. ¿Qué relación existe entre ellas?
3. ¿Qué columnas serían PK?
4. ¿Dónde aparecen las FK?
5. ¿Guardarías el color?
6. ¿Guardarías el número de obligaciones de cada elemento?
7. ¿Cómo conservarías el histórico?
8. ¿Qué preguntas faltan por hacer al usuario?

### Fase B · Comparación de modelos

Cada grupo explica su propuesta.

No preguntamos todavía «¿cuál es correcta?».

Preguntamos:

- ¿qué situación real puede representar?;
- ¿qué situación no puede representar?;
- ¿qué datos podría perder?;
- ¿qué inconsistencias permite?;
- ¿qué ha supuesto sin preguntarlo?

### Fase C · IA como revisor

Ahora sí se entrega el modelo a una IA, pero con una instrucción concreta:

```text
No rediseñes todavía el modelo.
Busca contradicciones, supuestos ocultos, datos redundantes
y casos reales que este diseño no pueda representar.
```

### Fase D · SQL

Solo cuando el modelo ha sobrevivido a la discusión pasamos a:

- tablas;
- PK y FK;
- tipos;
- `NOT NULL`;
- `UNIQUE`;
- `CHECK`;
- reglas de borrado;
- índices;
- vistas y automatización.

Así SQL aparece como **la traducción de decisiones previas**, no como el punto de partida.

---

## 14. Checklist antes de crear una tabla

Antes de ejecutar `CREATE TABLE`, intenta responder:

- [ ] ¿Qué entidad o hecho representa esta tabla?
- [ ] ¿Cuál es su identidad?
- [ ] ¿Qué relaciones tiene?
- [ ] ¿Las cardinalidades están claras?
- [ ] ¿Qué columnas son obligatorias?
- [ ] ¿Qué estados son imposibles y debe impedir la BBDD?
- [ ] ¿Qué ocurrirá al borrar cada entidad relacionada?
- [ ] ¿Estoy almacenando algo que podría derivarse?
- [ ] ¿Estoy perdiendo histórico al sobrescribir datos?
- [ ] ¿Los tipos de datos expresan la semántica correcta?
- [ ] ¿Hay conceptos del dominio mezclados en una sola tabla?
- [ ] ¿Qué supuestos he realizado sin confirmarlos?
- [ ] ¿Qué deberá seguir siendo cierto aunque mañana cambie el frontend?

Si varias respuestas son «no lo sé», todavía no necesitas más SQL.

Necesitas más análisis.

---

## Conclusión

PostgreSQL, Supabase, FlutterFlow y los asistentes de inteligencia artificial nos permiten construir mucho más rápido.

Pero **velocidad de implementación no equivale a calidad del modelo**.

Una IA puede generar una consulta impecable, una tabla sintácticamente perfecta o un trigger sofisticado. Si la especificación representa mal el dominio, estaremos automatizando con enorme eficiencia **el problema equivocado**.

El cambio importante consiste en dejar de pensar:

```text
"Necesito guardar estos datos"
```

y empezar a pensar:

```text
"Necesito representar estas entidades,
relaciones, hechos y reglas"
```

Después vendrán las tablas.

Después vendrá SQL.

Y entonces la IA será realmente útil: no porque sustituya el análisis, sino porque puede ayudarnos a **preguntar mejor, comparar alternativas, detectar huecos y revisar decisiones**.

> **La IA puede escribir nuestro SQL. Lo difícil sigue siendo entender qué debe significar ese SQL.**

---

## Para seguir aprendiendo

### PostgreSQL

- [Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Tipos de datos](https://www.postgresql.org/docs/current/datatype.html)
- [CREATE VIEW](https://www.postgresql.org/docs/current/sql-createview.html)
- [CREATE TRIGGER](https://www.postgresql.org/docs/current/sql-createtrigger.html)

### Supabase

- [Tables and Data](https://supabase.com/docs/guides/database/tables)
- [Views](https://supabase.com/docs/guides/database/views)
- [Postgres Triggers](https://supabase.com/docs/guides/database/postgres/triggers)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Managing User Data with Supabase Auth](https://supabase.com/docs/guides/auth/managing-user-data)

---

*Artículo orientado a docencia, análisis y diseño de bases de datos. Los ejemplos se han simplificado deliberadamente para centrarse en el razonamiento del modelo y no en una implementación concreta.*
