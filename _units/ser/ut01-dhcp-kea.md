---
title: "UT01 · Configuración dinámica: DHCP"
description: "DHCPv4 desde el protocolo hasta una concesión verificable con Kea en Debian 13, clientes Linux/Windows, reservas, opciones, varias redes y diagnóstico."
summary: "DHCPv4 con Kea: DORA, pools, leases, reservas, opciones, clientes, varias subredes sin relay y diagnóstico basado en evidencias."

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
version: "1.2"
last_reviewed: 2026-10-16
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
  - multired
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
  - title: Varias redes sin relay
    id: multired
  - title: Prácticas guiadas
    id: practicas
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

## 3. Por qué usamos Kea

El protocolo DHCP es estándar; **Kea es nuestra implementación de servidor**.

En Debian 13 estable utilizaremos:

```text
kea-dhcp4-server
```

Kea permite trabajar con:

- interfaces;
- subredes;
- pools;
- reservas;
- opciones;
- tiempos de concesión;
- almacenamiento de leases.

Durante el curso compararemos estos conceptos con otras implementaciones, pero el objetivo es aprender **DHCP**, no memorizar un producto concreto.

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

## 5. Asignación manual, dinámica y reserva

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

---

## PARTE I · LABORATORIO SEGURO {#laboratorio}

### 6. Reutilizamos SER-LAB

UT01 parte del laboratorio creado en UT00.

![Topología segura del laboratorio]({{ '/assets/docencia/ser/ut01/02_topologia_ser_lab.svg' | relative_url }})

*Figura 2. El servidor y los clientes comparten una Red interna aislada.*

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

### Prueba de ruta

```bash
ip route get 192.168.50.20
```

La salida debe utilizar la NIC interna.

### Ejercicio resuelto 3

Si la salida indica:

```text
via 10.0.2.2 dev enp0s3
```

para un destino de `SER-LAB`, revisa la topología antes de instalar DHCP.

Kea no arregla una red virtual mal construida.

---

### 8. El cliente no debe tener IP fija en SER-LAB

Antes de probar DHCP, la interfaz interna del cliente debe obtener configuración automáticamente.

En Windows:

```text
IPv4 → Obtener una dirección IP automáticamente
DNS → Obtener la dirección del servidor DNS automáticamente
```

En Debian, identifica primero el gestor real de la interfaz.

No mezcles sin motivo:

```text
NetworkManager
ifupdown
systemd-networkd
```

---

## PARTE II · CÓMO HABLA DHCP {#dora}

### 9. Puertos y difusión

DHCPv4 utiliza UDP.

```text
Servidor → UDP 67
Cliente  → UDP 68
```

El cliente inicial todavía no conoce una dirección IPv4 válida ni qué servidor DHCP existe.

Por eso la negociación inicial utiliza difusión.

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

### Ejercicio resuelto 4

En una captura aparecen dos `DHCPOFFER`.

No es imposible.

Puede haber dos servidores respondiendo.

En nuestro laboratorio eso debería hacernos revisar:

- otro Kea;
- DHCP de VirtualBox;
- una Red NAT;
- una red Solo-anfitrión;
- una VM conectada al segmento equivocado.

---

### 11. DORA no es todo DHCP

También existen:

- `DHCPNAK`;
- `DHCPRELEASE`;
- `DHCPDECLINE`;
- `DHCPINFORM`;
- renovaciones;
- retransmisiones.

DORA es el punto de partida, no todo el protocolo.

---

### 12. Campos que merece la pena reconocer

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

### Ejercicio resuelto 5

Si dos servidores envían ofertas al mismo cliente, **Option 54 · Server Identifier** ayuda a identificar quién respondió.

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

> «Tengo 254 direcciones para DHCP».

Parte del espacio puede reservarse para:

```text
servidores
routers
AP
impresoras
reservas
crecimiento
```

### Ejercicio resuelto 6

Tenemos:

```text
40 clientes simultáneos
10 reservas
5 equipos de infraestructura
```

Un pool de 10 direcciones no es suficiente.

El pool debe cubrir el pico de clientes dinámicos con margen razonable.

---

### 15. Tiempo de concesión

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

No anunciaremos gateway en `SER-LAB`, porque la red interna base no tiene una pasarela real.

Tampoco inventaremos un DNS que todavía no existe.

Sí podemos observar:

- dirección;
- máscara;
- lease;
- T1/T2;
- dominio de laboratorio.

---

## PARTE IV · KEA EN DEBIAN 13 {#kea}

### 17. Instalar Kea y herramientas

```bash
sudo apt update
sudo apt install -y kea-dhcp4-server tcpdump nano
```

Comprobar:

```bash
apt policy kea-dhcp4-server
kea-dhcp4 -V
dpkg -l | grep kea-dhcp4-server
```

---

### 18. Copia de seguridad

```bash
sudo cp -a /etc/kea/kea-dhcp4.conf /etc/kea/kea-dhcp4.conf.bak
```

Editar:

```bash
sudo nano /etc/kea/kea-dhcp4.conf
```

---

### 19. Configuración base

Sustituye `enp0s8` por la interfaz real de `SER-LAB`.

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

### Qué significa cada bloque

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

### 20. Validar antes de aplicar

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
```

Después:

```bash
sudo systemctl restart kea-dhcp4-server
systemctl status kea-dhcp4-server --no-pager
```

Logs:

```bash
sudo journalctl -u kea-dhcp4-server -b -n 50 --no-pager
```

Comprobación auxiliar:

```bash
sudo ss -lunp | grep ':67'
```

> La ausencia de una línea UDP 67 en `ss` no demuestra por sí sola un fallo de DHCP. Kea puede utilizar raw sockets. La prueba completa combina configuración, servicio, logs, tráfico DHCP y concesión real.

---

### 21. Orden de trabajo recomendado

```text
1. copia / plan de vuelta atrás
2. editar una sola cosa
3. validar
4. restart
5. status
6. logs
7. cliente
8. captura
9. concesión registrada
10. comprobar que no rompimos otra cosa
```

---

## PARTE V · CLIENTES Y CONCESIONES {#clientes}

### 22. Cliente Windows

Configura la NIC de `SER-LAB` para obtener IPv4 automáticamente.

```bat
ipconfig /all
```

Forzar negociación:

```bat
ipconfig /release
ipconfig /renew
ipconfig /all
```

Comprueba:

- dirección dentro del pool;
- máscara;
- servidor DHCP;
- duración de concesión.

No esperes gateway en la LAN base si no existe uno.

---

### 23. Cliente Debian

Primero identifica el gestor:

```bash
systemctl is-active NetworkManager systemd-networkd networking
```

#### NetworkManager

```bash
nmcli device status
nmcli connection show
nmcli -f GENERAL,IP4,DHCP4 device show INTERFAZ
```

Para renovar:

```bash
sudo nmcli connection down "NOMBRE_CONEXION"
sudo nmcli connection up "NOMBRE_CONEXION"
```

#### ifupdown

Perfil:

```text
auto enp0s8
iface enp0s8 inet dhcp
```

Aplicar desde consola local:

```bash
sudo ifdown enp0s8
sudo ifup enp0s8
ip -br address
ip route
```

No copies `enp0s8` sin comprobar el nombre real.

---

### 24. Primera concesión

Servidor:

```bash
sudo journalctl -u kea-dhcp4-server -f
```

En otra terminal:

```bash
sudo head -n 5 /var/lib/kea/kea-leases4.csv
```

La IP del cliente y la registrada por Kea deben ser coherentes.

---

### 25. Capturar DHCP con tcpdump

```bash
sudo tcpdump -ni INTERFAZ -vv 'udp port 67 or udp port 68'
```

Guardar PCAP:

```bash
sudo tcpdump -ni INTERFAZ -w ut01-dhcp.pcap 'udp port 67 or udp port 68'
```

Busca:

```text
Discover
Offer
Request
ACK
```

---

### 26. Wireshark

Filtro:

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

![Triángulo de evidencias]({{ '/assets/docencia/ser/ut01/06_triangulo_evidencias.svg' | relative_url }})

*Figura 6. Captura, lease y estado del cliente deben contar la misma historia.*

---

## PARTE VI · RESERVAS Y OPCIONES {#reservas}

### 27. Crear una reserva

Obtén la MAC real.

Linux:

```bash
ip link
```

Windows:

```bat
ipconfig /all
```

Dentro de `subnet4`:

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

---

### 28. Reserva DHCP no es IP manual

Con reserva:

```text
cliente usa DHCP
      ↓
servidor reconoce identidad
      ↓
entrega dirección estable
      ↓
puede entregar opciones
      ↓
queda registrada la concesión
```

Con IP manual, la dirección se configura directamente en el cliente.

---

### 29. Añadir gateway solo si existe

Si incorporamos una pasarela real:

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

Si no existe pasarela, no la anunciamos.

---

### 30. Añadir DNS cuando exista

Cuando implantemos un DNS real:

```json
{
  "name": "domain-name-servers",
  "data": "192.168.50.10"
}
```

DHCP puede entregar la dirección del DNS.

Eso no demuestra que DNS funcione correctamente.

---

## PARTE VII · DIAGNÓSTICO {#diagnostico}

### 31. Escalera DHCP

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

### 32. Cliente Windows obtiene 169.254.x.x

Una dirección APIPA suele indicar que Windows no ha conseguido una concesión útil.

Primera pregunta:

```text
¿llega un Discover al servidor?
```

Captura:

```bash
sudo tcpdump -ni INTERFAZ 'udp port 67 or udp port 68'
```

Si no llega Discover:

- red virtual;
- NIC;
- cable virtual;
- interfaz del cliente.

Si llega Discover pero no Offer:

- Kea;
- interfaz;
- subred;
- pool;
- logs.

---

### 33. Kea valida pero no arranca

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
systemctl status kea-dhcp4-server --no-pager
sudo journalctl -u kea-dhcp4-server -b -n 50 --no-pager
ip -br link
```

Hipótesis:

- interfaz inexistente;
- dirección/subred incoherente;
- conflicto;
- problema de ejecución.

La configuración puede ser sintácticamente válida y fallar al aplicarse al sistema real.

---

### 34. Dos ofertas

Síntoma:

```text
el cliente recibe IP de otro rango
```

Busca:

- Option 54;
- MAC origen;
- dos `DHCPOFFER`.

Posibles causas:

- segundo Kea;
- DHCP integrado de VirtualBox;
- Red NAT;
- Solo-anfitrión;
- VM en segmento incorrecto.

---

### 35. IP correcta pero no navega

No concluyas:

> «DHCP está mal».

En la ruta base de UT01 no existe gateway en `SER-LAB`.

Primero demostramos:

```text
cliente ↔ servidor dentro de la LAN
```

---

### 36. Reserva ignorada

Compara:

- MAC real;
- `chaddr`;
- `client-id`;
- reserva de Kea;
- concesión anterior.

No cambies cosas al azar hasta saber qué identidad presenta el cliente.

---

## PARTE VIII · INDIVIDUALIZACIÓN {#individualizacion}

### 37. Regla por puesto

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

### Ejemplo ficticio: puesto 7

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

## PARTE IX · VARIAS REDES SIN RELAY {#multired}

### 38. De una red a dos redes directamente conectadas

Hasta ahora Kea ha trabajado con una única LAN.

Ahora ampliaremos el laboratorio para entender que **un servidor DHCP puede atender varias subredes cuando está conectado directamente a todas ellas**.

```text
CLIENTE A ── RED A ── NIC A [ SERVIDOR KEA ] NIC B ── RED B ── CLIENTE B
```

En este escenario:

- Red A y Red B son dominios de difusión distintos;
- Kea tiene una interfaz dentro de cada red;
- cada interfaz del servidor tiene IP fija;
- cada red necesita su propia entrada `subnet4`;
- **no necesitamos relay**, porque el broadcast de cada cliente llega directamente a una NIC del servidor.

---

### 39. Preparar una segunda NIC

Con la VM apagada, añade una nueva tarjeta en VirtualBox:

```text
Adaptador 3
Conectado a: Red interna
Nombre: SER-DHCP2-PXX
Cable conectado: sí
```

Al arrancar Debian:

```bash
ip -br link
ip -br address
```

Identifica la nueva interfaz.

No supongas que se llama `enp0s9`.

---

### 40. La segunda NIC necesita IP persistente

Ejemplo para P07:

```text
Red A   192.168.57.0/24
Kea A   192.168.57.10

Red B   192.168.67.0/24
Kea B   192.168.67.10
```

Para obtener Red B de forma determinista podemos utilizar:

```text
M = 60 + P
Red B = 192.168.M.0/24
```

Para P07:

```text
M = 67
Red B = 192.168.67.0/24
```

Configura la nueva NIC usando **el mismo gestor de red que ya utiliza tu Debian**.

No añadas una segunda puerta de enlace predeterminada.

Comprueba:

```bash
ip -br address
ip route
```

Debes ver rutas conectadas a las dos LAN.

---

### 41. Kea escucha en varias interfaces

`interfaces-config` acepta una lista.

Ejemplo:

```json
"interfaces-config": {
  "interfaces": [ "enp0s8", "enp0s9" ]
}
```

Los nombres son ejemplos.

Usa los de tu máquina.

---

### 42. Declarar dos subredes

Ejemplo P07:

```json
"subnet4": [
  {
    "id": 1,
    "subnet": "192.168.57.0/24",
    "pools": [
      {
        "pool": "192.168.57.100 - 192.168.57.149"
      }
    ],
    "option-data": [
      {
        "name": "domain-name",
        "data": "p07-a.ser.test"
      }
    ]
  },
  {
    "id": 2,
    "subnet": "192.168.67.0/24",
    "pools": [
      {
        "pool": "192.168.67.100 - 192.168.67.149"
      }
    ],
    "option-data": [
      {
        "name": "domain-name",
        "data": "p07-b.ser.test"
      }
    ]
  }
]
```

Cada subred tiene:

- `id` distinto;
- red distinta;
- pool distinto.

---

### 43. ¿Por qué aquí no hace falta DHCP Relay?

Porque el servidor **está directamente conectado a las dos redes**.

```text
Red A                         Red B
cliente A ─ broadcast ─> NIC A   NIC B <─ broadcast ─ cliente B
                            [ KEA ]
```

El relay aparece cuando el servidor está en otra red:

```text
CLIENTE B ── RED B ── ROUTER/RELAY ── RED A ── SERVIDOR KEA
```

| Situación | ¿Relay? |
|---|---|
| Kea tiene una NIC en la red del cliente | No |
| Kea está en otra red separada por router | Sí, si queremos usar ese servidor |

---

### 44. Prueba de regresión

Antes de ampliar:

```text
Red A funciona
```

Después de ampliar:

```text
Red A debe seguir funcionando
Red B debe funcionar
```

Comprueba:

```bash
ip -br address
ip route
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
systemctl status kea-dhcp4-server --no-pager
sudo journalctl -u kea-dhcp4-server -b -n 50 --no-pager
```

Cliente A:

```text
IP del pool A
```

Cliente B:

```text
IP del pool B
```

Leases:

```bash
sudo tail -n 20 /var/lib/kea/kea-leases4.csv
```

Deben aparecer concesiones coherentes con ambas redes.

---


## PARTE XI · CASOS RESUELTOS {#casos}

### 45. Caso A · Windows muestra 169.254.x.x

Primera prueba:

```bash
sudo tcpdump -ni INTERFAZ 'udp port 67 or udp port 68'
```

**No aparece Discover**

Revisar:

```text
VirtualBox
NIC
red interna
cliente
```

**Aparece Discover pero no Offer**

Revisar:

```text
Kea
interfaz
subnet4
pool
logs
```

---

### 46. Caso B · configuración válida, servicio failed

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
```

no muestra errores, pero:

```bash
systemctl status kea-dhcp4-server
```

muestra `failed`.

Comprueba:

```bash
sudo journalctl -u kea-dhcp4-server -b -n 50 --no-pager
ip -br link
ip -br address
```

Si Kea escucha en una interfaz inexistente, el JSON puede ser válido y el servicio fallar.

---

### 47. Caso C · dos DHCPOFFER

Captura:

```text
Offer 1 → Server Identifier 192.168.50.10
Offer 2 → Server Identifier 10.0.2.2
```

Hay dos autoridades DHCP en el mismo segmento.

No lo arregles cambiando el pool.

Aísla y localiza el segundo servidor.

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

Primero corrige la identidad.

Después:

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
sudo systemctl restart kea-dhcp4-server
```

y renueva.

---

### 49. Caso E · Red A funciona y Red B no

Comprueba en orden:

```text
1. ¿NIC B está conectada?
2. ¿NIC B tiene IP fija?
3. ¿la ruta conectada a Red B existe?
4. ¿Kea escucha en NIC B?
5. ¿existe subnet4 de Red B?
6. ¿el pool pertenece a Red B?
7. ¿el cliente B está realmente en la misma red interna?
8. ¿llega Discover por NIC B?
```

No modifiques Red A si Red A sigue funcionando.

---

## PARTE XII · CHULETA OPERATIVA {#chuleta}

### Servidor

```bash
ip -br link
ip -br address
ip route
ip route get DIRECCION

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

sudo tail -n 20 /var/lib/kea/kea-leases4.csv
```

### Captura

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

### Windows

```bat
ipconfig /all
ipconfig /release
ipconfig /renew
ipconfig /all
```

### Debian con NetworkManager

```bash
nmcli device status
nmcli connection show
nmcli -f GENERAL,IP4,DHCP4 device show INTERFAZ
ip -br address
ip route
```

---

## PARTE XIII · AMPLIACIÓN {#ampliacion}

### 50. DHCP Relay

DHCP inicial utiliza broadcast y un router no reenvía ese broadcast de forma ordinaria.

En redes donde el servidor **no está directamente conectado** a la LAN del cliente se utiliza un relay.

```text
CLIENTE LAN B
     ↓ broadcast
RELAY
     ↓ reenvía
KEA central
```

El relay permite que una infraestructura DHCP centralizada atienda otras subredes.

En SMR lo introducimos conceptualmente. La implantación completa pertenece a una ampliación.

---

### 51. DHCP y DNS

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

### 52. Windows Server

El protocolo no cambia aunque cambie la plataforma.

En una implementación equivalente con Windows Server encontraremos:

```text
ámbitos
exclusiones
reservas
concesiones
opciones
```

El objetivo será reconocer los mismos conceptos, no repetirlos mecánicamente.

---

## PARTE XIV · REFERENCIAS OFICIALES {#referencias}

### Currículo

- [Decreto 272/2009, de 28 de diciembre · currículo de SMR en Extremadura](https://doe.juntaex.es/eli/es-ex/d/2009/12/28/272/dof/spa/pdf)
- [Real Decreto 1691/2007 · título de Técnico en Sistemas Microinformáticos y Redes](https://www.boe.es/buscar/doc.php?id=BOE-A-2008-819)

### DHCP y Kea

- [ISC Kea · DHCPv4 Server](https://kea.readthedocs.io/en/latest/arm/dhcp4-srv.html)
- [ISC Kea · Configuration Examples](https://kea.readthedocs.io/en/latest/config-examples.html)
- [Debian 13 · `kea-dhcp4-server`](https://packages.debian.org/trixie/kea-dhcp4-server)
- [RFC 2131 · Dynamic Host Configuration Protocol](https://www.rfc-editor.org/rfc/rfc2131.html)
- [RFC 2132 · DHCP Options](https://www.rfc-editor.org/rfc/rfc2132.html)

### Herramientas

- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/)
- [Microsoft · `ipconfig`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig)
- [Oracle VirtualBox · Networking](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/networkingdetails.html)

---
## 53. Puente hacia UT02

Al terminar UT01 deberías poder responder:

```text
¿quién me ha dado esta IP?
¿durante cuánto tiempo?
¿qué opciones me ha entregado?
¿qué servidor respondió?
¿dónde está registrada la concesión?
¿qué ocurre si el cliente no recibe respuesta?
¿cómo atiende Kea dos redes directamente conectadas?
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
