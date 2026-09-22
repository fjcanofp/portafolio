---
layout: default
title: "UT01 · DHCP profesional en Debian y Windows Server"
description: "DHCPv4 de doble entorno: Kea en Debian 13 y rol DHCP Windows Server 2025, DORA, ámbitos, reservas, relay y diagnóstico."
module: "sri"
module_title: "Servicios de Red e Internet"
module_code: "0375"
cycle: "asir"
course: "2.º ASIR"
unit: "UT01"
unit_order: 1
hours: 20
ra:
  - "RA2"
ce:
  - "RA2.a–g"
permalink: "/docencia/asir/servicios-de-red-e-internet/ut01-dhcp/"
published: true
---

# UT01 · DHCP profesional en Debian y Windows Server

> **Misión:** transformar el laboratorio estático de UT00 en una infraestructura donde clientes Linux y Windows reciben política de red de forma automática, observable y diagnosticable, administrada primero por Kea (Debian 13) y después por Windows Server 2025.

**Orden didáctico del curso:** en esta versión SRI seguimos la secuencia usada en Avanza: **DHCP antes que DNS**. Por eso UT01 no presupone un servidor DNS ya instalado. La integración funcional con DNS se cerrará en UT02.

> **Dos implementaciones obligatorias, un solo RA2:** [Ruta Linux/Kea](#6-instalación-e-inventario-de-kea) y [ruta Windows Server: tutorial completo]({{ "/docencia/asir/servicios-de-red-e-internet/ut01-dhcp-windows/" | relative_url }}). No se ejecutan simultáneamente sobre una misma red de clientes.

## 1. Qué vas a saber hacer

Al terminar deberías poder:

- explicar DHCP sin decir simplemente “da Internet”;
- interpretar Discover, Offer, Request, ACK, NAK, Release e Inform;
- localizar xid, yiaddr, Option 50, 51, 53, 54, 58 y 59;
- diseñar un pool con margen, exclusiones y tiempos coherentes;
- instalar e inventariar Kea DHCP4 en Debian 13;
- instalar el rol DHCP de Windows Server, crear ámbito, exclusiones y reservas con consola y PowerShell;
- configurar asignación dinámica y reserva;
- demostrar la política recibida en Linux y Windows;
- correlacionar cliente, PCAP, lease y configuración;
- atender una segunda subred mediante relay y `giaddr`;
- detectar un segundo servidor DHCP mediante Option 54 y origen de Offer;
- resolver incidencias con pruebas discriminantes y rollback.

## 2. RA2 y CE

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

## 3. Variante individual

Se reutiliza `Pxx-Lyy` de UT00.

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

## 4. Qué debe tener el equipo antes de empezar

- `srv-pXX-lYY` Debian 13 con NIC NAT + NIC `SRI-Pxx`.
- IP estática persistente de UT00 en la NIC interna.
- snapshot `10_RED_OK`.
- un cliente Debian o Windows con su NIC en `SRI-Pxx`.
- antes de probar DHCP, eliminar la IP manual del cliente y seleccionar IPv4 automático.

## 5. Protocolo: DORA y vida de la lease

DHCPv4 usa UDP 67/68. El Discover inicial suele difundirse porque el cliente aún no tiene una configuración IPv4 utilizable.

| Mensaje | Qué buscar |
|---|---|
| Discover | xid, chaddr/client-id, Parameter Request List |
| Offer | yiaddr, Option 54, Option 51 y política ofrecida |
| Request | Option 50 + Option 54 |
| ACK | concesión definitiva, opciones y T1/T2 |

T1 intenta renovar con el servidor conocido; T2 amplía la búsqueda; al expirar la lease el cliente no debe seguir usando la dirección.

## 6. Instalación e inventario de Kea

```bash
sudo apt update
sudo apt install -y kea-dhcp4-server kea-common
apt policy kea-dhcp4-server
kea-dhcp4 -V
dpkg -L kea-dhcp4-server | sort
systemctl list-unit-files | grep -i kea
```

En Debian 13 estable el paquete `kea-dhcp4-server` pertenece a la rama empaquetada por Debian; se registra la versión real en lugar de memorizar una versión de una diapositiva.

## 7. Cambio controlado

Antes de editar:

```bash
sudo cp /etc/kea/kea-dhcp4.conf /etc/kea/kea-dhcp4.conf.bak-ut01
```

Ciclo obligatorio:

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
sudo systemctl restart kea-dhcp4-server
systemctl --no-pager --full status kea-dhcp4-server
sudo ss -lunp | grep ':67'
sudo journalctl -u kea-dhcp4-server -b --no-pager -n 50
```

`-t` no sustituye a status/log/socket: una configuración válida puede fallar en runtime por una NIC inexistente o un conflicto.

## 8. Configuración de referencia

La configuración evaluable se calcula con la variante; no copies los datos del ejemplo docente.

```json
{
  "Dhcp4": {
    "interfaces-config": {
      "interfaces": [
        "enp0s8"
      ]
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
          {
            "pool": "10.37.7.107 - 10.37.7.136"
          }
        ],
        "option-data": [
          {
            "name": "domain-name",
            "data": "p07-l03.sri.test"
          }
        ],
        "reservations": [
          {
            "hw-address": "08:00:27:aa:bb:cc",
            "ip-address": "10.37.7.183",
            "hostname": "res-p07-l03"
          }
        ]
      },
      {
        "id": 2,
        "subnet": "10.38.7.0/24",
        "pools": [
          {
            "pool": "10.38.7.107 - 10.38.7.136"
          }
        ],
        "option-data": [
          {
            "name": "routers",
            "data": "10.38.7.254"
          },
          {
            "name": "domain-name",
            "data": "p07-l03.sri.test"
          }
        ]
      }
    ]
  }
}
```

### DNS todavía no está implantado

En UT01 **no se anuncia un servidor DNS ficticio como si funcionara**. Podemos analizar Option 6 en una PCAP o preparar una rama futura, pero la resolución real se implantará en UT02 DNS. Al cerrar UT02 volveremos a Kea y añadiremos Option 6 con los DNS reales.

## 9. Clientes Linux y Windows

Compara la política que llega por DHCP con el estado que aplica cada SO.

Linux:

```bash
ip -br a
ip route
resolvectl status
nmcli device show 2>/dev/null
```

Windows:

```powershell
ipconfig /all
ipconfig /release
ipconfig /renew
route print
```

No memorices un único comando Linux de renovación: identifica si el equipo usa NetworkManager, systemd-networkd u otro gestor.

## 10. Leases y PCAP

```bash
sudo tail -n 10 /var/lib/kea/kea-leases4.csv
sudo tcpdump -ni NIC 'udp port 67 or udp port 68' -w ut01-dora.pcap
```

Una captura no vale por contener cuatro colores: cada conclusión debe citar un paquete/campo.

## 11. Relay y segunda subred

El broadcast inicial no cruza routers de forma ordinaria. El relay permite centralizar DHCP.

```text
Kea ─ LAN A ─ relay ─ LAN B ─ cliente B
       10.37.P.0/24      10.38.P.0/24
```

Relay:

```text
upstream   10.37.P.254/24
downstream 10.38.P.254/24
```

En el servidor Kea debe existir ruta hacia LAN B mediante el relay:

```bash
sudo ip route add 10.38.P.0/24 via 10.37.P.254
```

Ejecución didáctica en primer plano del relay (sustituye interfaces y servidor):

```bash
sudo dhcrelay -4 -d -id NIC_LAN_B -iu NIC_LAN_A IP_SERVIDOR_KEA
```

La captura debe demostrar `giaddr`/selección de subred, no solo que el cliente obtuvo “alguna IP”.

## 12. Ruta de doble entorno: 20 h (12 Linux + 8 Windows)

| Sesión | Trabajo | Producto |
|---|---|---|
| S1 | diseño, DORA, opciones, pool y riesgos | plan individual |
| S2 | PCAP forense DORA + renovación | PCAP + tabla |
| S3 | Kea, JSON, validación, logs y socket | servidor + runbook |
| S4 | Linux/Windows, reserva y leases | matriz + reserva |
| S5 | relay, LAN B, rutas y `giaddr` | prueba multi-subred |
| S6 | tickets + reto + defensa | entrega final |

### Segunda implementación obligatoria · Windows Server (8 h)

| Sesión | Trabajo Windows | Evidencia |
|---|---|---|
| W1 (2 h) | VM e IP fija, rol DHCP, binding de NIC, ámbito y exclusiones | inventario + ámbito |
| W2 (2 h) | reserva, cliente Windows, cliente Linux, leases y opciones | política recibida |
| W3 (2 h) | reproducir por PowerShell; capturar DORA y backup | comandos + PCAP + exportación |
| W4 (2 h) | relay remoto, dos incidencias, defensa comparativa | LAN remota + tickets |

**Tutorial Windows, enunciados y criterios de aceptación:** [UT01 · DHCP en Windows Server]({{ "/docencia/asir/servicios-de-red-e-internet/ut01-dhcp-windows/" | relative_url }}).

## 13. Tareas obligatorias

### P01 · Diseño de política DHCP
Calcula tu variante, pool, reserva, tiempos, exclusiones y riesgos. Entrega topología y plan de pruebas.

### P02 · Anatomía forense de DORA
Genera una PCAP mínima y correlaciona xid, yiaddr, Options 50/51/54/58/59 e identidad.

### P03 · Kea reproducible
Instala, inventaría, configura y valida Kea. Demuestra configuración persistente y socket UDP/67.

### P04 · Clientes heterogéneos
Demuestra que Linux y Windows aplican la misma política y documenta diferencias de herramientas.

### P05 · Reserva e identidad
Reserva la IP calculada usando identidad real del cliente; correlaciona configuración, ACK y lease.

### P06 · Relay multi-subred
Añade LAN B, relay, ruta del servidor y segunda `subnet4`. Demuestra selección mediante relay.

### P07 · Centro de incidencias
Resuelve dos tickets individualizados sin cambios aleatorios. Cada causa raíz necesita dos evidencias independientes.

### P08 · Reto Figueroa DHCP Ops
Recibes VM/configuración parcialmente defectuosa. Debes reconstruir política, cerrar tickets y defender tu variante.

### W01–W07 · Windows Server (obligatorio)
Reproduce una política funcional equivalente en **red separada**, administra el ámbito con GUI y PowerShell, configura reserva dentro de rango excluido, atiende segunda subred mediante relay y entrega diagnóstico de al menos dos incidencias. [Ver enunciados e instrucciones]({{ "/docencia/asir/servicios-de-red-e-internet/ut01-dhcp-windows/" | relative_url }}).

## 14. Banco de ampliación

- A01 · Migración controlada de configuración ISC DHCP heredada a Kea.
- A02 · Forense de PCAP con dos servidores DHCP: Option 54, MAC origen y política falsa.
- A03 · Capacidad y agotamiento de pool: dimensionado, churn y lease-time.
- A04 · Windows Server con dominio AD: autorización, DNS dinámico y escenario corporativo (ampliación **posterior** a la práctica Windows obligatoria).
- A05 · DHCPv6/SLAAC: comparación razonada, no simple receta.
- A06 · Stork/monitorización y operación de Kea.
- A07 · Change request: duplicar clientes durante dos horas sin romper reservas.

## 15. Criterio de cierre

UT01 se considera cerrada cuando el alumno puede **diseñar, implantar, observar, romper y diagnosticar** DHCP tanto en Debian/Kea como en Windows Server; no cuando simplemente obtiene una dirección. Las pruebas de servidor DHCP simultáneos en la misma LAN se sustituyen por capturas facilitadas o un laboratorio controlado específico.

> **Siguiente: UT02 · DNS profesional.** Al terminar DNS volveremos a UT01 para activar Option 6 con los servidores reales y demostrar la integración DHCP → DNS.
