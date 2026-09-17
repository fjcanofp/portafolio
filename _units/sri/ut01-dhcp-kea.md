---
title: "UT01 · Configuración automática profesional: DHCP con Kea"
description: "DHCPv4 con Kea en Debian 13: DORA, pools individualizados, reservas, leases, opciones y diagnóstico; relay y multi-subred como ampliación."
summary: "Diseño, implantación y diagnóstico de DHCPv4 con Kea, clientes Linux/Windows, leases, reservas y análisis de tráfico."

module_key: sri
cycle_key: asir
order: 1

module_title: "Servicios de Red e Internet"
module_code: "0375"
cycle_title: "Administración de Sistemas Informáticos en Red"
course: "2.º ASIR"
unit: "UT01"
hours: 12
level: "intermedio"

authors:
  - fjcano

reviewers:
  - fjcano

rights: all-rights-reserved
version: "1.1"
last_reviewed: 2026-09-17
visibility: public

ra:
  - "RA2"

ce:
  - "RA2.a"
  - "RA2.b"
  - "RA2.c"
  - "RA2.d"
  - "RA2.e"
  - "RA2.f"
  - "RA2.g"

tags:
  - dhcp
  - kea
  - dora
  - leases
  - reservas
  - relay
  - wireshark
  - diagnostico

permalink: /docencia/asir/sri/ut01/
published: true

toc:
  - title: Introducción
    id: introduccion
  - title: Objetivos
    id: objetivos
  - title: RA2 y CE
    id: ra-ce
  - title: Individualización
    id: individualizacion
  - title: Prerrequisitos
    id: prerrequisitos
  - title: DORA y leases
    id: dora
  - title: Instalación de Kea
    id: instalacion
  - title: Cambio controlado
    id: cambio-controlado
  - title: Configuración
    id: configuracion
  - title: Clientes
    id: clientes
  - title: Leases y PCAP
    id: leases-pcap
  - title: Relay (ampliación)
    id: relay
  - title: Ruta de aprendizaje
    id: ruta
  - title: Diagnóstico
    id: diagnostico
  - title: Banco de ampliación
    id: ampliacion
  - title: Cierre
    id: cierre
---


# UT01 · Configuración automática profesional: DHCP con Kea

> **Misión.** Transformar el laboratorio estático de UT00 en una infraestructura donde los clientes reciban configuración IPv4 automática mediante **Kea DHCP4**, y donde podamos demostrar qué ha ocurrido mediante **DORA, logs y leases**.
>
> **Núcleo:** DHCPv4, DORA, pool, lease, Kea, clientes Linux/Windows, reserva y diagnóstico.
>
> **Ampliación:** relay/segunda subred, clasificación de clientes y alta disponibilidad. No hace falta forzar estas ampliaciones antes de dominar el núcleo.

## 1. Qué vas a saber hacer

Al terminar la unidad deberías poder:

- explicar qué hace DHCP sin reducirlo a “da Internet”;
- interpretar **Discover, Offer, Request y ACK**;
- diferenciar **subred, pool, reserva y lease**;
- instalar y operar Kea DHCP4 en Debian 13;
- configurar asignación dinámica y reservas;
- demostrar una concesión con cliente + PCAP + lease;
- diagnosticar fallos separando red, servicio, protocolo y cliente;
- ampliar el escenario con relay y una segunda subred cuando el núcleo esté consolidado.

## 2. RA2 y evidencias

**RA2.** Administra servicios de configuración automática, identificándolos y verificando la correcta asignación de los parámetros.

| Evidencia | Qué debe poder demostrar el alumno |
|---|---|
| Diseño | red, pool, exclusiones y tiempos coherentes |
| Implantación | Kea instalado, configurado y operativo |
| Asignación | clientes con direcciones correctas |
| Observación | DORA y lease correlacionadas |
| Reserva | identidad concreta -> dirección prevista |
| Diagnóstico | localizar la capa del fallo con pruebas discriminantes |
| Ampliación | relay/multi-subred cuando proceda |

## 3. Variante individual Pxx-Lyy

Se reutiliza la variante de UT00.

| Dato | Fórmula |
|---|---|
| LAN A | `10.37.P.0/24` |
| servidor Kea | `10.37.P.(20+L)` |
| pool A | `10.37.P.(100+P)` a `10.37.P.(129+P)` |
| reserva | `10.37.P.(180+L)` |
| `valid-lifetime` | `1800 + 60×L` segundos |
| T1 | `floor(valid/2)` |
| T2 | `floor(valid×7/8)` |
| LAN B (ampliación) | `10.38.P.0/24` |
| relay upstream | `10.37.P.254` |
| relay downstream | `10.38.P.254` |
| pool B | mismos sufijos que pool A |

**Ejemplo docente P07-L03**

```text
LAN A       10.37.7.0/24
Kea         10.37.7.23/24
pool A      10.37.7.107 - 10.37.7.136
reserva     10.37.7.183
lease/T1/T2 1980 / 990 / 1732 s
LAN B       10.38.7.0/24
relay       10.37.7.254 / 10.38.7.254
pool B      10.38.7.107 - 10.38.7.136
```

> **Importante.** Antes de activar el pool, apaga o pasa a DHCP los clientes que conserven una IP manual que pueda caer dentro de ese rango.

## 4. Prerrequisito de UT00: servidor con IP fija

El servidor tendrá:

- NIC de administración/salida: NAT;
- NIC del laboratorio: `SRI-Pxx`;
- IP fija persistente en la NIC interna.

Primero identifica las interfaces:

```bash
ip -br link
ip -br a
ip route
```

### Ruta A · Debian con ifupdown

Comprueba que ésta sea la ruta de tu máquina:

```bash
systemctl is-active NetworkManager
systemctl is-active systemd-networkd
cat /etc/network/interfaces
```

Ejemplo docente:

```text
auto enp0s8
iface enp0s8 inet static
    address 10.37.7.23
    netmask 255.255.255.0
```

Aplica y comprueba:

```bash
sudo systemctl restart networking
ip -br a
ip route
```

En una VM local también es válido reiniciar si quieres asegurar un estado limpio:

```bash
sudo reboot
```

> **No basta con ver `10.37.7.23`: debe aparecer `/24`.** `/etc/network/interfaces` describe la configuración persistente; `ip -br a` muestra el estado real del kernel.

Si la configuración persistente es correcta pero la NIC conserva una máscara anterior:

```bash
sudo ip -4 addr flush dev NIC_LAN
sudo ifup --force NIC_LAN
ip -br a
```

## 5. Qué hace DHCP: DORA y vida de una lease

DHCPv4 usa normalmente **UDP 67 en el servidor y UDP 68 en el cliente**.

| Mensaje | Idea que debes entender | Campos útiles |
|---|---|---|
| Discover | “¿Hay algún DHCP?” | `xid`, identidad del cliente |
| Offer | “Puedo ofrecerte esta configuración” | `yiaddr`, Option 51, Option 54 |
| Request | “Solicito/acepto esta oferta” | Option 50, Option 54 |
| ACK | “Concesión confirmada” | dirección, opciones, T1/T2 |

**Lease** = concesión temporal.

- **T1:** el cliente intenta renovar con el servidor conocido.
- **T2:** amplía la búsqueda para poder renovar.
- **Expiración:** la dirección deja de ser utilizable como concesión válida.

## 6. Instalación e inventario de Kea

```bash
sudo apt update
sudo apt install -y kea-dhcp4-server kea-common
apt policy kea-dhcp4-server
kea-dhcp4 -V
dpkg -L kea-dhcp4-server | sort
systemctl list-unit-files | grep -i kea
```

Antes de editar:

```bash
sudo cp /etc/kea/kea-dhcp4.conf /etc/kea/kea-dhcp4.conf.bak-ut01
```

## 7. Fase 1 · Configuración mínima de una LAN

Empieza por **una sola LAN y un solo pool**. Reserva, relay y LAN B vendrán después.

```bash
sudo nano /etc/kea/kea-dhcp4.conf
```

### Ejemplo docente mínimo

```json
{
  "Dhcp4": {
    "interfaces-config": {
      "interfaces": [ "enp0s8" ]
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
          { "pool": "10.37.7.107 - 10.37.7.136" }
        ]
      }
    ]
  }
}
```

### Qué significa cada bloque

- `interfaces-config`: interfaz por la que Kea atiende el laboratorio.
- `lease-database`: persistencia de las concesiones.
- `valid-lifetime`: duración total de la lease.
- `renew-timer`: T1.
- `rebind-timer`: T2.
- `subnet4`: red administrada.
- `pools`: direcciones que Kea puede asignar dinámicamente.

> **Subred != pool.** Una `/24` contiene muchas direcciones, pero no todas tienen por qué formar parte del rango dinámico.

## 8. Validación segura en nuestra Debian 13

En la imagen de laboratorio validada durante la preparación, ejecutar `kea-dhcp4 -t` como root puede chocar con el confinamiento de AppArmor aunque `/etc/kea/kea-dhcp4.conf` exista y `_kea` pueda leerlo. Para reproducir el contexto del servicio:

```bash
sudo -u _kea /usr/sbin/kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
```

Corrige todos los errores y, si aparece `extraneous comma`, elimina la coma sobrante correspondiente.

Después:

```bash
sudo systemctl restart kea-dhcp4-server
systemctl --no-pager --full status kea-dhcp4-server
sudo journalctl -u kea-dhcp4-server -b --no-pager -n 50
```

> `-t` solo valida la configuración. `active (running)` solo demuestra que el proceso está levantado. La prueba definitiva llegará cuando un cliente obtenga una concesión correcta.

Kea puede trabajar con **raw sockets**. Por ello, que `ss` no muestre una línea UDP/67 convencional no demuestra por sí solo que DHCP esté roto.

## 9. Cliente Debian · Ruta A (ifupdown)

En Debian 13, `ifupdown` puede usar `dhclient`, `udhcpc` o `dhcpcd`; en una instalación actual es habitual disponer de `dhcpcd-base`.

Para la NIC conectada a `SRI-Pxx`:

```text
auto enp0s3
iface enp0s3 inet dhcp
```

### Primera adquisición: la mejor forma de capturar DORA

1. Deja el cliente apagado.
2. En el servidor inicia la captura:

```bash
sudo tcpdump -ni NIC_LAN 'udp port 67 or udp port 68'
```

3. Arranca el cliente.
4. Comprueba:

```bash
ip -br a
ip route
```

La IP debe pertenecer al pool de **tu variante**.

### Si necesitas repetir la prueba

Comprueba primero qué cliente DHCP está disponible:

```bash
command -v dhcpcd
command -v dhclient
```

Si usa `dhcpcd`:

```bash
sudo dhcpcd -k NIC_CLIENTE
sudo ifup --force NIC_CLIENTE
```

No instales NetworkManager únicamente para disponer de `nmcli`.

## 10. Tres evidencias de que DHCP funciona

### 1. Estado del cliente

```bash
ip -br a
ip route
```

### 2. Tráfico DORA

```bash
sudo tcpdump -ni NIC_LAN 'udp port 67 or udp port 68' -w ut01-dora.pcap
```

### 3. Lease en Kea

```bash
sudo tail -n 20 /var/lib/kea/kea-leases4.csv
```

Correlaciona:

```text
cliente / identidad
        ↓
DORA observado
        ↓
IP recibida
        ↓
lease registrada por Kea
```

## 11. Fase 2 · Reserva DHCP

Una reserva **no es lo mismo que configurar una IP estática en el cliente**. El cliente sigue en DHCP, pero el servidor decide que una identidad concreta reciba una dirección concreta.

Ejemplo:

```json
"reservations": [
  {
    "hw-address": "08:00:27:aa:bb:cc",
    "ip-address": "10.37.7.183",
    "hostname": "res-p07-l03"
  }
]
```

En esta unidad se recomienda situar la reserva fuera del pool dinámico para que la separación sea visual y fácil de razonar.

Después de cualquier cambio:

```bash
sudo -u _kea /usr/sbin/kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
sudo systemctl restart kea-dhcp4-server
systemctl status kea-dhcp4-server --no-pager
```

## 12. Fase 3 · Relay y segunda subred (ampliación)

El broadcast inicial del cliente no atraviesa routers de forma ordinaria. El **DHCP relay** recibe la petición y la reenvía al servidor.

```text
KEA 10.37.P.(20+L)
        |
   10.37.P.0/24
        |
  relay 10.37.P.254
        |
  relay 10.38.P.254
        |
   10.38.P.0/24
        |
      cliente
```

Servidor Kea: ruta a LAN B mediante el relay:

```bash
sudo ip route add 10.38.P.0/24 via 10.37.P.254
```

Relay didáctico en Debian:

```bash
sudo apt update
sudo apt install isc-dhcp-relay
sudo dhcrelay -4 -d -id NIC_LAN_B -iu NIC_LAN_A IP_SERVIDOR_KEA
```

La captura debe demostrar **giaddr/selección de subred**, no limitarse a mostrar que el cliente consiguió una IP.

## 13. Diagnóstico por evidencias

Cuando un cliente no obtiene configuración:

1. ¿La NIC está en la red VirtualBox correcta?
2. ¿La configuración activa del servidor es realmente `/24`?
3. ¿Kea está `active (running)`?
4. ¿Qué dice `journalctl`?
5. ¿Llega `DHCPDISCOVER`?
6. Si llega Discover, ¿sale `DHCPOFFER`?
7. ¿Aparecen Request y ACK?
8. ¿Existe la lease en Kea?
9. ¿Qué configuración aplicó realmente el cliente?
10. Cambia una sola causa y repite la prueba.

| Síntoma | Pista |
|---|---|
| no hay Discover | cliente/NIC/red interna/captura |
| Discover sin Offer | Kea, subnet, pool, interfaz, logs |
| Offer sin Request | lado cliente/selección de oferta |
| Request sin ACK | servidor/configuración final |
| ACK pero cliente no aplica | gestor de red/estado del cliente |

## 14. Criterio de cierre {#cierre}

UT01 se considera cerrada cuando el alumno puede **diseñar, implantar, observar, romper y diagnosticar** DHCP; no cuando simplemente obtiene una dirección.

> **Siguiente: UT02 · DNS profesional.** Al terminar DNS volveremos a UT01 para activar Option 6 con los servidores reales y demostrar la integración DHCP → DNS.

### Referencias técnicas

- Kea Administrator Reference Manual: https://kea.readthedocs.io/
- Debian ifupdown interfaces(5): https://manpages.debian.org/trixie/ifupdown/interfaces.5.en.html
- Debian dhcpcd-base: https://packages.debian.org/trixie/dhcpcd-base
