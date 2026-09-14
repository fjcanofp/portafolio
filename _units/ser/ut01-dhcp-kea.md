---
title: "UT01 · Configuración dinámica: DHCP"
description: "DHCPv4 desde el protocolo hasta una concesión verificable con Kea en Debian 13, clientes Linux/Windows, reservas, opciones y diagnóstico."
summary: "DHCPv4 con Kea: DORA, diseño de pools, leases y reservas, opciones, clientes y diagnóstico basado en evidencias."

module_key: ser
cycle_key: smr
order: 1

module_title: "Servicios en Red"
module_code: "0227"
cycle_title: "Sistemas Microinformáticos y Redes"
course: "2.º SMR"
unit: "UT01"
hours: 18
level: "base-intermedio"

authors:
  - fjcano

reviewers:
  - fjcano

rights: all-rights-reserved
version: "1.0"
last_reviewed: 2026-09-15
visibility: public

ra:
  - "RA1"

ce:
  - "RA1.a"
  - "RA1.b"
  - "RA1.c"
  - "RA1.d"
  - "RA1.e"
  - "RA1.f"
  - "RA1.g"
  - "RA1.h"

tags:
  - dhcp
  - kea
  - debian
  - dora
  - leases
  - reservas
  - udp
  - diagnostico

permalink: /docencia/smr/ser/ut01/
published: true

toc:
  - title: Introducción
    id: introduccion
  - title: RA y CE
    id: ra-ce
  - title: Misión profesional
    id: mision
  - title: Fundamentos DHCP
    id: fundamentos
  - title: Laboratorio seguro
    id: laboratorio
  - title: DORA
    id: dora
  - title: Direccionamiento
    id: direccionamiento
  - title: Kea en Debian
    id: kea
  - title: Clientes y concesiones
    id: clientes
  - title: Reservas y opciones
    id: reservas
  - title: Diagnóstico
    id: diagnostico
  - title: Individualización
    id: individualizacion
  - title: Casos resueltos
    id: casos
  - title: Chuleta
    id: chuleta
  - title: Ampliación
    id: ampliacion
  - title: Referencias
    id: referencias
---

## Introducción {#introduccion}

> **Pregunta de partida:** ¿qué ocurre cuando conectamos un equipo nuevo a una red y, sin escribir manualmente IP, máscara ni otros parámetros, termina pudiendo comunicarse?

En esta unidad pasaremos de la idea de «IP automática» a una visión profesional de DHCP:

```text
necesidad
   ↓
protocolo
   ↓
política de direccionamiento
   ↓
servidor Kea
   ↓
cliente
   ↓
captura
   ↓
concesión
   ↓
diagnóstico
```

El objetivo no es memorizar DORA. El objetivo es ser capaz de **instalar, configurar, comprobar y diagnosticar un servicio DHCP real**.

---

## 1. Resultado de aprendizaje y criterios de evaluación {#ra-ce}

### RA1

> **Instala servicios de configuración dinámica, describiendo sus características y aplicaciones.**

En UT01 se trabaja el **RA1 completo**.

| CE | Criterio de evaluación |
|---|---|
| **a)** | Se ha reconocido el funcionamiento de los mecanismos automatizados de configuración de los parámetros de red. |
| **b)** | Se han identificado las ventajas que proporcionan. |
| **c)** | Se han ilustrado los procedimientos y pautas que intervienen en una solicitud de configuración de los parámetros de red. |
| **d)** | Se ha instalado un servicio de configuración dinámica de los parámetros de red. |
| **e)** | Se ha preparado el servicio para asignar la configuración básica a los sistemas de una red local. |
| **f)** | Se han realizado asignaciones dinámicas y estáticas. |
| **g)** | Se han integrado en el servicio opciones adicionales de configuración. |
| **h)** | Se ha verificado la correcta asignación de los parámetros. |

### Qué evidencia realmente el RA1

No basta con:

```text
systemctl status → active
```

Una evidencia completa combina:

```text
configuración válida
        ↓
servicio activo
        ↓
logs sin errores de arranque
        ↓
cliente solicita
        ↓
servidor responde
        ↓
cliente aplica
        ↓
lease registrada
        ↓
captura coherente
```

**Referencia curricular de Extremadura:**  
[Decreto 272/2009, de 28 de diciembre · currículo de SMR](https://doe.juntaex.es/eli/es-ex/d/2009/12/28/272/dof/spa/pdf)

---

## 2. La misión profesional {#mision}

Imagina una empresa con:

- 35 PC;
- portátiles que entran y salen;
- impresoras;
- teléfonos;
- máquinas virtuales;
- dispositivos nuevos cada semana.

Configurar cada equipo a mano implica:

```text
IP manual
máscara manual
gateway manual
DNS manual
cambios repetidos
errores humanos
direcciones duplicadas
```

DHCP centraliza esa política.

![Configuración manual frente a DHCP]({{ '/assets/docencia/ser/ut01/01_problema_dhcp.svg' | relative_url }})

*Figura 1. DHCP automatiza la entrega de parámetros, pero no sustituye a routing, DNS ni otros servicios.*

### Ejercicio resuelto 1

Una oficina cambia su servidor DNS.

Con configuración manual habría que modificar cada cliente.

Con DHCP podemos actualizar la opción correspondiente en el servidor y hacer que los clientes reciban la nueva política al renovar.

**Ventaja:** administración centralizada.

---

## 3. Por qué usamos Kea {#kea-contexto}

El protocolo DHCP es estándar; **Kea es nuestra implementación de servidor**.

En Debian 13 estable utilizaremos el paquete:

```text
kea-dhcp4-server
```

La versión estable empaquetada actualmente por Debian 13 es **2.6.3-1+deb13u1**.

Elegimos Kea porque:

- es el servidor DHCP moderno mantenido por ISC;
- está disponible directamente en Debian 13;
- separa con claridad subredes, pools, reservas, opciones y backend de leases;
- nos permite aprender conceptos transferibles a otros productos DHCP.

Durante el curso también podremos comparar estos conceptos con Windows Server u otras implementaciones, pero **no aprenderemos DHCP como una lista de menús de un producto concreto**.

> El antiguo ISC DHCP puede aparecer en documentación y sistemas heredados. Lo estudiaremos solo cuando ayude a interpretar configuraciones antiguas, no como plataforma principal de una instalación nueva.

- [Debian 13 · paquete `kea-dhcp4-server`](https://packages.debian.org/trixie/kea-dhcp4-server)
- [ISC · Kea DHCP](https://www.isc.org/kea/)
- [ISC DHCP · estado del proyecto](https://www.isc.org/dhcp/)

---

## 4. Qué hace DHCP y qué no hace {#fundamentos}

DHCP puede entregar:

- dirección IPv4;
- máscara/prefijo;
- tiempo de concesión;
- servidores DNS;
- dominio de búsqueda;
- gateway;
- otras opciones.

Pero DHCP **no garantiza** que esos recursos funcionen.

Ejemplo:

```text
DHCP entrega gateway 192.168.50.1
```

Eso no demuestra que:

```text
192.168.50.1 exista
192.168.50.1 enrute
192.168.50.1 tenga Internet
```

### Modelo mental

```text
DHCP → configura parámetros
routing → mueve paquetes
DNS → resuelve nombres
servicio → escucha en un puerto
aplicación → responde
```

No culpes a DHCP de todo lo que ocurra después de obtener una IP.

---

## 5. Asignación manual, dinámica y reserva {#asignaciones}

### IP estática configurada en el cliente

El administrador escribe directamente:

```text
IP
máscara
gateway
DNS
```

No es una asignación DHCP.

### Asignación dinámica

El servidor elige una IP desde un **pool** durante un tiempo limitado.

Uso típico:

```text
portátiles
aulas
móviles
equipos temporales
```

### Reserva

El cliente sigue utilizando DHCP, pero el servidor relaciona una identidad conocida con una dirección concreta.

Uso típico:

```text
impresora
AP
cámara
servidor auxiliar
equipo que necesita dirección estable
```

### Ejercicio resuelto 2

Una impresora debe conservar siempre `192.168.50.80`, pero queremos administrar sus opciones desde DHCP.

**Mejor opción:** reserva DHCP.

No escribiríamos necesariamente la IP manualmente en la impresora.

---

## PARTE I · LABORATORIO SEGURO {#laboratorio}

### 6. Reutilizamos SER-LAB

UT01 parte del laboratorio creado en UT00.

![Topología segura del laboratorio]({{ '/assets/docencia/ser/ut01/02_topologia_ser_lab.svg' | relative_url }})

*Figura 2. El servidor y los clientes comparten una Red interna aislada.*

#### Topología base

| Equipo | SO | Interfaz SER-LAB | Función |
|---|---|---|---|
| `ser-ser01` | Debian 13 | `192.168.50.10/24` estática | servidor Kea |
| `ser-cli01` | Debian 13 | sin IPv4 manual | cliente DHCP |
| `ser-win01` | Windows 11 | obtener automáticamente | cliente DHCP |

La NIC NAT de `ser-ser01` se mantiene para mantenimiento e instalación de paquetes.

La NIC de servicio se conecta a:

```text
Red interna: SER-LAB
```

#### Norma crítica

> **Nunca conectes el servidor DHCP de prácticas en modo Puente a la red física del centro.**

Un DHCP mal conectado puede responder a clientes que no forman parte del laboratorio.

---

### 7. Antes de instalar Kea

En `ser-ser01`:

```bash
ip -br link
ip -br address
ip route
```

Debes identificar la NIC de `SER-LAB`.

Ejemplo típico:

```text
enp0s3   UP   10.0.2.15/24
enp0s8   UP   192.168.50.10/24
```

No memorices `enp0s8`.

Comprueba cuál es la interfaz real de tu VM.

#### Prueba de ruta

```bash
ip route get 192.168.50.20
```

La salida debe utilizar la NIC interna.

#### Ejercicio resuelto 3

`ip route get 192.168.50.20` indica:

```text
via 10.0.2.2 dev enp0s3
```

Eso no es lo esperado para un cliente de `SER-LAB`.

**Prioridad:** revisar la configuración de red antes de instalar DHCP.

Kea no arregla una topología incorrecta.

---

### 8. El cliente no debe tener IP fija en SER-LAB

Antes de probar DHCP, la interfaz interna del cliente debe estar preparada para obtener configuración automáticamente.

En Windows:

```text
IPv4 → Obtener una dirección IP automáticamente
DNS → Obtener la dirección del servidor DNS automáticamente
```

En Debian, usa el gestor que realmente tenga instalado el cliente.

No mezcles:

```text
NetworkManager
ifupdown
systemd-networkd
```

sin saber cuál administra esa interfaz.

---

## PARTE II · CÓMO HABLA DHCP {#dora}

### 9. Puertos y difusión

DHCPv4 utiliza UDP.

```text
Servidor → UDP 67
Cliente  → UDP 68
```

Al principio el cliente todavía no conoce:

- su IP definitiva;
- el servidor;
- la red completa.

Por eso la negociación inicial utiliza difusión.

#### Idea importante

Un cliente que todavía no tiene una dirección válida puede emitir un `DHCPDISCOVER`.

Por eso:

```text
«no puedo hacer ping»
```

no implica necesariamente:

```text
«no puedo capturar DHCP»
```

---

### 10. DORA

![Proceso DORA]({{ '/assets/docencia/ser/ut01/03_dora.svg' | relative_url }})

*Figura 3. Discover, Offer, Request y ACK describen la negociación inicial más habitual.*

#### DHCPDISCOVER

El cliente busca servidores.

#### DHCPOFFER

Un servidor propone una dirección y determinadas opciones.

#### DHCPREQUEST

El cliente solicita la oferta elegida.

#### DHCPACK

El servidor confirma la concesión.

#### Ejercicio resuelto 4

En una captura aparecen:

```text
Discover
Offer de 192.168.50.10
Offer de 192.168.50.200
Request
ACK
```

¿Es imposible?

No.

Un cliente puede recibir más de una oferta.

En nuestro laboratorio, dos servidores respondiendo deberían hacernos sospechar:

- otro Kea;
- DHCP de VirtualBox;
- una red virtual incorrecta.

---

### 11. DORA no es todo DHCP

También existen:

- `DHCPNAK`;
- `DHCPRELEASE`;
- `DHCPDECLINE`;
- `DHCPINFORM`;
- renovaciones;
- retransmisiones.

DORA es una ayuda para empezar a entender el protocolo, no una descripción completa de todos los estados.

---

### 12. Campos que merece la pena reconocer

No necesitas memorizar la trama completa.

Sí debes reconocer:

| Campo | Para qué nos sirve |
|---|---|
| `xid` | relacionar mensajes de la misma negociación |
| `chaddr` | dirección hardware del cliente |
| `yiaddr` | dirección ofrecida/asignada |
| `ciaddr` | IP actual en determinadas renovaciones |
| `giaddr` | información de relay |
| Option 50 | IP solicitada |
| Option 53 | tipo de mensaje DHCP |
| Option 54 | identificador del servidor |
| Option 51 | tiempo de concesión |
| Option 58 | T1 |
| Option 59 | T2 |

#### Ejercicio resuelto 5

Dos `DHCPOFFER` llegan al mismo cliente.

¿Qué campo es especialmente útil para identificar qué servidor hizo cada oferta?

**Option 54 · Server Identifier**.

---

## PARTE III · POLÍTICA DE DIRECCIONAMIENTO {#direccionamiento}

### 13. Subred, pool y reservas

Antes de abrir el editor debemos diseñar.

![Diseño del pool]({{ '/assets/docencia/ser/ut01/04_pool_reservas.svg' | relative_url }})

*Figura 4. Separar infraestructura, reservas y pool evita conflictos y facilita crecer.*

Ejemplo base:

```text
Red              192.168.50.0/24
Servidor Kea     192.168.50.10
Reservas         192.168.50.50–99
Pool dinámico    192.168.50.100–149
Crecimiento      192.168.50.150–199
```

No entregues dinámicamente:

- dirección de red;
- broadcast;
- IP del servidor;
- IP del gateway si existe;
- reservas;
- otras direcciones estáticas conocidas.

---

### 14. Dimensionar un pool

Un `/24` no significa:

> «tengo 254 direcciones para DHCP».

Parte del espacio puede estar reservado para:

```text
servidores
routers
AP
impresoras
reservas
crecimiento
```

#### Ejercicio resuelto 6

Tenemos:

```text
40 clientes simultáneos
10 reservas
5 equipos de infraestructura
```

¿Un pool de 10 direcciones es suficiente?

No.

El pool debe cubrir el pico de clientes dinámicos con margen razonable.

---

### 15. Tiempo de concesión

Una IP dinámica se presta durante un tiempo.

![Ciclo de concesión]({{ '/assets/docencia/ser/ut01/05_lease_tiempos.svg' | relative_url }})

*Figura 5. El cliente intenta renovar antes de que la concesión expire.*

Ejemplo docente:

```text
T1     900 s
T2    1800 s
Lease 3600 s
```

Debe cumplirse:

```text
T1 < T2 < Lease
```

No copies estos valores a producción sin analizar el escenario.

---

### 16. Opciones DHCP

Algunas opciones habituales:

| Opción | Contenido |
|---|---|
| 1 | máscara |
| 3 | router |
| 6 | DNS |
| 15 | dominio |
| 51 | lease time |
| 53 | tipo de mensaje |
| 54 | servidor |
| 58 | T1 |
| 59 | T2 |

#### En la ruta base de UT01

No anunciaremos gateway en `SER-LAB`, porque nuestra red interna base no tiene una pasarela real.

Tampoco debemos fingir que un DNS funciona si todavía no lo hemos implantado.

Sí podemos observar:

- dirección;
- máscara;
- lease;
- T1/T2;
- dominio de laboratorio.

Más adelante, cuando exista una pasarela o DNS real, añadiremos sus opciones.

---

## PARTE IV · KEA EN DEBIAN 13 {#kea}

### 17. Qué vamos a instalar

En Debian 13 estable utilizaremos:

```text
kea-dhcp4-server
```

Debian 13 estable empaqueta actualmente `kea-dhcp4-server` **2.6.3-1+deb13u1**.

El paquete proporciona:

```text
/usr/sbin/kea-dhcp4
/etc/kea/kea-dhcp4.conf
kea-dhcp4-server.service
```

---

### 18. Instalar Kea y herramientas de observación

En `ser-ser01`:

```bash
sudo apt update
sudo apt install -y kea-dhcp4-server tcpdump nano
```

Comprobar versión:

```bash
apt policy kea-dhcp4-server
kea-dhcp4 -V
```

Comprobar archivos instalados:

```bash
dpkg -L kea-dhcp4-server | less
```

#### Ejercicio resuelto 7

`apt policy` muestra una versión candidata, pero:

```bash
systemctl status kea-dhcp4-server
```

dice que la unidad no existe.

¿Qué revisarías?

Primero confirma que el paquete está realmente instalado:

```bash
dpkg -l | grep kea-dhcp4-server
```

Consultar un repositorio no equivale a instalar el paquete.

---

### 19. Hacer copia antes de editar

```bash
sudo cp -a /etc/kea/kea-dhcp4.conf /etc/kea/kea-dhcp4.conf.bak
```

Edita la configuración:

```bash
sudo nano /etc/kea/kea-dhcp4.conf
```

`nano` se instala expresamente en el paso anterior para que todos los puestos utilicen la misma ruta de trabajo.

---

### 20. Configuración base

> Sustituye `enp0s8` por la interfaz real de `SER-LAB`.

```json
{
  "Dhcp4": {
    "interfaces-config": {
      "interfaces": [ "enp0s8" ]
    },

    "renew-timer": 900,
    "rebind-timer": 1800,
    "valid-lifetime": 3600,

    "lease-database": {
      "type": "memfile",
      "persist": true
    },

    "subnet4": [
      {
        "id": 1,
        "subnet": "192.168.50.0/24",

        "pools": [
          {
            "pool": "192.168.50.100 - 192.168.50.149"
          }
        ],

        "option-data": [
          {
            "name": "domain-name",
            "data": "ser.test"
          }
        ]
      }
    ]
  }
}
```

#### Qué significa cada bloque

| Bloque | Función |
|---|---|
| `interfaces-config` | NIC donde Kea recibe DHCP |
| `renew-timer` | T1 |
| `rebind-timer` | T2 |
| `valid-lifetime` | duración de la concesión |
| `lease-database` | almacenamiento de concesiones |
| `subnet4` | red administrada |
| `id` | identificador explícito de la subred |
| `pools` | direcciones dinámicas |
| `option-data` | opciones adicionales |

---

### 21. Validar antes de aplicar

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
```

Este comando comprueba la configuración y muestra el primer error que encuentre.

> **Importante:** `-t` es una comprobación previa. No demuestra que la interfaz exista, que el socket pueda abrirse ni que un cliente vaya a conseguir una concesión.

Después:

```bash
sudo systemctl restart kea-dhcp4-server
systemctl status kea-dhcp4-server --no-pager
```

Comprobación adicional del socket UDP:

```bash
sudo ss -lunp | grep ':67'
```

> **Importante:** esta comprobación es auxiliar. Kea puede utilizar *raw sockets* en sistemas compatibles, por lo que la ausencia de una línea UDP 67 en `ss` **no demuestra por sí sola** que DHCP esté fallando. Para verificar el servicio combina estado, logs, tráfico DHCP y una concesión real desde cliente.

Ver registros:

```bash
sudo journalctl -u kea-dhcp4-server -b -n 50 --no-pager
```

#### Ejercicio resuelto 8

`kea-dhcp4 -t` termina correctamente, pero el servicio no arranca.

¿Es una contradicción?

No.

La validación de configuración no comprueba todo el entorno de ejecución.

Siguiente evidencia:

```bash
systemctl status kea-dhcp4-server
journalctl -u kea-dhcp4-server -b -n 50 --no-pager
ip -br link
```

---

### 22. Orden de trabajo recomendado

Cada cambio importante seguirá esta secuencia:

```text
1. copia / plan de vuelta atrás
2. editar una sola cosa
3. kea-dhcp4 -t
4. restart
5. status
6. logs
7. cliente
8. captura
9. concesión registrada
10. comprobar que no rompimos otra cosa
```

No reinicies diez veces esperando un resultado distinto.

---

## PARTE V · CLIENTES Y CONCESIONES {#clientes}

### 23. Cliente Windows 11

Configura la interfaz de `SER-LAB` para obtener IPv4 automáticamente.

Después:

```bat
ipconfig /all
```

Para forzar una nueva negociación:

```bat
ipconfig /release
ipconfig /renew
ipconfig /all
```

Comprueba:

- dirección dentro del pool;
- máscara;
- servidor DHCP;
- duración de la concesión;
- sufijo/dominio cuando proceda.

#### Qué no debes esperar en la ruta base

Como `SER-LAB` está aislada:

- no esperamos gateway si no existe `ser-gw01`;
- no esperamos navegar por Internet a través de esa NIC;
- no confundimos «DHCP funciona» con «todo Internet funciona».

---

### 24. Cliente Debian 13

Primero identifica el gestor de red:

```bash
systemctl is-active NetworkManager systemd-networkd networking
```

No es necesario que los tres estén activos.

#### Si el cliente utiliza NetworkManager

```bash
nmcli device status
nmcli connection show
```

Después de activar el perfil DHCP:

```bash
nmcli -f GENERAL,IP4,DHCP4 device show INTERFAZ
ip -br address
ip route
```

Para renovar de forma sencilla en el laboratorio:

```bash
sudo nmcli connection down "NOMBRE_CONEXION"
sudo nmcli connection up "NOMBRE_CONEXION"
```

#### Si el cliente utiliza ifupdown

El perfil de esa NIC debe utilizar DHCP:

```text
auto enp0s8
iface enp0s8 inet dhcp
```

Después, desde la consola local:

```bash
sudo ifdown enp0s8
sudo ifup enp0s8
ip -br address
ip route
```

> **No copies `enp0s8` sin comprobar el nombre real de la interfaz.**

---

### 25. Primera concesión

Con Kea arrancado y el cliente en automático:

1. inicia una renovación;
2. observa el cliente;
3. observa el registro de Kea;
4. comprueba el archivo de leases.

En el servidor:

```bash
sudo journalctl -u kea-dhcp4-server -f
```

En otra terminal:

```bash
sudo head -n 5 /var/lib/kea/kea-leases4.csv
```

Tras obtener una concesión, el fichero de leases debe contener información relacionada con la dirección asignada.

---

### 26. Capturar DHCP con `tcpdump`

En el servidor:

```bash
sudo tcpdump -ni enp0s8 -vv 'udp port 67 or udp port 68'
```

Después fuerza una negociación desde el cliente.

Busca:

```text
Discover
Offer
Request
ACK
```

Detén la captura con `Ctrl+C`.

#### Guardar PCAP

```bash
sudo tcpdump -ni enp0s8 -w ut01-dhcp.pcap 'udp port 67 or udp port 68'
```

El archivo puede abrirse posteriormente con Wireshark.

> Sustituye `enp0s8` por la NIC real de `SER-LAB`.

---

### 27. Wireshark: no entregues solo una captura

Filtro de visualización:

```text
dhcp
```

Identifica al menos:

| Dato | Qué buscamos |
|---|---|
| tipo DHCP | Discover / Offer / Request / ACK |
| `xid` | mensajes de la misma negociación |
| `yiaddr` | IP ofrecida/asignada |
| Option 54 | servidor |
| Option 51 | lease |
| Option 58/59 | T1/T2 |
| Option 15 | dominio si se envía |

#### Ejercicio resuelto 9

El ACK contiene:

```text
yiaddr = 192.168.50.104
Server Identifier = 192.168.50.10
Lease Time = 3600
```

El cliente muestra:

```text
192.168.50.104/24
```

y el CSV de Kea contiene esa IP.

Las tres fuentes son coherentes.

![Triángulo de evidencias]({{ '/assets/docencia/ser/ut01/06_triangulo_evidencias.svg' | relative_url }})

*Figura 6. Captura, lease y estado del cliente deben contar la misma historia.*

---

## PARTE VI · RESERVAS Y OPCIONES {#reservas}

### 28. Crear una reserva

Obtén primero la MAC real del cliente.

Linux:

```bash
ip link
```

Windows:

```bat
ipconfig /all
```

Dentro de la entrada de `subnet4`, añade:

```json
"reservations": [
  {
    "hw-address": "08:00:27:aa:bb:cc",
    "ip-address": "192.168.50.80",
    "hostname": "equipo-reservado"
  }
]
```

Después:

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
sudo systemctl restart kea-dhcp4-server
```

Renueva el cliente.

Si la identidad coincide, deberá recibir:

```text
192.168.50.80
```

---

### 29. Reserva DHCP no es IP manual

Con reserva:

```text
cliente sigue usando DHCP
        ↓
servidor reconoce identidad
        ↓
entrega dirección estable
        ↓
puede entregar también opciones
        ↓
queda registro de la concesión
```

Con IP manual:

```text
la dirección se configura directamente en el cliente
```

#### Ejercicio resuelto 10

El cliente recibe `.112` en vez de la reserva `.80`.

Antes de cambiar nada, compara:

- MAC real;
- `chaddr` / client-id de la captura;
- reserva de Kea;
- concesión anterior.

Hay que comprobar primero **qué identidad presenta realmente el cliente**.

---

### 30. Añadir gateway solo si existe

Si posteriormente incorporamos una pasarela real:

```text
ser-gw01 → 192.168.50.1
```

podremos añadir:

```json
{
  "name": "routers",
  "data": "192.168.50.1"
}
```

Si no existe una pasarela, **no anunciamos una**.

---

### 31. Añadir DNS cuando exista

Cuando UT02 implante un DNS real, podremos añadir una opción como:

```json
{
  "name": "domain-name-servers",
  "data": "192.168.50.10"
}
```

DHCP puede entregar la dirección del DNS.

Eso no demuestra que DNS resuelva correctamente.

---

## PARTE VII · DIAGNÓSTICO {#diagnostico}

### 32. Escalera DHCP

![Escalera de diagnóstico DHCP]({{ '/assets/docencia/ser/ut01/07_diagnostico_dhcp.svg' | relative_url }})

*Figura 7. Comprobar una capa cada vez evita cambios aleatorios.*

Orden recomendado:

```text
1. misma Red interna
2. NIC conectada
3. servidor con IP estática
4. configuración Kea válida
5. servicio activo
6. logs sin error de arranque
7. Discover llega
8. Offer/ACK sale
9. cliente aplica
10. opciones coinciden
```

---

### 33. Cliente Windows obtiene `169.254.x.x`

Una dirección APIPA suele indicar que Windows no ha obtenido una concesión DHCP útil.

No empieces por DNS.

Pregunta primero:

```text
¿llega un Discover al servidor?
```

Servidor:

```bash
sudo tcpdump -ni enp0s8 'udp port 67 or udp port 68'
```

Si no llega:

- red virtual;
- NIC;
- cable virtual;
- interfaz del cliente.

Si llega Discover pero no Offer:

- Kea;
- interfaz de escucha;
- subred;
- pool;
- logs.

---

### 34. Kea valida pero no arranca

Pruebas:

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
systemctl status kea-dhcp4-server --no-pager
sudo journalctl -u kea-dhcp4-server -b -n 50 --no-pager
ip -br link
```

Hipótesis:

- interfaz inexistente;
- dirección/subred incoherente;
- conflicto de socket;
- problema de runtime.

#### Ejercicio resuelto 11

Configuración:

```json
"interfaces": [ "enp0s9" ]
```

La VM solo tiene:

```text
enp0s3
enp0s8
```

El test de configuración no sustituye las pruebas de ejecución.

El log y `ip -br link` permiten localizar la discrepancia.

---

### 35. Dos ofertas

Síntoma:

```text
el cliente recibe IP de otro rango
```

Busca:

- Option 54;
- MAC origen;
- dos `DHCPOFFER`.

Causas habituales en laboratorio:

- segundo Kea;
- DHCP integrado en una Red NAT;
- DHCP de una red Solo-anfitrión;
- VM conectada al segmento equivocado.

Contención:

```text
aislar
identificar
apagar el DHCP no autorizado
renovar
volver a capturar
```

---

### 36. IP correcta pero no navega

No concluyas:

> «DHCP está mal».

En la ruta base de UT01 no existe gateway en `SER-LAB`.

Primero demostramos:

```text
cliente ↔ servidor dentro de la LAN
```

Internet a través de una pasarela requiere que dicha pasarela exista y enrute.

---

### 37. Reserva ignorada

Comprueba:

```bash
ip link
```

o en Windows:

```bat
ipconfig /all
```

y compara con la reserva.

Revisa también la captura:

```text
chaddr
client-id
requested IP
```

No cambies la reserva hasta saber qué identidad presenta el cliente.

---

## PARTE VIII · INDIVIDUALIZACIÓN {#individualizacion}

### 38. Regla por puesto

Para dificultar la copia sin cambiar la dificultad, cada alumno utilizará su número de puesto `P`.

Calcula:

```text
N = 50 + P
```

Tu red será:

```text
192.168.N.0/24
```

Y utilizarás:

```text
Servidor Kea       192.168.N.10
Reserva            192.168.N.80
Pool               192.168.N.100–149
Dominio            pPP.ser.test
Red VirtualBox     SER-DHCP-PXX
```

#### Ejemplo ficticio: puesto 7

```text
P = 7
N = 57

Red                192.168.57.0/24
Servidor           192.168.57.10
Reserva            192.168.57.80
Pool               192.168.57.100–149
Dominio            p07.ser.test
Red interna        SER-DHCP-P07
```

---

{% comment %}

## PARTE IX · PRÁCTICA DE MUESTRA {#practica}

### 39. Implantar DHCP para una pequeña LAN

#### Situación profesional

Una pequeña organización quiere dejar de configurar los equipos manualmente.

Debes implantar DHCP en Debian 13 con Kea.

#### Requisitos

1. red interna individualizada;
2. servidor Debian con IP estática `.10`;
3. Kea DHCP4;
4. pool `.100–149`;
5. dominio individualizado;
6. reserva `.80`;
7. cliente Windows;
8. cliente Linux cuando esté disponible;
9. captura DORA;
10. diagnóstico de una incidencia.

#### Evidencias mínimas

Debes poder demostrar:

```text
topología
configuración
kea-dhcp4 -t
servicio active
logs de arranque
cliente con lease
PCAP DORA
lease CSV
reserva
diagnóstico
```

#### Preguntas de defensa

- ¿por qué no usas Puente?;
- ¿por qué el servidor tiene IP fija?;
- ¿qué diferencia hay entre pool y reserva?;
- ¿qué demuestra `kea-dhcp4 -t` y qué no?;
- ¿cómo detectas otro DHCP?;
- ¿por qué no anunciamos gateway en la ruta base?;
- ¿cómo sabes que la concesión es realmente de tu servidor?

{% endcomment %}

---

{% comment %}

## PARTE X · EJERCICIOS DE CONSOLIDACIÓN {#ejercicios}

### 40. Fundamentos

1. Explica qué problema resuelve DHCP.
2. Diferencia IP manual, asignación dinámica y reserva.
3. Indica puertos y transporte de DHCPv4.
4. Explica por qué Discover utiliza broadcast inicialmente.
5. Explica DORA sin memorizar solo las siglas.
6. ¿Qué aporta Option 54?
7. ¿Qué significan Lease, T1 y T2?
8. ¿Por qué no todo `/24` debe convertirse en pool?

### 41. Diseño

9. Diseña un pool para 30 clientes con espacio para infraestructura y reservas.
10. Explica por qué la IP del servidor no debe estar en el pool.
11. Decide si anunciarías un gateway inexistente.
12. Decide si una impresora debería usar reserva o IP escrita manualmente y justifica.

### 42. Operación Kea

13. Localiza la configuración principal de Kea.
14. Haz una copia de seguridad preservando metadatos.
15. Valida la configuración sin reiniciar el servicio.
16. Comprueba si la unidad está activa.
17. Comprueba si existe escucha UDP 67.
18. Consulta los últimos 50 mensajes del servicio.
19. Explica qué demuestra `kea-dhcp4 -t`.
20. Explica qué **no** demuestra `kea-dhcp4 -t`.

### 43. Clientes y evidencias

21. Fuerza una renovación en Windows.
22. Comprueba el servidor DHCP que aparece en `ipconfig /all`.
23. Identifica la concesión correspondiente en Kea.
24. Captura DORA con `tcpdump`.
25. Correlaciona `xid`, Option 54 y `yiaddr`.
26. Explica por qué una captura aislada sin interpretación es una evidencia débil.
27. Explica qué tres fuentes deberían ser coherentes para demostrar una concesión.

### 44. Diagnóstico

28. Windows obtiene `169.254.x.x`. Propón la primera prueba.
29. Discover llega al servidor pero no aparece Offer. Indica tres hipótesis.
30. Kea valida pero `systemctl` muestra `failed`. ¿Qué mirarías?
31. El cliente recibe una IP fuera de tu pool. ¿Qué sospechas?
32. La reserva no se aplica. ¿Qué identidad compararías?
33. El cliente recibe IP correcta pero no tiene Internet. Explica por qué esto no demuestra un fallo DHCP.
34. Dos clientes reciben la misma IP. Indica qué evidencias recogerías antes de cambiar configuraciones.

---

{% endcomment %}

## PARTE XI · CASOS RESUELTOS {#casos}

### 45. Caso A · `169.254.x.x`

#### Síntoma

Windows muestra:

```text
Autoconfiguration IPv4 Address: 169.254.x.x
```

#### Hipótesis iniciales

```text
cliente en red virtual incorrecta
NIC desconectada
Kea detenido
Kea escucha en otra interfaz
Discover bloqueado
```

#### Primera prueba

En servidor:

```bash
sudo tcpdump -ni enp0s8 'udp port 67 or udp port 68'
```

#### Interpretación

**No aparece Discover**

Prioridad:

```text
VirtualBox / NIC / red interna / cliente
```

**Aparece Discover pero no Offer**

Prioridad:

```text
Kea / interfaz / subred / pool / logs
```

---

### 46. Caso B · configuración válida, servicio `failed`

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
```

no muestra errores.

Sin embargo:

```bash
systemctl status kea-dhcp4-server
```

muestra:

```text
failed
```

#### Diagnóstico

```bash
sudo journalctl -u kea-dhcp4-server -b -n 50 --no-pager
ip -br link
ip -br address
```

Descubrimos que Kea está configurado para:

```text
enp0s9
```

pero la NIC de servicio es:

```text
enp0s8
```

#### Conclusión

La configuración puede ser sintácticamente válida y aun así fallar al aplicarse en el entorno real.

---

### 47. Caso C · dos `DHCPOFFER`

Captura:

```text
Offer 1 → Server Identifier 192.168.50.10
Offer 2 → Server Identifier 10.0.2.2
```

En una práctica aislada esto sugiere otro servidor DHCP.

Revisamos:

```text
modo de red
DHCP integrado de VirtualBox
otras VM
```

No arreglamos el problema cambiando el pool de Kea.

El problema es que existen **dos autoridades DHCP en el mismo segmento**.

---

### 48. Caso D · reserva incorrecta

Reserva:

```text
08:00:27:aa:bb:c1
```

Cliente:

```text
08:00:27:aa:bb:c7
```

El cliente recibe `.112`.

#### Solución

No vaciamos todas las leases ni reiniciamos todo.

Primero corregimos la identidad:

```json
"hw-address": "08:00:27:aa:bb:c7"
```

Después:

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
sudo systemctl restart kea-dhcp4-server
```

y renovamos el cliente.

---

## PARTE XII · CHULETA OPERATIVA {#chuleta}

### 49. Servidor

```bash
ip -br link
ip -br address
ip route
ip route get 192.168.50.20

sudo apt update
sudo apt install -y kea-dhcp4-server tcpdump nano

apt policy kea-dhcp4-server
kea-dhcp4 -V
dpkg -l | grep kea-dhcp4-server

sudo cp -a /etc/kea/kea-dhcp4.conf /etc/kea/kea-dhcp4.conf.bak
sudo nano /etc/kea/kea-dhcp4.conf

sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
sudo systemctl restart kea-dhcp4-server
systemctl status kea-dhcp4-server --no-pager
sudo journalctl -u kea-dhcp4-server -b -n 50 --no-pager

# Comprobación auxiliar: no es concluyente si Kea usa raw sockets
sudo ss -lunp | grep ':67'
sudo head -n 5 /var/lib/kea/kea-leases4.csv
```

### 50. Captura

```bash
sudo tcpdump -ni INTERFAZ -vv 'udp port 67 or udp port 68'
```

Guardar:

```bash
sudo tcpdump -ni INTERFAZ -w ut01-dhcp.pcap 'udp port 67 or udp port 68'
```

Wireshark:

```text
dhcp
```

### 51. Windows

```bat
ipconfig /all
ipconfig /release
ipconfig /renew
ipconfig /all
```

### 52. Debian con NetworkManager

```bash
nmcli device status
nmcli connection show
nmcli -f GENERAL,IP4,DHCP4 device show INTERFAZ
ip -br address
ip route
```

---

{% comment %}

## PARTE XIII · AUTOEVALUACIÓN {#autoevaluacion}

<details>
<summary><strong>1. ¿DHCP proporciona Internet?</strong></summary>

No. DHCP entrega parámetros de red. La conectividad exterior depende de routing, gateway, NAT, filtros y otros servicios.
</details>

<details>
<summary><strong>2. ¿Por qué el cliente usa broadcast al comenzar?</strong></summary>

Porque todavía no conoce un servidor ni dispone necesariamente de una configuración IPv4 válida.
</details>

<details>
<summary><strong>3. ¿Qué diferencia hay entre reserva e IP manual?</strong></summary>

En una reserva el cliente sigue utilizando DHCP y el servidor le entrega una dirección estable según una identidad. Con IP manual, la dirección se configura directamente en el cliente.
</details>

<details>
<summary><strong>4. ¿Qué puertos utiliza DHCPv4?</strong></summary>

Servidor UDP 67 y cliente UDP 68.
</details>

<details>
<summary><strong>5. ¿Qué demuestra `kea-dhcp4 -t`?</strong></summary>

Que Kea puede cargar y validar la configuración que se le proporciona. Es una prueba previa.
</details>

<details>
<summary><strong>6. ¿Qué NO demuestra `kea-dhcp4 -t`?</strong></summary>

No demuestra por sí solo que el daemon pueda arrancar en ese entorno, que la interfaz exista, que el servicio pueda atender peticiones DHCP ni que un cliente obtenga una concesión.
</details>

<details>
<summary><strong>7. ¿Cómo detectarías otro DHCP en el laboratorio?</strong></summary>

Buscando varias ofertas y comparando Option 54, origen de las tramas y parámetros entregados.
</details>

<details>
<summary><strong>8. ¿Por qué no anunciamos gateway en la ruta base?</strong></summary>

Porque la Red interna no tiene una pasarela real. No debemos entregar una opción que apunte a un servicio inexistente.
</details>

<details>
<summary><strong>9. ¿Qué tres evidencias deberían coincidir en una concesión?</strong></summary>

La captura DHCP, la lease registrada por Kea y el estado aplicado en el cliente.
</details>

<details>
<summary><strong>10. Windows obtiene 169.254.x.x. ¿Empiezas por DNS?</strong></summary>

No. Primero comprobaría si el Discover llega al servidor y si Kea responde.
</details>

{% endcomment %}

---

## PARTE XIV · AMPLIACIÓN {#ampliacion}

### 53. Relay DHCP

DHCP inicial utiliza broadcast y un router no reenvía ese broadcast de forma ordinaria.

En redes con varias subredes se utiliza un **DHCP relay**.

```text
CLIENTE LAN B
     ↓ broadcast
RELAY
     ↓ reenvía
KEA central
```

El relay permite al servidor conocer la subred de origen y seleccionar la política correspondiente.

Este concepto se introduce en UT01, pero una topología de relay completa se considera ampliación para SMR.

---

### 54. DHCP y DNS

En UT02 aparecerá una relación muy importante:

```text
DHCP
 entrega Option 6
      ↓
CLIENTE
 aprende qué DNS usar
      ↓
DNS
 resuelve nombres
```

Pero:

```text
DHCP correcto ≠ DNS correcto
DNS correcto  ≠ DHCP correcto
```

Cada servicio debe comprobarse por separado.

---

## PARTE XV · REFERENCIAS OFICIALES {#referencias}

### 55. Currículo

- [Decreto 272/2009, de 28 de diciembre · currículo de SMR en Extremadura](https://doe.juntaex.es/eli/es-ex/d/2009/12/28/272/dof/spa/pdf)
- [Real Decreto 1691/2007 · título de Técnico en Sistemas Microinformáticos y Redes](https://www.boe.es/buscar/doc.php?id=BOE-A-2008-819)

### 56. DHCP y Kea

- [ISC Kea · DHCPv4 Server](https://kea.readthedocs.io/en/latest/arm/dhcp4-srv.html)
- [ISC Kea · Configuration Examples](https://kea.readthedocs.io/en/latest/config-examples.html)
- [Debian 13 · `kea-dhcp4-server`](https://packages.debian.org/trixie/kea-dhcp4-server)
- [RFC 2131 · Dynamic Host Configuration Protocol](https://www.rfc-editor.org/rfc/rfc2131.html)
- [RFC 2132 · DHCP Options](https://www.rfc-editor.org/rfc/rfc2132.html)

### 57. Herramientas y clientes

- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/)
- [Microsoft · `ipconfig`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig)
- [Oracle VirtualBox · Networking](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/networkingdetails.html)

---

### 58. Puente hacia UT02

Al terminar UT01 deberías poder responder:

```text
¿quién me ha dado esta IP?
¿durante cuánto tiempo?
¿qué opciones me ha entregado?
¿qué servidor respondió?
¿dónde está registrada la concesión?
¿qué ocurre si el cliente no recibe respuesta?
```

La siguiente pregunta será:

```text
Ya tengo red…
¿cómo hago para usar nombres en lugar de direcciones IP?
```

Eso nos lleva a:

```text
UT02 · DNS
```
