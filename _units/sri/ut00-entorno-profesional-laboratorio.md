---
title: UT00 · Entorno profesional, laboratorio y diagnóstico
description: 'VirtualBox y Debian 13: laboratorio individual, NAT y red interna, IP fija persistente, cliente y diagnóstico
  reproducible.'
summary: 'Preparar servidor y cliente de SRI antes de instalar Kea: IP fija, redes aisladas y pruebas verificables.'
module_key: sri
cycle_key: asir
order: 0
module_title: Servicios de Red e Internet
module_code: '0375'
cycle_title: Administración de Sistemas Informáticos en Red
course: 2.º ASIR
unit: UT00
hours: 6
level: iniciacion
authors:
- fjcano
reviewers:
- fjcano
rights: all-rights-reserved
version: '2.0'
last_reviewed: '2026-09-23'
visibility: public
ra:
- Transversal a RA1–RA8
tags:
- debian
- virtualbox
- redes
- ip-estatica
- diagnostico
- laboratorio
permalink: /docencia/asir/sri/ut00/
published: true
toc:
- title: Introducción
  id: introduccion
- title: Laboratorio
  id: objetivos
- title: Individualización
  id: individualizacion
- title: Topología
  id: topologia
- title: Inventario
  id: inventario
- title: IP fija
  id: ip-estatica
- title: Cliente
  id: cliente
- title: Pruebas y diagnóstico
  id: evidencias
- title: 'Siguiente: DHCP'
  id: siguiente
---

## Introducción {#introduccion}

> **Objetivo:** dejar preparado un laboratorio individual, reproducible y seguro para comenzar **UT01 · DHCP/Kea**. La UT00 no añade un RA nuevo: prepara herramientas y método que reutilizaremos en todos los RA.

## 1. Qué debe quedar preparado {#objetivos}

Al cerrar UT00 cada alumno debe disponer de:

- código individual `Pxx-Lyy`;
- servidor Debian 13 `srv-pXX-lYY`;
- NIC 1 NAT, usada solo cuando haga falta instalar/actualizar;
- NIC 2 en Red Interna `SRI-Pxx`;
- snapshot `00_BASE` (plantilla) y snapshot `10_RED_OK` (servidor SRI);
- IP estática persistente de la NIC interna;
- cliente de pruebas en la misma red interna;
- conectividad IP servidor ↔ cliente;
- un servicio HTTP temporal probado desde cliente;
- inventario, evidencias y un ticket de diagnóstico básico.

## 2. Variante individual {#individualizacion}

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

## 3. Topología {#topologia}

![Topología base del laboratorio SRI]({{ '/assets/docencia/sri/ut00/01_topologia_sri_lab.svg' | relative_url }})

**Nunca uses modo puente para un servidor DHCP de laboratorio.**

![Funciones de la NIC NAT y de la NIC interna]({{ '/assets/docencia/sri/ut00/02_nic_nat_vs_interna.svg' | relative_url }})

## 4. Inventario antes de configurar {#inventario}

```bash
hostnamectl
ip -br link
ip -br address
ip route
systemctl is-active NetworkManager
systemctl is-active systemd-networkd
ls -l /etc/network/interfaces
```

No edites un fichero de red hasta identificar qué componente administra realmente la NIC. En Debian mínimo, un servicio `NetworkManager` o `systemd-networkd` inactivo **no significa** que la red esté rota: comprueba `networking` e `ifupdown` antes de instalar otro gestor.

```bash
systemctl is-active networking
dpkg -l ifupdown 2>/dev/null | grep ^ii
```

## 5. Configurar la IP estática del servidor {#ip-estatica}

### 5.1 Regla

La NIC **interna** recibe la IP calculada. No configuramos gateway en esa NIC: si hay salida a Internet corresponde a la NIC NAT. Identifica las interfaces por su MAC en VirtualBox; `enp0s3` y `enp0s8` son **ejemplos**, no nombres universales.

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

Aplica desde **la consola local** (no cortes tu sesión SSH al reiniciar networking) y comprueba: `sudo systemctl restart networking`, `ip -br a`, `ip route`. Si un servicio `networking` no está disponible, revisa si tienes realmente ifupdown y utiliza el gestor que administra esa NIC. En VM de laboratorio también puedes reiniciar después de guardar snapshot.

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

## 6. Configurar el cliente de prueba {#cliente}

En UT00 el cliente puede usar una IP manual para validar la red. En UT01 la quitaremos y pasará a **IPv4 automática** para probar DHCP. La IP manual `120+L` **puede quedar dentro del futuro pool DHCP** en algunas variantes: no la conserves cuando actives Kea.

Ejemplo docente P07-L03: `10.37.7.123/24`, sin gateway en la NIC interna.

Comprobar:

```bash
ping -c 3 10.37.7.23
```

## 7. Servicio temporal y evidencias {#evidencias}

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

![Evidencias técnicas para validar el laboratorio]({{ '/assets/docencia/sri/ut00/04_evidencias_ut00.svg' | relative_url }})


## 8. Método de diagnóstico {#diagnostico}

Cuando algo falle, evita cambiar varias cosas a la vez. Sigue una secuencia reproducible:

1. describe el **síntoma** sin interpretar;
2. identifica la **capa** probable;
3. formula una **hipótesis**;
4. elige una **prueba discriminante**;
5. observa el **dato**;
6. aplica el **cambio mínimo**;
7. repite la prueba y documenta el resultado.

![Flujo profesional de diagnóstico]({{ '/assets/docencia/sri/ut00/03_flujo_diagnostico.svg' | relative_url }})

> Las instrucciones concretas de entrega, archivos y criterios de evaluación se gestionan en el aula virtual. La web pública conserva el procedimiento de aprendizaje y las evidencias técnicas necesarias para entenderlo.

## 9. Siguiente unidad {#siguiente}

> **UT01 · Configuración automática profesional: DHCP con Kea**

El primer cambio será deliberado: el cliente dejará de tener IP manual y pasará a solicitar su configuración al servidor.

### Dos plataformas, una misma UT01

Primero trabajaremos **DHCP con Kea en Debian 13**. Cuando el núcleo esté consolidado, realizaremos la **segunda implementación obligatoria en Windows Server 2025**, en una red VirtualBox diferente (`SRI-W-Pxx`). No se pide instalar Windows Server en esta UT00; si el equipo es justo de memoria, usa las VM por turnos.

- [Continuar a UT01 · DHCP con Kea]({{ "/docencia/asir/sri/ut01/" | relative_url }}).
- [Ir al segundo laboratorio de UT01 · Windows Server 2025]({{ "/docencia/asir/sri/ut01-windows/" | relative_url }}).
