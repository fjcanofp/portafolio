---
title: UT02 · DNS en Windows Server 2025
description: 'Segundo laboratorio obligatorio de DNS: rol DNS, zonas directa e inversa, registros, GUI
  y PowerShell, transferencia e integración DHCP.'
summary: Administrar la misma política DNS del RA1 en Windows Server 2025.
module_key: sri
cycle_key: asir
module_title: Servicios de Red e Internet
module_code: '0375'
cycle_title: Administración de Sistemas Informáticos en Red
course: 2.º ASIR
unit: UT02
level: intermedio
authors:
- fjcano
reviewers:
- fjcano
rights: all-rights-reserved
version: '1.0'
last_reviewed: '2026-09-23'
visibility: public
ra:
- RA1
ce:
- RA1.a
- RA1.b
- RA1.c
- RA1.d
- RA1.e
- RA1.f
- RA1.g
- RA1.h
- RA1.i
- RA1.j
published: false
order: 2.1
hours: 10
tags:
- dns
- windows-server-2025
- powershell
- zonas
- ptr
- mx
- transferencias
- diagnostico
permalink: /docencia/asir/sri/ut02-windows/
toc:
- title: Misión
  id: inicio
- title: RA1 y CE
  id: ra-ce
- title: Topología
  id: topologia
- title: Instalación y NIC
  id: instalacion
- title: Rol DNS
  id: rol
- title: Zona directa
  id: directa
- title: Zona inversa
  id: inversa
- title: Registros
  id: registros
- title: PowerShell
  id: powershell
- title: Integración DHCP
  id: dhcp
- title: Secundario
  id: secundario
- title: Caché y seguridad
  id: cache
- title: Diagnóstico
  id: diagnostico
---

<a id="inicio"></a>
## Misión · el MISMO DNS en Windows Server 2025

Segunda implementación **obligatoria** de la UT02: primero zona/cliente DNS en Debian, después **Windows Server 2025 Desktop Experience**. La competencia es RA1, no RA2 (RA2 corresponde a DHCP). El objetivo es administrar la misma política de nombres de forma gráfica y mediante PowerShell en una LAN **separada** de Kea/Windows DHCP.

**Base:** 2 VM, servidor DNS Windows + cliente. **Comparación integrada:** 3 VM si además arrancas el servidor DHCP Windows de UT01 para entregar opción 006/015. **Avanzado:** zona secundaria, transferencia y comparación con BIND en laboratorio controlado.

<a id="ra-ce"></a>
## RA1 y CE de la UT02

**RA1. Administra servicios de resolución de nombres, analizándolos y garantizando la seguridad del servicio.** Trabajarás CE a–j: necesidad, mecanismos, jerarquía, instalación, reenviadores, caché, registros/A/MX/CNAME, DDNS, transferencias y documentación. La evaluación concreta y las soluciones se encuentran en Moodle.

<a id="topologia"></a>
## 1 · VM y direcciones: no mezclar dos DHCP

| Elemento | Regla | Ejemplo P07-L03 |
|---|---|---|
| Red Windows | `10.39.P.0/24` | `10.39.7.0/24` |
| VirtualBox interna | `SRI-W-Pxx` | `SRI-W-P07` |
| DHCP Windows previo | `10.39.P.(20+L)` | `10.39.7.23` |
| DNS Windows nuevo | `10.39.P.(30+L)` | `10.39.7.33` |
| Cliente manual inicial | `10.39.P.(120+L)` | `10.39.7.123` |
| Secundario opcional | `10.39.P.(40+L)` | `10.39.7.43` |
| Zona comparable | `pXX-lYY.sri.test` | `p07-l03.sri.test` |

```text
                 Red Interna SRI-W-P07
WDNS 2025  10.39.7.33 ----- Windows 11 cliente 10.39.7.123
                      \\ (posterior, NO a la vez que Kea)
                      DHCP Windows .23 (opción DNS .33)
```

**Importante:** el servidor DNS dedicado **no tiene que ser el servidor DHCP**. No clones dos servidores con la misma IP ni la misma MAC; si decides reunir roles en `.23` como proyecto, modifica el plan antes de usar estos pasos. Mientras aprendes DNS, una VM DNS `.33` y un cliente bastan.

<a id="instalacion"></a>
## 2 · Windows Server y dirección fija · clic a clic

1. VirtualBox → Nueva/Clonar VM Windows Server 2025 **con experiencia de escritorio**; genera MAC nueva.
2. VM apagada → Configuración → Red: NAT temporal para actualizaciones, segundo adaptador «Red interna» `SRI-W-P07`. Prohibido puente.
3. Inicia sesión como **Administrador**. `Windows+R` → `ncpa.cpl` → Enter.
4. Identifica NIC interna contrastando MAC con VirtualBox. Renómbrala `SRI-LAN` (clic derecho → Cambiar nombre).
5. `SRI-LAN` → Propiedades → **Protocolo de Internet versión 4 (TCP/IPv4)** → Propiedades.
6. «Usar la siguiente dirección IP»: IP `10.39.7.33`, máscara `255.255.255.0`; **gateway en blanco** y DNS preferido en blanco durante arranque. No modifiques NIC NAT.
7. Aceptar → Cerrar. En PowerShell **administrador**:

```powershell
Get-NetAdapter | Format-Table Name,MacAddress,Status
Get-NetIPAddress -InterfaceAlias 'SRI-LAN' -AddressFamily IPv4
Get-NetRoute -AddressFamily IPv4
ipconfig /all
```

8. Reinicia la VM, repite comprobación y crea instantánea `DNS-W00-IP-OK`.

> Si tu servidor ya viene del laboratorio DHCP Windows con dirección `.23`, no le agregues `.33` a ciegas: para estos apuntes se utiliza **VM DNS nueva `.33`**.

<a id="rol"></a>
## 3 · Instalar rol Servidor DNS (sin AD DS obligatorio)

1. Abre **Administrador del servidor** → Administrar → Agregar roles y características.
2. Instalación basada en roles/características → servidor local.
3. Marca **Servidor DNS** → Agregar características → Siguiente → Instalar.
4. Abre **Herramientas → DNS**. Comprueba el nombre de tu servidor en el árbol.
5. PowerShell elevado:

```powershell
Get-WindowsFeature DNS
Get-Service DNS
Get-DnsServerZone
```

Si el rol no está instalado, `Get-DnsServerZone` no funcionará. **AD DS y zona integrada en Active Directory no son obligatorios** para la práctica; utilizamos zona primaria **basada en archivo**, de modo que no pidamos una consola de dominio que aún no hemos montado.

<a id="directa"></a>
## 4 · Zona directa por GUI: primero aprende la consola

1. Administrador DNS → despliega servidor → clic derecho **Zonas de búsqueda directa** → Nueva zona.
2. Primaria → **no almacenar en AD** (si se muestra opción, requiere DC para integrarla) → siguiente.
3. Nombre: `p07-l03.sri.test` → crear archivo nuevo → **no permitir actualizaciones dinámicas** en este laboratorio inicial → Finalizar.
4. Clic derecho en zona → «Host nuevo (A o AAAA)»: `ns1` → `10.39.7.33`.
5. Antes de crear A de otros equipos, crea zona inversa, de modo que puedas marcar **«Crear registro del puntero (PTR) asociado»** para los hosts reales.

**No se supone que un registro de nombre implique servidor HTTP/correo ya instalado**: DNS guarda asociaciones, no arranca las aplicaciones.

<a id="inversa"></a>
## 5 · Zona inversa por GUI y prueba PTR

1. Clic derecho **Zonas de búsqueda inversa → Nueva zona**.
2. Zona primaria basada en archivo → IPv4 → Id. de red `10.39.7` (solo tres octetos, según asistente).
3. No permitir actualizaciones dinámicas → Finalizar. Zona esperada `7.39.10.in-addr.arpa`.
4. Vuelve a zona directa, elimina/recrea el `A ns1` **solo si realmente falta PTR** y marca «Crear registro PTR asociado», o crea PTR manualmente en inversa con owner `33` y destino `ns1.p07-l03.sri.test.`.
5. En cliente Windows 11 configura DNS preferido `10.39.7.33` en NIC interna, abre PowerShell:

```powershell
Resolve-DnsName ns1.p07-l03.sri.test -Server 10.39.7.33 -Type A
Resolve-DnsName 10.39.7.33 -Server 10.39.7.33 -Type PTR
nslookup ns1.p07-l03.sri.test 10.39.7.33
```

**Comprueba consulta directa e inversa por separado.** `ipconfig /all` demuestra DNS elegido; `Resolve-DnsName -Server` prueba el servidor consultado realmente.

<a id="registros"></a>
## 6 · A, CNAME, MX, NS y SOA (nivel equivalente BIND)

En zona directa → clic derecho:

| Registro | Qué se escribe para P07-L03 |
|---|---|
| A `cli` | `10.39.7.123` |
| A `web` | `10.39.7.53` |
| A `mail` | `10.39.7.63` |
| CNAME `www` | destino FQDN `web.p07-l03.sri.test` |
| MX del dominio (`@`/vacío) | `mail.p07-l03.sri.test`, prioridad 10 |
| NS | `ns1.p07-l03.sri.test` (no anuncies ns2 sin instalar) |
| SOA | comprueba master, correo del responsable, serial y temporizadores |

**GUI:** «Alias nuevo (CNAME)» para `www`; «Agente de intercambio de correo (MX)» para el correo; Propiedades de zona para SOA/NS. Consulta desde cliente `Resolve-DnsName ... -Type MX` y `... -Type CNAME`.

<a id="powershell"></a>
## 7 · PowerShell: mismo resultado, no dupliques la GUI

**En VM limpia/snapshot de antes de crear zonas**. Si ya creaste todo por GUI, usa solo cmdlets `Get-*` para observar; evita duplicar.

```powershell
$zone = 'p07-l03.sri.test'
$dns  = '10.39.7.33'
Add-DnsServerPrimaryZone -Name $zone -ZoneFile "$zone.dns"
Add-DnsServerPrimaryZone -NetworkID '10.39.7.0/24' -ZoneFile '7.39.10.in-addr.arpa.dns'
Add-DnsServerResourceRecordA -Name 'ns1' -ZoneName $zone -IPv4Address $dns -CreatePtr
Add-DnsServerResourceRecordA -Name 'cli' -ZoneName $zone -IPv4Address '10.39.7.123' -CreatePtr
Add-DnsServerResourceRecordA -Name 'web' -ZoneName $zone -IPv4Address '10.39.7.53'
Add-DnsServerResourceRecordA -Name 'mail' -ZoneName $zone -IPv4Address '10.39.7.63'
Add-DnsServerResourceRecordCName -Name 'www' -HostNameAlias "web.$zone" -ZoneName $zone
Add-DnsServerResourceRecordMX -Name '.' -MailExchange "mail.$zone" -Preference 10 -ZoneName $zone
Get-DnsServerZone
Get-DnsServerResourceRecord -ZoneName $zone
Resolve-DnsName "www.$zone" -Server $dns -Type CNAME
```

Los cmdlets pertenecen al módulo `DnsServer`. **Si no existe, instala/activa el rol y herramientas** en vez de copiar comandos de otra versión sin comprobar.

<a id="dhcp"></a>
## 8 · Integrar con el DHCP Windows que ya conocemos

Cuando `wdhcp` de UT01 está en **SRI-W-P07** en `.23` y DNS en `.33`, abre DHCP → IPv4 → ámbito → Opciones de ámbito → Configurar opciones:

- **006 Servidores DNS**: `10.39.7.33`.
- **015 Nombre de dominio DNS**: `p07-l03.sri.test`.
- **003 Router**: **omitir si no existe gateway real** en el laboratorio; no uses `.254` porque lo viste en otro ejercicio.

**Atención al cambiar de IP manual a DHCP:** el registro `cli A 10.39.7.123` representa el cliente de la fase manual; si ahora recibe otra IP del ámbito, no afirmes que dicho nombre se actualizará solo. Para el primer control usa `ns1` (IP fija `.33`) o actualiza A/PTR conscientemente. El DDNS automático es un laboratorio distinto.

Renueva un cliente Windows:

```powershell
ipconfig /release
ipconfig /renew
ipconfig /all
Resolve-DnsName ns1.p07-l03.sri.test -Server 10.39.7.33 -Type A
```

**Prueba doble:** ACK muestra opción 006/015, `Resolve-DnsName` demuestra que el DNS posee registros. Una cosa sin la otra no cumple integración funcional.

<a id="secundario"></a>
## 9 · Transferencia y secundario (ampliación)

**Usa tercera VM con IP `.43`** y nueva MAC, en la misma red aislada. En primario → zona → Propiedades → Transferencias de zona: habilita **solo al servidor autorizado**; configuración de notificaciones si procede.

En secundario → DNS → Nueva zona → **Secundaria** → mismo nombre → IP del primario `.33`. Repite para inversa si la práctica lo exige. Consulta ambos explícitamente antes de simular caída y comprueba SOA/serial. No llames «secundario» a una segunda zona primaria sin transferencia. Si el primario es BIND9, exige TCP/53/ACL/compatibilidad; no presupongas que Windows/Linux deben compartir mismo nombre de zona si están en LAN distintas.

<a id="cache"></a>
## 10 · Reenviadores, caché y seguridad

En Administrador DNS → clic derecho servidor → Propiedades → Reenviadores: **solo cuando exista salida real por NAT** y esté permitido, añade upstream de la práctica. Si no hay red externa, comprueba zona local y no prometas resolución de dominios públicos.

Revisar `Get-DnsServerForwarder`, consultar `Resolve-DnsName example.org -Server 10.39.7.33` dos veces y explicar TTL; no afirmar que el segundo siempre tarda 0 ms. Una zona primaria autoritativa y una respuesta recursiva con caché no son lo mismo. Restringe la recursión al ámbito de confianza y no publiques DNS como resolver abierto.

<a id="diagnostico"></a>
## 11 · Diagnóstico y consolidación

| Síntoma | Dónde mirar |
|---|---|
| `Resolve-DnsName` timeout | VirtualBox, NIC IP, servicio DNS, firewall UDP/TCP 53. |
| `NXDOMAIN` | Nombre completo, tipo de registro, zona, caché negativa. |
| No hay PTR | zona inversa y creación de PTR. |
| MX apunta a IP | error: MX debe apuntar a nombre de host con A/AAAA. |
| DHCP entrega DNS antiguo | opción 006 y renovación, `ipconfig /all`. |
| Secundario vacío | transferencia habilitada y permitida desde IP, TCP 53, serial. |
| Consulta externa falla | NAT, reenviadores, recursión, firewall. |

Cierra un **ticket**: síntoma, 3 hipótesis, prueba discriminante, dato, cambio mínimo, misma prueba, rollback. La entrega se realiza en Moodle con variante P/L y defensa individual.

### Referencias

- [Microsoft Learn · instalar DNS](https://learn.microsoft.com/es-es/windows-server/networking/dns/quickstart-install-configure-dns-server)
- [Microsoft Learn · administrar zonas](https://learn.microsoft.com/en-us/windows-server/networking/dns/manage-dns-zones)
- [Microsoft Learn · registros](https://learn.microsoft.com/es-es/windows-server/networking/dns/manage-resource-records)
- [BOE · RA1 del módulo 0375](https://www.boe.es/buscar/doc.php?id=BOE-A-2009-18355)
