---
title: "UT01 · Configuración dinámica: DHCP"
description: "DHCPv4 desde el protocolo hasta una concesión verificable con Kea en Debian 13, clientes Linux/Windows, reservas, opciones, DHCP Relay entre redes y diagnóstico."
summary: "DHCPv4 con Kea: DORA, pools, leases, reservas, opciones, clientes, DHCP Relay para atender varias subredes y diagnóstico basado en evidencias."

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
version: "1.4"
last_reviewed: 2026-10-20
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
  - relay
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
  - title: DHCP Relay
    id: relay
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

> **Importante para las prácticas:** en los ejemplos de esta página se utilizan direcciones y nombres de laboratorio para aprender el procedimiento. En las tareas evaluables tendrás que aplicar estos conocimientos a **tu propia variante**. No debes copiar literalmente las direcciones de los ejemplos.

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

En nuestras prácticas utilizaremos principalmente la **dirección MAC** de la interfaz de red del cliente.

Uso típico:

```text
impresora
AP
cámara
servidor auxiliar
equipo que necesita dirección estable
```

### Ejercicio resuelto 2

Una impresora debe conservar siempre la misma dirección, pero queremos seguir administrando su configuración mediante DHCP.

**Mejor opción:** reserva DHCP.

---

# PARTE I · LABORATORIO SEGURO {#laboratorio}

## 6. Reutilizamos SER-LAB

UT01 parte del laboratorio creado en UT00.

![Topología segura del laboratorio]({{ '/assets/docencia/ser/ut01/02_topologia_ser_lab.svg' | relative_url }})

*Figura 2. El servidor y los clientes comparten una Red interna aislada.*

| Equipo | SO | Interfaz de servicio | Función |
|---|---|---|---|
| `ser-ser01` | Debian 13 | IPv4 estática | servidor Kea |
| `ser-cli01` | Debian 13 | sin IPv4 manual | cliente DHCP |
| `ser-win01` | Windows 11 | obtener automáticamente | cliente DHCP |

La NIC NAT de `ser-ser01` se mantiene para mantenimiento e instalación de paquetes.

La NIC de servicio se conecta a una **Red interna de VirtualBox**.

> **Nunca conectes el servidor DHCP de prácticas en modo Puente a la red física del centro.**

Un DHCP mal conectado puede responder a clientes que no forman parte del laboratorio.

---

## 7. Antes de instalar Kea

En `ser-ser01`:

```bash
ip -br link
ip -br address
ip route
```

Debes identificar qué NIC está conectada a la red interna.

Ejemplo típico:

```text
enp0s3   UP   10.0.2.15/24
enp0s8   UP   10.10.10.10/24
```

No memorices `enp0s8`.

Comprueba cuál es la interfaz real de tu VM.

### Prueba de ruta

```bash
ip route get 10.10.10.20
```

La salida debe utilizar la NIC interna.

### Ejercicio resuelto 3

Si un destino de la LAN interna intenta salir por la NIC NAT, revisa la topología y las rutas antes de instalar DHCP.

Kea no arregla una red virtual mal construida.

---

## 8. IPv4 estática y persistente en el servidor

Un servidor DHCP necesita una dirección **estable** en la red a la que presta servicio.

No basta con ejecutar temporalmente:

```bash
sudo ip address add ...
```

Ese cambio desaparece al reiniciar.

Antes de editar ningún fichero, averigua **qué componente gestiona realmente la interfaz**:

```bash
systemctl is-active NetworkManager
systemctl is-active systemd-networkd
systemctl is-active networking
```

También puedes consultar:

```bash
nmcli device status
networkctl status
```

No mezcles varios gestores sobre la misma interfaz.

### Opción A · NetworkManager

Primero identifica el nombre de la conexión:

```bash
nmcli connection show
```

Ejemplo genérico:

```bash
sudo nmcli connection modify "CONEXION_INTERNA" \
  ipv4.method manual \
  ipv4.addresses 10.10.10.10/24 \
  ipv4.gateway "" \
  ipv4.dns ""

sudo nmcli connection up "CONEXION_INTERNA"
```

Comprueba:

```bash
ip -br address
ip route
```

### Opción B · ifupdown

Si Debian utiliza `/etc/network/interfaces`, una configuración genérica puede ser:

```text
auto INTERFAZ
iface INTERFAZ inet static
    address 10.10.10.10/24
```

En la NIC interna de nuestro laboratorio **no añadimos gateway** si no existe un router en esa red.

Aplica los cambios desde la consola local:

```bash
sudo ifdown INTERFAZ
sudo ifup INTERFAZ
```

Comprueba después:

```bash
ip -br address
ip route
```

### Opción C · systemd-networkd

Ejemplo genérico:

```ini
[Match]
Name=INTERFAZ

[Network]
Address=10.10.10.10/24
```

Guárdalo como un fichero `.network` dentro de:

```text
/etc/systemd/network/
```

Después:

```bash
sudo systemctl restart systemd-networkd
networkctl status INTERFAZ
ip -br address
ip route
```

### Comprobación obligatoria

Una configuración persistente debe superar esta prueba:

```text
configuro
   ↓
compruebo
   ↓
reinicio
   ↓
vuelvo a comprobar
```

Si después del reinicio la dirección desaparece, **no era persistente**.

> Los valores `10.10.10.10/24` anteriores son ejemplos de aprendizaje. En una tarea evaluable utiliza la red y el direccionamiento que correspondan a tu escenario.

---

## 9. El cliente no debe tener IP fija en la LAN DHCP

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

# PARTE II · CÓMO HABLA DHCP {#dora}

## 10. Puertos y difusión

DHCPv4 utiliza UDP.

```text
Servidor → UDP 67
Cliente  → UDP 68
```

El cliente inicial todavía no conoce una dirección IPv4 válida ni qué servidor DHCP existe.

Por eso la negociación inicial utiliza difusión.

---

## 11. DORA

![Proceso DORA]({{ '/assets/docencia/ser/ut01/03_dora.svg' | relative_url }})

*Figura 3. Discover, Offer, Request y ACK describen la negociación inicial más habitual.*

### DHCPDISCOVER

El cliente busca servidores.

### DHCPOFFER

Un servidor propone una dirección y determinadas opciones.

### DHCPREQUEST

El cliente solicita la oferta elegida.

### DHCPACK

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

## 12. DORA no es todo DHCP

También existen:

- `DHCPNAK`;
- `DHCPRELEASE`;
- `DHCPDECLINE`;
- `DHCPINFORM`;
- renovaciones;
- retransmisiones.

DORA es el punto de partida, no todo el protocolo.

---

## 13. Campos que merece la pena reconocer

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

# PARTE III · POLÍTICA DE DIRECCIONAMIENTO {#direccionamiento}

## 14. Subred, pool, infraestructura y reservas

Antes de abrir el editor debemos diseñar.

![Diseño del pool]({{ '/assets/docencia/ser/ut01/04_pool_reservas.svg' | relative_url }})

*Figura 4. Separar infraestructura, reservas y pool evita conflictos y facilita crecer.*

Ejemplo **solo didáctico**:

```text
Red              10.44.0.0/24
Servidor          10.44.0.10
Infraestructura   10.44.0.1–49
Reservas          10.44.0.50–79
Pool dinámico     10.44.0.100–139
Crecimiento       resto del espacio planificado
```

No entregues dinámicamente:

- dirección de red;
- broadcast;
- IP del servidor;
- IP del gateway si existe;
- direcciones reservadas;
- otras direcciones estáticas conocidas.

### La decisión importante

Un buen plan no consiste en copiar siempre:

```text
servidor .10
pool .100–149
reserva .80
```

Consiste en justificar que:

```text
todas las direcciones pertenecen a la subred
no se solapan
hay espacio suficiente
la infraestructura queda protegida
las reservas no entran en conflicto
el diseño puede crecer
```

---

## 15. Dimensionar un pool

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
24 clientes dinámicos simultáneos
6 dispositivos con dirección estable
varios equipos de infraestructura
```

Un pool de 10 direcciones no sería suficiente.

El pool debe cubrir el pico de clientes dinámicos con un margen razonable.

### Si una tarea te indica una capacidad

Si el enunciado exige, por ejemplo:

```text
20 clientes dinámicos
```

tu pool debe disponer **como mínimo** de ese número de direcciones válidas y no puede solaparse con:

```text
servidor
infraestructura
reservas
red
broadcast
```

---

## 16. Tiempo de concesión

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

No copies estos valores sin analizar el escenario.

### ¿Qué ocurre si el cliente se apaga?

Una concesión **no desaparece automáticamente** en el mismo instante en que el cliente se apaga o se desconecta.

La dirección puede continuar figurando como concedida hasta que:

- el cliente la libere expresamente;
- la concesión expire;
- o el servidor actualice su estado según corresponda.

Por eso:

```text
cliente apagado ≠ dirección inmediatamente libre
```

Esta diferencia es importante cuando interpretamos el fichero de leases.

---

## 17. Opciones DHCP

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

### En la ruta base de UT01

No anunciaremos gateway si la red interna no tiene una pasarela real.

Tampoco inventaremos un DNS que todavía no existe.

Sí podemos observar:

- dirección;
- máscara;
- lease;
- T1/T2;
- dominio de laboratorio.

---

# PARTE IV · KEA EN DEBIAN 13 {#kea}

## 18. Instalar Kea y herramientas

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

## 19. Copia de seguridad

```bash
sudo cp -a /etc/kea/kea-dhcp4.conf /etc/kea/kea-dhcp4.conf.bak
```

Editar:

```bash
sudo nano /etc/kea/kea-dhcp4.conf
```

---

## 20. Configuración base de ejemplo

Este bloque sirve para **entender la estructura de Kea**. No es la solución de ninguna tarea evaluable.

Sustituye `INTERFAZ_LAN` y los datos de ejemplo cuando construyas tu propio escenario.

```json
{
  "Dhcp4": {
    "interfaces-config": {
      "interfaces": [ "INTERFAZ_LAN" ]
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
        "subnet": "10.44.0.0/24",

        "pools": [
          {
            "pool": "10.44.0.100 - 10.44.0.139"
          }
        ],

        "option-data": [
          {
            "name": "domain-name",
            "data": "ejemplo.ser.test"
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

## 21. Validar antes de aplicar

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

> La ausencia de una línea UDP 67 en `ss` no demuestra por sí sola un fallo de DHCP. La comprobación completa combina configuración, servicio, logs, tráfico DHCP y concesión real.

---

## 22. Orden de trabajo recomendado

```text
1. entender el requisito
2. diseñar el direccionamiento
3. guardar una copia / plan de vuelta atrás
4. modificar
5. validar
6. aplicar
7. comprobar servicio y logs
8. probar desde cliente
9. revisar concesión
10. comprobar que no rompimos otra cosa
```

Este orden es un **método de trabajo**, no la solución de una práctica concreta.

---

# PARTE V · CLIENTES Y CONCESIONES {#clientes}

## 23. Cliente Windows

Configura la NIC de laboratorio para obtener IPv4 automáticamente.

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

- dirección dentro del pool esperado;
- máscara;
- servidor DHCP;
- duración de concesión.

No esperes gateway en una LAN que no tenga uno.

---

## 24. Cliente Debian

Primero identifica el gestor:

```bash
systemctl is-active NetworkManager systemd-networkd networking
```

### NetworkManager

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

### ifupdown

Perfil:

```text
auto INTERFAZ
iface INTERFAZ inet dhcp
```

Aplicar desde consola local:

```bash
sudo ifdown INTERFAZ
sudo ifup INTERFAZ
ip -br address
ip route
```

No copies un nombre de interfaz sin comprobar el real.

---

## 25. Primera concesión

Servidor:

```bash
sudo journalctl -u kea-dhcp4-server -f
```

En otra terminal:

```bash
sudo head -n 5 /var/lib/kea/kea-leases4.csv
```

La IP del cliente y la registrada por Kea deben ser coherentes.

### Qué es una lease

Una **lease** es una concesión temporal.

No significa:

> «esta IP pertenece para siempre a este cliente».

Significa:

> «esta dirección ha sido cedida bajo unas condiciones y durante un tiempo determinado».

---

## 26. Capturar DHCP con tcpdump

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

## 27. Wireshark

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

### Pregunta clave

¿Cómo puede enviar un cliente `DHCPDISCOVER` si todavía no tiene una IPv4 válida?

Porque la fase inicial utiliza **difusión** y los puertos UDP definidos por DHCP. El cliente todavía no necesita conocer una dirección unicast del servidor.

---

# PARTE VI · RESERVAS Y OPCIONES {#reservas}

## 28. Reserva por dirección MAC

Obtén la MAC real de la interfaz que participa en el laboratorio.

Linux:

```bash
ip link
```

Windows:

```bat
ipconfig /all
```

Ejemplo **genérico** de estructura:

```json
"reservations": [
  {
    "hw-address": "08:00:27:aa:bb:cc",
    "ip-address": "10.44.0.70",
    "hostname": "equipo-reservado"
  }
]
```

Lo importante no es copiar esos valores, sino entender la relación:

```text
MAC concreta
      ↓
reserva DHCP
      ↓
dirección concreta
```

La IP reservada debe:

- pertenecer a la subred;
- no ser dirección de red ni broadcast;
- no entrar en conflicto con el servidor;
- no entrar en conflicto con otra dirección estática;
- respetar la política de direccionamiento diseñada.

---

## 29. Reserva DHCP no es IP manual

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

## 30. Añadir gateway solo si existe

Si incorporamos una pasarela real:

```text
router de laboratorio → 10.44.0.1
```

podremos añadir:

```json
{
  "name": "routers",
  "data": "10.44.0.1"
}
```

Si no existe pasarela, no la anunciamos.

---

## 31. Añadir DNS cuando exista

Cuando implantemos un DNS real:

```json
{
  "name": "domain-name-servers",
  "data": "DIRECCION_DEL_DNS"
}
```

DHCP puede entregar la dirección del DNS.

Eso no demuestra que DNS funcione correctamente.

---

# PARTE VII · DIAGNÓSTICO {#diagnostico}

## 32. Escalera DHCP

![Escalera de diagnóstico DHCP]({{ '/assets/docencia/ser/ut01/07_diagnostico_dhcp.svg' | relative_url }})

*Figura 7. Comprobar una capa cada vez evita cambios aleatorios.*

Orden recomendado:

```text
1. ¿cliente y servidor están realmente en el segmento esperado?
2. ¿las NIC están conectadas?
3. ¿el servidor tiene direccionamiento válido y persistente?
4. ¿la configuración de Kea es válida?
5. ¿el servicio está activo?
6. ¿los logs muestran un error?
7. ¿el Discover llega?
8. ¿sale Offer/ACK?
9. ¿el cliente aplica la configuración?
10. ¿la lease coincide?
```

---

## 33. Cliente Windows obtiene 169.254.x.x

Una dirección APIPA suele indicar que Windows no ha conseguido una concesión útil.

Primera pregunta:

```text
¿llega un Discover al servidor?
```

Captura:

```bash
sudo tcpdump -ni INTERFAZ 'udp port 67 or udp port 68'
```

Si no llega Discover, investiga primero:

- red virtual;
- NIC;
- cable virtual;
- interfaz del cliente.

Si llega Discover pero no Offer, investiga:

- Kea;
- interfaz;
- subred;
- pool;
- logs.

---

## 34. Kea valida pero no arranca

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
systemctl status kea-dhcp4-server --no-pager
sudo journalctl -u kea-dhcp4-server -b -n 50 --no-pager
ip -br link
```

Hipótesis posibles:

- interfaz inexistente;
- dirección/subred incoherente;
- conflicto;
- problema de ejecución.

La configuración puede ser sintácticamente válida y fallar al aplicarse al sistema real.

---

## 35. Dos ofertas

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

## 36. IP correcta pero no navega

No concluyas:

> «DHCP está mal».

En una red interna sin gateway, el objetivo inicial es demostrar:

```text
cliente ↔ servidor dentro de la LAN
```

---

## 37. Reserva ignorada

Compara:

- MAC real de la interfaz usada;
- `chaddr`;
- `client-id` si procede;
- reserva de Kea;
- concesión anterior.

No cambies cosas al azar hasta saber qué identidad presenta el cliente.

---

# PARTE VIII · INDIVIDUALIZACIÓN {#individualizacion}

## 38. Tu variante no es una solución precalculada

Las tareas del módulo utilizan datos individualizados para que cada alumno construya y pueda defender su propio escenario.

En las prácticas podremos utilizar:

```text
P → número de puesto asignado al alumno
L → inicial del primer apellido convertida a número
M → número máximo de equipos que deben poder obtener concesión dinámica simultáneamente
```

> La unidad **no fija cuántos puestos existen en el aula**. `P` es únicamente el identificador de puesto que indique el profesor para esa actividad.

El enunciado concretará cómo afectan `P`, `L` y, cuando proceda, `M` al escenario.

### Qué puede cambiar entre alumnos

Pueden variar:

- red de trabajo;
- número máximo de equipos que debe poder atender el pool;
- duración de concesión;
- segunda red;
- nombre de red virtual;
- determinados requisitos de la incidencia.

### Número máximo de equipos y tamaño del pool

Si una práctica indica:

```text
M = 18
```

significa que el pool debe poder entregar **como mínimo 18 concesiones simultáneas válidas**.

No significa que la última dirección del pool tenga que terminar en `.18`.

Por ejemplo, si elegimos como inicio:

```text
10.44.0.100
```

un pool de 18 direcciones consecutivas terminaría en:

```text
10.44.0.117
```

porque se cuentan ambas direcciones.

La idea que debes recordar es:

```text
número máximo de equipos
          ↓
número mínimo de direcciones útiles en el pool
```

### Qué debes decidir tú

Aunque la tarea te proporcione una red y unas restricciones, tendrás que decidir de forma razonada:

```text
dirección del servidor
zona de infraestructura
inicio y final del pool dinámico
dirección reservada
organización de las redes
```

No hay una única respuesta basada en:

```text
servidor siempre .10
pool siempre .100–149
reserva siempre .80
```

Una solución será válida si:

- cumple el enunciado;
- utiliza direcciones válidas;
- evita solapamientos;
- satisface el número máximo de equipos exigido;
- funciona;
- y puedes justificarla.

### Ejemplo didáctico que NO pertenece a la práctica final

Supongamos:

```text
Red                         10.44.0.0/24
Número máximo de equipos    18
1 servidor
1 equipo reservado
```

Una posible planificación podría ser:

```text
infraestructura  → zona baja
reserva          → fuera del pool
pool             → al menos 18 direcciones válidas
```

La web te enseña los criterios. En la tarea tendrás que construir **tu propio plan**.


---

# PARTE IX · DHCP RELAY {#relay}

## 39. Un único servidor DHCP para dos redes

Hasta ahora Kea ha atendido clientes situados en su misma LAN.

El siguiente paso consiste en mantener **un único servidor Kea** y conseguir que entregue configuración a clientes de **dos redes diferentes**.

```text
RED A · 10.44.0.0/24

CLIENTE A ─────────────────────┐
                              │
KEA 10.44.0.10 ────────────────┼── 10.44.0.254
                              │      [ RELAY ]
                              │     10.55.0.254
                              │
                              └────────────── CLIENTE B

RED B · 10.55.0.0/24
```

Los valores anteriores son **didácticos**. La práctica evaluable utilizará los datos indicados en su enunciado.

El objetivo es:

```text
CLIENTE A → dirección del pool de RED A
CLIENTE B → dirección del pool de RED B

pero solo existe un servidor Kea
```

---

## 40. Por qué necesitamos un relay

La negociación DHCP inicial utiliza difusión.

Si Kea está en Red A y el cliente está en Red B:

```text
CLIENTE B
    ↓
DHCPDISCOVER broadcast
    ↓
RED B
    X
no llega directamente a Kea en RED A
```

El **DHCP Relay** resuelve ese problema:

```text
CLIENTE B
    ↓ broadcast
RELAY
    ↓ reenvío hacia Kea
SERVIDOR DHCP
```

El relay:

- no sustituye al servidor DHCP;
- no crea el pool;
- no decide qué IP entregar;
- transporta la negociación entre redes distintas;
- aporta información para que Kea pueda seleccionar la subred correcta.

---

## 41. Topología y máquinas necesarias

Para esta ampliación necesitamos tres roles:

| Equipo | Interfaces de laboratorio | Función |
|---|---:|---|
| Servidor Kea | Red A | servidor DHCP central |
| Relay | Red A + Red B | comunica DHCP entre las dos redes |
| Cliente B | Red B | solicita configuración desde una red remota |

Podemos reutilizar un cliente de Red A para comprobar que lo ya existente continúa funcionando.

### Servidor Kea

El servidor permanece conectado a Red A.

**No añadimos una NIC del servidor a Red B.**

Si Kea estuviera directamente conectado también a Red B, ya no estaríamos comprobando relay.

### Relay

El relay necesita dos NIC de laboratorio:

```text
NIC A → Red A
NIC B → Red B
```

Ejemplo didáctico:

```text
NIC A → 10.44.0.254/24
NIC B → 10.55.0.254/24
```

### Cliente B

Su NIC de laboratorio se conecta a Red B y debe obtener IPv4 automáticamente.

---

## 42. Preparar el equipo relay

Antes de modificar nada:

```bash
ip -br link
ip -br address
ip route
```

Identifica qué interfaz corresponde a cada red.

Configura direcciones **estáticas y persistentes** en ambas NIC utilizando el gestor de red real de ese Debian:

```text
NetworkManager
ifupdown
systemd-networkd
```

No copies nombres como `enp0s8` o `enp0s9` sin comprobarlos.

Después:

```bash
ip -br address
ip route
```

El relay debe tener presencia directa en ambas redes.

### Instalar el servicio

```bash
sudo apt update
sudo apt install -y isc-dhcp-relay
```

Revisa:

```bash
sudo nano /etc/default/isc-dhcp-relay
```

La configuración debe expresar al menos:

```text
SERVERS="IP_DEL_SERVIDOR_KEA"
INTERFACES="INTERFAZ_RED_A INTERFAZ_RED_B"
OPTIONS=""
```

Ejemplo didáctico:

```text
SERVERS="10.44.0.10"
INTERFACES="INTERFAZ_A INTERFAZ_B"
OPTIONS=""
```

Sustituye los marcadores por los nombres reales.

Después:

```bash
sudo systemctl restart isc-dhcp-relay
systemctl status isc-dhcp-relay --no-pager
sudo journalctl -u isc-dhcp-relay -b -n 50 --no-pager
```

> El objetivo de esta práctica es transportar correctamente la negociación DHCP entre Red B y el servidor de Red A. No es necesario convertirla en un ejercicio completo de routing de usuarios.

---

## 43. Kea debe conocer las dos subredes

Kea continúa escuchando en la interfaz del servidor conectada a Red A.

Dentro de `subnet4` debe existir una política para cada red administrada.

Ejemplo didáctico:

```json
"subnet4": [
  {
    "id": 1,
    "subnet": "10.44.0.0/24",
    "pools": [
      {
        "pool": "10.44.0.100 - 10.44.0.119"
      }
    ]
  },
  {
    "id": 2,
    "subnet": "10.55.0.0/24",
    "pools": [
      {
        "pool": "10.55.0.100 - 10.55.0.119"
      }
    ]
  }
]
```

Este bloque enseña la **estructura**, no la solución de la práctica final.

Cada subred:

- tiene un `id` distinto;
- utiliza una red distinta;
- utiliza su propio pool;
- debe respetar el número máximo de equipos exigido;
- debe evitar infraestructura, reservas y solapamientos.

Valida:

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
```

Después:

```bash
sudo systemctl restart kea-dhcp4-server
systemctl status kea-dhcp4-server --no-pager
```

---

## 44. `giaddr`: cómo sabe Kea de qué red viene el cliente

Cuando el cliente de Red B envía su `DHCPDISCOVER`, el relay lo recibe.

Al reenviarlo hacia Kea utiliza el campo:

```text
giaddr
```

Podemos razonarlo así:

```text
CLIENTE B
    ↓ Discover
RELAY en RED B
    ↓ añade información de relay
giaddr = dirección del relay en RED B
    ↓
KEA
    ↓
subnet4 de RED B
    ↓
pool de RED B
```

Por eso `giaddr` es especialmente útil al analizar una negociación que ha atravesado un relay.

---

## 45. Verificar las dos redes

### Cliente A · Red A

Debe recibir una dirección perteneciente al **pool A**.

### Cliente B · Red B

Debe recibir una dirección perteneciente al **pool B**, no al pool A.

### Servidor Kea

```bash
sudo tail -n 20 /var/lib/kea/kea-leases4.csv
```

Deben aparecer concesiones coherentes con ambas redes.

### Relay

```bash
systemctl status isc-dhcp-relay --no-pager
sudo journalctl -u isc-dhcp-relay -b -n 50 --no-pager
```

### Captura

```bash
sudo tcpdump -ni INTERFAZ -vv 'udp port 67 or udp port 68'
```

En Wireshark:

```text
dhcp
```

En el tráfico procedente de Red B localiza especialmente:

```text
giaddr
Option 53
Option 54
yiaddr
```

---

## 46. Prueba de regresión

Antes:

```text
Red A funciona
```

Después:

```text
Red A debe seguir funcionando
Red B debe funcionar mediante relay
```

Comprueba:

```text
Kea sigue operativo
cliente A obtiene pool A
relay está operativo
cliente B obtiene pool B
leases contienen ambas redes
la negociación remota muestra información coherente de relay
```

Una ampliación que consigue atender Red B pero rompe Red A **no está terminada**.


---

# PARTE X · CASOS RESUELTOS {#casos}

## 47. Caso A · cliente con dirección automática de emergencia

Síntoma:

```text
el cliente no obtiene una concesión útil
```

Primera decisión:

```text
¿el Discover llega realmente al servidor?
```

Si no llega, investiga la conectividad y el segmento virtual.

Si llega y no existe respuesta útil, investiga servidor, interfaz, subred, pool y logs.

---

## 48. Caso B · configuración válida, servicio no operativo

Una validación sintáctica correcta no garantiza que el servicio pueda arrancar con el sistema real.

Comprueba:

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
systemctl status kea-dhcp4-server --no-pager
sudo journalctl -u kea-dhcp4-server -b -n 50 --no-pager
ip -br link
ip -br address
```

Ejemplo de razonamiento:

```text
JSON correcto
↓
pero interfaz configurada no existe
↓
Kea no puede aplicar la configuración
```

---

## 49. Caso C · aparecen respuestas inesperadas

Si un cliente recibe una oferta de otro rango:

```text
no cambies inmediatamente tu pool
```

Antes identifica quién está respondiendo.

Busca:

- Option 54;
- MAC origen;
- número de ofertas;
- topología VirtualBox.

---

## 50. Caso D · reserva que no se aplica

No concluyas directamente que la sintaxis es incorrecta.

Compara:

```text
identidad real del cliente
reserva configurada
lease anterior
interfaz que realmente está usando el cliente
```

La pregunta importante es:

> ¿Está presentando el cliente la identidad que yo creo?

---

## 51. Caso E · Red A funciona y Red B no obtiene DHCP mediante relay

Si Red A sigue funcionando y Red B no:

```text
NO empieces modificando Red A
```

Acota el problema:

```text
1. ¿el cliente B está realmente en Red B?
2. ¿las dos NIC del relay están UP y tienen direcciones correctas?
3. ¿el relay conoce la IP del servidor Kea?
4. ¿isc-dhcp-relay está activo?
5. ¿los logs del relay muestran errores?
6. ¿Kea tiene declarada subnet4 para Red B?
7. ¿el pool de Red B pertenece realmente a Red B?
8. ¿el Discover llega al relay?
9. ¿Kea recibe una petición reenviada con giaddr coherente?
10. ¿la respuesta vuelve al cliente B?
```

Herramientas:

```bash
ip -br address
ip route
systemctl status isc-dhcp-relay --no-pager
sudo journalctl -u isc-dhcp-relay -b -n 50 --no-pager
sudo journalctl -u kea-dhcp4-server -b -n 50 --no-pager
sudo tcpdump -ni INTERFAZ -vv 'udp port 67 or udp port 68'
```


---

# PARTE XI · CHULETA OPERATIVA {#chuleta}

## Servidor

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

## Captura

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

## Windows

```bat
ipconfig /all
ipconfig /release
ipconfig /renew
ipconfig /all
```

## Debian con NetworkManager

```bash
nmcli device status
nmcli connection show
nmcli -f GENERAL,IP4,DHCP4 device show INTERFAZ
ip -br address
ip route
```

## Relay Debian

```bash
ip -br link
ip -br address
ip route

sudo apt update
sudo apt install -y isc-dhcp-relay
sudo nano /etc/default/isc-dhcp-relay

sudo systemctl restart isc-dhcp-relay
systemctl status isc-dhcp-relay --no-pager
sudo journalctl -u isc-dhcp-relay -b -n 50 --no-pager

sudo tcpdump -ni INTERFAZ -vv 'udp port 67 or udp port 68'
```

Configuración conceptual:

```text
SERVERS="IP_DEL_SERVIDOR_KEA"
INTERFACES="INTERFAZ_RED_A INTERFAZ_RED_B"
OPTIONS=""
```

---

# PARTE XII · AMPLIACIÓN {#ampliacion}

## 52. Escalar el diseño a más redes

El laboratorio de esta UT utiliza dos redes para comprender el patrón.

En una infraestructura mayor podríamos encontrar:

```text
                  ┌─ LAN A
KEA central ──────┼─ relay/router ─ LAN B
                  ├─ relay/router ─ LAN C
                  └─ relay/router ─ LAN D
```

La idea no cambia:

```text
cada red
   ↓
su propia subnet4
   ↓
su propio pool y opciones
   ↓
relay cuando el servidor no está directamente en esa LAN
```

Cuantas más redes añadimos, más importante resulta documentar direccionamiento, relays, pools, reservas, rutas y evidencias.

En SER nos quedamos con el escenario de dos redes.

---

## 53. DHCP y DNS

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

## 54. Windows Server

El protocolo no cambia aunque cambie la plataforma.

En una implementación equivalente con Windows Server encontraremos:

```text
ámbitos
exclusiones
reservas
concesiones
opciones
relay
```

El objetivo será reconocer los mismos conceptos, no repetirlos mecánicamente.


---

# PARTE XIII · REFERENCIAS OFICIALES {#referencias}

## Currículo

- [Decreto 272/2009, de 28 de diciembre · currículo de SMR en Extremadura](https://doe.juntaex.es/eli/es-ex/d/2009/12/28/272/dof/spa/pdf)
- [Real Decreto 1691/2007 · título de Técnico en Sistemas Microinformáticos y Redes](https://www.boe.es/buscar/doc.php?id=BOE-A-2008-819)

## DHCP y Kea

- [ISC Kea · DHCPv4 Server](https://kea.readthedocs.io/en/latest/arm/dhcp4-srv.html)
- [ISC Kea · Configuration Examples](https://kea.readthedocs.io/en/latest/config-examples.html)
- [Debian 13 · `kea-dhcp4-server`](https://packages.debian.org/trixie/kea-dhcp4-server)
- [Debian 13 · `isc-dhcp-relay`](https://packages.debian.org/trixie/isc-dhcp-relay)
- [RFC 2131 · Dynamic Host Configuration Protocol](https://www.rfc-editor.org/rfc/rfc2131.html)
- [RFC 2132 · DHCP Options](https://www.rfc-editor.org/rfc/rfc2132.html)

## Herramientas

- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/)
- [Microsoft · `ipconfig`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig)
- [Oracle VirtualBox · Networking](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/networkingdetails.html)

---

# 55. Puente hacia UT02

Al terminar UT01 deberías poder responder:

```text
¿quién me ha dado esta IP?
¿durante cuánto tiempo?
¿qué opciones me ha entregado?
¿qué servidor respondió?
¿dónde está registrada la concesión?
¿qué ocurre si el cliente no recibe respuesta?
¿cómo puede un único Kea entregar direcciones a dos redes distintas?
¿qué función cumple un DHCP Relay?
¿qué información aporta giaddr?
¿qué diferencia hay entre una concesión dinámica y una reserva por MAC?
¿por qué una lease no desaparece necesariamente al apagar un cliente?
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
