---
title: "UT01 · DHCP en Windows Server 2022 y 2025"
description: "Segunda implementación de DHCPv4 de la UT01 de SER en Windows Server 2022/2025: ámbitos, exclusiones, reservas, bindings, PowerShell y diagnóstico; RRAS/NAT como ampliación."
summary: "Los mismos conceptos DHCP del RA1 administrados en Windows Server 2022 y 2025 mediante consola gráfica y PowerShell, con routing y NAT como ampliación de infraestructura."

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
last_reviewed: 2026-11-13
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
  - windows-server-2022
  - windows-server-2025
  - ambitos
  - exclusiones
  - reservas
  - bindings
  - leases
  - dora
  - powershell
  - rras
  - nat
  - wireshark
  - diagnostico
  - ra1

permalink: /docencia/smr/ser/ut01-windows/
published: true

toc:
  - title: Objetivo y RA1
    id: objetivo
  - title: Windows Server 2022 y 2025
    id: versiones
  - title: Laboratorio y topología
    id: topologia
  - title: Plan de direccionamiento
    id: direccionamiento
  - title: Preparar Windows Server
    id: preparar
  - title: Conceptos DHCP en Windows
    id: conceptos
  - title: Instalar DHCP Server
    id: dhcp
  - title: Ámbito y exclusiones
    id: ambito
  - title: Opciones de ámbito
    id: opciones
  - title: Bindings
    id: bindings
  - title: Clientes y concesiones
    id: clientes
  - title: Reservas
    id: reservas
  - title: DORA y Wireshark
    id: dora
  - title: PowerShell
    id: powershell
  - title: RRAS y NAT
    id: rras
  - title: Diagnóstico
    id: diagnostico
  - title: Kea vs Windows
    id: comparacion
  - title: Práctica integrada
    id: practica
  - title: Evidencias
    id: evidencias
  - title: Recursos
    id: recursos
  - title: Cierre
    id: cierre
---

## 1. Objetivo y relación con el RA1 {#objetivo}

Esta página es la **segunda implementación de la misma UT01**.

La primera se realiza con [DHCP y Kea en Debian 13]({{ '/docencia/smr/ser/ut01/' | relative_url }}). Aquí repetiremos los conceptos fundamentales en Windows Server para comprobar una idea importante:

> **El protocolo DHCP no cambia porque cambie el sistema operativo. Cambia la herramienta con la que lo administramos.**

En Kea hemos trabajado con:

```text
subnet4
pools
reservations
option-data
leases
logs
```

En Windows Server trabajaremos con:

```text
ámbitos
intervalos
exclusiones
reservas
opciones
concesiones
bindings
PowerShell
eventos
```

El objetivo no es memorizar dos tutoriales distintos. El objetivo es reconocer el **mismo servicio** en dos plataformas y ser capaz de:

```text
planificar
   ↓
instalar
   ↓
configurar
   ↓
probar
   ↓
capturar
   ↓
diagnosticar
   ↓
explicar
```

### Resultado de aprendizaje

**RA1 — Instala servicios de configuración dinámica, describiendo sus características y aplicaciones.**

En este bloque volvemos a trabajar el **RA1 completo**, pero aplicándolo a Windows Server 2022/2025.

| CE | Evidencia que podremos obtener |
|---|---|
| RA1.a | distinguir configuración manual y automática |
| RA1.b | justificar ventajas de DHCP |
| RA1.c | explicar DORA y sus mensajes |
| RA1.d | instalar el rol DHCP Server |
| RA1.e | crear y activar un ámbito funcional |
| RA1.f | comprobar concesiones y reservas |
| RA1.g | configurar opciones adicionales |
| RA1.h | demostrar la asignación con cliente, servidor y captura |

> **Regla de trabajo:** una captura de pantalla aislada no demuestra por sí sola que el servicio funcione. Buscaremos evidencias coherentes entre **cliente + servidor + protocolo**.

---

## 2. Windows Server 2022 y Windows Server 2025 {#versiones}

![Comparación entre Windows Server 2022 y Windows Server 2025]({{ '/assets/docencia/ser/ut01/windows/06_ws2022_vs_2025.svg' | relative_url }})

En el aula pueden aparecer **Windows Server 2022** y **Windows Server 2025**.

Para lo que trabajamos en esta unidad:

```text
DHCP Server
ámbitos
exclusiones
reservas
bindings
concesiones
PowerShell
RRAS / routing
```

el modelo administrativo es esencialmente el mismo.

No vamos a inventar diferencias donde no las hay.

### Situación de las versiones

A fecha de revisión de esta unidad:

| Versión | Situación |
|---|---|
| Windows Server 2022 | LTSC en soporte extendido |
| Windows Server 2025 | LTSC actual |

Microsoft mantiene soporte extendido de Windows Server 2022 hasta octubre de 2031 y de Windows Server 2025 hasta noviembre de 2034.

Para el laboratorio:

```text
WS2022 → válido
WS2025 → válido
```

Los pasos pueden presentar pequeñas diferencias visuales, pero los conceptos, objetos DHCP y cmdlets principales que utilizaremos son equivalentes.

> Cuando una captura de la web no coincida exactamente con tu pantalla, **no busques el mismo píxel**: identifica el objeto que estás administrando.

---

## 3. Laboratorio seguro y topología {#topologia}

![Topología completa de DHCP y RRAS/NAT]({{ '/assets/docencia/ser/ut01/windows/01_topologia_completa.svg' | relative_url }})

### 3.1. Máquinas

Escenario mínimo:

| Máquina | Sistema | Función |
|---|---|---|
| Servidor | Windows Server 2022 o 2025 | DHCP y, al final, RRAS/NAT |
| Cliente | Windows 11 | cliente DHCP |
| Cliente opcional | Debian 13 | segunda comprobación multiplataforma |

### 3.2. Dos NIC en el servidor

El servidor utilizará:

```text
NIC 1 → NAT de VirtualBox
NIC 2 → Red interna de VirtualBox
```

Las renombraremos como:

```text
WAN-NAT
LAN-INTERNA
```

La idea es:

```text
Internet
   │
VirtualBox NAT
   │
WAN-NAT
[ Windows Server ]
LAN-INTERNA
   │
Red interna
   │
Cliente
```

### 3.3. El cliente no tendrá NAT directo

Esto es importante.

El cliente debe conectarse únicamente a:

```text
LAN-INTERNA
```

No le añadas una segunda tarjeta NAT para «hacer que tenga Internet».

Si lo haces:

```text
cliente
 ├─ LAN-INTERNA
 └─ NAT directo
```

ya no podrás demostrar que la salida se realiza realmente a través de Windows Server.

### 3.4. Seguridad del laboratorio

No uses:

```text
Adaptador puente
```

para la NIC que ejecutará DHCP.

Un servidor DHCP de prácticas conectado por error a la red física del centro puede responder a equipos que no pertenecen a tu laboratorio.

Utiliza:

```text
NAT
+
Red interna
```

y comprueba el nombre de la red interna antes de encender el servicio.

---

## 4. Plan de direccionamiento antes de configurar {#direccionamiento}

No empieces el asistente de Windows Server sin saber qué direcciones vas a utilizar.

### 4.1. Ejemplo didáctico

Utilizaremos este ejemplo únicamente para aprender el procedimiento:

```text
Red LAN            192.168.150.0/24
Servidor LAN       192.168.150.1
Ámbito total       192.168.150.20 - 192.168.150.220

Exclusión 1        192.168.150.20 - 192.168.150.79
Dinámicas          192.168.150.80 - 192.168.150.179
Exclusión 2        192.168.150.180 - 192.168.150.220
```

No copies estos valores en una tarea evaluable salvo que el profesor indique expresamente esa red.

### 4.2. Número máximo de equipos

En las prácticas podrá aparecer:

```text
M → número máximo de equipos
```

Si:

```text
M = 25
```

el intervalo dinámico debe disponer de **al menos 25 direcciones utilizables simultáneamente**.

No significa:

```text
terminar en .25
```

Significa:

```text
capacidad del pool >= M
```

### 4.3. Individualización sin fijar el tamaño del aula

Podremos utilizar:

```text
P → identificador de puesto asignado
M → número máximo de equipos exigido
V → versión de Windows Server asignada
```

La unidad **no presupone un número fijo de puestos en el aula**.

El enunciado de cada práctica proporcionará o permitirá derivar:

```text
red
capacidad mínima
duración de lease
versión de Windows Server
requisito de reserva
incidencia
```

El alumno deberá decidir razonadamente:

```text
IP del servidor
intervalo del ámbito
exclusiones
zona dinámica
IP reservada
pruebas necesarias
```

### 4.4. Qué debe quedar fuera de la asignación dinámica

Reserva zonas para:

```text
servidor
gateway
infraestructura
reservas
crecimiento
```

No diseñes un ámbito únicamente pensando en «que funcione hoy».

---

## 5. Preparar Windows Server y las interfaces {#preparar}

### 5.1. Crear o preparar la VM

Recomendación inicial:

```text
Windows Server 2022 o 2025
Standard / Datacenter
Desktop Experience
2 vCPU
4 GB RAM
60 GB disco dinámico
```

Utiliza la ISO facilitada por el centro o un medio de evaluación/licenciado válido.

Una vez instalado el sistema:

```text
1. inicia sesión como Administrador
2. instala las Guest Additions si procede
3. aplica las actualizaciones necesarias
4. apaga la VM
5. configura las dos NIC en VirtualBox
```

### 5.2. VirtualBox

Configuración:

```text
Adaptador 1
→ NAT

Adaptador 2
→ Red interna
→ nombre: SER-WIN-PXX
```

El nombre concreto de la red interna será el indicado en la práctica.

Crea snapshot:

```text
20_WIN_BASE
```

### 5.3. Identificar las NIC

En Windows Server:

```text
Windows + R
→ ncpa.cpl
→ Enter
```

No supongas:

```text
Ethernet = NAT
Ethernet 2 = LAN
```

Puede ser al revés.

Comprueba primero las MAC.

PowerShell como administrador:

```powershell
Get-NetAdapter |
    Format-Table Name, InterfaceDescription, MacAddress, Status
```

En VirtualBox comprueba también las direcciones MAC de cada adaptador.

### 5.4. Renombrarlas

En `ncpa.cpl`:

```text
NIC conectada a NAT
→ WAN-NAT

NIC conectada a Red interna
→ LAN-INTERNA
```

Comprueba:

```powershell
Get-NetAdapter
```

Resultado esperado:

```text
WAN-NAT        Up
LAN-INTERNA    Up
```

### 5.5. Configurar la LAN con IPv4 estática por GUI

Trabaja sobre:

```text
LAN-INTERNA
```

No sobre `WAN-NAT`.

Ruta:

```text
ncpa.cpl
→ LAN-INTERNA
→ botón derecho
→ Propiedades
→ Protocolo de Internet versión 4 (TCP/IPv4)
→ Propiedades
→ Usar la siguiente dirección IP
```

Con el ejemplo didáctico:

```text
IP                  192.168.150.1
Máscara             255.255.255.0
Puerta de enlace    dejar en blanco
DNS                 dejar en blanco en esta fase
```

¿Por qué sin gateway en LAN?

Porque la **ruta por defecto debe salir por WAN-NAT**, no por la red interna.

### 5.6. Comprobar desde PowerShell

```powershell
Get-NetIPConfiguration
Get-NetIPAddress -AddressFamily IPv4
Get-NetRoute -AddressFamily IPv4
```

Comprueba específicamente:

```powershell
Get-NetRoute -DestinationPrefix "0.0.0.0/0"
```

Esperamos que la ruta por defecto corresponda a `WAN-NAT`.

### 5.7. Comprobar Internet desde el servidor

Antes de instalar RRAS debemos demostrar que **el propio servidor** puede salir por su WAN.

```powershell
Resolve-DnsName www.microsoft.com
Test-NetConnection www.microsoft.com -Port 443
```

Si el servidor no tiene conectividad exterior, no tiene sentido culpar después a RRAS.

### 5.8. Persistencia

Reinicia Windows Server.

Después:

```powershell
Get-NetIPConfiguration
Get-NetRoute -DestinationPrefix "0.0.0.0/0"
```

La IP de `LAN-INTERNA` debe seguir presente.

Crea snapshot:

```text
21_WIN_RED_OK
```

---

## 6. Conceptos DHCP en Windows Server {#conceptos}

### 6.1. Ámbito

Un **ámbito** es la configuración DHCP asociada a una subred.

Incluye:

```text
intervalo
máscara
lease
exclusiones
opciones
reservas
```

### 6.2. Intervalo del ámbito

Es el intervalo completo administrado por el ámbito.

Ejemplo:

```text
192.168.150.20
        ↓
192.168.150.220
```

### 6.3. Exclusión

Una exclusión pertenece al intervalo del ámbito pero Windows DHCP **no la entrega dinámicamente**.

Se utiliza para proteger:

```text
infraestructura
servidores
routers
reservas
crecimiento
```

### 6.4. Reserva

Una reserva vincula:

```text
MAC / Client ID
        ↓
IPv4 determinada
```

El cliente sigue configurado en:

```text
obtener dirección automáticamente
```

### 6.5. Concesión

Una concesión o lease representa una asignación DHCP real:

```text
cliente
+
dirección
+
identificador
+
tiempo
```

### 6.6. Opciones

DHCP puede entregar, además de IP y máscara:

```text
003 → router / gateway
006 → DNS
015 → dominio
051 → duración de lease
```

### 6.7. Binding

Un servidor con varias NIC debe saber **en qué interfaces debe escuchar DHCP**.

Eso es lo que comprobaremos mediante los bindings.

---

## 7. Instalar DHCP Server {#dhcp}

### 7.1. Prerrequisitos

Antes:

```text
☐ LAN-INTERNA tiene IP estática
☐ WAN-NAT funciona
☐ servidor y cliente están aislados de la red física
☐ existe plan de direccionamiento
```

### 7.2. Instalación gráfica

En Windows Server:

```text
Administrador del servidor
→ Administrar
→ Agregar roles y características
```

Selecciona:

```text
Instalación basada en características o en roles
→ servidor local
→ Servidor DHCP
→ Agregar características
→ Siguiente
→ Instalar
```

Al finalizar, no cierres el proceso sin leer el resultado.

### 7.3. PowerShell equivalente

Abre PowerShell como administrador:

```powershell
Install-WindowsFeature DHCP -IncludeManagementTools
```

Comprueba:

```powershell
Get-WindowsFeature DHCP
Get-Service DHCPServer
```

Resultado esperado:

```text
DHCP Server → Installed
DHCPServer  → Running
```

Si el servicio no está iniciado:

```powershell
Start-Service DHCPServer
```

### 7.4. ¿Hay que autorizar el servidor?

Depende del entorno.

#### Grupo de trabajo

Si el servidor **no pertenece a un dominio Active Directory**:

```text
NO ejecutes Add-DhcpServerInDC
```

Microsoft indica expresamente que ese comando no debe utilizarse si no existe entorno de dominio.

En este laboratorio de SER trabajaremos primero en:

```text
workgroup / grupo de trabajo
```

#### Dominio Active Directory

En un dominio, un servidor DHCP debe estar autorizado.

Ejemplo profesional:

```powershell
Add-DhcpServerInDC `
    -DnsName DHCP1.ejemplo.test `
    -IPAddress 192.168.150.1

Get-DhcpServerInDC
```

No ejecutes ese ejemplo en el laboratorio independiente.

---

## 8. Crear el ámbito y las exclusiones {#ambito}

![Ámbito, exclusiones y reserva]({{ '/assets/docencia/ser/ut01/windows/03_ambito_exclusion_reserva.svg' | relative_url }})

### 8.1. Abrir la consola DHCP

```text
Administrador del servidor
→ Herramientas
→ DHCP
```

Despliega:

```text
servidor
→ IPv4
```

### 8.2. Nuevo ámbito

Botón derecho:

```text
IPv4
→ Nuevo ámbito...
```

El asistente solicitará:

```text
nombre
intervalo
máscara
exclusiones
duración de concesión
opciones
activación
```

### 8.3. Ejemplo guiado

Nombre:

```text
SER-LAB
```

Intervalo:

```text
Inicio    192.168.150.20
Fin       192.168.150.220
Máscara   255.255.255.0
```

Exclusiones:

```text
192.168.150.20 - 192.168.150.79
192.168.150.180 - 192.168.150.220
```

Queda dinámico:

```text
192.168.150.80 - 192.168.150.179
```

### 8.4. ¿Por qué un ámbito más amplio que el rango dinámico?

Porque Windows diferencia:

```text
intervalo total del ámbito
        ≠
direcciones que realmente se entregan dinámicamente
```

Las exclusiones retiran direcciones de la asignación ordinaria.

### 8.5. Lease

Para laboratorio podemos utilizar una duración corta que permita observar renovaciones.

Ejemplo didáctico:

```text
30 minutos
```

En una red real no copiaríamos automáticamente ese valor.

La duración depende de:

```text
movilidad de clientes
cantidad de direcciones
estabilidad de la red
tipo de dispositivo
política de administración
```

### 8.6. PowerShell equivalente

Crear ámbito:

```powershell
Add-DhcpServerv4Scope `
    -Name "SER-LAB" `
    -StartRange 192.168.150.20 `
    -EndRange 192.168.150.220 `
    -SubnetMask 255.255.255.0 `
    -LeaseDuration (New-TimeSpan -Minutes 30)
```

Crear exclusiones:

```powershell
Add-DhcpServerv4ExclusionRange `
    -ScopeId 192.168.150.0 `
    -StartRange 192.168.150.20 `
    -EndRange 192.168.150.79
```

```powershell
Add-DhcpServerv4ExclusionRange `
    -ScopeId 192.168.150.0 `
    -StartRange 192.168.150.180 `
    -EndRange 192.168.150.220
```

Consultar:

```powershell
Get-DhcpServerv4Scope
Get-DhcpServerv4ExclusionRange -ScopeId 192.168.150.0
```

> **No mezcles métodos sin control.** Si has creado el ámbito mediante GUI, usa PowerShell primero para **consultar**. No vuelvas a crear el mismo ámbito mediante cmdlet.

---

## 9. Opciones de ámbito {#opciones}

![DHCP no es Internet: relación entre DHCP, RRAS y NAT]({{ '/assets/docencia/ser/ut01/windows/02_dhcp_rras_nat.svg' | relative_url }})

### 9.1. DHCP no crea Internet

Un cliente puede recibir perfectamente:

```text
IP
máscara
gateway
DNS
```

y aun así no poder salir de la LAN.

DHCP **anuncia parámetros**.

No activa:

```text
routing
NAT
DNS
Internet
```

### 9.2. Primera fase: DHCP aislado

Antes de configurar RRAS/NAT, podemos trabajar únicamente con:

```text
IP
máscara
lease
reserva
```

En esa fase:

```text
opción 003 → no inventar
opción 006 → no inventar
```

### 9.3. Segunda fase: servidor como gateway

Cuando RRAS/NAT esté realmente funcionando:

```text
opción 003
→ IP de LAN-INTERNA del servidor
```

En el ejemplo:

```text
003 Router
→ 192.168.150.1
```

PowerShell:

```powershell
Set-DhcpServerv4OptionValue `
    -ScopeId 192.168.150.0 `
    -Router 192.168.150.1
```

### 9.4. DNS

Configura la opción 006 únicamente cuando sepas qué servidor DNS debe utilizar la práctica.

Ejemplo conceptual:

```powershell
Set-DhcpServerv4OptionValue `
    -ScopeId 192.168.150.0 `
    -DnsServer IP_DNS_VALIDO
```

No copies un DNS al azar únicamente para rellenar el asistente.

### 9.5. Comprobar opciones

```powershell
Get-DhcpServerv4OptionValue `
    -ScopeId 192.168.150.0
```

---

## 10. Bindings: DHCP solo en la NIC correcta {#bindings}

El servidor tiene dos NIC:

```text
WAN-NAT
LAN-INTERNA
```

No queremos que DHCP atienda clientes a través de la WAN.

### 10.1. Consultar

```powershell
Get-DhcpServerv4Binding
```

Resultado esperado:

```text
LAN-INTERNA   True
WAN-NAT       False
```

El nombre exacto de la columna puede variar según el formato de salida.

### 10.2. Corregir

```powershell
Set-DhcpServerv4Binding `
    -InterfaceAlias "LAN-INTERNA" `
    -BindingState $true
```

```powershell
Set-DhcpServerv4Binding `
    -InterfaceAlias "WAN-NAT" `
    -BindingState $false
```

Después:

```powershell
Get-DhcpServerv4Binding
```

### 10.3. Por qué importa

Un DHCP activo en una interfaz equivocada puede provocar:

```text
respuestas donde no corresponden
confusión de clientes
incidencias difíciles de interpretar
```

Por eso el binding forma parte de nuestro diagnóstico básico.

---

## 11. Clientes y concesiones {#clientes}

### 11.1. Cliente Windows 11

En VirtualBox:

```text
Adaptador
→ Red interna
→ misma red interna que LAN-INTERNA
```

No añadas NAT al cliente.

En Windows 11:

```text
IPv4
→ Obtener una dirección IP automáticamente
→ Obtener DNS automáticamente
```

Abre CMD:

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

### 11.2. Qué esperamos antes de RRAS

En la fase DHCP aislada:

```text
IPv4 del pool          ✅
máscara                ✅
servidor DHCP          ✅
lease                  ✅
gateway                puede estar vacío
Internet               no es requisito todavía
```

### 11.3. Cliente Debian 13

Con NetworkManager:

```bash
nmcli device status
nmcli connection show
```

Comprueba parámetros:

```bash
ip -br address
ip route
nmcli -f GENERAL,IP4,DHCP4 device show INTERFAZ
```

Si necesitas renovar la conexión:

```bash
nmcli connection down "NOMBRE_CONEXION"
nmcli connection up "NOMBRE_CONEXION"
```

No copies `NOMBRE_CONEXION`: utiliza el nombre real.

### 11.4. Ver concesiones en Windows Server

GUI:

```text
DHCP
→ IPv4
→ Ámbito
→ Concesiones de direcciones
```

PowerShell:

```powershell
Get-DhcpServerv4Lease `
    -ScopeId 192.168.150.0
```

Estadísticas:

```powershell
Get-DhcpServerv4ScopeStatistics
```

El cliente y el servidor deben contar la misma historia.

---

## 12. Reservas por MAC / Client ID {#reservas}

Una reserva significa:

```text
mismo cliente
      ↓
misma IP DHCP
```

El cliente **no** se configura manualmente.

### 12.1. Obtener el identificador

En Windows:

```bat
ipconfig /all
```

Busca la dirección física de la NIC conectada a la LAN.

También puedes comprobar la concesión desde el servidor.

### 12.2. Crear desde una lease existente

En la consola:

```text
Ámbito
→ Concesiones de direcciones
→ botón derecho sobre el cliente
→ Agregar a reserva
```

Es una buena opción para reducir errores al copiar la MAC.

### 12.3. Crear manualmente

```text
Ámbito
→ Reservas
→ Nueva reserva
```

Necesitas:

```text
nombre
IPv4
MAC / Client ID
descripción opcional
```

### 12.4. Regla importante de Windows

La dirección reservada debe pertenecer al **intervalo del ámbito**.

Puede estar dentro de una zona excluida de asignación dinámica.

Por eso podemos diseñar:

```text
Ámbito total
192.168.150.20 - 192.168.150.220

Exclusión
192.168.150.20 - 192.168.150.79

Reserva
192.168.150.70
```

La dirección `.70`:

```text
no se entrega al azar
        +
sí puede ser entregada al cliente reservado
```

### 12.5. PowerShell

```powershell
Add-DhcpServerv4Reservation `
    -ScopeId 192.168.150.0 `
    -IPAddress 192.168.150.70 `
    -ClientId "001122334455" `
    -Description "Cliente reservado"
```

Consultar:

```powershell
Get-DhcpServerv4Reservation `
    -ScopeId 192.168.150.0
```

### 12.6. Probar de verdad

En el cliente:

```bat
ipconfig /release
ipconfig /renew
ipconfig /all
```

No basta con ver la reserva creada en la consola.

Debes demostrar que el cliente correcto recibe la IP esperada.

---

## 13. DORA y Wireshark {#dora}

![Secuencia DORA]({{ '/assets/docencia/ser/ut01/windows/04_dora.svg' | relative_url }})

No necesitamos volver a memorizar DORA desde cero.

Necesitamos **reconocerlo en una captura real**.

### 13.1. Captura

Inicia Wireshark en la NIC del cliente conectada a `LAN-INTERNA`.

Filtro de visualización:

```text
dhcp
```

Si tu versión de Wireshark lo requiere también puedes comprobar:

```text
bootp
```

Después fuerza una renovación:

```bat
ipconfig /release
ipconfig /renew
```

### 13.2. Mensajes

Busca:

```text
DHCPDISCOVER
DHCPOFFER
DHCPREQUEST
DHCPACK
```

### 13.3. Datos que debes relacionar

No entregues cuatro paquetes sin analizarlos.

Relaciona:

```text
MAC cliente
      ↓
Discover
      ↓
Offer
      ↓
IP propuesta
      ↓
Request
      ↓
Server Identifier
      ↓
ACK
      ↓
lease en Windows Server
```

Observa especialmente:

```text
Option 53 → tipo de mensaje
Option 54 → servidor DHCP
yiaddr    → dirección ofrecida/asignada
Client Identifier / chaddr
lease time
```

### 13.4. Triangulación

La misma IP debe aparecer coherentemente en:

```text
ipconfig /all
concesión del servidor
captura DORA
```

Si no coincide, no des por terminada la práctica.

---

## 14. PowerShell: administrar, no memorizar {#powershell}

PowerShell no sustituye al razonamiento.

Su objetivo es permitir:

```text
consultar
automatizar
repetir
comparar
diagnosticar
```

### 14.1. Sistema y red

```powershell
Get-NetAdapter
Get-NetIPConfiguration
Get-NetIPAddress -AddressFamily IPv4
Get-NetRoute -AddressFamily IPv4
```

Ruta por defecto:

```powershell
Get-NetRoute -DestinationPrefix "0.0.0.0/0"
```

### 14.2. Rol y servicio

```powershell
Get-WindowsFeature DHCP
Get-Service DHCPServer
```

### 14.3. Ámbitos

```powershell
Get-DhcpServerv4Scope
```

Crear:

```powershell
Add-DhcpServerv4Scope `
    -Name "SER-LAB" `
    -StartRange 192.168.150.20 `
    -EndRange 192.168.150.220 `
    -SubnetMask 255.255.255.0 `
    -LeaseDuration (New-TimeSpan -Minutes 30)
```

### 14.4. Exclusiones

```powershell
Get-DhcpServerv4ExclusionRange `
    -ScopeId 192.168.150.0
```

Crear:

```powershell
Add-DhcpServerv4ExclusionRange `
    -ScopeId 192.168.150.0 `
    -StartRange 192.168.150.20 `
    -EndRange 192.168.150.79
```

### 14.5. Opciones

```powershell
Get-DhcpServerv4OptionValue `
    -ScopeId 192.168.150.0
```

### 14.6. Bindings

```powershell
Get-DhcpServerv4Binding
```

### 14.7. Concesiones

```powershell
Get-DhcpServerv4Lease `
    -ScopeId 192.168.150.0
```

### 14.8. Reservas

```powershell
Get-DhcpServerv4Reservation `
    -ScopeId 192.168.150.0
```

### 14.9. Estadísticas

```powershell
Get-DhcpServerv4ScopeStatistics
```

### 14.10. Activar o desactivar ámbito

```powershell
Set-DhcpServerv4Scope `
    -ScopeId 192.168.150.0 `
    -State Active
```

```powershell
Set-DhcpServerv4Scope `
    -ScopeId 192.168.150.0 `
    -State InActive
```

> El objetivo no es memorizar todos estos cmdlets. Debes saber **qué objeto necesitas consultar o modificar** y ser capaz de encontrar la sintaxis correcta.

---

## 15. RRAS y NAT: hacer del servidor un gateway {#rras}

![Relación entre DHCP, RRAS y NAT]({{ '/assets/docencia/ser/ut01/windows/02_dhcp_rras_nat.svg' | relative_url }})

Hasta este punto podemos tener un DHCP perfecto y, aun así:

```text
cliente → sin Internet
```

Eso no implica que DHCP esté mal.

### 15.1. Separar responsabilidades

```text
DHCP
→ entrega configuración

Routing / RRAS
→ reenvía paquetes entre interfaces

NAT
→ traduce direcciones de la LAN al salir por WAN
```

En nuestro escenario:

```text
Cliente
192.168.150.x
      │
      ▼
192.168.150.1
LAN-INTERNA
[ Windows Server ]
WAN-NAT
      │
      ▼
VirtualBox NAT
      │
      ▼
Internet
```

### 15.2. Antes de RRAS

Debes demostrar:

```text
Servidor WAN tiene Internet             ✅
Servidor LAN tiene IP fija              ✅
Solo existe una ruta por defecto útil   ✅
DHCP funciona                           ✅
Cliente recibe IP                       ✅
Cliente aparece en leases               ✅
```

No instales RRAS para ocultar un problema previo.

### 15.3. Instalar Remote Access / Routing por GUI

En:

```text
Administrador del servidor
→ Administrar
→ Agregar roles y características
```

Selecciona:

```text
Acceso remoto
→ Servicios de rol
→ Enrutamiento
```

Instala las características requeridas.

Microsoft documenta el servicio de enrutamiento de Remote Access para Windows Server 2022 y 2025.

### 15.4. Alternativa PowerShell para routing

Como administrador:

```powershell
Install-WindowsFeature RemoteAccess `
    -IncludeManagementTools
```

Después:

```powershell
Install-RemoteAccess -VpnType RoutingOnly
```

Comprueba:

```powershell
Get-Service RemoteAccess
```

> En esta UT utilizaremos la consola gráfica para configurar NAT porque permite visualizar mejor qué interfaz es pública y cuál es privada.

### 15.5. Configurar RRAS/NAT

Abre:

```text
Administrador del servidor
→ Herramientas
→ Enrutamiento y acceso remoto
```

En el nombre del servidor:

```text
botón derecho
→ Configurar y habilitar Enrutamiento y acceso remoto
```

Selecciona la configuración de:

```text
NAT
```

Identifica:

```text
WAN-NAT
→ interfaz pública
→ habilitar NAT

LAN-INTERNA
→ interfaz privada
```

No intercambies los papeles.

### 15.6. Comprobar servicio

```powershell
Get-Service RemoteAccess
```

Debe estar operativo.

También vuelve a comprobar:

```powershell
Get-NetAdapter
Get-NetIPConfiguration
Get-NetRoute -AddressFamily IPv4
```

### 15.7. Ahora sí: Option 003

Cuando Windows Server esté actuando realmente como router para la LAN:

```text
gateway de clientes
→ IP LAN del servidor
```

Ejemplo:

```text
192.168.150.1
```

Configura la opción 003.

PowerShell:

```powershell
Set-DhcpServerv4OptionValue `
    -ScopeId 192.168.150.0 `
    -Router 192.168.150.1
```

Después renueva el cliente:

```bat
ipconfig /release
ipconfig /renew
ipconfig /all
```

### 15.8. DNS

La salida IP y la resolución de nombres son pruebas distintas.

Comprueba primero que el cliente recibió un DNS válido.

Después:

```powershell
Resolve-DnsName www.microsoft.com
```

Y una aplicación real:

```powershell
Test-NetConnection www.microsoft.com -Port 443
```

### 15.9. Orden correcto de comprobación

```text
1. cliente recibe IP
2. cliente recibe máscara
3. cliente recibe gateway
4. cliente llega al gateway
5. servidor tiene salida WAN
6. RRAS está activo
7. NAT está configurado
8. cliente puede salir
9. DNS resuelve
10. TCP/HTTPS funciona
```

No saltes directamente al navegador.

---

## 16. Diagnóstico por capas {#diagnostico}

![Diagnóstico por capas]({{ '/assets/docencia/ser/ut01/windows/05_diagnostico.svg' | relative_url }})

Cuando algo falla:

```text
NO cambies cinco cosas a la vez
```

Sigue una escalera.

### 16.1. Capa 1 · VirtualBox

Comprueba:

```text
servidor WAN → NAT
servidor LAN → Red interna correcta
cliente      → misma Red interna
cliente      → sin NAT directo
```

### 16.2. Capa 2 · Servidor

```powershell
Get-NetAdapter
Get-NetIPConfiguration
Get-NetRoute -DestinationPrefix "0.0.0.0/0"
```

Preguntas:

```text
¿WAN está Up?
¿LAN está Up?
¿LAN tiene IP fija?
¿hay una sola ruta por defecto coherente?
```

### 16.3. Capa 3 · DHCP

```powershell
Get-Service DHCPServer
Get-DhcpServerv4Binding
Get-DhcpServerv4Scope
Get-DhcpServerv4ScopeStatistics
```

Comprueba:

```text
servicio Running
binding LAN True
binding WAN False
ámbito Active
direcciones disponibles
```

### 16.4. Capa 4 · Cliente

Windows:

```bat
ipconfig /all
```

Si aparece:

```text
169.254.x.x
```

es una dirección APIPA.

No significa «Windows está roto».

Pregunta:

```text
¿el cliente envió Discover?
¿recibió Offer?
```

### 16.5. Capa 5 · DORA

Wireshark:

```text
dhcp
```

Casos:

```text
Discover pero no Offer
→ revisar servidor, binding, ámbito, aislamiento

Offer pero no ACK
→ revisar Request, conflicto, configuración

ACK correcto
→ DHCP probablemente funciona
```

### 16.6. Capa 6 · Reserva

Comprueba:

```powershell
Get-DhcpServerv4Reservation `
    -ScopeId RED
```

Después compara:

```text
MAC real
vs
Client ID configurado
```

### 16.7. Capa 7 · RRAS/NAT

Si DHCP funciona pero no hay salida:

```powershell
Get-Service RemoteAccess
Get-NetRoute -AddressFamily IPv4
```

Comprueba en la consola RRAS:

```text
WAN-NAT → pública / NAT
LAN-INTERNA → privada
```

### 16.8. Capa 8 · DNS y aplicación

Si hay conectividad IP pero no nombres:

```powershell
Resolve-DnsName www.microsoft.com
```

Si DNS funciona:

```powershell
Test-NetConnection www.microsoft.com -Port 443
```

Separar estas pruebas evita confundir:

```text
DHCP
routing
NAT
DNS
HTTP/HTTPS
```

### 16.9. Eventos DHCP

Abre:

```text
Visor de eventos
→ Registros de aplicaciones y servicios
→ Microsoft
→ Windows
→ DHCP-Server
```

Busca especialmente los canales disponibles de:

```text
Admin
Operational
Audit
```

### 16.10. Logs DHCP

Directorio habitual:

```text
%windir%\System32\Dhcp
```

No borres logs como primera estrategia de diagnóstico.

---

## 17. Kea vs Windows Server {#comparacion}

| Concepto | Debian + Kea | Windows Server 2022/2025 |
|---|---|---|
| Servicio | `kea-dhcp4-server` | DHCP Server |
| Red | `subnet4` | ámbito |
| Dinámicas | `pools` | intervalo + exclusiones |
| No asignar dinámicamente | fuera del pool | exclusión |
| Reserva | `reservations` | reserva |
| Identidad | client-id / MAC | Client ID / MAC |
| Opciones | `option-data` | Scope Options |
| Concesiones | memfile / CSV | Address Leases |
| Escucha por NIC | `interfaces-config` | bindings |
| CLI | JSON + utilidades | PowerShell |
| Validación | `kea-dhcp4 -t` | cmdlets + servicio + eventos |
| Captura | tcpdump / Wireshark | Wireshark |

### 17.1. Lo que no cambia

```text
broadcast inicial
UDP 67/68
DORA
lease
reserva
opciones
cliente automático
```

### 17.2. Lo que sí cambia

```text
modelo de configuración
herramienta de administración
forma de excluir direcciones
logs y eventos
automatización
```

### 17.3. Conclusión profesional

Si solo sabes seguir:

```text
clic aquí
clic allí
```

has aprendido un tutorial.

Si sabes traducir:

```text
subnet4 ↔ ámbito
pool ↔ intervalo dinámico
reservation ↔ reserva
option-data ↔ opciones
leases ↔ concesiones
```

has aprendido el servicio.

---

## 18. Práctica integrada individualizada {#practica}

Después del laboratorio guiado realizarás **una práctica única** que integra DHCP, diagnóstico y, cuando se solicite, RRAS/NAT.

### 18.1. Datos que proporciona el profesor

Cada alumno recibirá una combinación de:

```text
V → Windows Server 2022 o 2025
red de laboratorio
M → número máximo de equipos
duración de lease
requisito de reserva
opciones necesarias
incidencia
RRAS/NAT → requerido o no
```

No se fija en esta web un número concreto de puestos.

### 18.2. Fase A · Infraestructura

Debes demostrar:

```text
dos NIC correctamente identificadas
WAN-NAT funcional
LAN-INTERNA estática
una única ruta por defecto coherente
cliente solo conectado a LAN
```

### 18.3. Fase B · DHCP

Debes decidir:

```text
intervalo total
exclusiones
zona dinámica
lease
activación
```

La zona dinámica deberá cumplir:

```text
capacidad >= M
```

### 18.4. Fase C · Reserva

Debes:

```text
identificar el cliente
crear una reserva
renovar
demostrar que recibe la IP reservada
```

### 18.5. Fase D · Protocolo

Captura DORA.

Relaciona:

```text
MAC
mensaje
IP
servidor DHCP
lease
reserva
```

### 18.6. Fase E · PowerShell y binding

Debes demostrar con PowerShell, como mínimo:

```text
NIC
rutas
binding
ámbito
exclusiones
concesiones
reservas
estadísticas
```

### 18.7. Fase F · RRAS/NAT

Cuando forme parte de tu variante:

```text
instalar routing
configurar NAT
activar gateway real mediante Option 003
probar salida
probar DNS
probar TCP 443
```

### 18.8. Fase G · Incidencia

Se proporcionará un fallo o requisito que **no tendrá necesariamente la misma solución que el de otro alumno**.

Ejemplos de familias de incidencia:

```text
binding incorrecto
ámbito inactivo
pool insuficiente
exclusión equivocada
reserva con MAC errónea
gateway anunciado antes de existir
cliente en otra red interna
WAN/LAN intercambiadas
RRAS/NAT incompleto
DNS incorrecto
```

No recibirás una lista cerrada de clics para esta fase.

Debes:

```text
formular hipótesis
obtener evidencia
corregir
volver a comprobar
explicar
```

---

## 19. Evidencias de aprendizaje {#evidencias}

![Triángulo de evidencias: cliente, servidor y DORA]({{ '/assets/docencia/ser/ut01/windows/07_evidencias.svg' | relative_url }})

Una evidencia sólida debe relacionar tres puntos:

```text
CLIENTE
   ↘
    coherencia
   ↗
SERVIDOR ←→ PROTOCOLO
```

### 19.1. Evidencias mínimas

#### Infraestructura

```text
Get-NetAdapter
Get-NetIPConfiguration
Get-NetRoute -DestinationPrefix "0.0.0.0/0"
```

#### DHCP

```text
rol instalado
servicio Running
binding correcto
ámbito activo
exclusiones
```

#### Cliente

```text
ipconfig /all
o equivalente Linux
```

#### Concesión

```powershell
Get-DhcpServerv4Lease -ScopeId RED
```

#### Reserva

```powershell
Get-DhcpServerv4Reservation -ScopeId RED
```

#### Protocolo

Captura con:

```text
Discover
Offer
Request
ACK
```

#### Diagnóstico

Debes poder explicar:

```text
qué comprobaste
qué observaste
qué hipótesis formulaste
qué cambiaste
qué evidencia demuestra la solución
```

### 19.2. Si trabajas RRAS/NAT

Añade:

```text
RRAS operativo
WAN pública
LAN privada
gateway DHCP correcto
cliente sale por servidor
DNS funciona
TCP 443 funciona
```

### 19.3. Una captura no es una explicación

Evita entregas del tipo:

```text
captura1.png
captura2.png
captura3.png
```

sin indicar qué demuestra cada una.

Una evidencia profesional debe responder:

```text
¿Qué afirmación estoy demostrando?
¿Qué dato de la captura lo prueba?
¿Con qué otra evidencia lo relaciono?
```

---

## 20. Recursos y documentación oficial {#recursos}

### DHCP

- [Microsoft Learn · Instalar y configurar DHCP Server](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/quickstart-install-configure-dhcp-server)
- [Microsoft Learn · Ámbitos DHCP](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/dhcp-scopes)
- [Microsoft Learn · DHCP con PowerShell](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/dhcp-deploy-wps)
- [Microsoft Learn · `Get-DhcpServerv4Binding`](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/get-dhcpserverv4binding?view=windowsserver2025-ps)
- [Microsoft Learn · `Set-DhcpServerv4Binding`](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/set-dhcpserverv4binding?view=windowsserver2025-ps)
- [Microsoft Learn · diagnóstico DHCP](https://learn.microsoft.com/es-es/troubleshoot/windows-server/networking/troubleshoot-dhcp-guidance)

### Windows Server

- [Microsoft Learn · información de versiones de Windows Server](https://learn.microsoft.com/es-es/windows/release-health/windows-server-release-info)
- [Microsoft Lifecycle · Windows Server 2022](https://learn.microsoft.com/es-es/lifecycle/products/windows-server-2022/)
- [Microsoft Lifecycle · Windows Server 2025](https://learn.microsoft.com/es-es/lifecycle/products/windows-server-2025)

### RRAS / Routing

- [Microsoft Learn · Remote Access](https://learn.microsoft.com/es-es/windows-server/remote/remote-access/remote-access)
- [Microsoft Learn · `Install-RemoteAccess`](https://learn.microsoft.com/es-es/powershell/module/remoteaccess/install-remoteaccess?view=windowsserver2025-ps)

### Herramientas

- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/)
- [Oracle VirtualBox · Networking](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/networkingdetails.html)

### Tutoriales complementarios

Estos recursos pueden servir como apoyo visual. La referencia de configuración de la unidad seguirá siendo la documentación oficial y las instrucciones del laboratorio.

- [Server World · DHCP en Windows Server 2025](https://www.server-world.info/en/note?os=Windows_Server_2025&p=dhcp&f=1)
- [RDR-IT · DHCP en Windows Server 2025](https://rdr-it.com/es/windows-server-2025-instalar-y-configurar-un-servidor-dhcp/)

---

## 21. Cierre {#cierre}

Antes de cerrar este bloque deberías poder responder sin mirar una receta:

```text
¿Qué cambia realmente entre Kea y Windows Server?

¿Qué diferencia hay entre:
ámbito,
intervalo,
exclusión,
reserva
y concesión?

¿Por qué una reserva sigue siendo DHCP?

¿Por qué el servidor tiene dos NIC?

¿Por qué LAN-INTERNA no debe tener una segunda ruta por defecto?

¿Qué es un binding?

¿Por qué queremos DHCP en LAN y no en WAN?

¿Cómo relacionas:
MAC,
DORA,
IP,
lease
y reserva?

¿Por qué un cliente puede recibir DHCP correctamente
y seguir sin Internet?

¿Qué hace RRAS?

¿Qué hace NAT?

¿Cuándo debe anunciarse Option 003?

¿Cómo distingues un problema de:
DHCP,
routing,
NAT,
DNS
o aplicación?

¿Qué diferencias prácticas relevantes encuentras
entre Windows Server 2022 y 2025 para esta UT?
```

La respuesta a la última pregunta debería ser prudente:

```text
Para este laboratorio:
mismo protocolo
mismos objetos DHCP
mismos cmdlets principales
misma lógica de diagnóstico

Cambian:
versión del sistema
ciclo de soporte
detalles visuales menores
```

Si eres capaz de configurar el servicio, obtener evidencias coherentes y diagnosticar una incidencia sin modificar cosas al azar, has alcanzado el objetivo de esta segunda implementación de la UT01.
