---
title: 'UT01 · Configuración automática de IPs: DHCP con Kea'
description: 'DHCPv4 con Kea en Debian 13: DORA, pools, reservas, leases, captura y diagnóstico; Windows Server como
  segundo laboratorio obligatorio.'
summary: Diseño, implantación y diagnóstico de DHCP con Kea; después la misma competencia en Windows Server 2025.
module_key: sri
cycle_key: asir
order: 1
module_title: Servicios de Red e Internet
module_code: '0375'
cycle_title: Administración de Sistemas Informáticos en Red
course: 2.º ASIR
unit: UT01
hours: 12
level: intermedio
authors:
- fjcano
reviewers:
- fjcano
rights: all-rights-reserved
version: '2.0'
last_reviewed: '2026-09-23'
visibility: public
ra:
- RA2
ce:
- RA2.a
- RA2.b
- RA2.c
- RA2.d
- RA2.e
- RA2.f
- RA2.g
tags:
- dhcp
- kea
- debian
- dora
- leases
- reservas
- relay
- windows-server
permalink: /docencia/asir/sri/ut01/
published: true
toc:
- title: Misión y objetivos
  id: introduccion
- title: Individualización
  id: individualizacion
- title: DORA y concesiones
  id: dora
- title: Preparar el servidor
  id: prerrequisitos
- title: Instalar Kea
  id: instalacion
- title: Configuración por fases
  id: configuracion
- title: Clientes y evidencias
  id: clientes
- title: Relay (ampliación)
  id: relay
- title: Diagnóstico
  id: diagnostico
- title: 'Windows: segundo laboratorio'
  id: cierre
---

## Introducción {#introduccion}

> **Misión:** transformar el laboratorio estático de UT00 en una infraestructura DHCP observable y diagnosticable. UT01 tiene **dos implementaciones obligatorias** del mismo RA2: primero Kea en Debian 13; después [Windows Server 2025]({{ "/docencia/asir/sri/ut01-windows/" | relative_url }}). No se arranca cada servidor DHCP sobre la red del otro.

> **Núcleo de la unidad:** DORA, Kea, pools, leases, reservas, clientes Linux/Windows y diagnóstico.  
> **Ampliación de Kea:** relay, LAN B, clasificación de clientes, detección de DHCP no autorizado y HA. Se conservan para avanzar por niveles. **Windows Server no es ampliación**: es la segunda plataforma de la misma UT01. Si el grupo necesita consolidación, se ajustará la temporalización sin fingir que se han completado ambos entornos.

**Orden didáctico del curso:** en esta versión SRI seguimos la secuencia usada en Avanza: **DHCP antes que DNS**. Por eso UT01 no presupone un servidor DNS ya instalado. La integración funcional con DNS se cerrará en UT02.

## 1. Qué vas a saber hacer {#objetivos}

Al terminar deberías poder:

- explicar DHCP sin decir simplemente “da Internet”;
- interpretar Discover, Offer, Request, ACK, NAK, Release e Inform;
- localizar xid, yiaddr, Option 50, 51, 53, 54, 58 y 59;
- diseñar un pool con margen, exclusiones y tiempos coherentes;
- instalar e inventariar Kea DHCP4 en Debian 13;
- configurar asignación dinámica y reserva;
- demostrar la política recibida en Linux y Windows;
- correlacionar cliente, PCAP, lease y configuración;
- atender una segunda subred mediante relay y `giaddr`;
- detectar un segundo servidor DHCP mediante Option 54 y origen de Offer;
- resolver incidencias con pruebas discriminantes y rollback.

## 2. RA2 y CE {#ra-ce}

**RA2:** Administra servicios de configuración automática, identificándolos y verificando la correcta asignación de los parámetros.

| CE | Evidencia principal |
|---|---|
| a | comparación manual/DHCP, ventajas, riesgos y dimensionado |
| b | PCAP DORA/renovación interpretada |
| c | Kea instalado, inventariado y operable |
| d | pool y concesión real a cliente |
| e | dinámica + reserva por identidad |
| f | opciones coherentes + relay/multi-subred |
| g | topología, runbook, tickets y rollback |

## 3. Variante individual {#individualizacion}

Se reutiliza `Pxx-Lyy` de UT00 (`P`: puesto 01–40; `L`: letra inicial del primer apellido A=01 … Z=26). Los cálculos hacen variar la configuración sin alterar la dificultad. Los datos P07-L03 son **ejemplo docente**; cada alumno usa sus valores.

| Dato | Fórmula |
|---|---|
| LAN A | `10.37.P.0/24` |
| servidor Kea | `10.37.P.(20+L)` |
| pool A | `10.37.P.(100+P)` a `10.37.P.(129+P)` |
| reserva | `10.37.P.(180+L)` |
| valid-lifetime | `1800 + 60×L` segundos |
| T1 | `floor(valid/2)` |
| T2 | `floor(valid×7/8)` |
| LAN B | `10.38.P.0/24` |
| relay upstream | `10.37.P.254` |
| relay downstream | `10.38.P.254` |
| pool B | mismos sufijos que pool A |

![Pool dinámico y reserva de la variante]({{ '/assets/docencia/sri/ut01/02_pool_reserva.svg' | relative_url }})

Ejemplo docente P07-L03:

```text
LAN A       10.37.7.0/24
Kea         10.37.7.23
pool A      10.37.7.107 - 10.37.7.136
reserva     10.37.7.183
lease/T1/T2 1980 / 990 / 1732 s
LAN B       10.38.7.0/24
relay       10.37.7.254 / 10.38.7.254
pool B      10.38.7.107 - 10.38.7.136
```

## 4. Qué debe tener el equipo antes de empezar {#prerrequisitos}

- `srv-pXX-lYY` Debian 13 con NIC NAT + NIC `SRI-Pxx`.
- IP estática persistente de UT00 en la NIC interna.
- snapshot `10_RED_OK`.
- un cliente Debian o Windows con su NIC en `SRI-Pxx`.
- antes de probar DHCP, eliminar la IP manual del cliente y seleccionar IPv4 automático;
- confirmar que en `SRI-Pxx` **solo Kea** podrá responder; no activar simultáneamente Windows DHCP en esa red.

## 5. Protocolo: DORA y vida de la lease {#dora}

DHCPv4 usa UDP 67/68. El Discover inicial suele difundirse porque el cliente aún no tiene una configuración IPv4 utilizable.

| Mensaje | Qué buscar |
|---|---|
| Discover | xid, chaddr/client-id, Parameter Request List |
| Offer | yiaddr, Option 54, Option 51 y política ofrecida |
| Request | Option 50 + Option 54 |
| ACK | concesión definitiva, opciones y T1/T2 |

![Proceso DHCP DORA]({{ '/assets/docencia/sri/ut01/01_dora.svg' | relative_url }})

T1 intenta renovar con el servidor conocido; T2 amplía la búsqueda mediante *rebinding*. Al expirar la lease, el cliente no debe continuar usando esa dirección basándose en la concesión caducada. Además de DORA estudia **NAK** (solicitud rechazada), **Release** (liberación) e **Inform** (solicitud de opciones por un cliente ya configurado). Las opciones 58/59 corresponden a T1/T2 si están presentes; compruébalas en la captura, no las inventes.

![Tiempos de una concesión DHCP]({{ '/assets/docencia/sri/ut01/03_lease_t1_t2.svg' | relative_url }})

### Prerrequisito práctico: NIC interna con IP fija

La NIC interna del servidor conserva `10.37.P.(20+L)/24` y **no tiene gateway**. Revisa `ip -br a`, `ip route` y el gestor real de red antes de continuar. Si la IP aparece sin `/24` o desaparece tras reiniciar, vuelve a [UT00]({{ "/docencia/asir/sri/ut00/" | relative_url }}).

## 6. Instalación e inventario de Kea {#instalacion}

```bash
sudo apt update
sudo apt install -y kea-dhcp4-server kea-common
apt policy kea-dhcp4-server
kea-dhcp4 -V
dpkg -L kea-dhcp4-server | sort
systemctl list-unit-files | grep -i kea
```

En Debian 13 estable el paquete `kea-dhcp4-server` pertenece a la rama empaquetada por Debian; se registra la versión real en lugar de memorizar una versión de una diapositiva.

## 7. Cambio controlado {#cambio-controlado}

Antes de editar:

```bash
sudo cp /etc/kea/kea-dhcp4.conf /etc/kea/kea-dhcp4.conf.bak-ut01
```

Ciclo obligatorio:

```bash
sudo /usr/sbin/kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
sudo systemctl restart kea-dhcp4-server
systemctl --no-pager --full status kea-dhcp4-server
sudo journalctl -u kea-dhcp4-server -b --no-pager -n 50
```

Comprobación auxiliar:

```bash
sudo ss -lunp | grep ':67'
```

> **Importante:** en Linux, Kea puede trabajar con *raw sockets*. Por tanto, que `ss` no muestre una línea UDP/67 convencional **no demuestra por sí solo** que DHCP esté fallando. La evidencia fuerte combina estado, logs, tráfico DORA y una concesión real.

Si la validación de la instalación del aula devuelve un `Permission denied` relacionado con AppArmor o la lectura del fichero, compara el contexto y permisos del servicio en lugar de desactivar el confinamiento:

```bash
systemctl cat kea-dhcp4-server
namei -l /etc/kea/kea-dhcp4.conf
sudo -u _kea /usr/sbin/kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
```

El último comando es **una ruta de diagnóstico para instalaciones que usan `_kea`**; primero comprueba que exista ese usuario y que puede leer el fichero. No es una regla universal para todas las versiones de Kea. `kea-dhcp4 -t` valida la configuración, pero no sustituye a las pruebas de ejecución: una configuración válida puede fallar en *runtime* por una NIC inexistente, permisos, conflicto o condiciones del sistema.

## 8. Implantación progresiva: no configures todo de golpe {#configuracion}

La versión anterior mezclaba **LAN A, reserva y LAN B en la primera configuración**. Eso impide aislar fallos en un grupo que acaba de preparar la IP fija. Trabajaremos tres estados verificables y guardaremos snapshot entre etapas.

### Fase A · Kea mínimo, solo LAN A

Antes de tocar el fichero, identifica la NIC realmente conectada a `SRI-Pxx` (`enp0s8` es solo ejemplo). Para **P07-L03**:

```json
{
  "Dhcp4": {
    "interfaces-config": {
      "interfaces": ["enp0s8"]
    },
    "lease-database": {
      "type": "memfile",
      "persist": true,
      "name": "/var/lib/kea/kea-leases4.csv"
    },
    "valid-lifetime": 1980,
    "renew-timer": 990,
    "rebind-timer": 1732,
    "subnet4": [
      {
        "id": 1,
        "subnet": "10.37.7.0/24",
        "pools": [
          {"pool": "10.37.7.107 - 10.37.7.136"}
        ]
      }
    ]
  }
}
```

Comprueba **sintaxis → reinicio → logs → cliente DHCP → lease**. La IP del servidor `.23` no pertenece al pool `.107–.136` y no se anuncia un router ni DNS que todavía no existen en la red aislada.

### Fase B · Reserva e identificación real

Obtén la MAC del **cliente que vas a reservar**. No copies la MAC del ejemplo ni la del adaptador NAT. Introduce dentro del objeto de LAN A, después de `pools`, este fragmento (añadiendo la coma separadora que corresponda):

```json
"reservations": [
  {
    "hw-address": "08:00:27:aa:bb:cc",
    "ip-address": "10.37.7.183",
    "hostname": "res-p07-l03"
  }
]
```

La reserva queda **fuera del pool** dinámico, aunque dentro de la subred. El cliente reservado sigue configurado por DHCP. Tras probarla, compara `ip -br a` / `ipconfig /all`, ACK y CSV de Kea. Si el cliente conservaba una lease anterior, fuerza una **nueva adquisición con su gestor de red real** o espera la renovación; no infieras que reiniciar Kea obliga al cliente a solicitar una IP diferente.

### Fase C · Opciones coherentes

Puedes incorporar, en el objeto de LAN A, la opción de sufijo de laboratorio sin asegurar que ya exista resolución de nombres:

```json
"option-data": [
  {"name": "domain-name", "data": "p07-l03.sri.test"}
]
```

**DNS todavía no está implantado:** no anuncies un DNS ficticio (Option 6) ni un router inexistente (Option 3). En UT02 volveremos al DHCP para integrar el DNS que realmente hayamos desplegado. Compara opción configurada, opción solicitada y opción observada en ACK.

> Guarda una copia/versionado de cada estado. La ampliación LAN B viene después; el apartado de relay contiene el objeto `subnet4` adicional y las rutas necesarias.

## 9. Clientes Linux y Windows {#clientes}

Compara la política que llega por DHCP con el estado que aplica cada SO.

Linux:

```bash
ip -br a
ip route
# Solo si el servicio/comando está disponible en este cliente:
resolvectl status
nmcli device show
```

Windows:

```powershell
ipconfig /all
ipconfig /release
ipconfig /renew
route print
```

> Si el equipo tiene varias NIC, identifica primero el adaptador de `SRI-Pxx` y evita renovar de forma indiscriminada interfaces que no pertenecen al laboratorio.

En Debian 13 mínimo con `ifupdown`, comienza identificando si se utiliza `dhcpcd`, `dhclient` u otro cliente real (`command -v dhcpcd; command -v dhclient`). Para una primera DORA limpia: **deja apagado el cliente, comienza `tcpdump` en servidor y enciende el cliente**. No instales NetworkManager solo por `nmcli`; no copies `dhclient` si no está instalado.

En Windows con dos NIC, identifica el adaptador del laboratorio y evita `ipconfig /release` indiscriminado sobre la NIC de administración.

## 10. Leases y PCAP {#leases-pcap}

```bash
sudo tail -n 10 /var/lib/kea/kea-leases4.csv
# Sustituye NIC por la interfaz interna real antes de copiar:
sudo tcpdump -ni NIC 'udp port 67 or udp port 68' -w ut01-dora.pcap
```

La captura puede quedarse sin paquetes si comienza **después** de que el cliente haya adquirido la lease. Empieza a capturar antes de arrancar/reiniciar el cliente o de generar una adquisición nueva.

**Evidencia cruzada:** `xid`, identidad del cliente, `yiaddr`, Option 54, IP aplicada, vencimiento y registro CSV. No basta con ver cuatro colores ni con presentar una única captura de `active (running)`.

## 11. Ampliación avanzada · Relay y segunda subred {#relay}

El broadcast inicial no cruza routers de forma ordinaria. El relay permite centralizar DHCP.

Este bloque es **ampliación avanzada en la implementación Kea**. Si el ritmo del grupo no permite trabajarlo con calma, puede trasladarse a otra sesión sin confundirlo con el segundo laboratorio obligatorio Windows.

![Topología DHCP con relay y segunda subred]({{ '/assets/docencia/sri/ut01/04_topologia_relay.svg' | relative_url }})

Relay:

```text
upstream   10.37.P.254/24
downstream 10.38.P.254/24
```

En el relay Linux debe existir `10.37.P.254/24` en LAN A y `10.38.P.254/24` en LAN B; confirma `ip -br a` y reenvío IPv4. En el servidor Kea debe existir **ruta de retorno** a LAN B mediante el relay (ejemplo de formato: sustituir `P` antes de ejecutar):

```bash
sudo ip route add 10.38.7.0/24 via 10.37.7.254
```

Instala el relay disponible en Debian si vas a realizar esta ampliación:

```bash
sudo apt update
sudo apt install isc-dhcp-relay
```

> Se usa aquí como **relay didáctico**. ISC DHCP es tecnología heredada; el servidor de la unidad sigue siendo Kea.

Ejecución didáctica en primer plano del relay (sustituye interfaces y servidor):

```bash
sudo dhcrelay -4 -d -id NIC_LAN_B -iu NIC_LAN_A IP_SERVIDOR_KEA
```

Añade a `subnet4` la segunda red **solo ahora**, manteniendo la primera: 

```json
{
  "id": 2,
  "subnet": "10.38.7.0/24",
  "pools": [{"pool": "10.38.7.107 - 10.38.7.136"}],
  "option-data": [{"name": "routers", "data": "10.38.7.254"}]
}
```

Es un **objeto para insertar dentro del array `subnet4`**, no un fichero `kea-dhcp4.conf` completo. Ajusta separadores JSON, valida y comprueba las rutas. La captura debe demostrar `giaddr`/selección de subred, no solo que el cliente obtuvo “alguna IP”.

## 12. Ruta de aprendizaje {#ruta}

```text
DISEÑAR
  ↓
OBSERVAR DORA
  ↓
IMPLANTAR KEA
  ↓
PROBAR CLIENTES
  ↓
CORRELACIONAR LEASE + PCAP
  ↓
DIAGNOSTICAR
  ↓
AMPLIAR (si procede)
```

El relay y la segunda subred son ampliación del bloque Kea; no se deben forzar si el grupo necesita consolidar la LAN A. **Después de Kea llega Windows Server 2025**, que es obligatorio en UT01. La propuesta 12 h Kea + 8 h Windows debe contrastarse con la temporalización aprobada; no anunciarla como cambio definitivo de programación sin revisión docente.


## 13. Diagnóstico DHCP por evidencias {#diagnostico}

Cuando un cliente no obtiene la configuración esperada, separa las capas y toma nota del síntoma real:

1. valida el JSON con `kea-dhcp4 -t` (y sus permisos);
2. comprueba estado y logs del servicio;
3. observa si llega `DHCPDISCOVER`;
4. verifica si sale `DHCPOFFER`;
5. revisa qué aplica realmente el cliente;
6. correlaciona `ACK`, lease y parámetros recibidos;
7. cambia **una sola causa** y repite la prueba.

![Diagnóstico DHCP basado en evidencias]({{ '/assets/docencia/sri/ut01/06_diagnostico_dhcp.svg' | relative_url }})

> Las prácticas evaluables, tickets concretos, variantes de entrega y criterios de calificación se gestionan en el aula virtual.

## 14. Banco de ampliación opcional {#ampliacion}

![Servidor DHCP legítimo frente a un segundo servidor no autorizado]({{ '/assets/docencia/sri/ut01/05_dhcp_legitimo_rogue.svg' | relative_url }})


- A01 · Migración controlada de configuración ISC DHCP heredada a Kea.
- A02 · Forense de PCAP con dos servidores DHCP: Option 54, MAC origen y política falsa.
- A03 · Capacidad y agotamiento de pool: dimensionado, churn y lease-time.
- A04 · Integración con DNS real al finalizar UT02, en Kea y en Windows Server.
- A05 · DHCPv6/SLAAC: comparación razonada, no simple receta.
- A06 · Stork/monitorización y operación de Kea.
- A07 · Change request: duplicar clientes durante dos horas sin romper reservas.

### Alta disponibilidad y clasificación, después del núcleo

En Kea, la ampliación HA usa el mecanismo de **High Availability** de Kea; **no** es válido copiar `failover peer` de ISC DHCP a `kea-dhcp4.conf`. Las *client classes* permiten reglas por cliente, pero primero hay que demostrar asignación simple y reserva sin introducir complejidad artificial.

## 15. Criterio de cierre {#cierre}

El bloque Kea está consolidado cuando el alumno puede **diseñar, implantar, observar y diagnosticar** DHCP; no cuando simplemente obtiene una dirección. El **RA2 completo de UT01** incorpora después la administración equivalente en Windows Server 2025.

[**Continuar: UT01 · DHCP en Windows Server 2025 →**]({{ "/docencia/asir/sri/ut01-windows/" | relative_url }})

Las tareas evaluables y sus criterios particulares se publican **solo en Moodle**; estos apuntes web son material de consulta y entrenamiento.

**Referencias:** [Manual Kea](https://kea.readthedocs.io/), [documentación Debian de ifupdown](https://manpages.debian.org/trixie/ifupdown/interfaces.5.en.html), [paquetes DHCP Debian](https://packages.debian.org/trixie/dhcpcd-base).

> **Siguiente: UT02 · DNS profesional.** Al terminar DNS volveremos a UT01 para activar Option 6 con los servidores reales y demostrar la integración DHCP → DNS.
