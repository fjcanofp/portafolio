---
title: "UT01 · DHCP en Windows Server 2022 y 2025"
description: "DHCPv4 en Windows Server 2022/2025: dos NIC, ámbito, exclusiones, reservas, concesiones, PowerShell, RRAS/NAT, diagnóstico y comparación con Kea."
summary: "Mismo protocolo, dos generaciones de Windows Server: DHCP, administración gráfica, PowerShell, salida a Internet mediante RRAS/NAT y comparación con Debian/Kea."

module_key: ser
cycle_key: smr
order: 1.1

module_title: "Servicios en Red"
module_code: "0227"
cycle_title: "Sistemas Microinformáticos y Redes"
course: "2.º SMR"
unit: "UT01"
hours: 10
level: "base-intermedio"

authors:
  - fjcano
reviewers:
  - fjcano
rights: all-rights-reserved
version: "2.0"
last_reviewed: 2026-11-09
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
  - windows-server-2022
  - windows-server-2025
  - ambitos
  - exclusiones
  - reservas
  - leases
  - powershell
  - rras
  - nat
  - diagnostico

permalink: /docencia/smr/ser/ut01-windows/
published: true

toc:
  - title: Por qué Windows Server
    id: por-que
  - title: 2022 vs 2025
    id: versiones
  - title: Laboratorio con dos NIC
    id: laboratorio
  - title: Comprobar Internet del servidor
    id: servidor-internet
  - title: Conceptos DHCP
    id: conceptos
  - title: Instalar el rol
    id: instalacion
  - title: Ámbito, exclusiones y opciones
    id: ambito
  - title: Reservas y concesiones
    id: reservas
  - title: Clientes
    id: clientes
  - title: PowerShell
    id: powershell
  - title: Dar Internet al cliente con RRAS/NAT
    id: rras
  - title: Diagnóstico
    id: diagnostico
  - title: Kea vs Windows
    id: comparacion
  - title: Prácticas
    id: practicas
  - title: Recursos
    id: recursos
  - title: Cierre
    id: cierre
---

## 1. ¿Por qué DHCP también en Windows Server? {#por-que}

Ya conocemos DHCP con Kea en Debian 13. Ahora repetimos el **mismo servicio** en otra plataforma para comprobar qué pertenece al protocolo y qué pertenece a la herramienta de administración.

```text
DHCPDISCOVER → DHCPOFFER → DHCPREQUEST → DHCPACK
```

Eso no cambia entre:

```text
Debian + Kea
Windows Server 2022
Windows Server 2025
```

Lo que sí cambia es cómo lo administramos.

| Idea | Kea | Windows Server |
|---|---|---|
| Red administrada | `subnet4` | ámbito |
| Direcciones dinámicas | `pools` | intervalo + exclusiones |
| Reserva | `reservations` | reserva |
| Opciones | `option-data` | opciones de ámbito |
| Concesiones | `kea-leases4.csv` | concesiones de direcciones |
| Administración | JSON + CLI | MMC + PowerShell |

> **Objetivo:** ser capaz de configurar y comprobar DHCP en Windows Server sin depender de memorizar una secuencia de clics.

---

## 2. Windows Server 2022 frente a Windows Server 2025 {#versiones}

Microsoft documenta conjuntamente el rol DHCP para **Windows Server 2022 y Windows Server 2025**. Para el nivel de esta UT, el procedimiento y los conceptos fundamentales son esencialmente los mismos:

```text
DHCP Server
ámbitos
exclusiones
reservas
leases
opciones
PowerShell
RRAS / Routing
```

![Windows Server 2022 frente a 2025]({{ '/assets/docencia/ser/ut01/windows/04_ws2022_vs_2025.svg' | relative_url }})

### Lo que sí merece la pena distinguir

| Aspecto | Windows Server 2022 | Windows Server 2025 |
|---|---|---|
| Generación | LTSC 2021 | LTSC 2024 |
| DHCP básico | mismo modelo | mismo modelo |
| Consola DHCP | MMC | MMC |
| Cmdlets DHCP | mismos cmdlets principales | mismos cmdlets principales |
| RRAS / Routing | disponible | disponible |
| Interfaz visual | generación anterior | escritorio/instalación más reciente |
| Soporte estándar | finalizado en octubre de 2026 | hasta noviembre de 2029 |
| Soporte ampliado | hasta octubre de 2031 | hasta noviembre de 2034 |

### Qué NO vamos a hacer

No vamos a inventar diferencias en DHCP donde no las hay.

La comparación útil será:

```text
¿puedo resolver el mismo problema en 2022 y 2025?
¿cambian los conceptos?
¿cambian los cmdlets?
¿cambia la interfaz?
¿qué versión tiene mayor recorrido de soporte?
```

### Ampliación profesional

Microsoft documenta incluso la migración de DHCP desde versiones anteriores hacia Windows Server más reciente. Por tanto, una empresa puede mantener la misma política DHCP y migrar el servidor con cambios mínimos para los clientes.

---

## 3. Laboratorio: servidor con dos tarjetas {#laboratorio}

El escenario completo será:

![Topología DHCP + RRAS/NAT]({{ '/assets/docencia/ser/ut01/windows/01_topologia_dhcp_nat.svg' | relative_url }})

```text
                    WINDOWS SERVER
Internet ← NAT ← [ WAN-NAT | LAN-INTERNA ] ← Red interna ← Cliente
                           │
                           ├─ DHCP Server
                           └─ RRAS + NAT
```

### NIC 1 · WAN-NAT

VirtualBox:

```text
Adaptador 1
Conectado a: NAT
Cable conectado: sí
```

Esta interfaz obtiene normalmente su configuración del NAT de VirtualBox.

Su función es:

```text
actualizaciones
navegación del servidor
salida WAN del RRAS
```

### NIC 2 · LAN-INTERNA

VirtualBox:

```text
Adaptador 2
Conectado a: Red interna
Nombre: SER-WIN-LAB
Cable conectado: sí
```

Esta interfaz será la LAN del laboratorio.

Ejemplo didáctico:

```text
LAN             192.168.150.0/24
Servidor LAN    192.168.150.1/24
Gateway LAN     vacío en el propio servidor
```

> La NIC interna del servidor **no necesita una segunda puerta de enlace predeterminada**. La ruta por defecto pertenece a la NIC WAN/NAT.

### Cliente

El cliente tendrá **solo una NIC** conectada a:

```text
Red interna: SER-WIN-LAB
```

Y se configurará para obtener:

```text
IPv4 automáticamente
DNS automáticamente
```

---

## 4. Preparar y comprobar las dos NIC {#servidor-internet}

Antes de instalar DHCP debemos demostrar que el servidor está bien conectado.

### 4.1 Renombrar adaptadores

En Windows Server:

```text
Win + R
→ ncpa.cpl
```

Renombra las tarjetas para no confundirlas:

```text
Ethernet  → WAN-NAT
Ethernet 2 → LAN-INTERNA
```

### 4.2 Configurar la LAN con IP fija

En `LAN-INTERNA`:

```text
IPv4: 192.168.150.1
Máscara: 255.255.255.0
Gateway: vacío
DNS: vacío inicialmente
```

La WAN-NAT puede permanecer con configuración automática de VirtualBox.

PowerShell para comprobar:

```powershell
Get-NetAdapter
Get-NetIPConfiguration
Get-NetRoute -DestinationPrefix "0.0.0.0/0"
```

Debe existir **una única ruta por defecto útil**, asociada a WAN-NAT.

### 4.3 ¿Tiene Internet el servidor?

No utilices solo `ping` como prueba.

Comprueba por capas:

```powershell
Get-NetIPConfiguration
Resolve-DnsName www.microsoft.com
Test-NetConnection www.microsoft.com -Port 443
```

Si quieres una comprobación HTTP:

```powershell
Invoke-WebRequest https://www.microsoft.com -UseBasicParsing
```

### Interpretación

```text
servidor sin Internet
→ todavía NO sigas con RRAS
```

Primero corrige la WAN/NAT.

---

## 5. DHCP no significa Internet {#conceptos}

![DHCP no es Internet]({{ '/assets/docencia/ser/ut01/windows/02_dhcp_no_es_internet.svg' | relative_url }})

DHCP puede entregar al cliente:

```text
IP
máscara
gateway
DNS
lease
```

Pero DHCP **no enruta paquetes**.

Para que el cliente de la LAN interna pueda salir a Internet necesitamos además:

```text
Routing and Remote Access (RRAS)
+
NAT
```

Esta separación es fundamental:

```text
DHCP → configura
RRAS → enruta
NAT → traduce direcciones
DNS → resuelve nombres
```

---

## 6. Conceptos propios de Windows DHCP

### Ámbito

Un **ámbito** es el conjunto administrativo de direcciones que Windows DHCP gestiona para una subred.

Define:

```text
intervalo
máscara
lease
exclusiones
reservas
opciones
```

### Exclusión

Una exclusión pertenece al intervalo del ámbito, pero Windows no la entregará como concesión dinámica.

![Ámbito, exclusiones y reserva]({{ '/assets/docencia/ser/ut01/windows/03_ambito_exclusion_reserva.svg' | relative_url }})

Ejemplo didáctico:

```text
Red              192.168.150.0/24
Intervalo         .20 - .220
Exclusión         .20 - .79
Exclusión         .180 - .220
Dinámicas         .80 - .179
```

### Reserva

Una reserva vincula:

```text
MAC / Client ID
      ↓
IPv4 concreta
```

El cliente sigue utilizando DHCP.

### Particularidad importante de Windows

La IP reservada debe estar dentro del **intervalo del ámbito**.

Puede estar además incluida en una exclusión para impedir que se entregue dinámicamente a otro cliente.

---

## 7. Instalar el rol DHCP {#instalacion}

### GUI

```text
Administrador del servidor
→ Administrar
→ Agregar roles y características
→ Instalación basada en características o roles
→ Servidor local
→ Servidor DHCP
→ Agregar características
→ Instalar
```

PowerShell equivalente:

```powershell
Install-WindowsFeature DHCP -IncludeManagementTools
```

Comprobar:

```powershell
Get-WindowsFeature DHCP
Get-Service DHCPServer
```

Microsoft indica que la instalación del rol no requiere reinicio.

### Autorización en Active Directory

En nuestro laboratorio inicial utilizaremos un servidor independiente.

Si no está unido a un dominio de Active Directory:

```text
no necesitamos autorizarlo en AD
```

En un dominio sí aparece la autorización del servidor DHCP como medida contra servidores no autorizados.

---

## 8. Crear el ámbito, exclusiones y opciones {#ambito}

Abre:

```text
Administrador del servidor
→ Herramientas
→ DHCP
→ servidor
→ IPv4
→ Nuevo ámbito
```

### Ejemplo docente completo

```text
Nombre        SER-WIN-DEMO
Red           192.168.150.0/24
Intervalo     192.168.150.20 - 192.168.150.220
Exclusión 1   192.168.150.20 - 192.168.150.79
Exclusión 2   192.168.150.180 - 192.168.150.220
Dinámicas     192.168.150.80 - 192.168.150.179
Lease         30 minutos
```

### Opción 003 · Router

Cuando RRAS/NAT esté configurado, el gateway de los clientes será:

```text
192.168.150.1
```

porque esa es la interfaz LAN del router Windows Server.

### Opción 006 · DNS

Si todavía no hemos instalado DNS en nuestro servidor podemos utilizar, para este laboratorio de salida a Internet, servidores DNS públicos.

Ejemplo:

```text
1.1.1.1
8.8.8.8
```

No anuncies un DNS local que todavía no existe.

---

## 9. Reservas y concesiones {#reservas}

### Ver leases

```text
Ámbito
→ Concesiones de direcciones
```

PowerShell:

```powershell
Get-DhcpServerv4Lease -ScopeId 192.168.150.0
```

### Crear una reserva

Desde una concesión:

```text
Concesiones de direcciones
→ botón derecho sobre el cliente
→ Agregar a reserva
```

O manualmente:

```text
Reservas
→ Nueva reserva
```

PowerShell:

```powershell
Add-DhcpServerv4Reservation `
  -ScopeId 192.168.150.0 `
  -IPAddress 192.168.150.70 `
  -ClientId "001122334455" `
  -Description "Cliente reservado"
```

Los valores anteriores son ejemplos de aprendizaje, no una solución evaluable.

---

## 10. Cliente Windows o Linux {#clientes}

### Windows

```bat
ipconfig /release
ipconfig /renew
ipconfig /all
```

Comprueba:

```text
IPv4
máscara
servidor DHCP
gateway
DNS
fecha de obtención
fecha de expiración
```

### Linux

Comprueba la dirección, rutas y datos DHCP con las herramientas ya trabajadas en la unidad.

### Antes de activar RRAS

El cliente puede tener perfectamente:

```text
IP correcta
máscara correcta
gateway correcto
DNS correcto
```

pero **todavía no navegar**.

¿Por qué?

Porque el servidor aún no está reenviando/traduciendo tráfico entre LAN y WAN.

---

## 11. PowerShell: misma administración sin GUI {#powershell}

Listar ámbitos:

```powershell
Get-DhcpServerv4Scope
```

Crear un ámbito:

```powershell
Add-DhcpServerv4Scope `
  -Name "LAB-EJEMPLO" `
  -StartRange 192.168.150.20 `
  -EndRange 192.168.150.220 `
  -SubnetMask 255.255.255.0 `
  -LeaseDuration 00:30:00
```

Exclusión:

```powershell
Add-DhcpServerv4ExclusionRange `
  -ScopeId 192.168.150.0 `
  -StartRange 192.168.150.20 `
  -EndRange 192.168.150.79
```

Gateway y DNS:

```powershell
Set-DhcpServerv4OptionValue `
  -ScopeId 192.168.150.0 `
  -Router 192.168.150.1 `
  -DnsServer 1.1.1.1,8.8.8.8
```

Comprobaciones:

```powershell
Get-DhcpServerv4Scope
Get-DhcpServerv4ExclusionRange -ScopeId 192.168.150.0
Get-DhcpServerv4Reservation -ScopeId 192.168.150.0
Get-DhcpServerv4Lease -ScopeId 192.168.150.0
Get-DhcpServerv4OptionValue -ScopeId 192.168.150.0
Get-DhcpServerv4Binding
Get-DhcpServerv4ScopeStatistics
```

---

## 12. Dar Internet al cliente: RRAS + NAT {#rras}

Este apartado ya no pertenece estrictamente a DHCP, pero completa el escenario profesional de dos tarjetas.

### 12.1 Instalar el servicio de enrutamiento

```text
Administrador del servidor
→ Administrar
→ Agregar roles y características
→ Acceso remoto
→ Servicios de rol
→ Enrutamiento
→ Instalar
```

PowerShell:

```powershell
Install-WindowsFeature RemoteAccess -IncludeManagementTools
Install-WindowsFeature Routing
```

### 12.2 Configurar RRAS

Abre:

```text
Administrador del servidor
→ Herramientas
→ Enrutamiento y acceso remoto
```

Después:

```text
botón derecho sobre el servidor
→ Configurar y habilitar Enrutamiento y acceso remoto
→ NAT
```

Selecciona como interfaz pública:

```text
WAN-NAT
```

Y como interfaz privada:

```text
LAN-INTERNA
```

### 12.3 Qué debe ocurrir

```text
Cliente
  ↓ gateway 192.168.150.1
Windows Server / LAN-INTERNA
  ↓ routing + NAT
Windows Server / WAN-NAT
  ↓
VirtualBox NAT
  ↓
Internet
```

### 12.4 Comprobaciones

Servidor:

```powershell
Get-Service RemoteAccess
Get-NetIPConfiguration
```

Cliente:

```bat
ipconfig /all
ping 192.168.150.1
nslookup www.microsoft.com
```

Comprobación TCP/HTTP desde PowerShell cliente:

```powershell
Test-NetConnection www.microsoft.com -Port 443
```

### Si el cliente tiene IP pero no Internet

No culpes directamente a DHCP.

Comprueba:

```text
1. gateway entregado
2. RRAS iniciado
3. WAN correcta
4. NAT sobre la interfaz WAN
5. DNS entregado
```

---

## 13. Diagnóstico {#diagnostico}

![Escalera de diagnóstico]({{ '/assets/docencia/ser/ut01/windows/05_diagnostico.svg' | relative_url }})

### Servidor DHCP

```powershell
Get-Service DHCPServer
Get-DhcpServerv4Scope
Get-DhcpServerv4Binding
Get-DhcpServerv4ScopeStatistics
```

### RRAS

```powershell
Get-Service RemoteAccess
Get-NetIPConfiguration
Get-NetRoute
```

### Eventos DHCP

```text
Visor de eventos
→ Registros de aplicaciones y servicios
→ Microsoft
→ Windows
→ DHCP-Server
```

### Auditoría DHCP

Ruta habitual:

```text
%windir%\System32\Dhcp
```

### Wireshark

Filtro:

```text
dhcp
```

Busca:

```text
Discover
Offer
Request
ACK
```

### Cliente APIPA

Si aparece:

```text
169.254.x.x
```

investiga primero:

```text
red interna
NIC
servicio
ámbito
binding
Discover/Offer
```

---

## 14. Kea vs Windows Server 2022 vs 2025 {#comparacion}

| Concepto | Kea / Debian 13 | WS 2022 | WS 2025 |
|---|---|---|---|
| Protocolo | DHCPv4 | DHCPv4 | DHCPv4 |
| Red | `subnet4` | ámbito | ámbito |
| Dinámicas | `pools` | intervalo/exclusiones | intervalo/exclusiones |
| Reserva | `reservations` | reserva | reserva |
| Lease | CSV/BD | concesión | concesión |
| Opciones | `option-data` | opciones | opciones |
| GUI | no necesaria | MMC | MMC |
| CLI | fichero/CLI | PowerShell | PowerShell |
| Routing/NAT | servicio aparte | RRAS | RRAS |

### Qué queremos que aprendas

No memorices tres productos.

Aprende a traducir conceptos:

```text
problema de red
      ↓
concepto DHCP
      ↓
implementación concreta
```

---

## 15. Prácticas {#practicas}

### W01 · Preparar el servidor de dos NIC

Demostrar:

```text
WAN-NAT operativa
LAN interna con IP estable
una sola ruta por defecto
Internet en el servidor
```

### W02 · Implantar DHCP

Demostrar:

```text
ámbito diseñado
exclusiones justificadas
cliente con concesión
lease visible en servidor
```

### W03 · Reserva y DORA

Demostrar:

```text
MAC real
reserva
cliente reservado
DORA propio
```

### W04 · Internet para el cliente mediante RRAS/NAT

Demostrar:

```text
gateway entregado por DHCP
RRAS activo
NAT WAN
cliente llega a Internet
```

### W05 · Windows Server 2022 vs 2025

Comparar el mismo servicio en ambas versiones:

```text
instalación del rol
ámbito
reserva
PowerShell
RRAS
resultado del cliente
```

---

## 16. Recursos reales {#recursos}

### Microsoft Learn

- [Servidor DHCP - instalación y configuración](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/quickstart-install-configure-dhcp-server)
- [Ámbitos DHCP](https://learn.microsoft.com/windows-server/networking/technologies/dhcp/dhcp-scopes)
- [DHCP mediante PowerShell](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/dhcp-deploy-wps)
- [Diagnóstico DHCP](https://learn.microsoft.com/es-es/troubleshoot/windows-server/networking/troubleshoot-dhcp-guidance)
- [Acceso remoto y servicio de routing](https://learn.microsoft.com/es-es/windows-server/remote/remote-access/remote-access)
- [Migración DHCP entre Windows Server](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/migrate-dhcp-server)
