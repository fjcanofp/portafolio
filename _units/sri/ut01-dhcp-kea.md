---
title: 'UT01 · Configuración automática de IPs: DHCP con Kea'
description: 'DHCPv4 con Kea en Debian 13: DORA, instalación guiada, pools individualizados, reservas, leases, diagnóstico y relay.'
summary: 'Diseño, implantación y diagnóstico de DHCP con Kea; después la misma competencia en Windows Server 2025.'
module_key: sri
cycle_key: asir
order: 1
module_title: Servicios de Red e Internet
module_code: '0375'
cycle_title: Administración de Sistemas Informáticos en Red
course: 2.º ASIR
unit: UT01
hours: 12
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
  - kea
  - debian-13
  - dora
  - reservas
  - relay
  - diagnostico
permalink: /docencia/asir/sri/ut01/
published: true
toc:
  - title: Misión y recorrido
    id: introduccion
  - title: RA y CE
    id: ra-ce
  - title: Individualización
    id: individualizacion
  - title: Laboratorio y prerrequisitos
    id: prerrequisitos
  - title: DORA y leases
    id: dora-y-leases
  - title: Instalación de Kea
    id: instalacion-de-kea
  - title: Configuración mínima
    id: configuracion-minima
  - title: Validación
    id: validacion
  - title: Clientes
    id: clientes
  - title: Evidencias DHCP
    id: evidencias-dhcp
  - title: Reservas
    id: reservas
  - title: Relay básico
    id: relay-basico
  - title: Diagnóstico
    id: diagnostico
  - title: Client classes
    id: client-classes
  - title: Relay y multisubred
    id: relay-y-multisubred
  - title: Kea HA
    id: kea-ha
  - title: Relay + HA
    id: relay-ha
  - title: Equivalencias ISC/Kea
    id: equivalencias-isc-kea
  - title: Ruta de aprendizaje
    id: ruta-de-aprendizaje
  - title: Ampliaciones
    id: ampliaciones
---

<a id="introduccion"></a>
## Introducción · una misma competencia, dos plataformas

**Misión:** transformar el laboratorio de IP fija de [UT00](/docencia/asir/sri/ut00/) en un servicio de configuración automática. Primero lo haremos con **Kea en Debian 13** y después con [DHCP en Windows Server 2025](/docencia/asir/sri/ut01-windows/). Ambas implementaciones pertenecen a **UT01 / RA2** y son obligatorias; relay y alta disponibilidad se desarrollan progresivamente según el nivel del grupo.

**Tres logros que debes demostrar:** (1) el cliente obtiene datos correctos, (2) podemos mostrar la conversación DHCP y (3) sabemos averiguar **por qué** algo falla.

| Fase | Máquinas simultáneas | Alcance |
|---|---:|---|
| Kea + un cliente | **2** | Núcleo obligatorio, DORA y reserva |
| Cliente Windows alternativo | **2** (por turnos) | Comparación de clientes |
| Kea + relay + cliente LAN B | **3** | Ampliación de dos redes |
| Kea principal + standby + cliente | **3** | HA avanzada, solo tras dominar núcleo |

> **Seguridad:** todas las interfaces que sirven DHCP están en **Red Interna**, nunca en «Adaptador puente». Windows DHCP utilizará una red de VirtualBox **distinta** para que ambos servidores no compitan por error.

<a id="ra-ce"></a>
## 1. RA2 y criterios de evaluación: qué evidencia aporta cada bloque

**RA2:** administra servicios de configuración automática, identificándolos y verificando la correcta asignación de parámetros.

| CE | Evidencia de aprendizaje |
|---|---|
| RA2.a | Comparación manual/DHCP, planificación de IP y riesgos |
| RA2.b | Secuencia DORA y renovación, paquete/identificador interpretado |
| RA2.c | Kea instalado, servicio identificado y gestionado |
| RA2.d | Pool válido y concesión obtenida por cliente real |
| RA2.e | Dirección dinámica y reserva por identidad |
| RA2.f | Opciones coherentes y configuración de varias redes cuando proceda |
| RA2.g | Topología, registros, pruebas, incidencia y recuperación |

La rúbrica, los enunciados individualizados y las entregas concretas se publican en Moodle. Esta web es material de **aprendizaje guiado**, no el solucionario de las tareas.

<a id="individualizacion"></a>
## 2. Datos propios: antes de instalar, calcula tu red

Mantén la regla de UT00: `P` = puesto 01–40 y `L` = inicial del primer apellido A=01 … Z=26.

| Elemento | Fórmula | Ejemplo **P07-L03** |
|---|---|---|
| LAN A | `10.37.P.0/24` | `10.37.7.0/24` |
| Servidor Kea | `10.37.P.(20+L)` | `10.37.7.23` |
| Pool A | `10.37.P.(100+P)` a `10.37.P.(129+P)` | `.107` a `.136` |
| Reserva | `10.37.P.(180+L)` | `.183` |
| Lease | `1800 + 60×L` | `1980 s` = 33 min |
| T1 | `floor(lease/2)` | `990 s` |
| T2 | `floor(lease×7/8)` | `1732 s` |
| LAN B, ampliación | `10.38.P.0/24` | `10.38.7.0/24` |
| Relay lado A / B | `10.37.P.254` / `10.38.P.254` | `10.37.7.254` / `10.38.7.254` |
| Pool B | mismos sufijos que A | `10.38.7.107` a `.136` |

**Comprobación razonada P07-L03:** la red y broadcast son `.0`/`.255`; `.23` es el servidor, `.107–.136` son 30 IP dinámicas, `.183` es reserva y `.254` se utilizará **solo cuando exista un router/relay real**. No anuncies `.254` por DHCP en la LAN A básica.

<a id="prerrequisitos"></a>
## 3. Prepara el laboratorio ANTES de Kea

```text
Servidor Debian 13: NIC NAT (actualizaciones) + NIC interna SRI-P07 (10.37.7.23/24)
                                    │
                             switch SRI-P07
                                    │
Cliente Debian o Windows: NIC interna SRI-P07 (IPv4 AUTOMÁTICO en esta UT)
```

1. En VirtualBox, comprueba que **ambas** NIC internas se llaman exactamente `SRI-Pxx`.
2. Arranca servidor. Debe conservar el snapshot `10_RED_OK` y la IP fija. Ejecuta:

```bash
ip -br link
ip -br address
ip route
systemctl is-active networking
```

3. **Deja la IP fija del servidor**; DHCP no significa que el propio servidor deba solicitar su IP al DHCP que instalará.
4. En cliente, **retira la IP manual de UT00** y selecciona IPv4 automática. No intentes descubrir DHCP si el cliente sigue configurado manualmente.
5. Si aún necesitas instalar paquetes, mantén NAT solo en el servidor. Si aparece un DHCP inesperado, comprueba que no has conectado el cliente a NAT u otra red con DHCP virtual.

**Resultado esperado antes de instalar:** servidor `10.37.7.23/24`, cliente preparado para solicitar DHCP, **ningún otro DHCP** atendiendo `SRI-P07`.

<a id="dora-y-leases"></a>
## 4. ¿Qué es DHCP? DORA, puertos, pool y concesión

Sin DHCP habría que escribir IP, máscara, gateway y DNS en todos los clientes y evitar direcciones duplicadas. DHCP distribuye **parámetros de configuración** de forma controlada; **no proporciona Internet ni crea por sí mismo un router o DNS**.

```text
CLIENTE                                 SERVIDOR KEA
   | --- DHCPDISCOVER (¿hay DHCP?) --------> |
   | <--- DHCPOFFER (te ofrezco .107) ----- |
   | --- DHCPREQUEST (elijo oferta) ------> |
   | <--- DHCPACK (confirmación) ---------- |
```

| Concepto | Significado / comprobación |
|---|---|
| UDP 67 / 68 | Puerto del servidor / cliente DHCPv4 |
| Pool | Conjunto de direcciones disponibles para asignación dinámica |
| Reserva DHCP | Una identidad concreta recibe IP determinada; el cliente **sigue en automático** |
| Lease | Tiempo de validez de la concesión |
| T1 | Intento de renovación con el servidor conocido |
| T2 | Rebinding: búsqueda más amplia si no se renovó |
| `xid` | Identificador de transacción; relaciona los mensajes |
| `yiaddr` | IP ofrecida/asignada al cliente |
| Opción 54 | Identidad del servidor DHCP que hizo la oferta |
| Opciones 51/58/59 | Lease / T1 / T2, cuando se entregan |

**Ejemplo P07-L03:** 0 s obtiene lease; T1=990 s (16 min 30 s); T2=1732 s (28 min 52 s); caduca a 1980 s (33 min) si no se renueva. Debe cumplirse `0 < T1 < T2 < lease`. Durante renovación no siempre se repite el DORA completo.

<a id="instalacion-de-kea"></a>
## 5. Instala Kea en Debian 13 · paso a paso

**Todos estos comandos se ejecutan en la TERMINAL del SERVIDOR**, salvo los bloques etiquetados CLIENTE.

1. Comprueba NAT y actualiza listas:

```bash
ip route
sudo apt update
```

2. Instala servidor DHCP4 y herramientas de captura:

```bash
sudo apt install -y kea-dhcp4-server kea-common tcpdump
```

3. Identifica versión, archivos y unidad:

```bash
apt policy kea-dhcp4-server
kea-dhcp4 -V
systemctl status kea-dhcp4-server --no-pager
dpkg -L kea-dhcp4-server | grep -E 'conf|service'
```

4. Guarda una copia **antes** de sustituir la configuración inicial:

```bash
sudo cp /etc/kea/kea-dhcp4.conf /etc/kea/kea-dhcp4.conf.bak-ut01
```

**Si `apt update` no funciona:** revisa NAT y `ip route`; no uses una IP interna ficticia como gateway. **Si el paquete no se encuentra:** comprueba repositorios y versión Debian (`cat /etc/os-release`) en vez de mezclar instrucciones de Ubuntu.

<a id="configuracion-minima"></a>
## 6. Fase A · Configura SOLO LAN A: primer DHCP funcional

**Primero un caso pequeño que se pueda diagnosticar.** No añadas reserva, LAN B, clasificación ni HA hasta obtener una lease normal.

1. En el servidor averigua **tu** NIC interna: `ip -br address`. **No copies `enp0s8` si tu NIC tiene otro nombre.**
2. Edita:

```bash
sudo nano /etc/kea/kea-dhcp4.conf
```

3. Sustituye el contenido del fichero por el ejemplo **P07-L03** siguiente (cambia todos los valores individuales):

```json
{
  "Dhcp4": {
    "interfaces-config": {
      "interfaces": ["enp0s8"]
    },
    "lease-database": {
      "type": "memfile",
      "persist": true,
      "name": "/var/lib/kea/kea-leases4.csv"
    },
    "valid-lifetime": 1980,
    "renew-timer": 990,
    "rebind-timer": 1732,
    "subnet4": [
      {
        "id": 1,
        "subnet": "10.37.7.0/24",
        "pools": [
          {"pool": "10.37.7.107 - 10.37.7.136"}
        ]
      }
    ]
  }
}
```

4. Guarda en `nano`: `Ctrl+O`, `Enter`, `Ctrl+X`.

**Qué hace cada apartado:** `interfaces-config` elige NIC de escucha; `lease-database` conserva concesiones; `valid-lifetime`/T1/T2 gestionan tiempos; `subnet4` declara la red y `pools` el intervalo dinámico.

**No introducimos gateway ni DNS en esta fase.** En la LAN A básica todavía no existe el router `.254` ni tenemos desplegado el BIND9 de UT02. Un cliente puede recibir IP correcta y no tener salida a Internet: es exactamente lo previsto en la red aislada.

<a id="validacion"></a>
## 7. Valida, aplica y comprueba (no saltes de editar a «funciona»)

Desde el **servidor**, ejecuta los pasos **en orden**:

```bash
sudo /usr/sbin/kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
```

**Si sale un error:** no reinicies todavía. Revisa nombre de interfaz, rutas, llaves, comas de JSON y `subnet4`. En algunas instalaciones de aula, la validación como root puede encontrar restricciones de permisos/AppArmor: investiga `systemctl cat kea-dhcp4-server` y `namei -l /etc/kea/kea-dhcp4.conf`; **solo si existe el usuario `_kea` y tiene acceso**, prueba:

```bash
id _kea
sudo -u _kea /usr/sbin/kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
```

Cuando la validación sea correcta:

```bash
sudo systemctl restart kea-dhcp4-server
systemctl --no-pager --full status kea-dhcp4-server
sudo journalctl -u kea-dhcp4-server -b --no-pager -n 50
```

**Resultado esperado:** `active (running)` sin errores recientes de interfaz/subred, pero eso aún **NO** prueba que DHCP haya concedido una IP.

```bash
sudo ss -lunp | grep ':67'
```

Este último comando es **auxiliar**: Kea puede usar sockets raw; que no aparezca una línea UDP/67 convencional no basta para declarar el servicio roto.

<a id="clientes"></a>
## 8. Comprueba desde un CLIENTE real (Debian o Windows)

### Cliente Debian 13 mínimo · Ruta A (ifupdown)

1. Si el cliente conservó la IP manual, edita su configuración por el mismo gestor identificado en UT00:

```bash
ip -br link
systemctl is-active networking
sudo nano /etc/network/interfaces
```

2. Para la NIC **interna del cliente**, sustituye el bloque estático por uno como este (aquí el ejemplo usa `enp0s3`; comprueba el real):

```text
auto enp0s3
iface enp0s3 inet dhcp
```

3. Aplica en la **consola local del cliente**, no en el servidor:

```bash
sudo systemctl restart networking
ip -br address
ip route
```

**Si no obtiene IP:** comprueba si existe un cliente DHCP (`command -v dhcpcd; command -v dhclient`), y el servicio `networking`. No instales NetworkManager solo por copiar `nmcli`. La forma más clara de ver un DORA nuevo es comenzar la captura del servidor con el cliente **apagado** y arrancarlo después.

### Cliente Windows 11 · Ruta gráfica

1. Arranca **solo** el cliente Windows conectado a `SRI-Pxx`, no a `SRI-W-Pxx`.
2. `Windows + R` → escribe `ncpa.cpl` → Enter.
3. Clic derecho sobre la NIC del laboratorio → **Propiedades** → «Protocolo de Internet versión 4 (TCP/IPv4)» → **Propiedades**.
4. Selecciona **Obtener una dirección IP automáticamente** y, cuando corresponda, **Obtener la dirección del servidor DNS automáticamente** → Aceptar.
5. Abre CMD como usuario normal:

```bat
ipconfig /all
```

6. Si necesitas forzar una nueva adquisición y solo tienes NIC de laboratorio:

```bat
ipconfig /release
ipconfig /renew
ipconfig /all
```

**Resultado esperado:** IP dentro del pool de **tu variante**, máscara `/24` y servidor DHCP `10.37.P.(20+L)`. En LAN A básica puede no aparecer puerta de enlace ni DNS interno; no es un fallo del DHCP en este escenario.

> Si Windows tiene varias NIC, no ejecutes `/release` indiscriminadamente sobre la NIC usada para conectarte al equipo; identifica el adaptador de laboratorio.

<a id="evidencias-dhcp"></a>
## 9. ¿Cómo demuestro que hay DHCP y no solo una IP cualquiera?

Desde el **servidor**, antes de encender o renovar el cliente:

```bash
ip -br address
sudo tcpdump -ni enp0s8 'udp port 67 or udp port 68'
```

Para guardar una PCAP en un directorio de trabajo del usuario:

```bash
cd ~
sudo tcpdump -ni enp0s8 -w ut01-dora.pcap 'udp port 67 or udp port 68'
```

Detén con `Ctrl+C`; si el fichero quedó propiedad de root, consulta con `sudo tcpdump -nn -r ut01-dora.pcap` o ajusta permisos para su análisis. En Wireshark usa filtro `dhcp` o `bootp` según versión.

Comprueba también la base de concesiones **en el servidor**:

```bash
sudo tail -n 12 /var/lib/kea/kea-leases4.csv
```

| Fuente | Qué acredita |
|---|---|
| Captura | Qué paquetes circularon y qué servidor respondió (Option 54) |
| CSV de Kea | Qué concesión registró Kea |
| `ip -br a` / `ipconfig /all` | Qué aplicó finalmente el cliente |

Correlaciona `xid`, `chaddr`/client-id, `yiaddr`, Option 54, lease y dirección final. Un DHCP Discover sin Offer orienta hacia interfaz, pool, subred o servicio; ni la captura ni `active` son suficientes por sí solas.

<a id="reservas"></a>
## 10. Fase B · Reserva DHCP por identidad

**Pregunta:** ¿cómo hacer que un equipo concreto obtenga siempre `.183` sin escribirle IP fija manual?

1. Obtén la **MAC real de la NIC de laboratorio del cliente**: Linux `ip link`; Windows `ipconfig /all`. **No utilices la MAC NAT ni copies la del ejemplo.**
2. Crea una copia del Kea funcional:

```bash
sudo cp /etc/kea/kea-dhcp4.conf /etc/kea/kea-dhcp4.conf.lana-ok
sudo nano /etc/kea/kea-dhcp4.conf
```

3. Dentro del **objeto de LAN A**, después del array `pools`, añade la coma separadora y la nueva clave (fragmento del ejemplo):

```json
"pools": [
  {"pool": "10.37.7.107 - 10.37.7.136"}
],
"reservations": [
  {
    "hw-address": "08:00:27:aa:bb:cc",
    "ip-address": "10.37.7.183",
    "hostname": "res-p07-l03"
  }
]
```

4. Sustituye MAC/IP/nombre por tu variante; valida y aplica siguiendo **apartado 7**.
5. Fuerza nueva adquisición en el cliente, o usa otro identificador si retiene una concesión antigua. Comprueba ACK, dirección final y lease. La reserva está **fuera del pool dinámico, pero dentro de la subred**.

**Si recibe otra IP:** revisa identidad cliente (MAC/client-id), si renovó realmente, que no haya otro DHCP y los logs Kea. Cambiar el hostname del cliente **no sustituye** a configurar la identidad usada en la reserva.

### Fase C · Opción de dominio sin inventar DNS

En el objeto de `subnet4` LAN A, agrega —con comas JSON correctas—:

```json
"option-data": [
  {"name": "domain-name", "data": "p07-l03.sri.test"}
]
```

Ese sufijo **no hace que el dominio ya resuelva**. La opción DNS (6) se añadirá al integrar servidores BIND reales en UT02; la opción router (3) solo cuando exista pasarela real.

<a id="relay-basico"></a>
## 11. Relay básico: ¿por qué hace falta una tercera VM?

**Ampliación posterior al núcleo:** en LAN B el Discover inicial es broadcast y no atraviesa un router normal. El **relay** lo reenvía hacia Kea, y `giaddr` permite saber desde qué subred llegó.

```text
LAN A 10.37.7.0/24                           LAN B 10.38.7.0/24
KEA 10.37.7.23 ── RELAY (10.37.7.254 | 10.38.7.254) ── CLIENTE DHCP
```

**Máquinas simultáneas:** 3: servidor Kea, Debian relay/router con dos tarjetas internas y cliente B. No agregues la LAN B al escenario básico hasta que la LAN A funcione.

<a id="diagnostico"></a>
## 12. Diagnóstico DHCP por capas

| Síntoma | Prueba discriminante | Posible causa |
|---|---|---|
| Cliente con IP manual | Ajustes de NIC | No está usando DHCP |
| Descubre, pero Kea no ve paquetes | Captura NIC interna | Red VirtualBox / NIC equivocada |
| Kea ve Discover, no Offer | Validación + logs + pool | No selecciona red, fallo de servicio o política |
| Offer pero no ACK | PCAP xid/opción 54 | Cliente eligió otra oferta o negociación interrumpida |
| IP correcta pero sin Internet | `ip route`, topología | La LAN A no tiene gateway real; es previsto |
| Reserva no aplicada | MAC/ClientId, leases | Identidad incorrecta o lease antigua |
| `169.254.x.x` Windows | DORA y `ipconfig /all` | No ha obtenido IPv4 utilizable por DHCP |

**Método común de todo SRI:** síntoma → hipótesis → prueba → dato → cambio mínimo → repetir la misma prueba → documentar.

<a id="client-classes"></a>
## 13. Clasificación de clientes · ampliación profesional

Kea permite asociar clientes a clases y aplicar diferentes políticas. Esta ampliación se plantea **solo cuando una única subred, un único pool y una reserva funcionen**. No es necesario aprender de memoria un JSON complejo antes de comprender quién hace Offer y cuál es el ámbito de la política.

Caso para razonar: dos categorías de equipos reciben diferentes opciones o rangos, con **dificultad equivalente** para cada alumno. Se debe mostrar la identidad que Kea utilizó, el pool aplicado y el paquete ACK. Documentación: [Kea ARM](https://kea.readthedocs.io/).

<a id="relay-y-multisubred"></a>
## 14. Relay y multisubred · implantación guiada de ampliación

**Comprueba las tres VM antes de instalar ningún paquete:** en relay NIC-A `10.37.7.254/24`, NIC-B `10.38.7.254/24` y cliente conectado **solo a LAN B**. En el servidor Kea mantiene `.23/24` y debe tener ruta de retorno hacia LAN B por `.254`.

1. Identifica las dos NIC **en el relay** con `ip -br a`. Configúralas con tu gestor real, igual que en UT00; **no inventes nombres**.
2. Activa forwarding en **relay**, no en el cliente:

```bash
sudo sysctl -w net.ipv4.ip_forward=1
printf 'net.ipv4.ip_forward=1\n' | sudo tee /etc/sysctl.d/90-sri-relay.conf
sudo sysctl --system
```

3. En **servidor Kea**, ruta al otro segmento (ejemplo P07):

```bash
sudo ip route replace 10.38.7.0/24 via 10.37.7.254
ip route get 10.38.7.120
```

Esta ruta con `ip route` no es persistente por sí sola: si el escenario debe conservarse tras reiniciar, añádela usando el gestor real de la NIC o guarda snapshot de la topología. **La NAT no sustituye esta ruta explícita.**

4. En el **relay Debian**, instala el agente de laboratorio:

```bash
sudo apt update
sudo apt install isc-dhcp-relay
```

Durante instalación, configura servicio solo si tienes ya todos los datos; para una demostración en primer plano evita ejecutar **dos instancias simultáneas**: detén el servicio instalado si está activo y después inicia el proceso:

```bash
sudo systemctl stop isc-dhcp-relay 2>/dev/null || true
sudo dhcrelay -4 -d -id NIC_B_REAL -iu NIC_A_REAL 10.37.7.23
```

Sustituye ambos nombres de NIC por los del relay. `isc-dhcp-relay` es **software heredado/deprecado** en Debian 13 que usamos aquí como agente didáctico; nuestro servidor sigue siendo Kea.

5. En **Kea**, añade un segundo elemento dentro del array `subnet4` (¡no reemplaces el de LAN A!). Ejemplo del **objeto** de LAN B:

```json
{
  "id": 2,
  "subnet": "10.38.7.0/24",
  "pools": [
    {"pool": "10.38.7.107 - 10.38.7.136"}
  ],
  "option-data": [
    {"name": "routers", "data": "10.38.7.254"}
  ]
}
```

6. Valida Kea y vuelve a probar desde cliente LAN B con IPv4 automática. **Resultado esperado:** IP de `10.38.7.107–136`; en PCAP aparece `giaddr=10.38.7.254`; `ip route` en cliente refleja gateway **real** `.254`.

**Prueba negativa:** detén el relay y fuerza una nueva adquisición; documenta que el servidor central ya no recibe directamente los broadcasts de LAN B. No confundas «router» (tráfico IP entre redes) con «relay» (reenvío DHCP): aunque la misma VM desempeñe ambos roles, son funciones diferentes.

<a id="kea-ha"></a>
## 15. Alta disponibilidad de Kea · ampliación, después del núcleo

**Problema distinto del relay:** relay permite llegar a otras subredes; HA busca continuidad cuando un servidor falla. Requiere **dos servidores Kea coordinados** y un cliente; no consiste en poner dos DHCP independientes compitiendo en la misma LAN.

Antes de abordar HA: copia de los dos ficheros, snapshot, red correctamente aislada, configuración y hooks compatibles con la **versión Kea de Debian instalada**. Revisa documentación oficial de [Kea High Availability](https://kea.readthedocs.io/) y registra estado primary/standby, sincronización de concesiones, caída controlada y recuperación. No copies la directiva `failover peer` de ISC DHCP a JSON Kea: pertenecen a implementaciones distintas.

<a id="relay-ha"></a>
## 16. Relay + HA · integración avanzada

Combina dos problemas que **ya funcionaban por separado**: servidor central disponible y subred remota atendida por relay. Implanta en orden: HA en LAN A → relay en LAN B → rutas y opciones → parada controlada del principal → prueba cliente LAN B → recuperación. Hazlo solo si existen tiempo, recursos y una topología documentada.

<a id="equivalencias-isc-kea"></a>
## 17. Equivalencia de conceptos ISC DHCP ↔ Kea

| Concepto | ISC DHCP histórico | Kea |
|---|---|---|
| Subred | `subnet … netmask …` | `subnet4[].subnet` |
| Rango | `range` | `pools[].pool` |
| Reserva | `host` / `fixed-address` | `reservations` |
| Opciones | `option …` | `option-data` |
| Concesiones | `dhcpd.leases` | `memfile` CSV o backend de BD |
| Alta disponibilidad | Sintaxis específica ISC | Kea HA hook, diseño y versión correspondientes |

El servidor histórico `isc-dhcp-server` no es la implementación nueva de referencia del módulo: estudiamos sus declaraciones para leer configuraciones heredadas y entender una migración.

<a id="ruta-de-aprendizaje"></a>
## 18. Ruta de aprendizaje y transición a Windows Server

```text
IP fija del SERVIDOR y cliente automático
    ↓
Kea mínimo + cliente con primera lease
    ↓
DORA + CSV + estado cliente
    ↓
Reserva + opciones reales
    ↓
Diagnóstico y prueba negativa
    ↓
RELAY / clases / HA (ampliaciones, después del núcleo)
    ↓
DHCP WINDOWS SERVER 2025 (segunda implementación obligatoria del RA2)
    ↓
UT02 DNS: configurar Option 6 SOLO tras desplegar DNS real
```

<a id="ampliaciones"></a>
## 19. Banco de ampliación opcional y cierre

- **A01** · Migración documentada de configuración ISC DHCP heredada a Kea.
- **A02** · Forense de PCAP con **dos servidores DHCP independientes**: Option 54 y política inesperada, solo en red aislada. **No confundir con HA.**
- **A03** · Dimensionar pool/lease ante variación del número de clientes.
- **A04** · Volver a Option 6 y resolución DNS **real** tras UT02.
- **A05** · Distinguir DHCPv4, SLAAC y DHCPv6.
- **A06** · Monitorización/operación con Stork, cuando versión y recursos lo permitan.
- **A07** · Change request de ampliación de capacidad conservando reservas.

**Criterio de cierre:** un alumno domina Kea cuando es capaz de **diseñar**, **implantar**, **observar**, **explicar** y **diagnosticar** el servicio, no solo cuando ve una dirección IP. El bloque equivalente de [Windows Server 2025](/docencia/asir/sri/ut01-windows/) completa la UT01; **UT02 es DNS**.

### Referencias oficiales

- [ISC Kea Administrator Reference Manual](https://kea.readthedocs.io/)
- [Debian 13 · kea-dhcp4-server](https://packages.debian.org/trixie/kea-dhcp4-server)
- [Debian 13 · isc-dhcp-relay (legado)](https://packages.debian.org/trixie/isc-dhcp-relay)
- [RFC 2131 · DHCPv4](https://www.rfc-editor.org/rfc/rfc2131)
- [Microsoft Learn · DHCP Windows Server](https://learn.microsoft.com/es-es/windows-server/networking/technologies/dhcp/quickstart-install-configure-dhcp-server)

**Material público para el alumnado · Fco. Javier Cano Granado · versión 2.1 · 23/09/2026.**
