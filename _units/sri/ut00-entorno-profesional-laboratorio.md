---
title: 'UT00 · Entorno profesional, laboratorio y diagnóstico'
description: 'Preparación guiada de VirtualBox y Debian 13: NIC NAT, red interna, IP fija, cliente y diagnóstico comprobable.'
summary: 'Preparar servidor y cliente de SRI antes de instalar Kea: IP fija, redes aisladas y pruebas verificables.'
module_key: sri
cycle_key: asir
order: 0
module_title: Servicios de Red e Internet
module_code: '0375'
cycle_title: Administración de Sistemas Informáticos en Red
course: 2.º ASIR
unit: UT00
hours: 4
level: inicial
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
  - RA2.g
tags:
  - virtualbox
  - debian-13
  - redes
  - ip-estatica
  - diagnostico
permalink: /docencia/asir/sri/ut00/
published: true
toc:
  - title: Objetivo y recorrido
    id: introduccion
  - title: Datos individuales
    id: individualizacion
  - title: Redes y tarjetas VirtualBox
    id: topologia
  - title: Inventario de Debian
    id: inventario
  - title: Ruta A · ifupdown
    id: ruta-a
  - title: Ruta B · NetworkManager
    id: ruta-b
  - title: Ruta C · networkd
    id: ruta-c
  - title: Gateway y comprobación
    id: gateway
  - title: Cliente y ping
    id: cliente
  - title: HTTP de prueba
    id: http
  - title: Diagnóstico y cierre
    id: diagnostico
---

<a id="introduccion"></a>
## Introducción · para qué sirve UT00

**Misión:** preparar el laboratorio individual que utilizaremos en DHCP, DNS y servicios web. Esta unidad es introductoria y transversal: no pretende añadir un RA nuevo. Las prácticas evaluables y entregas específicas se indican en Moodle.

**Ruta mínima que sí realizaremos:** configurar VirtualBox → reconocer NIC → IP fija por **una sola** de las tres rutas → cliente con IP manual → ping → HTTP temporal → snapshot.

**Ampliación para comprender otras instalaciones:** NetworkManager y systemd-networkd. **No tienes que ejecutar las tres rutas de configuración sobre la misma tarjeta.**

| Máquinas encendidas | Función | Imprescindible |
|---|---|---|
| Servidor Debian 13 | IP fija, servicio temporal | Sí |
| Cliente Debian 13 o Windows | Probar otro equipo, no `localhost` | Sí |

### ¿Qué debe funcionar al acabar?

- El servidor tiene una IP privada que **persiste tras reiniciar**.
- El cliente lo alcanza por `ping` y accede por HTTP cuando hay un servicio escuchando.
- Sabes explicar por qué un servicio puede fallar aunque funcione `ping`.
- Guardas `00_BASE` antes de intervenir y `10_RED_OK` cuando todo esté probado.

<a id="individualizacion"></a>
## 1. Datos individuales Pxx-Lyy

`P` = número de puesto, de 01 a 40; `L` = inicial del **primer apellido** normalizada A=01 … Z=26. En los nombres usa siempre dos dígitos; en las IP usa el número sin cero inicial.

| Concepto | Fórmula individual | Ejemplo **P07-L03** |
|---|---|---|
| Red interna | `10.37.P.0/24` | `10.37.7.0/24` |
| Servidor | `10.37.P.(20+L)` | `10.37.7.23/24` |
| Cliente inicial | `10.37.P.(120+L)` | `10.37.7.123/24` |
| Puerto web temporal | `8000+P` | `8007` |
| Red VirtualBox | `SRI-Pxx` | `SRI-P07` |
| Host Debian | `srv-pXX-lYY` | `srv-p07-l03` |

> **No copies P07-L03 si no es tu variante.** La IP del cliente es **manual solamente en UT00**. En UT01 habrá que retirarla para probar DHCP.

**¿Por qué el nombre `SRI-P07`?** No es una IP ni el hostname: es el nombre del **switch virtual privado** al que conectamos servidor y cliente. Si uno está en `SRI-P07` y otro en `SRI-P08`, no comparten esa red.

**¿Para qué sirve `srv-p07-l03`?** Identifica el sistema, no sustituye al DNS ni garantiza que otros equipos resuelvan ese nombre.

<a id="topologia"></a>
## 2. Redes y tarjetas en VirtualBox · clic a clic

```text
Internet ── NAT / NIC 1 ── [ SERVIDOR DEBIAN ] ── NIC 2 / Red interna «SRI-P07»
                                                        │
                                                    [ CLIENTE ]
                                            NIC 1 / Red interna «SRI-P07»
```

**NAT** permite al servidor actualizar/instalar paquetes; **Red Interna** aísla nuestras pruebas de la red física. No actives un servidor DHCP de laboratorio en **Adaptador puente**: podría responder a equipos de la red del centro.

1. Apaga las VM. VirtualBox → selecciona servidor → **Configuración → Red → Adaptador 1**: habilitado, «Conectado a: NAT».
2. Servidor → **Adaptador 2**: habilitado, «Conectado a: Red interna», nombre exacto `SRI-Pxx`, «Cable conectado».
3. Cliente → **Adaptador 1**: habilitado, «Red interna», exactamente `SRI-Pxx`. Para el ejercicio inicial, no necesita NAT.
4. Arranca ambas VM. Verifica el resultado en el sistema operativo.

**Si no se comunican:** revisa primero el **nombre exacto** de Red Interna y que ambas tarjetas tengan el cable virtual conectado. NAT y Red Interna **no son lo mismo**.

<a id="inventario"></a>
## 3. Inventario en Debian 13: ¿cómo se llama mi tarjeta?

Abre la **terminal del servidor**, no la del cliente. Si tu cuenta no tiene `sudo`, entra como administrador según indique el profesor; los comandos de consulta no lo necesitan.

```bash
hostnamectl
ip -br link
ip -br address
ip route
```

Un ejemplo habitual es `enp0s3` para NAT y `enp0s8` para la interna, **pero no lo supongas**. En VirtualBox puedes comparar la MAC del adaptador con la que muestra `ip link`.

### ¿Qué gestiona las interfaces de este Debian?

```bash
systemctl is-active networking
systemctl is-active NetworkManager
systemctl is-active systemd-networkd
command -v ifup
command -v nmcli
command -v networkctl
cat /etc/network/interfaces
```

| Resultado | Interpretación |
|---|---|
| `active` | Servicio ejecutándose; **no prueba por sí solo** que gestione tu NIC |
| `inactive` | Unidad no activa; **no significa necesariamente desinstalado** |
| `failed` | Servicio falló: consulta `systemctl status NOMBRE` |
| `Unit ... could not be found` | Esa unidad no está disponible; revisa instalación |
| `command -v nmcli` sin salida | La herramienta `nmcli` no está disponible en el PATH |

**Decisión:** si tu instalación mínima utiliza `networking` + `/etc/network/interfaces`, sigue **Ruta A**, que es la de nuestro aula. Las rutas B y C describen **alternativas**, no pasos siguientes.

<a id="ruta-a"></a>
## 4. Ruta A · ifupdown (la habitual de nuestro Debian Server)

**Objetivo:** dar `10.37.7.23/24` a la interfaz interna, conservando la NAT tal como está.

1. Localiza la NIC interna: `ip -br link`. Aquí usaremos **`enp0s8` solo como ejemplo**.
2. Guarda copia de seguridad:

```bash
sudo cp /etc/network/interfaces /etc/network/interfaces.bak-ut00
```

3. Abre el fichero:

```bash
sudo nano /etc/network/interfaces
```

4. **No borres la parte de NAT**. Añade o modifica *solo* la interfaz interna (evita declararla dos veces):

```text
auto enp0s8
iface enp0s8 inet static
    address 10.37.7.23
    netmask 255.255.255.0
```

5. Guarda: `Ctrl+O`, `Enter`, `Ctrl+X`. Desde la **consola de VirtualBox**, aplica sin apagar Debian:

```bash
sudo systemctl restart networking
ip -br address
ip route
```

**Resultado esperado:** NIC interna con `10.37.7.23/24`; NAT conserva su configuración. Si el comando falla, consulta `systemctl status networking` y `journalctl -u networking -b -n 40 --no-pager`. No pases a NetworkManager para «arreglarlo» sin diagnosticar.

**Alternativa para una interfaz concreta, si sabes que ifupdown la gestiona:** `sudo ifdown enp0s8 && sudo ifup enp0s8`. Hazlo localmente: una conexión SSH puede cortarse.

<a id="ruta-b"></a>
## 5. Ruta B · NetworkManager (alternativa, NO continuar tras la A)

Se usa solo cuando NetworkManager **está instalado y administra esa NIC**. En una instalación Debian mínima puede no existir `nmcli`: eso no significa que esté rota.

```bash
systemctl is-active NetworkManager
command -v nmcli
nmcli device status
nmcli connection show
```

**Si ambas comprobaciones permiten seguir**, identifica el perfil de la NIC interna: si ya existe, **modifícalo en lugar de crear duplicados**. Solo si es una NIC sin perfil, ejemplo:

```bash
sudo nmcli con add type ethernet ifname enp0s8 con-name SRI-LAN \
  ipv4.method manual ipv4.addresses 10.37.7.23/24 \
  ipv4.never-default yes ipv6.method disabled
sudo nmcli con up SRI-LAN
ip -br address
```

Si `nmcli: command not found`, **termina esta alternativa** y vuelve al gestor real que utiliza tu instalación; no necesitas instalarlo para completar UT00 por Ruta A.

<a id="ruta-c"></a>
## 6. Ruta C · systemd-networkd (alternativa sobre snapshot/clon)

No basta con crear un `.network` si el servicio está inactivo. El ejemplo siguiente migra **solo la NIC interna** desde ifupdown, dejando la NAT en su gestor original. Hazlo desde consola local y guarda `UT00_ANTES_NETWORKD` antes de empezar.

1. Comprueba nombre real de la NIC y copia la configuración existente:

```bash
ip -br link
sudo cp /etc/network/interfaces /etc/network/interfaces.bak-networkd
```

2. Prepara el fichero (ejemplo `enp0s8`, P07-L03):

```bash
sudo mkdir -p /etc/systemd/network
sudo nano /etc/systemd/network/20-sri-lan.network
```

```ini
[Match]
Name=enp0s8

[Network]
DHCP=no
Address=10.37.7.23/24
```

3. Si **ifupdown administra la interna**, bájala y retira **solo** su declaración de `/etc/network/interfaces`; conserva el bloque NAT:

```bash
sudo ifdown enp0s8
sudo nano /etc/network/interfaces
```

4. Activa `networkd` y comprueba:

```bash
sudo systemctl enable --now systemd-networkd
systemctl is-active systemd-networkd
networkctl status enp0s8
ip -br address
ip route
```

5. Tras **cambios posteriores** al fichero `.network`, aplica sin reiniciar la VM:

```bash
sudo networkctl reload
sudo networkctl reconfigure enp0s8
```

> **No uses esta ruta sin retirar previamente de ifupdown la interfaz migrada.** Si `networkctl` dice que el servicio no está disponible, investiga con `systemctl status systemd-networkd`; no mezcles gestores ni desactives la NAT por accidente.

<a id="gateway"></a>
## 7. Gateway, rutas y persistencia

**Gateway (puerta de enlace):** equipo al que entregamos un paquete destinado a una red que no es la nuestra. Con `/24`, `10.37.7.23` y `10.37.7.123` pertenecen a la **misma** subred: se comunican sin router.

| Desde `10.37.7.123/24` hacia… | ¿Hace falta gateway? |
|---|---|
| `10.37.7.23` | No |
| `10.38.7.120` | Sí: necesitaría un router real |
| Internet | Sí: requiere ruta real, normalmente NAT en el servidor |

En la **NIC interna de UT00** no pongas `gateway 10.37.7.254`, porque todavía no hemos instalado ningún router en esa IP. `ip route` permite observar por dónde sale el tráfico.

**Prueba de persistencia:** reinicia servidor y repite `ip -br address` e `ip route`. La IP correcta debe seguir ahí. Cuando todo esté comprobado, guarda snapshot `10_RED_OK`.

<a id="cliente"></a>
## 8. Configurar cliente con IP manual y demostrar conectividad

El cliente tiene **una tarjeta en `SRI-Pxx`**. Si es Debian con ifupdown, repite la Ruta A cambiando únicamente la IP a `10.37.7.123/24`; si es Windows 11: `Win+R` → `ncpa.cpl` → clic derecho en la NIC interna → Propiedades → «Protocolo de Internet versión 4 (TCP/IPv4)» → Propiedades → «Usar la siguiente dirección IP».

| Campo del cliente P07-L03 | Valor |
|---|---|
| IP | `10.37.7.123` |
| Máscara | `255.255.255.0` |
| Gateway interno | En blanco |
| DNS interno | En blanco en la ruta base |

**Desde cliente Debian:**

```bash
ip -br address
ping -c 3 10.37.7.23
```

**Desde Windows:**

```powershell
ipconfig /all
ping 10.37.7.23
```

**Resultado esperado:** respuesta desde `10.37.7.23`. Si no aparece, verifica *dos* IP de la misma `/24`, NIC activas y nombre `SRI-Pxx` idéntico en VirtualBox. El ping correcto demuestra conectividad básica, **no prueba un servicio web**.

<a id="http"></a>
## 9. HTTP temporal: ¿por qué se estudia antes de Apache?

Una **IP identifica el equipo**; un **puerto identifica el servicio o punto de comunicación** dentro de él. Usaremos Python para probar `8000+P` sin instalar Apache todavía.

1. En el **servidor**, comprueba que Python está disponible: `command -v python3`. Si no existe, conecta NAT y ejecuta `sudo apt update && sudo apt install python3`.
2. En la terminal del servidor (ejemplo `P07-L03`):

```bash
mkdir -p ~/sri-ut00
cd ~/sri-ut00
printf '<h1>SRI - %s</h1>\n' "$(hostname)" > index.html
python3 -m http.server 8007 --bind 10.37.7.23
```

**Deja esa terminal abierta**. Desde otra terminal en el servidor: `ss -lntp` debe mostrar el puerto `8007`.

3. Desde el **cliente**, si está instalado `curl`:

```bash
curl -v http://10.37.7.23:8007/
```

En Windows puedes abrir `http://10.37.7.23:8007/` en el navegador. Si Debian no tiene `curl`, instálalo solo si lo vas a utilizar: `sudo apt install curl` con acceso NAT disponible.

4. Regresa al servidor, pulsa `Ctrl+C`, repite `ping` y `curl`. **Pregunta:** ¿por qué sigue respondiendo `ping` cuando el puerto HTTP ya no atiende?

<a id="diagnostico"></a>
## 10. Diagnóstico, evidencias y continuidad

**No cambies varias cosas a la vez.** Usa siempre «síntoma → hipótesis → prueba → dato → cambio mínimo → misma prueba».

| Síntoma | Comprueba | Qué significa |
|---|---|---|
| No aparece IP interna | `ip -br address` y gestor correcto | Fallo de configuración de la NIC |
| IP correcta, sin ping | IP/máscara del cliente y `SRI-Pxx` | No demuestra fallo del servicio web |
| Ping sí, HTTP no | Proceso Python, `ss -lntp`, puerto | Problema de servicio, enlace o firewall |
| La IP desaparece al reiniciar | Fichero, gestor y snapshot | No era configuración persistente |

**Evidencia técnica mínima:** dos IP correctas, ping desde otro equipo, acceso HTTP, prueba de HTTP detenido y configuración persistente. Los nombres de entrega, rúbricas y plazos se publican en Moodle.

**Transición a UT01:** conserva la IP **fija del servidor** y elimina la IP **manual del cliente** antes de pedir DHCP. Primero [DHCP con Kea](/docencia/asir/sri/ut01/) y, a continuación, [DHCP con Windows Server 2025](/docencia/asir/sri/ut01-windows/) en una red VirtualBox **distinta**, `SRI-W-Pxx`.

### Referencias

- [Debian · manual de referencia de red](https://www.debian.org/doc/manuals/debian-reference/ch05.es.html)
- [Oracle VirtualBox · Internal Networking](https://www.virtualbox.org/manual/ch06.html)
- [systemd-networkd y archivos `.network`](https://manpages.debian.org/trixie/systemd/systemd.network.5.en.html)

**Material público para el alumnado · Fco. Javier Cano Granado · versión 2.1 · 23/09/2026.**
