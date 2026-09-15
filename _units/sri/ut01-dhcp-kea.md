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
version: "1.0"
last_reviewed: 2026-09-15
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

## Introducción {#introduccion}

> **Misión:** transformar el laboratorio estático de UT00 en una infraestructura donde clientes Linux y Windows reciben política de red de forma automática, observable y diagnosticable.

> **Núcleo de la unidad:** DORA, Kea, pools, leases, reservas, clientes Linux/Windows y diagnóstico.  
> **Ampliación:** relay, segunda subred, detección de DHCP no autorizado y el banco final. Estos contenidos se mantienen disponibles, pero pueden desplazarse o reducirse si el ritmo real del grupo lo aconseja sin perder el núcleo del RA2.

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
- antes de probar DHCP, eliminar la IP manual del cliente y seleccionar IPv4 automático.

## 5. Protocolo: DORA y vida de la lease {#dora}

DHCPv4 usa UDP 67/68. El Discover inicial suele difundirse porque el cliente aún no tiene una configuración IPv4 utilizable.

| Mensaje | Qué buscar |
|---|---|
| Discover | xid, chaddr/client-id, Parameter Request List |
| Offer | yiaddr, Option 54, Option 51 y política ofrecida |
| Request | Option 50 + Option 54 |
| ACK | concesión definitiva, opciones y T1/T2 |

![Proceso DHCP DORA]({{ '/assets/docencia/sri/ut01/01_dora.svg' | relative_url }})

T1 intenta renovar con el servidor conocido; T2 amplía la búsqueda; al expirar la lease el cliente no debe seguir usando la dirección.

![Tiempos de una concesión DHCP]({{ '/assets/docencia/sri/ut01/03_lease_t1_t2.svg' | relative_url }})

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
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
sudo systemctl restart kea-dhcp4-server
systemctl --no-pager --full status kea-dhcp4-server
sudo journalctl -u kea-dhcp4-server -b --no-pager -n 50
```

Comprobación auxiliar:

```bash
sudo ss -lunp | grep ':67'
```

> **Importante:** en Linux, Kea puede trabajar con *raw sockets*. Por tanto, que `ss` no muestre una línea UDP/67 convencional **no demuestra por sí solo** que DHCP esté fallando. La evidencia fuerte combina estado, logs, tráfico DORA y una concesión real.

`kea-dhcp4 -t` valida la configuración, pero no sustituye a las pruebas de ejecución: una configuración válida puede fallar en *runtime* por una NIC inexistente, permisos, conflicto o condiciones del sistema.

## 8. Configuración de referencia {#configuracion}

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

## 9. Clientes Linux y Windows {#clientes}

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

> Si el equipo tiene varias NIC, identifica primero el adaptador de `SRI-Pxx` y evita renovar de forma indiscriminada interfaces que no pertenecen al laboratorio.

No memorices un único comando Linux de renovación: identifica si el equipo usa NetworkManager, systemd-networkd u otro gestor.

## 10. Leases y PCAP {#leases-pcap}

```bash
sudo tail -n 10 /var/lib/kea/kea-leases4.csv
sudo tcpdump -ni NIC 'udp port 67 or udp port 68' -w ut01-dora.pcap
```

Una captura no vale por contener cuatro colores: cada conclusión debe citar un paquete/campo.

## 11. Ampliación avanzada · Relay y segunda subred {#relay}

El broadcast inicial no cruza routers de forma ordinaria. El relay permite centralizar DHCP.

Este bloque es **ampliación avanzada**. Si el ritmo del grupo no permite trabajarlo con calma, puede posponerse sin afectar al núcleo de la unidad.

![Topología DHCP con relay y segunda subred]({{ '/assets/docencia/sri/ut01/04_topologia_relay.svg' | relative_url }})

Relay:

```text
upstream   10.37.P.254/24
downstream 10.38.P.254/24
```

En el servidor Kea debe existir ruta hacia LAN B mediante el relay:

```bash
sudo ip route add 10.38.P.0/24 via 10.37.P.254
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

La captura debe demostrar `giaddr`/selección de subred, no solo que el cliente obtuvo “alguna IP”.

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

El **relay y la segunda subred** pertenecen al tramo de ampliación. No es necesario forzarlos dentro de las 12 horas si el grupo necesita más tiempo para consolidar el núcleo.


## 13. Diagnóstico DHCP por evidencias {#diagnostico}

Cuando un cliente no obtiene la configuración esperada, separa las capas:

1. valida el JSON con `kea-dhcp4 -t`;
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
- A04 · Windows Server DHCP equivalente y comparación con Kea.
- A05 · DHCPv6/SLAAC: comparación razonada, no simple receta.
- A06 · Stork/monitorización y operación de Kea.
- A07 · Change request: duplicar clientes durante dos horas sin romper reservas.

## 15. Criterio de cierre {#cierre}

UT01 se considera cerrada cuando el alumno puede **diseñar, implantar, observar, romper y diagnosticar** DHCP; no cuando simplemente obtiene una dirección.

> **Siguiente: UT02 · DNS profesional.** Al terminar DNS volveremos a UT01 para activar Option 6 con los servidores reales y demostrar la integración DHCP → DNS.
