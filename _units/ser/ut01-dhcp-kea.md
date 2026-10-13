---
layout: default
title: "UT01 · Configuración automática: DHCP con Kea"
description: "DHCPv4 en 2.º SMR con Kea sobre Debian 13: DORA, pool, concesiones, reservas, clientes y prácticas guiadas."
module: "ser"
module_title: "Servicios en Red"
module_code: "0227"
cycle: "smr"
cycle_title: "Sistemas Microinformáticos y Redes"
course: "2.º SMR"
unit: "UT01"
unit_order: 1
level: "iniciacion-intermedio"
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
  - reservas
  - leases
  - virtualbox
permalink: "/docencia/smr/ser/ut01/"
published: true
---

# UT01 · Configuración automática: DHCP con Kea

> **Objetivo:** pasar de configurar una IP a mano a conseguir que un servidor entregue automáticamente direcciones y parámetros de red a los clientes.

En esta unidad trabajaremos con **Debian 13 + Kea DHCP4**. El nivel de las prácticas está adaptado a **2.º SMR**: primero seguiremos una guía muy detallada y después iremos retirando ayuda.

> **Seguridad del laboratorio:** un servidor DHCP de prácticas nunca se conectará mediante modo Puente a la red física del centro. Utilizaremos **Red Interna de VirtualBox**.

---

## 1. Qué debes aprender

Al finalizar la unidad deberías poder:

- explicar para qué sirve DHCP;
- distinguir **servidor DHCP**, **cliente DHCP**, **pool**, **concesión/lease** y **reserva**;
- reconocer **Discover, Offer, Request y ACK**;
- recordar que DHCPv4 usa **UDP 67 en el servidor y UDP 68 en el cliente**;
- instalar Kea DHCP4 en Debian 13;
- crear un pool de direcciones;
- configurar una reserva mediante la MAC del cliente;
- comprobar las concesiones entregadas;
- configurar clientes Linux y Windows para obtener IPv4 automáticamente;
- localizar errores sencillos de configuración.

---

## 2. El problema que resuelve DHCP

Configurar manualmente 20 o 30 ordenadores funciona, pero es lento y aumenta la posibilidad de errores. DHCP permite centralizar esa configuración.

```text
CLIENTE                      SERVIDOR DHCP
sin configuración                Kea
     │                             │
     ├──── Discover ──────────────>│
     │<──── Offer ─────────────────┤
     ├──── Request ───────────────>│
     │<──── ACK ───────────────────┤
     │                             │
     └── ya puede usar la IP ──────┘
```

Esta secuencia se recuerda como **DORA**.

### Conceptos básicos

| Concepto | Significado sencillo |
|---|---|
| Pool | conjunto de IP que el servidor puede repartir |
| Lease | tiempo durante el que un cliente puede usar una IP |
| Reserva | IP que el servidor guarda para un cliente concreto |
| MAC | dirección de la tarjeta que podemos usar para identificar un cliente |
| DORA | Discover → Offer → Request → ACK |

---

## 3. Laboratorio SER-LAB

Partimos del laboratorio de UT00.

| Equipo | Red interna | Dirección | Función |
|---|---|---|---|
| `ser-ser01` | `SER-LAB` | `192.168.50.10/24` | Debian 13 + Kea |
| `ser-cli01` | `SER-LAB` | automática | cliente Debian |
| `ser-win01` | `SER-LAB` | automática | cliente Windows, si se usa |

La NIC interna del servidor **no tiene gateway**, porque dentro de `SER-LAB` no hemos instalado un router.

### Personalización sencilla

- `P` = número de puesto (`01-40`).
- `L` = inicial del primer apellido (`A=01 ... Z=26`).

| Dato | Fórmula |
|---|---|
| Pool | `192.168.50.(100+P)` a `192.168.50.(119+P)` |
| Reserva | `192.168.50.(200+L)` |
| Lease inicial | `600 s` |

**Ejemplo P07-L03:** pool `192.168.50.107-126`; reserva `192.168.50.203`.

---

## 4. Instalación de Kea

```bash
sudo apt update
sudo apt install -y kea-dhcp4-server kea-common
```

Antes de editar:

```bash
ip -br a
ip route
sudo cp /etc/kea/kea-dhcp4.conf /etc/kea/kea-dhcp4.conf.bak
```

No copies el nombre `enp0s8` sin comprobarlo: cada VM puede tener nombres de interfaz diferentes.

---

## 5. Configuración mínima

Ejemplo P07. Debes sustituir el pool por el de tu puesto y la interfaz por la de tu VM.

```json
{
  "Dhcp4": {
    "interfaces-config": {
      "interfaces": [ "enp0s8" ]
    },
    "valid-lifetime": 600,
    "subnet4": [
      {
        "id": 1,
        "subnet": "192.168.50.0/24",
        "pools": [
          { "pool": "192.168.50.107 - 192.168.50.126" }
        ]
      }
    ]
  }
}
```

### Validar y arrancar

```bash
sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
sudo systemctl restart kea-dhcp4-server
systemctl --no-pager status kea-dhcp4-server
```

Si `kea-dhcp4 -t` informa de un error, corrige primero el JSON. Reiniciar muchas veces no arregla una coma o una llave mal colocada.

---

## 6. Comprobar una concesión

El cliente debe tener la NIC de `SER-LAB` configurada para **obtener IPv4 automáticamente**.

Linux:

```bash
ip -br a
```

Windows:

```text
ipconfig /all
```

En el servidor podemos consultar las concesiones:

```bash
sudo tail -n 10 /var/lib/kea/kea-leases4.csv
```

Una prueba correcta debe demostrar dos cosas:

1. el cliente tiene una IP dentro de su pool;
2. el servidor tiene registrada la concesión.

---

## 7. Reservas

Una reserva permite que un cliente siga usando DHCP pero reciba siempre una dirección concreta.

Dentro de la `subnet4`:

```json
"reservations": [
  {
    "hw-address": "08:00:27:11:22:33",
    "ip-address": "192.168.50.203",
    "hostname": "cliente-p07"
  }
]
```

La MAC debe ser la MAC real de la NIC conectada a `SER-LAB` y la IP debe corresponder a tu valor `L`.

---

## 8. DORA con Wireshark

En Wireshark utiliza el filtro:

```text
dhcp
```

Debes ser capaz de localizar:

1. DHCP Discover;
2. DHCP Offer;
3. DHCP Request;
4. DHCP ACK.

En SMR no necesitas analizar todos los campos internos del paquete. Lo importante es comprender **quién envía cada mensaje y qué consigue con él**.

---

## 9. Prácticas obligatorias

| Práctica | Qué vas a hacer | Tiempo orientativo |
|---|---|---:|
| **P01 · Mi primer Kea** | instalar, crear pool y obtener una concesión | 3 h |
| **P02 · Reserva** | reservar una IP a un cliente por MAC | 2 h |
| **P03 · Dos clientes** | dinámica + reserva y consulta de leases | 2 h |
| **P04 · DORA** | capturar Discover, Offer, Request y ACK | 2 h |
| **P05 · Dos redes** | un Kea con dos NIC y dos `subnet4` | 3 h |

### P05 no utiliza relay

En la práctica final el servidor está **directamente conectado a las dos redes**. Esto permite practicar varias subredes sin introducir todavía el nivel de complejidad del DHCP Relay.

El **relay DHCP** se explicará conceptualmente y podrá aparecer como ampliación, pero no forma parte del mínimo obligatorio de la práctica Kea de grado medio.

---

## 10. Averías sencillas que debes reconocer

| Síntoma | Primero comprueba |
|---|---|
| el cliente no recibe IP | red VirtualBox, estado de Kea e interfaz configurada |
| Kea no arranca | `kea-dhcp4 -t` y errores de JSON |
| la reserva no funciona | MAC del cliente y bloque `reservations` |
| cliente recibe una IP inesperada | pool configurado y que no exista otro DHCP |

---

## 11. Qué dejamos para ampliación

Estos temas existen y son importantes, pero **no serán la primera práctica de un alumno de SMR**:

- DHCP Relay real entre routers/subredes;
- análisis avanzado de `xid`, `giaddr` y opciones 50/54;
- detección forense de servidores DHCP no autorizados;
- alta disponibilidad;
- automatización y scripts de validación;
- migración profesional ISC DHCP → Kea.

Los retomaremos cuando el grupo domine la implantación básica o en **SRI de ASIR**, donde el nivel de administración y diagnóstico es mayor.

---

## 12. Puente con Windows Server

El protocolo no cambia aunque cambie la plataforma. Después del bloque Kea veremos la implementación equivalente con **Windows Server**, utilizando ámbitos, exclusiones, reservas y concesiones. La finalidad será reconocer los mismos conceptos en dos entornos diferentes, no repetir mecánicamente toda la unidad.

---