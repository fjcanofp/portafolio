---
title: UT01 · DHCP en Windows Server 2025
description: 'Segundo laboratorio obligatorio de DHCP: ámbitos, exclusiones, reservas, PowerShell, relay y diagnóstico
  en Windows Server 2025.'
summary: Administrar la misma política DHCP del RA2 con Windows Server, GUI y PowerShell.
module_key: sri
cycle_key: asir
order: 1.1
module_title: Servicios de Red e Internet
module_code: '0375'
cycle_title: Administración de Sistemas Informáticos en Red
course: 2.º ASIR
unit: UT01
hours: 8
level: intermedio
authors:
- fjcano
reviewers:
- fjcano
rights: all-rights-reserved
version: '2.0'
last_reviewed: '2026-09-23'
visibility: public
ra:
- RA2
ce:
- RA2.a
- RA2.b
- RA2.c
- RA2.d
- RA2.e
- RA2.f
- RA2.g
tags:
- dhcp
- windows-server
- powershell
- ambitos
- reservas
- relay
- diagnostico
permalink: /docencia/asir/sri/ut01-windows/
published: true
toc:
- title: Por qué Windows y Kea
  id: comparacion
- title: Instalación y NIC
  id: instalacion
- title: Variante individual
  id: individualizacion
- title: Rol DHCP
  id: rol
- title: Ámbito y reserva
  id: ambito-gui
- title: PowerShell
  id: powershell
- title: Clientes y DORA
  id: clientes
- title: Relay (ampliación)
  id: relay
- title: Copia y diagnóstico
  id: operacion
- title: Cierre y Moodle
  id: consolidacion
---

> **Segundo laboratorio obligatorio de la misma UT01 (RA2) · 2.º ASIR.** Aquí no se cambia el protocolo ni la competencia: cambia la plataforma de administración. Usaremos primero la consola DHCP para entender el modelo de objetos de Windows y después **PowerShell para construirlo, inventariarlo y operarlo de forma reproducible**.

Regresa a [UT01 · Kea y fundamentos DHCP]({{ "/docencia/asir/sri/ut01/" | relative_url }}). La UT02 del curso será DNS; por tanto, en esta primera pasada no suponemos DNS interno ya operativo.

## 1. Qué vas a demostrar (RA2) {#objetivos}

**RA2 oficial:** Administra servicios de configuración automática, identificándolos y verificando la correcta asignación de los parámetros.

| CE | Qué se debe comprender y verificar |
|---|---|
| **a)** | Comparación de configuración manual y automática, ventajas y riesgos |
| **b)** | PCAP DORA y tiempos interpretados; explicación de renovación |
| **c)** | Rol DHCP instalado, operativo, limitado a la NIC de laboratorio |
| **d)** | Ámbito activo y concesión en un cliente real |
| **e)** | Dirección dinámica y reserva por identidad real |
| **f)** | Opciones entregadas y segunda subred mediante relay |
| **g)** | Inventario, comandos, copia, tickets y procedimiento de recuperación |

## 2. Por qué dos plataformas {#comparacion}

| Misma necesidad | Debian + Kea | Windows Server |
|---|---|---|
| Instalar | `apt install kea-dhcp4-server` | Rol DHCP en Administrador del servidor o `Install-WindowsFeature` |
| Política | JSON `subnet4`, `pools`, `reservations` | ámbito, intervalo, exclusiones, reservas y opciones |
| Gestión repetible | fichero validado / herramientas Kea | cmdlets PowerShell `DhcpServer` |
| Servicio/estado | `systemctl`, `journalctl`, `ss` | `Get-Service`, consola DHCP, `Get-DhcpServerv4Lease`, eventos/logs |
| Respaldo | copia de configuración + leases/snapshot | `Backup-DhcpServer` y `Export-DhcpServer` |
| Identidad cliente | MAC/client-id, según configuración de Kea | ClientId de reserva, normalmente MAC para clientes Windows |

**No confundas diferencias de implementación con diferencias de protocolo.** DORA y los puertos UDP 67/68 son los mismos.

## 3. Requisitos y descarga {#requisitos}

- **Windows Server 2025 Standard Evaluation con Desktop Experience** (o licencia de centro compatible). No instales *Server Core* si se va a evaluar también GUI; *Core* se ofrece como ampliación PowerShell.
- VirtualBox compatible y virtualización por hardware habilitada.
- Sugerencia de VM: **2 vCPU, 4–6 GB RAM y disco virtual dinámico de 60 GB**; ajustar al hardware disponible.
- Un cliente Windows 11 y uno Debian 13; pueden usarse secuencialmente si el PC no puede arrancarlos todos a la vez.
- PowerShell elevado con privilegios de administrador local; sin dominio AD en la fase base.
- [ISO de evaluación Windows Server 2025 (Microsoft)](https://www.microsoft.com/es-es/evalcenter/evaluate-windows-server-2025). La evaluación tiene duración limitada y sus condiciones deben respetarse.
- [Manual VirtualBox](https://www.virtualbox.org/manual/).

### Advertencia de laboratorio

**Nunca conectes una NIC que sirva DHCP al modo puente de la red del centro.** La VM Windows tiene NIC1 NAT opcional para actualizaciones y NIC2 **Red Interna** `SRI-W-Pxx`, aislada de la red Linux `SRI-Pxx`. Desconecta NAT durante las capturas si no se necesita.

![Dos implementaciones DHCP en redes internas separadas]({{ "/assets/docencia/sri/ut01-windows/01_redes_separadas.svg" | relative_url }})

## 4. Variante Windows (misma dificultad, red distinta) {#individualizacion}

- `P` = puesto 1–40; `L` = inicial normalizada A=1…Z=26, como UT00.
- Servidor Windows: `wdhcp-pXX-lYY` (nombre NetBIOS corto).

| Parámetro | Fórmula Windows |
|---|---|
| Red interna | `SRI-W-Pxx` |
| LAN A Windows | `10.39.P.0/24` |
| IP estática servidor | `10.39.P.(20+L)` |
| Pool dinámico deseado | `. (100+P)` a `. (129+P)`, 30 direcciones |
| Reserva | `. (180+L)`, fuera del pool dinámico |
| Ámbito Windows inicial–final | `. (100+P)` a `. (180+L)` |
| Exclusión | `. (130+P)` a `. (180+L)` |
| Duración de lease | `1800+60×L` segundos |
| LAN B Windows | `10.40.P.0/24` |
| Relay LAN A / LAN B | `10.39.P.254` / `10.40.P.254` |
| Pool LAN B | `. (100+P)` a `. (129+P)` |

![Ámbito total, rango dinámico, exclusión y reserva en Windows]({{ "/assets/docencia/sri/ut01-windows/02_ambito_exclusion_reserva.svg" | relative_url }})

**Ejemplo P07-L03:** servidor `10.39.7.23/24`; ámbito `.107–.183`; exclusión `.137–.183`; reserva `.183`; distribución dinámica `.107–.136`; lease 1980 s; LAN B `10.40.7.0/24`.

> **Detalle técnico que debes entender:** Windows Server requiere que la IP reservada esté dentro del intervalo total del ámbito; admite que quede dentro de un tramo excluido de asignación dinámica. Por tanto, no crees el ámbito únicamente `.107–.136` e intentes reservar `.183`: fallará. Esta diferencia es una parte evaluable de la práctica. [Explicación oficial de Microsoft](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/cant-add-dhcp-reservation).

## 5. Puesta a punto de Windows Server, paso a paso {#instalacion}

1. Crea la VM con la ISO oficial. Selecciona **Desktop Experience** para disponer de consola gráfica.
2. Asigna NIC 1 NAT y NIC 2 **Red Interna `SRI-W-Pxx`**.
3. Completa instalación y configura contraseña de administrador de laboratorio.
4. Identifica tarjetas **por MAC y modo VirtualBox**, no solamente por el nombre `Ethernet`.
5. En *Conexiones de red* (ejecuta `ncpa.cpl`), renombra la NIC interna como `SRI-LAN`; comprueba que la NAT no se ha confundido con la NIC interna.
6. Configura IPv4 estática con tu fórmula, máscara `/24` y **sin gateway en la interna**. La salida por defecto, cuando exista, corresponde a NAT.
7. Comprueba con PowerShell:

```powershell
Get-NetAdapter | Format-Table Name,InterfaceDescription,MacAddress,Status
Get-NetIPAddress -AddressFamily IPv4
Get-NetRoute -AddressFamily IPv4
Get-NetIPConfiguration
```

8. Crea snapshot `20_WIN_BASE`; tras aplicar IPv4 reinicia y demuestra persistencia; crea `21_WIN_RED_OK`.

### Alternativa PowerShell para la IP (solo después de comprobar la interfaz)

```powershell
# EJEMPLO DOCENTE P07-L03; cambia por tu variante
New-NetIPAddress -InterfaceAlias "SRI-LAN" -IPAddress "10.39.7.23" -PrefixLength 24
Get-NetIPAddress -InterfaceAlias "SRI-LAN" -AddressFamily IPv4
```

Si el adaptador tenía previamente una IPv4 manual, inventaría y retira *solo esa configuración incorrecta* antes de añadir la nueva; no elimines indiscriminadamente IPs de otras NIC. Si el adaptador aparece gestionado por DHCP, revisa su estado antes de invocar `New-NetIPAddress`.

## 6. Instalar el rol por GUI y comprobarlo por PowerShell {#rol}

Ruta gráfica: **Administrador del servidor → Administrar → Agregar roles y características → Instalación basada en roles → Servidor DHCP → incluir herramientas de administración → Instalar**.

Ruta PowerShell alternativa:

```powershell
Install-WindowsFeature DHCP -IncludeManagementTools
Get-WindowsFeature DHCP
Get-Service DHCPServer
Get-DhcpServerv4Binding
```

El servicio debe quedar ligado **solo a la NIC interna**. Si también aparece habilitado en la NIC NAT, deshabilita el binding de DHCP en esa interfaz identificada:

```powershell
# EJEMPLO: sustituye "Ethernet-NAT" por el alias REAL mostrado en Get-DhcpServerv4Binding
Set-DhcpServerv4Binding -InterfaceAlias "Ethernet-NAT" -BindingState $false
Get-DhcpServerv4Binding
```

No confundas deshabilitar el *binding del rol DHCP* con desconectar la NIC del sistema.

### Grupo de trabajo frente a dominio

- **Ruta base:** servidor independiente en red aislada, sin AD DS. **No ejecutes `Add-DhcpServerInDC`** ni intentes crear un dominio solo para esta primera práctica.
- **Ruta corporativa ampliada:** cuando exista un AD DS de laboratorio y el servidor esté unido al dominio, se autorizará expresamente con privilegios adecuados y se comprobará la autorización; un servidor unido a dominio pero no autorizado puede dejar de conceder. [Microsoft: autorización DHCP](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/troubleshooting-guide-dhcp-authorization-failures).

## 7. Construye tu ámbito con GUI (obligatorio) {#ambito-gui}

En **Herramientas → DHCP → IPv4 → Nuevo ámbito**:

1. Nombre: `SRI-W-Pxx-Lyy`.
2. Inicio: `. (100+P)`; final: `. (180+L)`; máscara `255.255.255.0`.
3. Exclusión: `. (130+P)` a `. (180+L)`.
4. Lease: `1800+60×L` segundos. **La GUI puede no exponer la precisión en segundos que exige la variante; aplica el tiempo exacto con PowerShell y compruébalo después.**
5. Gateway: **no anunciar opción 3** en una red que no tiene router.
6. DNS: **no anunciar opción 6 inventada** antes de UT02 DNS.
7. Puedes entregar el sufijo `pXX-lYY.sri.test` (opción 15) sin prometer que ya resuelve.
8. Activa el ámbito solo tras verificar las exclusiones. Revisa visualmente *Address Pool*, *Address Leases*, *Reservations* y *Scope Options*.

### Reserva (GUI)

Obtén la dirección física REAL del cliente de reservas con `ipconfig /all`. En **Reservations → New Reservation**, crea `. (180+L)` con esa identidad. Aunque está dentro de la exclusión, Windows puede concedérsela al cliente reservado. La IP no debe asignarse a cualquier cliente.

## 8. Reproduce la implantación con PowerShell (obligatorio) {#powershell}

El siguiente ejemplo se ejecuta en una VM/snapshot limpia o tras eliminar el ámbito de ensayo de forma controlada. **No lo ejecutes encima del ámbito ya existente para crear duplicados.** Es referencia docente `P07-L03`; sustituye fórmulas por tu variante.

```powershell
$P = 7
$L = 3
$Scope = "10.39.$P.0"
$PoolStart = 100 + $P
$PoolEnd = 129 + $P
$Reserved = 180 + $L
$LeaseSeconds = 1800 + 60*$L
$Suffix = ('p{0:D2}-l{1:D2}.sri.test' -f $P,$L)

# Intervalo total incluye la futura reserva, NO equivale al pool dinámico final
Add-DhcpServerv4Scope -Name ('SRI-W-P{0:D2}-L{1:D2}' -f $P,$L) `
  -StartRange "10.39.$P.$PoolStart" `
  -EndRange "10.39.$P.$Reserved" `
  -SubnetMask 255.255.255.0 `
  -LeaseDuration (New-TimeSpan -Seconds $LeaseSeconds) `
  -State InActive

# Excluimos todo lo que queda después del pool, INCLUIDA la reserva
$ExclusionStart = $PoolEnd + 1
Add-DhcpServerv4ExclusionRange -ScopeId $Scope `
  -StartRange "10.39.$P.$ExclusionStart" `
  -EndRange "10.39.$P.$Reserved"

# Obtenido del cliente REAL: sustituir antes de ejecutar
$ClientMAC = '08-00-27-AA-BB-CC'
Add-DhcpServerv4Reservation -ScopeId $Scope `
  -IPAddress "10.39.$P.$Reserved" -ClientId $ClientMAC `
  -Name ('Reserva-P{0:D2}-L{1:D2}' -f $P,$L)

# Solo sufijo; DNS real se incorporará tras UT02
Set-DhcpServerv4OptionValue -ScopeId $Scope -DnsDomain $Suffix
Set-DhcpServerv4Scope -ScopeId $Scope -State Active
```

> El `ClientMAC` es **dato de ejemplo**, no una MAC que deban copiar todos. Sustitúyela por la del cliente de reservas; en máquinas clonadas VirtualBox debes verificar que no haya MAC duplicadas.

### Comprueba que el resultado es el requerido

```powershell
Get-DhcpServerv4Scope
Get-DhcpServerv4ExclusionRange -ScopeId $Scope
Get-DhcpServerv4Reservation -ScopeId $Scope
Get-DhcpServerv4OptionValue -ScopeId $Scope
Get-DhcpServerv4Lease -ScopeId $Scope -AllLeases
Get-DhcpServerv4Binding
Get-Service DHCPServer
```

`Get-DhcpServerv4Lease` no sustituye a la PCAP: la base de concesiones y el protocolo se corroboran mutuamente.

## 9. Pruebas desde Linux y Windows {#clientes}

1. Conecta los clientes a `SRI-W-Pxx` y selecciona IPv4 automática; no conserves la IP manual de UT00.
2. Comprueba que un cliente **no reservado** obtiene dirección `.100+P … .129+P`.
3. Fuerza renovación en Windows con `ipconfig /release` e `ipconfig /renew`.
4. En Linux usa el gestor real de red: `nmcli`, `networkctl`, `dhclient` solo si está instalado y corresponde a ese cliente.
5. Obtén nueva transacción y correlaciona `xid`, `yiaddr`, opciones 51/54, identificador de cliente y tiempo.
6. Confirma que el cliente reservado recibe `.180+L` y que un cliente distinto **no** recibe esa dirección.
7. Correlaciona concesión con `Get-DhcpServerv4Lease`.
8. Repite tras reiniciar Windows Server: la configuración debe persistir.

**No asumas igualdad exacta de T1/T2 entre implementaciones:** Kea permite fijarlos explícitamente. En Windows Server configuramos la duración de concesión y **medimos** los valores efectivos de renovación/rebinding en la captura, explicando la política concreta de la plataforma.

## 10. Segunda subred y relay Windows (ruta evaluable) {#relay}

```text
ws-dhcp (Windows) ── SRI-W-Pxx ── relay ── SRI-WB-Pxx ── cliente B
 10.39.P.(20+L)    10.39.P.0/24   /24    10.40.P.0/24
                         .254       .254
```

Prepara un relay en una VM intermedia con dos NIC internas, sin puente. Puede ser el Debian relay **reutilizado en otra snapshot**; no hay necesidad de instalar un DHCP en el relay. Configura una IP fija `.254` en cada interfaz, reenvío IPv4/ruta y agente relay hacia la IP del Windows DHCP. El Windows DHCP necesita ruta de retorno `10.40.P.0/24 vía 10.39.P.254`; el equipo relay será el router real anunciado **solo en LAN B**.

Crea ámbito adicional para `10.40.P.0/24`, pool `.100+P… .129+P`, opción router `10.40.P.254`. Comprueba desde cliente B que la concesión procede del servidor Windows y documenta `giaddr` en una captura tomada en el relay/servidor.

### Comandos orientativos de la fase relay · ejemplo P07-L03

En Windows Server, PowerShell elevado; identifica primero la NIC LAN por su alias real:

```powershell
# SOLO P07-L03 · el router Linux debe tener primero 10.39.7.254/24 y 10.40.7.254/24
New-NetRoute -DestinationPrefix '10.40.7.0/24' -InterfaceAlias 'SRI-LAN' -NextHop '10.39.7.254'
Get-NetRoute -DestinationPrefix '10.40.7.0/24'

Add-DhcpServerv4Scope -Name 'LAN-B-P07-L03' `
  -StartRange 10.40.7.107 -EndRange 10.40.7.136 `
  -SubnetMask 255.255.255.0 -LeaseDuration (New-TimeSpan -Seconds 1980)
Set-DhcpServerv4OptionValue -ScopeId 10.40.7.0 -Router 10.40.7.254
Get-DhcpServerv4Scope
Get-DhcpServerv4OptionValue -ScopeId 10.40.7.0
```

En el **Debian de relay dedicado**, instala `isc-dhcp-relay` en la VM de laboratorio si está disponible, documenta que el software ISC DHCP Relay es legado y que el docente puede sustituirlo por un relay mantenido del equipamiento de red. Las dos NIC ya deben conservar sus IP estáticas sin gateway ficticio. Identifícalas y activa reenvío IPv4:

```bash
ip -br a
sudo sysctl -w net.ipv4.ip_forward=1
# Para dejarlo persistente en esta VM de laboratorio:
printf 'net.ipv4.ip_forward=1\n' | sudo tee /etc/sysctl.d/90-sri-relay.conf
sudo sysctl --system

# Ejemplo de nombres de NIC: comprobarlos en TU VM antes de ejecutar
sudo dhcrelay -4 -d -id NIC_LAN_B -iu NIC_LAN_A 10.39.7.23
```

No sustituye a configurar y comprobar las direcciones estáticas de ambas NIC. Usa `tcpdump -ni NIC 'udp port 67 or 68'` y no confundas que llegue un Discover al relay con que Windows entregue finalmente un ACK. Si `New-NetRoute` indica ruta ya existente, verifica el siguiente salto y modifica solamente la ruta incorrecta; no acumules rutas duplicadas.

Para el segundo ámbito no hace falta reserva exterior: puede crearse directamente con el rango dinámico de treinta direcciones. **Importante:** la IP de router `.254` debe existir y la ruta de retorno debe comprobarse. Puedes utilizar, como ampliación, un Windows Server independiente con rol **Remote Access / RRAS** como relay en lugar de Debian; [tutorial oficial de Microsoft](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/dhcp-deploy-relay-agent).

## 11. Logs, copia y vuelta atrás {#operacion}

Comprobaciones:

```powershell
Get-Service DHCPServer
Get-DhcpServerv4Binding
Get-DhcpServerv4Scope
Get-DhcpServerv4Lease -ScopeId $Scope -AllLeases
Get-WinEvent -LogName System -MaxEvents 100 | Where-Object ProviderName -Match 'DHCP'
```

Revisa también la rama **Microsoft-Windows-DHCP-Server** del Visor de eventos y los registros de auditoría DHCP disponibles en el servidor. No des por hecho que un nombre exacto de canal o una ruta de auditoría son iguales en todas las instalaciones; inventaría lo que exista.

```powershell
New-Item -ItemType Directory -Path 'C:\SRI-Backup' -Force
Backup-DhcpServer -Path 'C:\SRI-Backup'
Export-DhcpServer -File 'C:\SRI-Backup\dhcp-export.xml' -Leases -Force
```

La snapshot permite revertir el laboratorio; las copias de DHCP permiten documentar y ensayar una recuperación específica del servicio. No restaures un backup antiguo **sobre concesiones activas** sin un plan que contemple a los clientes.

## 12. Consolidación y Moodle {#consolidacion}

Antes de dar por cerrada la implementación, el alumnado debe poder **interpretar** su ámbito, exclusiones, reserva, opción realmente recibida, DORA, lease, ruta de retorno y procedimiento de recuperación.

Las consignas W01–W07, entregas, incidencias individuales, defensa y rúbrica están en el **aula virtual**, no en esta página ni en el repositorio público. Aquí se conserva la explicación y el laboratorio guiado.

### Comparación de cierre

| Pregunta | Kea | Windows |
|---|---|---|
| ¿Dónde se declara el pool? | `subnet4` / `pools` | Ámbito / exclusiones |
| ¿Cómo se reserva? | `reservations` | Reserva por ClientId |
| ¿Dónde se observa la concesión? | CSV + logs | `Get-DhcpServerv4Lease` + eventos |
| ¿Cómo compruebo un cambio? | Validar + servicio + cliente | Cmdlets + servicio + cliente |

## 13. Enlace con la siguiente unidad: DNS {#dns}

Al terminar **UT02 DNS**, volveremos a los ámbitos Windows para poner **Option 6** a los servidores DNS realmente instalados y verificar una consulta funcional. Solo entonces tendrá sentido la integración de actualizaciones DNS dinámicas con Active Directory/BIND, tratada como extensión con sus propios requisitos y autorizaciones.

## 14. Referencias oficiales {#referencias}

- [Evaluación Windows Server 2025](https://www.microsoft.com/es-es/evalcenter/evaluate-windows-server-2025)
- [Instalar y configurar DHCP en Windows Server](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/quickstart-install-configure-dhcp-server)
- [Add-DhcpServerv4Scope](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/add-dhcpserverv4scope?view=windowsserver2025-ps)
- [Add-DhcpServerv4ExclusionRange](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/add-dhcpserverv4exclusionrange?view=windowsserver2025-ps)
- [Add-DhcpServerv4Reservation](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/add-dhcpserverv4reservation?view=windowsserver2025-ps)
- [Get-DhcpServerv4Binding](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/get-dhcpserverv4binding?view=windowsserver2025-ps)
- [Windows: reservas e intervalos excluidos](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/cant-add-dhcp-reservation)
- [Backup-DhcpServer](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/backup-dhcpserver?view=windowsserver2025-ps)
- [Relay DHCP en Windows](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/dhcp-deploy-relay-agent)
- [Windows DHCP failover (dos Windows; ampliación)](https://learn.microsoft.com/en-us/windows-server/networking/technologies/dhcp/dhcp-failover)
