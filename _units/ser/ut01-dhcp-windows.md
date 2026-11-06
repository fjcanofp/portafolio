---
title: "UT01 · DHCP en Windows Server 2025"
description: "Segunda implementación de DHCPv4 de la UT01 de SER: rol DHCP de Windows Server 2025, ámbitos, exclusiones, reservas, concesiones, opciones, PowerShell y diagnóstico."
summary: "Los mismos conceptos DHCP del RA1 administrados en Windows Server 2025 mediante consola gráfica y PowerShell."

module_key: ser
cycle_key: smr
order: 1.1

module_title: "Servicios en Red"
module_code: "0227"
cycle_title: "Sistemas Microinformáticos y Redes"
course: "2.º SMR"
unit: "UT01"
hours: 8
level: "base-intermedio"

authors:
  - fjcano

reviewers:
  - fjcano

rights: all-rights-reserved
version: "1.1"
last_reviewed: 2026-11-06
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
  - windows-server
  - windows-server-2025
  - ambitos
  - exclusiones
  - reservas
  - leases
  - powershell
  - diagnostico
  - ra1

permalink: /docencia/smr/ser/ut01-windows/
published: true

toc:
  - title: Por qué Windows Server
    id: por-que
  - title: Laboratorio
    id: laboratorio
  - title: Conceptos
    id: conceptos
  - title: Instalación
    id: instalacion
  - title: Autorización
    id: autorizacion
  - title: Ámbito IPv4
    id: ambito
  - title: Exclusiones
    id: exclusiones
  - title: Opciones de ámbito
    id: opciones
  - title: Reservas
    id: reservas
  - title: Concesiones
    id: concesiones
  - title: Clientes Windows y Linux
    id: clientes
  - title: PowerShell
    id: powershell
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

## 1. ¿Por qué ver DHCP también en Windows Server 2025? {#por-que}

El protocolo **no cambia** porque cambie el sistema operativo.

Esta página es la **segunda implementación de la misma UT01**. La primera se realiza con [Kea en Debian 13]({{ '/docencia/smr/ser/ut01/' | relative_url }}); aquí repetimos los conceptos esenciales con Windows Server 2025 para aprender a administrarlos desde otra plataforma.

Seguimos trabajando:

```text
cliente
  ↓ DHCPDISCOVER
servidor
  ↓ DHCPOFFER
cliente
  ↓ DHCPREQUEST
servidor
  ↓ DHCPACK
```

Lo que cambia es la forma de administrar el servicio.

En Debian/Kea hemos utilizado:

```text
subnet4
pools
reservations
option-data
leases
```

En Windows Server encontraremos:

```text
ámbito
grupo de direcciones
exclusiones
reservas
concesiones
opciones de ámbito
```

> **Objetivo de este bloque:** reconocer los mismos conceptos DHCP en una segunda plataforma y ser capaz de administrarlos tanto desde la consola gráfica como desde PowerShell.

Microsoft incluye Windows Server 2025 entre las versiones a las que se aplica su guía actual de instalación y configuración del rol DHCP.

---

## 2. Laboratorio seguro {#laboratorio}

### Máquina servidor

Recomendación de aula:

```text
Windows Server 2025 Standard Evaluation
Server with Desktop Experience
2 vCPU
4 GB RAM
60 GB disco
```

La edición de evaluación oficial de Windows Server 2025 está disponible durante **180 días** en Microsoft Evaluation Center.

### Red virtual

Patrón recomendado:

```text
NIC 1 → NAT
NIC 2 → Red interna SER-WIN-PXX
```

La NIC de servicio debe tener una IPv4 **estática**.

La NIC NAT se utiliza únicamente para:

```text
Windows Update
descargas
mantenimiento
```

La NIC de servicio se utiliza para:

```text
DHCP
pruebas de clientes
Wireshark
```

> **Seguridad:** no conectes un servidor DHCP de prácticas en modo Puente a la red física del centro.

### Clientes

Puedes probar con:

```text
Windows 11
Debian 13
```

Los dos deben estar configurados para obtener IPv4 automáticamente en la NIC del laboratorio.

---

## 3. Conceptos de Windows DHCP {#conceptos}

### Ámbito

Un **ámbito** es el conjunto administrativo de direcciones que Windows DHCP gestiona para una subred.

Un ámbito define, entre otras cosas:

```text
red
intervalo de distribución
máscara
duración de lease
exclusiones
opciones
reservas
```

### Intervalo de distribución

Es el intervalo continuo que pertenece al ámbito.

Ejemplo didáctico:

```text
Red       10.25.10.0/24
Ámbito    10.25.10.20 - 10.25.10.220
```

### Exclusión

Una exclusión es una parte del intervalo del ámbito que **Windows no entregará dinámicamente**.

Ejemplo:

```text
Ámbito      10.25.10.20 - 10.25.10.220
Exclusión   10.25.10.20 - 10.25.10.79
Exclusión   10.25.10.180 - 10.25.10.220

Dinámicas efectivas:
10.25.10.80 - 10.25.10.179
```

Las exclusiones son útiles para proteger direcciones destinadas a:

```text
servidores
routers
impresoras con IP manual
infraestructura
crecimiento
```

### Reserva

Una reserva vincula:

```text
MAC del cliente
      ↓
dirección IPv4 concreta
```

El cliente continúa utilizando DHCP.

### Diferencia importante respecto al diseño de Kea

En Windows Server, una reserva debe encontrarse dentro del **intervalo de distribución del ámbito**.

Si no quieres que esa dirección se entregue dinámicamente:

```text
amplía el intervalo del ámbito
        +
incluye esa dirección en una exclusión
        +
crea la reserva
```

Una reserva situada dentro de una exclusión **sigue funcionando**.

---

## 4. Instalar el rol DHCP {#instalacion}

Antes de instalar el rol:

```text
1. servidor con IPv4 estática
2. red de laboratorio comprobada
3. cliente en el mismo segmento
4. plan de direccionamiento preparado
```

### Ruta gráfica

En Windows Server 2025:

```text
Administrador del servidor
→ Administrar
→ Agregar roles y características
→ Instalación basada en características o en roles
→ Servidor local
→ Servidor DHCP
→ Agregar características
→ Siguiente
→ Instalar
```

La documentación oficial de Microsoft indica que la instalación del rol no requiere reinicio.

### PowerShell equivalente

Abre PowerShell como administrador:

```powershell
Install-WindowsFeature DHCP -IncludeManagementTools
```

Comprobación:

```powershell
Get-WindowsFeature DHCP
Get-Service DHCPServer
```

---

## 5. ¿Hay que autorizar el servidor? Depende {#autorizacion}

### Laboratorio sin dominio

Si el servidor está en un **grupo de trabajo** y no pertenece a Active Directory:

```text
NO hay que ejecutar Add-DhcpServerInDC
```

En la configuración posterior a la instalación puede omitirse la autorización de AD.

### Servidor unido a dominio

En un entorno de Active Directory, el servidor DHCP debe estar autorizado.

PowerShell:

```powershell
Add-DhcpServerInDC -DnsName DHCP1.ejemplo.test -IPAddress 10.25.10.10
Get-DhcpServerInDC
```

> En SER utilizaremos primero el escenario **independiente**. La autorización en AD se trata como ampliación profesional.

---

## 6. Crear un ámbito IPv4 {#ambito}

### Desde la consola DHCP

Abre:

```text
Administrador del servidor
→ Herramientas
→ DHCP
```

Después:

```text
Servidor
→ IPv4
→ botón derecho
→ Nuevo ámbito...
```

El asistente solicita:

```text
nombre
intervalo
máscara
exclusiones
duración de concesión
opciones
activación
```

### Ejemplo didáctico

```text
Nombre del ámbito     LAB-EJEMPLO
Red                   10.25.10.0/24
Intervalo             10.25.10.20 - 10.25.10.220
Lease                 30 minutos
```

No copies estos valores para una tarea evaluable.

---

## 7. Exclusiones {#exclusiones}

Microsoft recomienda planificar primero el intervalo del ámbito y después proteger mediante exclusiones las direcciones que no deben entregarse dinámicamente.

Ejemplo didáctico:

```text
10.25.10.20 - 10.25.10.79     infraestructura / reservas
10.25.10.180 - 10.25.10.220   crecimiento
```

En la consola:

```text
Ámbito
→ Grupo de direcciones
→ botón derecho
→ Nuevo intervalo de exclusión
```

PowerShell:

```powershell
Add-DhcpServerv4ExclusionRange `
  -ScopeId 10.25.10.0 `
  -StartRange 10.25.10.20 `
  -EndRange 10.25.10.79
```

---

## 8. Opciones de ámbito {#opciones}

Las opciones más conocidas son:

| Opción | Uso |
|---|---|
| 003 | Router / puerta de enlace |
| 006 | Servidores DNS |
| 015 | Nombre de dominio |
| 051 | Duración de concesión |

No anuncies servicios inexistentes.

Si la red de laboratorio:

```text
no tiene router
no tiene DNS
```

no inventes una puerta de enlace ni un servidor DNS.

### PowerShell

Cuando exista una pasarela real:

```powershell
Set-DhcpServerv4OptionValue `
  -ScopeId 10.25.10.0 `
  -Router 10.25.10.1
```

Cuando exista DNS real:

```powershell
Set-DhcpServerv4OptionValue `
  -ScopeId 10.25.10.0 `
  -DnsServer 10.25.10.10 `
  -DnsDomain "ejemplo.test"
```

---

## 9. Reservas por MAC {#reservas}

### Desde una concesión existente

Una forma cómoda:

```text
Ámbito
→ Concesiones de direcciones
→ botón derecho sobre el cliente
→ Agregar a reserva
```

### Crearla manualmente

```text
Ámbito
→ Reservas
→ Nueva reserva
```

Necesitas:

```text
nombre
dirección IPv4
MAC / Client ID
```

### PowerShell

Ejemplo didáctico:

```powershell
Add-DhcpServerv4Reservation `
  -ScopeId 10.25.10.0 `
  -IPAddress 10.25.10.70 `
  -ClientId "001122334455" `
  -Description "Equipo de prueba"
```

### Regla de Windows que debes recordar

La reserva debe pertenecer al intervalo del ámbito.

Una dirección excluida de la asignación dinámica **puede utilizarse como reserva**.

---

## 10. Concesiones {#concesiones}

En la consola:

```text
IPv4
→ Ámbito
→ Concesiones de direcciones
```

Puedes comprobar:

```text
IP
nombre
identificador único
fecha de expiración
tipo
```

PowerShell:

```powershell
Get-DhcpServerv4Lease -ScopeId 10.25.10.0
```

Reservas:

```powershell
Get-DhcpServerv4Reservation -ScopeId 10.25.10.0
```

Ámbitos:

```powershell
Get-DhcpServerv4Scope
```

Exclusiones:

```powershell
Get-DhcpServerv4ExclusionRange -ScopeId 10.25.10.0
```

Opciones:

```powershell
Get-DhcpServerv4OptionValue -ScopeId 10.25.10.0
```

---

## 11. Probar desde Windows y Linux {#clientes}

### Cliente Windows

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
lease obtenida
lease expira
gateway si existe
DNS si existe
```

### Cliente Linux

Comprueba la interfaz y los parámetros recibidos con las herramientas trabajadas en la unidad.

Lo importante es que:

```text
cliente
consola DHCP
PowerShell
captura DORA
```

cuenten la misma historia.

---

## 12. PowerShell: administrar, no memorizar {#powershell}

Instalar:

```powershell
Install-WindowsFeature DHCP -IncludeManagementTools
```

Listar ámbitos:

```powershell
Get-DhcpServerv4Scope
```

Crear un ámbito:

```powershell
Add-DhcpServerv4Scope `
  -Name "LAB-EJEMPLO" `
  -StartRange 10.25.10.20 `
  -EndRange 10.25.10.220 `
  -SubnetMask 255.255.255.0 `
  -LeaseDuration 00:30:00
```

Crear exclusión:

```powershell
Add-DhcpServerv4ExclusionRange `
  -ScopeId 10.25.10.0 `
  -StartRange 10.25.10.20 `
  -EndRange 10.25.10.79
```

Crear reserva:

```powershell
Add-DhcpServerv4Reservation `
  -ScopeId 10.25.10.0 `
  -IPAddress 10.25.10.70 `
  -ClientId "001122334455"
```

Activar/desactivar:

```powershell
Set-DhcpServerv4Scope -ScopeId 10.25.10.0 -State Active
Set-DhcpServerv4Scope -ScopeId 10.25.10.0 -State InActive
```

Comprobar binding:

```powershell
Get-DhcpServerv4Binding
```

> El objetivo no es memorizar todos los cmdlets. Debes ser capaz de reconocer qué objeto estás administrando: rol, ámbito, exclusión, reserva, opción o concesión.

---

## 13. Diagnóstico {#diagnostico}

### Escalera rápida

```text
1. ¿cliente y servidor están en la misma Red interna?
2. ¿servidor tiene IP fija?
3. ¿servicio DHCP Server está iniciado?
4. ¿ámbito está activo?
5. ¿quedan direcciones disponibles?
6. ¿el servidor está enlazado a la interfaz correcta?
7. ¿la reserva coincide con la MAC real?
8. ¿el cliente envía Discover?
9. ¿el servidor responde Offer?
10. ¿la concesión aparece en la consola?
```

### Servicio

```powershell
Get-Service DHCPServer
```

### Binding

```powershell
Get-DhcpServerv4Binding
```

### Estadísticas

```powershell
Get-DhcpServerv4ScopeStatistics
```

### Eventos

Abre:

```text
Visor de eventos
→ Registros de aplicaciones y servicios
→ Microsoft
→ Windows
→ DHCP-Server
```

Microsoft documenta canales:

```text
Operational
Admin
System
Audit
```

### Logs

Los registros de DHCP se encuentran de forma predeterminada en:

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

Si aparece:

```text
169.254.x.x
```

no cambies cosas al azar.

Pregunta primero:

```text
¿ha llegado un Offer útil al cliente?
```

---

## 14. Kea y Windows Server: mismos conceptos, otra administración {#comparacion}

| Concepto DHCP | Debian + Kea | Windows Server 2025 |
|---|---|---|
| Servicio | `kea-dhcp4-server` | DHCP Server |
| Red atendida | `subnet4` | Ámbito |
| Direcciones dinámicas | `pools` | Grupo de direcciones |
| No asignar dinámicamente | separar del pool | Exclusión |
| Reserva | `reservations` | Reservas |
| Identidad | MAC / client-id | MAC / Client ID |
| Concesiones | `kea-leases4.csv` | Concesiones de direcciones |
| Opciones | `option-data` | Opciones de ámbito |
| CLI | fichero JSON / utilidades | PowerShell |
| Validación | `kea-dhcp4 -t` | consola/cmdlets + servicio/eventos |

### Diferencia que debes entender

Kea permite diseñar directamente un pool separado de una reserva.

Windows Server parte del **intervalo del ámbito** y utiliza **exclusiones** para retirar direcciones de la asignación dinámica.

---

## 15. Prácticas propuestas {#practicas}

### W01 · Primer ámbito desde GUI

Objetivo:

```text
instalar el rol
crear un ámbito
obtener una concesión real
```

### W02 · Exclusiones, reserva y dos clientes

Objetivo:

```text
proteger infraestructura
crear una reserva por MAC
comparar cliente dinámico y reservado
```

### W03 · Administrar con PowerShell

Objetivo:

```text
consultar ámbito
consultar exclusiones
consultar reservas
consultar leases
modificar una propiedad
comprobar el resultado
```

### W04 · Práctica final autónoma

El profesor facilitará:

```text
red personalizada
capacidad mínima
duración de lease
requisito de reserva
incidencia
```

El alumno deberá decidir:

```text
dirección del servidor
intervalo del ámbito
exclusiones
dirección reservada
pruebas
```

No se proporciona tutorial paso a paso.

---

## 16. Capturas reales y tutoriales externos {#recursos}

Para evitar copiar imágenes de terceros en esta web, se enlazan tutoriales con capturas reales de Windows Server 2025.

### Server World · Windows Server 2025

- Instalación del rol DHCP:
  https://www.server-world.info/en/note?os=Windows_Server_2025&p=dhcp&f=1
- Configuración y asistente de ámbito:
  https://www.server-world.info/en/note?os=Windows_Server_2025&p=dhcp&f=2

Incluye capturas reales de:

```text
Add Roles and Features Wizard
DHCP Post-Install Configuration Wizard
DHCP console
New Scope Wizard
```

### Tutorial en español con capturas

RDR-IT:

https://rdr-it.com/es/windows-server-2025-instalar-y-configurar-un-servidor-dhcp/

### Microsoft Learn

Instalar y configurar DHCP:

https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/quickstart-install-configure-dhcp-server

Ámbitos:

https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/dhcp-scopes

PowerShell:

https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/dhcp-deploy-wps

Diagnóstico:

https://learn.microsoft.com/es-es/troubleshoot/windows-server/networking/troubleshoot-dhcp-guidance

### Vídeo recomendado en español

**oscariope · Windows Server 2025 - Configura un Servidor DHCP Paso a Paso (Desde Cero)**

https://www.youtube.com/watch?v=YkldzyCEgnI

Capítulos publicados por el autor:

```text
00:12 qué es DHCP
01:33 comprobar IP
02:32 instalar rol DHCP
03:43 configurar ámbito
07:28 cliente en automático
09:33 reserva DHCP
```

### Alternativa en inglés

**ittaster · Install & Configure DHCP in Windows Server 2025 - Beginner Step by Step Guide**

https://www.youtube.com/watch?v=18g3IdIq87g

Incluye:

```text
rol DHCP
scope
exclusions
gateway/DNS
cliente Windows 11
APIPA y diagnóstico
```

---

## 17. Puente hacia la práctica final {#cierre}

Antes de dar por cerrado este bloque deberías poder responder:

```text
¿Qué es un ámbito?
¿Qué diferencia hay entre ámbito, exclusión y reserva?
¿Por qué una reserva depende de la MAC?
¿Por qué una reserva de Windows debe estar dentro del intervalo del ámbito?
¿Dónde veo las concesiones?
¿Cómo compruebo lo mismo con PowerShell?
¿Cuándo hay que autorizar DHCP en Active Directory?
¿Cómo compruebo si el problema está en el cliente, el ámbito o el servicio?
¿Qué conceptos son equivalentes entre Kea y Windows Server?
```
