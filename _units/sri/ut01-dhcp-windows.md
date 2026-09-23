---
title: UT01 · DHCP en Windows Server 2025
description: 'Segundo laboratorio obligatorio de DHCP: ámbitos, exclusiones, reservas, PowerShell, relay y diagnóstico en Windows Server 2025.'
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
version: '2.1'
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

<a id="comparacion"></a>
## Introducción · segundo laboratorio obligatorio de la UT01

**Misión:** demostrar el **mismo protocolo y RA2** con otra plataforma: [DHCP con Kea en Debian 13](/docencia/asir/sri/ut01/) → **DHCP con Windows Server 2025**. Aquí no «inventamos otro DHCP»: cambiamos la forma de administrarlo, comprobarlo y respaldarlo.

| Aspecto | Kea / Debian | Windows Server 2025 |
|---|---|---|
| Configuración | JSON `Dhcp4`, `subnet4`, `pools` | Ámbitos, exclusiones, opciones y reservas |
| Herramienta | Terminal y servicio | GUI DHCP + PowerShell |
| Lease | CSV memfile y logs | Concesiones del ámbito y registros |
| Protocolo | DORA, UDP 67/68 | **El mismo** DORA, UDP 67/68 |
| Repetibilidad | Fichero validado / API | Cmdlets `DhcpServer` |

**Ruta mínima obligatoria:** VM Windows Server → NIC/IP fija por GUI → rol DHCP → ámbito y exclusión → reserva → cliente DHCP → prueba DORA → comparación. **Ruta avanzada:** reproducción automatizada, relay/segunda LAN, copias e incidencias. El uso de PowerShell es parte de la competencia, pero **no se mezclan** dos métodos de creación de ámbitos sobre la misma configuración existente.

**RA2:** administra servicios de configuración automática y verifica parámetros recibidos. Evidencias: RA2.a manual/automático; b DORA; c instalación/gestión del rol; d ámbito/cliente; e reserva; f opciones/relay; g logs, copia e incidencia.

<a id="instalacion"></a>
## 1. Preparar Windows Server y las tarjetas · clic a clic

### 1.1 Máquinas necesarias

| VM | SO | Adaptadores | Cuándo encenderla |
|---|---|---|---|
| `wdhcp-pXX-lYY` | Windows Server 2025 **Desktop Experience** | NAT para instalación; Red Interna `SRI-W-Pxx` | Toda la práctica |
| `wcli-pXX-lYY` | Windows 11 | Red Interna `SRI-W-Pxx` | Desde la prueba cliente |
| Cliente Debian opcional | Debian 13 | Red Interna `SRI-W-Pxx` | Por turnos con Windows 11 |
| Relay opcional | Debian 13 | LAN A y LAN B internas | Solo fase de ampliación |

El laboratorio base requiere **dos VM simultáneas**. Sugerencia inicial: Windows Server 2 vCPU, 4–6 GB RAM y 60 GB de disco dinámico, según el hardware del aula.

### 1.2 Instalación de la VM

1. Descarga Windows Server 2025 desde [Microsoft Evaluation Center](https://www.microsoft.com/evalcenter/) o usa la licencia proporcionada por el centro. La evaluación tiene condiciones y duración limitadas.
2. VirtualBox → **Nueva** → selecciona la ISO, recursos y disco. Si la instalación guiada te impide elegir edición, revisa la instalación desatendida de VirtualBox.
3. En el instalador de Windows selecciona edición con **Desktop Experience** (experiencia de escritorio). **Server Core no ofrece la misma GUI**; lo estudiaremos como ampliación.
4. Establece la contraseña de la cuenta Administrador **solo para el laboratorio**. Accede al escritorio del servidor.
5. Apaga y entra en **VirtualBox → Configuración → Red**: Adaptador 1 **NAT**; Adaptador 2 **Red interna**, nombre exacto `SRI-W-Pxx`. No uses **Adaptador puente** para el DHCP del centro.
6. Crea snapshot `20_WIN_BASE`.

> `SRI-W-P07` es **otro switch virtual**: no es `SRI-P07` de Kea. Así evitamos que ambos DHCP contesten a los mismos clientes accidentalmente.

### 1.3 Identificar las dos NIC ANTES de asignar IP

En **Windows Server**, pulsa `Windows+R`, escribe `ncpa.cpl` y pulsa **Enter**. Se abre **Conexiones de red**.

1. Verás dos adaptadores (nombres como `Ethernet` y `Ethernet 2` pueden variar).
2. En VirtualBox, compara la **dirección MAC** del adaptador NAT e Interno. En Windows, clic derecho → **Estado → Detalles** o usa PowerShell:

```powershell
Get-NetAdapter | Format-Table Name, MacAddress, Status
```

3. Clic derecho en la NIC **interna** → **Cambiar nombre** → `SRI-LAN`. Si quieres, renombra NAT a `Ethernet-NAT` para reconocerla.
4. **Nunca** decidas solo por “Ethernet 2”: comprueba primero la MAC/modo VirtualBox.

<a id="individualizacion"></a>
## 2. Variante individual Windows · misma dificultad, red diferente

`P` = puesto 01–40; `L` = inicial del primer apellido A=01 … Z=26. La red `10.39.P.0/24` corresponde al Windows Server, distinta de Kea (`10.37.P.0/24`).

| Concepto | Fórmula | Ejemplo docente **P07-L03** |
|---|---|---|
| Red VirtualBox | `SRI-W-Pxx` | `SRI-W-P07` |
| Servidor | `10.39.P.(20+L)` | `10.39.7.23/24` |
| Dirección dinámica deseada | `. (100+P)` … `. (129+P)` | `.107–.136` |
| Reserva | `. (180+L)` | `.183` |
| Ámbito total en Windows | `. (100+P)` … `. (180+L)` | `.107–.183` |
| Exclusión | `. (130+P)` … `. (180+L)` | `.137–.183` |
| Lease | `1800+60×L` segundos | `1980 s = 33 min` |
| Segunda red (ampliación) | `10.40.P.0/24` | `10.40.7.0/24` |
| Relay LAN A / B | `.254` en cada subred | `10.39.7.254 / 10.40.7.254` |

**Por qué hacemos un ámbito más amplio que el pool dinámico:** Windows Server exige que la IP reservada esté dentro del **intervalo total** del ámbito. La excluimos de las asignaciones ordinarias, pero permitimos que el cliente reservado la reciba. Referencia: [Microsoft Learn · reserva fuera de intervalo](https://learn.microsoft.com/es-es/troubleshoot/windows-server/networking/cant-add-dhcp-reservation) y [exclusiones](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/add-dhcpserverv4exclusionrange?view=windowsserver2025-ps).

### 2.1 Poner IP fija al servidor por GUI · PASOS COMPLETOS

**Este es el camino para empezar. PowerShell viene después.** Trabaja en **Windows Server**, no en el cliente.

1. Pulsa `Windows+R` → `ncpa.cpl` → Enter.
2. Clic derecho en la **NIC `SRI-LAN`** → **Propiedades**.
3. Selecciona **Protocolo de Internet versión 4 (TCP/IPv4)** → **Propiedades**.
4. Marca «Usar la siguiente dirección IP» e introduce **tu variante**:

| Campo | P07-L03 |
|---|---|
| Dirección IP | `10.39.7.23` |
| Máscara de subred | `255.255.255.0` |
| Puerta de enlace predeterminada | **Dejar en blanco** |
| DNS preferido en NIC interna | **Dejar en blanco en esta fase** |

5. Pulsa **Aceptar → Cerrar**. **No has configurado la tarjeta NAT**: debe conservar su configuración.
6. Abre PowerShell y comprueba:

```powershell
Get-NetAdapter
Get-NetIPAddress -InterfaceAlias 'SRI-LAN' -AddressFamily IPv4
Get-NetRoute -AddressFamily IPv4
ipconfig /all
```

**Resultado esperado:** la NIC `SRI-LAN` tiene tu IP `/24`; no aparece una segunda ruta por defecto creada por la LAN interna. La NAT puede seguir proporcionando salida para actualizar. Si modificaste por error NAT, recupérala desde su configuración/instantánea antes de continuar.

7. Reinicia Windows Server y repite `ipconfig /all`: la IP debe seguir presente. Crea snapshot `21_WIN_RED_OK`.

### 2.2 Alternativa de IP con PowerShell · solo en NIC limpia o snapshot

**No añadas una segunda IP sin comprobar las existentes.** Para una NIC `SRI-LAN` aún en DHCP y sin IP manual, PowerShell **como Administrador**:

```powershell
Get-NetIPAddress -InterfaceAlias 'SRI-LAN' -AddressFamily IPv4
New-NetIPAddress -InterfaceAlias 'SRI-LAN' -IPAddress '10.39.7.23' -PrefixLength 24
Get-NetIPAddress -InterfaceAlias 'SRI-LAN' -AddressFamily IPv4
```

`New-NetIPAddress` cambia la configuración según el estado de la NIC. Si ya la configuraste por GUI, **no repitas el alta**; usa `Get-NetIPAddress` para verificarla. En una interfaz con configuración manual errónea, identifica primero la IP concreta antes de modificarla: no elimines direcciones de NAT indiscriminadamente.

<a id="rol"></a>
## 3. Instalar el rol DHCP · primero la GUI

### 3.1 Administrador del servidor, clic a clic

1. Inicia **Administrador del servidor (Server Manager)**. Si no se abre, búscalo desde Inicio.
2. Pulsa **Administrar → Agregar roles y características**.
3. «Antes de comenzar» → **Siguiente**.
4. «Instalación basada en características o en roles» → **Siguiente**.
5. Selecciona **el propio servidor Windows** → **Siguiente**.
6. Activa **Servidor DHCP** → acepta «Agregar características»/herramientas solicitadas → **Siguiente**.
7. Avanza por características y confirmación → **Instalar**. Espera a ver instalación correcta.
8. Abre **Herramientas → DHCP**.

> No instalamos Active Directory solo para esta práctica. En **grupo de trabajo y red interna aislada**, no ejecutes `Add-DhcpServerInDC`; la **autorización AD** corresponde a servidores unidos a dominio y se estudiará al disponer de ese escenario.

### 3.2 Comprobación por PowerShell elevado

```powershell
Get-WindowsFeature DHCP
Get-Service DHCPServer
Get-DhcpServerv4Binding
```

**Esperado:** rol instalado, servicio disponible y **binding DHCP habilitado únicamente sobre la NIC de laboratorio**. Si DHCP aparece vinculado también a NAT, usa el alias que devuelve `Get-DhcpServerv4Binding`:

```powershell
Set-DhcpServerv4Binding -InterfaceAlias 'Ethernet-NAT' -BindingState $false
Get-DhcpServerv4Binding
```

**No copies `Ethernet-NAT` si la tuya se llama de otra forma.** Deshabilitar el binding DHCP **no equivale a deshabilitar la NIC NAT de Windows**.

La instalación alternativa del rol, cuando corresponda a un snapshot limpio:

```powershell
Install-WindowsFeature DHCP -IncludeManagementTools
```

Referencia: [Microsoft Learn · instalación DHCP Windows Server](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/quickstart-install-configure-dhcp-server).

<a id="ambito-gui"></a>
## 4. Crear el ámbito, la exclusión y la reserva por GUI

**Antes de empezar:** en el servidor ya existe `SRI-LAN = 10.39.7.23/24`; cliente aún apagado; tenemos snapshot `21_WIN_RED_OK`.

### 4.1 Crear ámbito pero NO activarlo todavía

1. **Administrador del servidor → Herramientas → DHCP**.
2. En el árbol izquierdo expande el nombre del servidor → **IPv4**.
3. Clic derecho **IPv4 → Ámbito nuevo (New Scope)**.
4. Nombre P07-L03: `SRI-W-P07-L03`. Descripción: «DHCP laboratorio Windows».
5. En «Intervalo de direcciones IP» introduce:

| Campo | P07-L03 |
|---|---|
| Inicio | `10.39.7.107` |
| Final | `10.39.7.183` |
| Máscara | `255.255.255.0` |

6. En «Agregar exclusiones» introduce **inicio** `10.39.7.137`, **final** `10.39.7.183` → **Agregar → Siguiente**.
7. En duración de concesión: **0 días, 0 horas, 33 minutos** para P07-L03. **Todos los valores de nuestra fórmula son minutos enteros:** `30+L` minutos. No hace falta adivinar segundos en la GUI.
8. Configurar opciones ahora: **no declares puerta de enlace** en la LAN base. Si el asistente requiere datos DNS que no tienes, omite lo que permita omitir y revisa después «Opciones de ámbito». No escribas `8.8.8.8` ni la IP de un BIND que todavía no hemos instalado solo para completar una pantalla.
9. WINS: **omitir**, salvo que el ejercicio indique lo contrario.
10. En «Activar ámbito», elige **No, lo activaré más adelante**. Finaliza.

### 4.2 Inspeccionar el resultado antes de activarlo

En el árbol **IPv4 → Ámbito `SRI-W-P07-L03`**, visita:

- **Grupo de direcciones / Address Pool:** intervalo y exclusión correctos.
- **Concesiones / Address Leases:** aún puede estar vacío.
- **Reservas / Reservations:** aún vacías.
- **Opciones de ámbito / Scope Options:** no deben aparecer un router o DNS inventados.

### 4.3 Crear la reserva para un cliente concreto

1. Arranca el **cliente Windows 11** para consultar su identidad. `Windows+R` → `cmd` → `ipconfig /all`.
2. Localiza **dirección física de la NIC conectada a `SRI-W-Pxx`**, no la Wi-Fi del anfitrión ni una NIC NAT. Anota la MAC real.
3. En servidor → DHCP → IPv4 → tu ámbito → clic derecho **Reservas → Nueva reserva**.
4. Introduce nombre `Reserva-P07-L03`, IP `10.39.7.183` y **MAC real** del cliente; tipo DHCP o ambos si la interfaz lo ofrece.
5. Comprueba que aparece en **Reservas**.
6. Clic derecho sobre **el ámbito** → **Activar**. Desde este momento puede distribuir concesiones.

**Importante:** `.183` está dentro del intervalo total `.107–.183` y en el tramo excluido `.137–.183`: la exclusión evita reparto dinámico ordinario, **no impide la reserva de ese cliente**.

**Resultado esperado:** 30 direcciones dinámicas normales `.107–.136`, reserva `.183`, servidor `.23` fuera del ámbito y opción router ausente hasta que exista uno real.

<a id="powershell"></a>
## 5. PowerShell · inventariar primero, reproducir después

**Primero aprender GUI, luego automatizar.** No ejecutes `Add-DhcpServerv4Scope` sobre el ámbito que acabas de crear: dará conflicto o duplicidad. Para recrear por PowerShell, recupera snapshot **posterior a rol/IP, anterior al ámbito**, o elimina el ámbito de ensayo **solo si sabes que no contiene trabajo que necesites conservar**.

### 5.1 Inspeccionar lo que has creado por GUI (seguro para empezar)

Abre **PowerShell como Administrador** en servidor:

```powershell
Get-Service DHCPServer
Get-DhcpServerv4Binding
Get-DhcpServerv4Scope
Get-DhcpServerv4ExclusionRange -ScopeId 10.39.7.0
Get-DhcpServerv4Reservation -ScopeId 10.39.7.0
Get-DhcpServerv4OptionValue -ScopeId 10.39.7.0
```

Los tres últimos necesitan que **ya exista** tu ámbito; sustituye `10.39.7.0` por tu red. Compara cada salida con las ventanas GUI.

### 5.2 Crear ámbito desde cero con PowerShell · P07-L03

**Ejecutar únicamente en entorno limpio** después de completar IP y rol. Sustituye la MAC por la del cliente real antes de invocar la reserva.

```powershell
$P = 7
$L = 3
$Scope = "10.39.$P.0"
$PoolStart = 100 + $P
$PoolEnd = 129 + $P
$Reserved = 180 + $L
$LeaseSeconds = 1800 + 60 * $L
$Suffix = ('p{0:D2}-l{1:D2}.sri.test' -f $P,$L)

# 1) Ámbito total, primero INACTIVO
Add-DhcpServerv4Scope `
  -Name ('SRI-W-P{0:D2}-L{1:D2}' -f $P,$L) `
  -StartRange "10.39.$P.$PoolStart" `
  -EndRange "10.39.$P.$Reserved" `
  -SubnetMask 255.255.255.0 `
  -LeaseDuration (New-TimeSpan -Seconds $LeaseSeconds) `
  -State InActive

# 2) Excluir de reparto ordinario desde 1 IP después del pool hasta la reserva
$ExclusionStart = $PoolEnd + 1
Add-DhcpServerv4ExclusionRange -ScopeId $Scope `
  -StartRange "10.39.$P.$ExclusionStart" `
  -EndRange "10.39.$P.$Reserved"

# 3) MAC REAL de la tarjeta interna del cliente; sustituir el ejemplo
$ClientMAC = '08-00-27-AA-BB-CC'
Add-DhcpServerv4Reservation -ScopeId $Scope `
  -IPAddress "10.39.$P.$Reserved" -ClientId $ClientMAC `
  -Name ('Reserva-P{0:D2}-L{1:D2}' -f $P,$L)

# 4) Solo sufijo de laboratorio; BIND9 real llegará en UT02
Set-DhcpServerv4OptionValue -ScopeId $Scope -DnsDomain $Suffix

# 5) Activar solo cuando comprobamos el diseño
Set-DhcpServerv4Scope -ScopeId $Scope -State Active
```

### 5.3 Verificar tras PowerShell

```powershell
Get-DhcpServerv4Scope
Get-DhcpServerv4ExclusionRange -ScopeId $Scope
Get-DhcpServerv4Reservation -ScopeId $Scope
Get-DhcpServerv4OptionValue -ScopeId $Scope
Get-DhcpServerv4Binding
```

**Si falla un cmdlet a mitad:** no repitas todo el bloque sin mirar qué objetos ya se crearon. Consulta estado real y ejecuta solo el paso pendiente; para una reconstrucción desde cero, recupera el snapshot previsto.

<a id="clientes"></a>
## 6. Cliente Windows + Debian · demostrar concesión y DORA

### 6.1 Windows 11 (segundo equipo)

1. VirtualBox del **cliente** → NIC interna llamada exactamente `SRI-W-Pxx`.
2. Windows del cliente → `Windows+R` → `ncpa.cpl` → clic derecho NIC interna → Propiedades → IPv4 → Propiedades.
3. Activa **Obtener una dirección IP automáticamente** y DNS automático → Aceptar.
4. CMD cliente:

```bat
ipconfig /all
```

5. Si necesitas una solicitud nueva:

```bat
ipconfig /release
ipconfig /renew
ipconfig /all
```

**Cliente reservado:** debe recibir `.180+L` (P07-L03 → `10.39.7.183`); **cliente no reservado** debe recibir una IP dinámica en `.100+P … .129+P`. Para comprobar dinámica usa otro cliente, o realiza una prueba de identidad controlada en un snapshot; no cambies MAC al azar en el equipo que ya tiene concesión.

**Si aparece 169.254.x.x:** no ha obtenido IPv4 útil por DHCP; revisa si llega Discover, rol/binding, ámbito activo, exclusión y `SRI-W-Pxx` antes de cambiar DNS.

### 6.2 Debian 13 (cliente alternativo por turnos)

Conecta el cliente Linux a `SRI-W-Pxx`, ajusta su NIC a DHCP mediante **su gestor real** (UT00), no instales NetworkManager solo porque veas `nmcli` en otro tutorial.

```bash
ip -br address
ip route
command -v dhcpcd
command -v dhclient
```

Comienza captura **antes** de encender el cliente para ver su primera solicitud. Compara la IP con el ámbito de Windows y la información obtenida por el servidor.

### 6.3 Prueba en Windows Server

```powershell
$Scope = '10.39.7.0'  # sustituye por tu red
Get-DhcpServerv4Lease -ScopeId $Scope -AllLeases
Get-DhcpServerv4Reservation -ScopeId $Scope
```

**Una lease en la consola no sustituye la PCAP.** Para observar tráfico puedes usar Wireshark en un cliente/lab autorizado o capturarlo desde un equipo Linux conectado a la red interna. Busca `DHCPDISCOVER`, `DHCPOFFER`, `DHCPREQUEST`, `DHCPACK`, `xid`, `yiaddr`, opción 54 y duración. Windows puede utilizar temporizadores de renovación efectivos distintos de los que fijaste expresamente en Kea: **observa el paquete**, no los inventes.

<a id="relay"></a>
## 7. Segunda LAN y relay · ampliación posterior al núcleo

```text
Windows DHCP 10.39.7.23/24 ── LAN A SRI-W-P07 ── Debian RELAY ── LAN B SRI-WB-P07 ── Cliente automático
                                            10.39.7.254 | 10.40.7.254
```

**No lo hagas el primer día**: antes debes tener una LAN A que funcione, una reserva demostrada y una captura DORA. En la fase avanzada se necesitan **tres VM simultáneas**: Windows Server, Debian relay con dos interfaces internas y cliente B.

### 7.1 Preparar el relay Debian

1. Apaga la VM relay. VirtualBox → NIC a `SRI-W-Pxx` y otra NIC a `SRI-WB-Pxx`. Si necesita instalar paquetes, usa NAT **temporal en una tercera NIC**, pero no confundas sus rutas.
2. En relay `ip -br link`; identifica las dos NIC. Configura **IP fija** `10.39.P.254/24` y `10.40.P.254/24` usando tu gestor (consulta [UT00](/docencia/asir/sri/ut00/)); sin gateway ficticio en esas NIC.
3. Verifica con `ip -br a`. Activa forwarding en relay:

```bash
sudo sysctl -w net.ipv4.ip_forward=1
printf 'net.ipv4.ip_forward=1\n' | sudo tee /etc/sysctl.d/90-sri-relay.conf
sudo sysctl --system
```

4. Instala en relay, usando NAT temporal si lo necesita:

```bash
sudo apt update
sudo apt install isc-dhcp-relay
```

5. Para demostración en primer plano, evita dos instancias de relay simultáneas y sustituye nombres NIC **reales** (ejemplo servidor P07-L03):

```bash
sudo systemctl stop isc-dhcp-relay 2>/dev/null || true
sudo dhcrelay -4 -d -id NIC_LAN_B -iu NIC_LAN_A 10.39.7.23
```

`isc-dhcp-relay` está deprecado en Debian: se utiliza como **herramienta de laboratorio**, no como propuesta automática de despliegue nuevo corporativo.

### 7.2 Ruta y segundo ámbito en Windows Server

En **PowerShell elevado del servidor Windows**, ejemplo P07-L03:

```powershell
New-NetRoute -DestinationPrefix '10.40.7.0/24' `
  -InterfaceAlias 'SRI-LAN' -NextHop '10.39.7.254'
Get-NetRoute -DestinationPrefix '10.40.7.0/24'

Add-DhcpServerv4Scope -Name 'LAN-B-P07-L03' `
  -StartRange 10.40.7.107 -EndRange 10.40.7.136 `
  -SubnetMask 255.255.255.0 `
  -LeaseDuration (New-TimeSpan -Seconds 1980)
Set-DhcpServerv4OptionValue -ScopeId 10.40.7.0 -Router 10.40.7.254
Get-DhcpServerv4Scope
```

**Comprueba antes de cada `Add-`:** si ya existe ruta/ámbito, inspecciónalo y corrige solo el elemento incorrecto; no crees duplicados.

### 7.3 Cliente de LAN B y evidencia

Cliente conectado únicamente a `SRI-WB-Pxx`, IPv4 automático. Resultado esperado: IP `10.40.7.107–136`, gateway **existente** `10.40.7.254`, servidor DHCP Windows `10.39.7.23`. La captura muestra `giaddr` de LAN B. Si la oferta llega pero no vuelve ACK, revisa rutas y forwarding en ambas direcciones.

La ampliación corporativa puede utilizar RRAS/relay en Windows Server en vez de Debian, pero no lo mezclamos con la ruta mínima mientras aprendemos los conceptos.

<a id="operacion"></a>
## 8. Logs, copias, incidencias y vuelta atrás

**En servidor, PowerShell elevado:**

```powershell
Get-Service DHCPServer
Get-DhcpServerv4Binding
Get-DhcpServerv4Scope
Get-DhcpServerv4Lease -ScopeId 10.39.7.0 -AllLeases
Get-WinEvent -LogName System -MaxEvents 100 |
  Where-Object ProviderName -Match 'DHCP'
```

Consulta también **Visor de eventos → Registros de aplicaciones y servicios → Microsoft → Windows → DHCP-Server** (según canales disponibles) y los registros de auditoría configurados en tu instalación. No presupongas que todas las versiones presentan rutas idénticas.

### Copia del servicio, distinta del snapshot

```powershell
New-Item -ItemType Directory -Path 'C:\SRI-Backup' -Force
Backup-DhcpServer -Path 'C:\SRI-Backup'
Export-DhcpServer -File 'C:\SRI-Backup\dhcp-export.xml' -Leases -Force
```

**Un snapshot** recupera toda la VM; **una copia DHCP** sirve para guardar/exportar configuración y datos del rol. No importes una copia antigua sobre concesiones activas sin un plan de recuperación.

| Síntoma | ¿Qué mirar primero? |
|---|---|
| Cliente sin IP, `169.254.x.x` | Red interna, ámbito activo, binding, DHCP Server, DORA |
| Cliente con IP inesperada | ¿Está en `SRI-Pxx` de Kea por error?, Option 54, exclusión |
| Reserva no se aplica | MAC de NIC interna, `ClientId`, lease existente |
| GUI y PowerShell difieren | Ámbito que se consulta, ScopeId, snapshot, tiempo de lease |
| LAN B no recibe | Relay NIC-A/B, `giaddr`, ruta Windows a LAN B, IP forwarding |
| IP correcta, nombres no resuelven | No confundir: en UT01 todavía no hay BIND9 interno |

<a id="consolidacion"></a>
## 9. Cierre · comparar Kea y Windows, enlazar con UT02

**El mismo diseño final:** 30 direcciones dinámicas, una reserva por cliente, tiempo de concesión calculado, cliente Linux/Windows, prueba DORA y registro de concesiones. **La diferencia técnica importante** es que Windows utiliza intervalo total del ámbito + exclusión + reserva, mientras Kea permite reservar `.183` fuera del pool dinámico.

Al terminar debes explicar **qué hiciste**, **qué comprobó cada comando o captura**, **qué harías si no hay Offer**, **por qué no anunciamos un router falso**, y **cómo recuperarías el servicio**. Las prácticas, tickets, entregas y rúbricas individuales se encuentran en Moodle, no en la web pública.

**Siguiente: UT02 DNS.** Cuando haya servidores DNS reales, vuelve a Kea y Windows DHCP para configurar **opción 6** con IPs de servidores que realmente existen y demostrar resolución desde un cliente; solo entonces tiene sentido profundizar en DDNS.

### Referencias oficiales

- [Microsoft · instalar y configurar DHCP](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/quickstart-install-configure-dhcp-server)
- [Microsoft · ámbitos DHCP](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/dhcp-scopes)
- [Microsoft · reservas fuera de intervalo total](https://learn.microsoft.com/es-es/troubleshoot/windows-server/networking/cant-add-dhcp-reservation)
- [Microsoft · exclusiones y reservas](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/add-dhcpserverv4exclusionrange?view=windowsserver2025-ps)
- [Microsoft · Set-DhcpServerv4Binding](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/set-dhcpserverv4binding?view=windowsserver2025-ps)
- [Microsoft · desplegar DHCP con PowerShell](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/dhcp-deploy-wps)
- [Debian 13 · isc-dhcp-relay (legado)](https://packages.debian.org/trixie/isc-dhcp-relay)

**Material público para el alumnado · Fco. Javier Cano Granado · versión 2.1 · 23/09/2026.**
