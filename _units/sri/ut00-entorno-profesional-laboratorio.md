---
layout: default
title: "UT00 · Entorno profesional, laboratorio y método de diagnóstico"
description: "Puesta a punto de SRI: VirtualBox, Debian 13, IP estática persistente, red interna, evidencias y diagnóstico antes de DHCP."
module: "sri"
module_title: "Servicios de Red e Internet"
module_code: "0375"
cycle: "asir"
course: "2.º ASIR"
unit: "UT00"
unit_order: 0
ra:
  - "Transversal a RA1–RA8"
permalink: "/docencia/asir/servicios-de-red-e-internet/ut00/"
published: true
---

# UT00 · Entorno profesional, laboratorio y método de diagnóstico

> **Objetivo:** dejar preparado un laboratorio individual, reproducible y seguro para comenzar **UT01 · DHCP/Kea**. La UT00 no añade un RA nuevo: prepara herramientas y método que reutilizaremos en todos los RA.

## 1. Qué debe quedar preparado

Al cerrar UT00 cada alumno debe disponer de:

- código individual `Pxx-Lyy`;
- servidor Debian 13 `srv-pXX-lYY`;
- NIC 1 NAT, usada solo cuando haga falta instalar/actualizar;
- NIC 2 en Red Interna `SRI-Pxx`;
- snapshot `00_BASE` y snapshot `10_RED_OK`;
- IP estática persistente de la NIC interna;
- cliente de pruebas en la misma red interna;
- conectividad IP servidor ↔ cliente;
- un servicio HTTP temporal probado desde cliente;
- inventario, evidencias y un ticket de diagnóstico básico.

## 2. Variante individual

- `P`: número de puesto (01–40).
- `L`: inicial normalizada del primer apellido: A=01 … Z=26.

| Dato | Fórmula |
|---|---|
| Red interna | `10.37.P.0/24` |
| Servidor | `10.37.P.(20+L)` |
| Cliente inicial | `10.37.P.(120+L)` |
| Puerto HTTP temporal | `8000+P` |
| Red VirtualBox | `SRI-Pxx` |
| Host servidor | `srv-pXX-lYY` |

Ejemplo docente `P07-L03`: servidor `10.37.7.23/24`, cliente `10.37.7.123/24`, puerto `8007`.

## 3. Topología

```text
                         INTERNET
                            ▲
                            │ NIC 1 · NAT (solo paquetes)
                    ┌───────┴────────┐
                    │ srv-pXX-lYY     │
                    │ Debian 13       │
                    └───────┬────────┘
                            │ NIC 2 · SRI-Pxx
                            │ IP estática
                    ────────┼──────── red interna
                            │
                    ┌───────┴────────┐
                    │ cli-pXX-lYY     │
                    │ Linux/Windows   │
                    └────────────────┘
```

**Nunca uses modo puente para un servidor DHCP de laboratorio.**

## 4. Inventario antes de configurar

```bash
hostnamectl
ip -br link
ip -br address
ip route
systemctl is-active NetworkManager
systemctl is-active systemd-networkd
ls -l /etc/network/interfaces
```

No edites un fichero de red hasta identificar qué componente administra realmente la NIC.

## 5. Configurar la IP estática del servidor

### 5.1 Regla

La NIC **interna** recibe la IP calculada. No configuramos gateway en esa NIC: si hay salida a Internet corresponde a la NIC NAT.

### 5.2 Ruta A · ifupdown (`/etc/network/interfaces`)

Si el sistema usa ifupdown, añade una sección equivalente a esta, sustituyendo NIC e IP por las tuyas:

```text
auto enp0s8
iface enp0s8 inet static
    address 10.37.7.23
    netmask 255.255.255.0
```

Antes de cambiar:

```bash
sudo cp /etc/network/interfaces /etc/network/interfaces.bak-ut00
```

Aplica desde consola local o reinicia la VM tras guardar snapshot. Verifica después con `ip -br a` e `ip route`.

### 5.3 Ruta B · NetworkManager

```bash
nmcli device status
nmcli connection show
sudo nmcli con add type ethernet ifname enp0s8 con-name SRI-LAN \
  ipv4.method manual ipv4.addresses 10.37.7.23/24 \
  ipv4.never-default yes ipv6.method disabled
sudo nmcli con up SRI-LAN
```

Si ya existe un perfil, **modifícalo** en lugar de crear duplicados.

### 5.4 Ruta C · systemd-networkd

`/etc/systemd/network/20-sri-lan.network`:

```ini
[Match]
Name=enp0s8

[Network]
Address=10.37.7.23/24
```

Después:

```bash
sudo networkctl reload
sudo networkctl reconfigure enp0s8
```

### 5.5 Comprobación obligatoria

```bash
ip -br address
ip route
```

Reinicia la VM y repite la comprobación. **Si la IP desaparece tras reiniciar, la tarea no está terminada.**

## 6. Configurar el cliente de prueba

En UT00 el cliente puede usar una IP manual para validar la red. En UT01 la quitaremos y pasará a **IPv4 automática** para probar DHCP.

Ejemplo docente P07-L03: `10.37.7.123/24`, sin gateway en la NIC interna.

Comprobar:

```bash
ping -c 3 10.37.7.23
```

## 7. Servicio temporal y evidencias

En servidor:

```bash
mkdir -p ~/sri-ut00
cd ~/sri-ut00
printf '<h1>SRI · %s</h1>\n' "$(hostname)" > index.html
python3 -m http.server 8007 --bind 0.0.0.0
```

Desde otra terminal:

```bash
ss -lntp
```

Desde cliente:

```bash
curl -v http://10.37.7.23:8007/
```

Detén el proceso y repite `curl`. Explica por qué la conectividad IP puede seguir funcionando aunque HTTP ya no responda.

## 8. Entrega UT00

Entrega un único `UT00_Pxx-Lyy.zip` con:

1. `01_inventario.md`: SO, hostname, NIC, MAC, gestor de red, IP y rutas.
2. `02_topologia.pdf`: NAT + red interna + servidor + cliente.
3. `03_red_servidor.md`: procedimiento usado para hacer persistente la IP y prueba tras reinicio.
4. `04_evidencias.pdf`: IP/ruta, ping, socket, curl positivo y curl negativo.
5. `05_ticket.md`: una incidencia resuelta con síntoma → hipótesis → prueba → causa → cambio → retest.

## 9. Criterios de aceptación UT00

- La red interna tiene el nombre correcto para la variante.
- La IP del servidor coincide con la fórmula y persiste tras reinicio.
- La NIC interna no introduce una ruta por defecto falsa.
- Cliente y servidor se comunican por IP.
- El servicio temporal se demuestra desde **otro equipo**, no solo desde localhost.
- La prueba negativa está interpretada.
- Existe snapshot `10_RED_OK` antes de comenzar DHCP.

## 10. Siguiente unidad

> **UT01 · Configuración automática profesional: DHCP con Kea**

El primer cambio será deliberado: el cliente dejará de tener IP manual y pasará a solicitar su configuración al servidor.


## Preparación de la segunda plataforma para UT01 · Windows Server

**No se pide instalar Windows Server dentro de UT00.** La entrega de UT00 sigue siendo Debian + cliente + IP persistente + prueba HTTP. Durante UT01 se creará la segunda plataforma en una red **independiente** `SRI-W-Pxx`: Windows Server 2025 con IP `10.39.P.(20+L)/24` y rol DHCP. Si tu equipo tiene poca RAM, ejecuta cada laboratorio por separado usando snapshots, no arranques todas las VM a la vez.

[Ir al laboratorio Windows Server de UT01]({{ '/docencia/asir/servicios-de-red-e-internet/ut01-dhcp-windows/' | relative_url }}).
