---
title: "UT02 · DNS en Windows Server 2022 y 2025"
description: "Segunda implementación del RA2: rol DNS Server, interfaces, reenviadores, zonas estándar, registros A/CNAME/MX/PTR, PowerShell y zona secundaria transferida desde BIND9."
summary: "Los mismos conceptos DNS administrados con GUI y PowerShell, terminando con interoperabilidad Debian BIND9 → Windows Server."

module_key: ser
cycle_key: smr
order: 2.1

module_title: "Servicios en Red"
module_code: "0227"
cycle_title: "Sistemas Microinformáticos y Redes"
course: "2.º SMR"
unit: "UT02"
hours: 6
level: "base-intermedio"

authors:
  - fjcano

reviewers:
  - fjcano

rights: all-rights-reserved
version: "1.0"
last_reviewed: 2026-11-19
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
  - "RA2.h"

tags:
  - dns
  - windows-server
  - windows-server-2022
  - windows-server-2025
  - zones
  - forwarders
  - records
  - secondary
  - axfr
  - powershell
  - ra2

permalink: /docencia/smr/ser/ut02-windows/
published: false

toc:
  - title: Objetivo
    id: objetivo
  - title: 2022 y 2025
    id: versiones
  - title: Laboratorio
    id: laboratorio
  - title: Instalar DNS
    id: instalar
  - title: Interfaces
    id: interfaces
  - title: Reenviadores
    id: forwarders
  - title: Zona primaria
    id: primaria
  - title: Registros
    id: registros
  - title: Zona inversa
    id: inversa
  - title: PowerShell
    id: powershell
  - title: Zona secundaria
    id: secundaria
  - title: Transferencia
    id: transferencia
  - title: Diagnóstico
    id: diagnostico
  - title: Comparación
    id: comparacion
  - title: Recursos
    id: recursos
  - title: Cierre
    id: cierre
---

## 1. Objetivo {#objetivo}

Esta página es la segunda implementación de la UT02.

Primero trabajamos:

➡️ **[DNS con BIND9 en Debian 13]({{ '/docencia/smr/ser/ut02/' | relative_url }})**

Ahora comprobaremos que los conceptos permanecen:

```text
zona
registros
caché
reenviador
primario
secundario
transferencia
```

Lo que cambia es la herramienta:

```text
BIND9 → ficheros + CLI

Windows DNS → consola gráfica + PowerShell
```

---

## 2. Windows Server 2022 y 2025 {#versiones}

Microsoft aplica la misma documentación actual de DNS Server a:

```text
Windows Server 2022
Windows Server 2025
```

Para lo que trabajamos en SMR:

| Elemento | WS2022 | WS2025 |
|---|---|---|
| Rol DNS Server | igual | igual |
| Zona estándar | igual | igual |
| Forward / reverse | igual | igual |
| Secondary zone | igual | igual |
| Cmdlets principales | equivalentes | equivalentes |

No buscaremos diferencias artificiales.

---

## 3. Laboratorio {#laboratorio}

Ejemplo docente:

```text
Debian primary    192.168.160.10
Windows DNS       192.168.160.20
Cliente           192.168.160.100
```

Primero crearemos una pequeña zona estándar en Windows.

Después lo convertiremos en secundario de la zona de Debian.

> No necesitamos Active Directory para esta práctica.

---

## 4. Instalar DNS Server {#instalar}

Requisito:

```text
IPv4 estable
```

GUI:

```text
Server Manager
→ Manage
→ Add Roles and Features
→ DNS Server
→ Install
```

PowerShell:

```powershell
Install-WindowsFeature DNS -IncludeManagementTools
Get-Service DNS
```

La instalación no requiere reinicio.

---

## 5. Interfaces de escucha {#interfaces}

Por defecto, Windows DNS puede escuchar en todas las IP del servidor.

En una máquina con varias NIC:

```text
DNS Manager
→ servidor
→ Properties
→ Interfaces
```

Selecciona:

```text
Only the following IP addresses
```

y utiliza la IP de la LAN.

PowerShell:

```powershell
$cfg = Get-DnsServerSetting -All
$cfg.ListeningIpAddress = @("192.168.160.20")
Set-DnsServerSetting $cfg
```

---

## 6. Reenviadores {#forwarders}

GUI:

```text
servidor
→ Properties
→ Forwarders
```

Ejemplo:

```text
1.1.1.1
8.8.8.8
```

PowerShell:

```powershell
Set-DnsServerForwarder `
  -IPAddress @("1.1.1.1","8.8.8.8")
```

Importante:

```text
Set-DnsServerForwarder
```

reemplaza la lista cuando indicamos `-IPAddress`.

---

## 7. Zona primaria estándar {#primaria}

Para aprender la consola crearemos una zona **basada en fichero**.

GUI:

```text
Forward Lookup Zones
→ New Zone
→ Primary zone
→ NO almacenar en Active Directory
→ nombre de zona
→ fichero de zona
```

PowerShell:

```powershell
Add-DnsServerPrimaryZone `
  -Name "win-demo.ser.test" `
  -ZoneFile "win-demo.ser.test.dns"
```

---

## 8. Registros {#registros}

### A

```powershell
Add-DnsServerResourceRecordA `
  -Name "www" `
  -ZoneName "win-demo.ser.test" `
  -IPv4Address "192.168.160.80"
```

### A + PTR

Si la zona inversa ya existe:

```powershell
Add-DnsServerResourceRecordA `
  -Name "www" `
  -ZoneName "win-demo.ser.test" `
  -IPv4Address "192.168.160.80" `
  -CreatePtr
```

### CNAME

```powershell
Add-DnsServerResourceRecordCName `
  -Name "intranet" `
  -HostNameAlias "www.win-demo.ser.test" `
  -ZoneName "win-demo.ser.test"
```

### MX

Desde la GUI:

```text
zona
→ New Mail Exchanger (MX)
```

Debe apuntar al **nombre** de un servidor de correo.

---

## 9. Zona inversa {#inversa}

GUI:

```text
Reverse Lookup Zones
→ New Zone
→ Primary
→ IPv4
→ Network ID
```

PowerShell:

```powershell
Add-DnsServerPrimaryZone `
  -NetworkId "192.168.160.0/24" `
  -ZoneFile "160.168.192.in-addr.arpa.dns"
```

---

## 10. Comprobación con PowerShell {#powershell}

```powershell
Get-DnsServerZone
```

```powershell
Get-DnsServerResourceRecord `
  -ZoneName "win-demo.ser.test"
```

```powershell
Get-DnsServerForwarder
```

```powershell
Resolve-DnsName `
  www.win-demo.ser.test `
  -Server 192.168.160.20
```

---

## 11. Zona secundaria de BIND9 {#secundaria}

![Transferencia Debian-Windows]({{ '/assets/docencia/ser/ut02/dns/05_transferencia.svg' | relative_url }})

Ahora llega la parte que une ambas plataformas.

Debian:

```text
primary
```

Windows:

```text
secondary
```

GUI:

```text
Forward Lookup Zones
→ New Zone
→ Secondary zone
```

Nombre:

```text
exactamente el mismo que en Debian
```

Master DNS Servers:

```text
IP del BIND primary
```

PowerShell:

```powershell
Add-DnsServerSecondaryZone `
  -Name "demo.ser.test" `
  -ZoneFile "demo.ser.test.dns" `
  -MasterServers 192.168.160.10
```

---

## 12. Qué necesita el primario {#transferencia}

En BIND debe existir:

```conf
allow-transfer {
    192.168.160.20;
};
```

Una transferencia completa de zona necesita transporte TCP.

---

## 13. Probar un cambio

En Debian:

```text
añadir registro
↓
incrementar serial
↓
validar
↓
recargar
```

Después en Windows:

```powershell
Get-DnsServerResourceRecord `
  -ZoneName "demo.ser.test"
```

y:

```powershell
Resolve-DnsName `
  nuevo.demo.ser.test `
  -Server 192.168.160.20
```

Si aparece, tenemos interoperabilidad real.

---

## 14. Diagnóstico {#diagnostico}

Si la zona secundaria no carga:

```text
1. conectividad por IP
2. servicio DNS Windows
3. nombre de zona exacto
4. master correcto
5. allow-transfer en Debian
6. TCP 53
7. serial
```

### Caso importante

Primary resuelve correctamente.

Secondary no tiene la zona.

Conclusión:

```text
no cambies los registros de la zona
```

Primero investiga la **transferencia**.

---

## 15. BIND y Windows {#comparacion}

| Concepto | BIND9 | Windows Server |
|---|---|---|
| zona primaria | `type primary` | Primary zone |
| zona secundaria | `type secondary` | Secondary zone |
| registros | fichero | GUI / PowerShell |
| reenviadores | `forwarders` | Forwarders |
| validación | checkconf/checkzone | consola / cmdlets / eventos |
| transferencia | `allow-transfer` | Secondary / Zone Transfers |

---

## 16. Recursos {#recursos}

- [Microsoft · instalar y configurar DNS Server](https://learn.microsoft.com/es-es/windows-server/networking/dns/quickstart-install-configure-dns-server)
- [Microsoft · administrar zonas DNS](https://learn.microsoft.com/es-es/windows-server/networking/dns/manage-dns-zones)
- [Microsoft · administrar registros](https://learn.microsoft.com/es-es/windows-server/networking/dns/manage-resource-records)
- [Microsoft · DNS forwarding](https://learn.microsoft.com/en-us/windows-server/networking/dns/configure-dns-forwarding)
- [Server World · Windows Server 2025](https://www.server-world.info/en/note?os=Windows_Server_2025)
- [Vídeo · Windows Server Basic Admin Skills DNS](https://www.youtube.com/watch?v=q_TbJSVndv0)

---

## 17. Cierre {#cierre}

Debes ser capaz de explicar:

```text
qué concepto es igual en BIND y Windows
cómo crear una zona estándar
cómo crear A / CNAME / MX / PTR
qué hace un reenviador
qué es una zona secundaria
por qué importa el serial
por qué una transferencia puede fallar aunque la zona primaria funcione
```
