---
title: "UT00 · Entorno profesional, laboratorio y método de diagnóstico"
description: "Laboratorio individual de SRI, direccionamiento persistente, pruebas cliente-servidor y método de diagnóstico antes de comenzar DHCP."
summary: "Laboratorio individual de SRI, direccionamiento persistente, pruebas cliente-servidor y método de diagnóstico antes de comenzar DHCP."

module_key: sri
cycle_key: asir
order: 0

module_title: "Servicios de Red e Internet"
module_code: "0375"
cycle_title: "Administración de Sistemas Informáticos en Red"
course: "2.º ASIR"
unit: "UT00"
level: "puesta-a-punto"

authors:
  - fjcano

reviewers:
  - fjcano

rights: all-rights-reserved
version: "1.2"
last_reviewed: 2026-09-16
visibility: public

ra:
  - "Transversal a RA1–RA8"

tags:
  - virtualizacion
  - debian
  - redes
  - direccionamiento
  - diagnostico
  - laboratorio
  - virtualbox

permalink: /docencia/asir/sri/ut00/
published: true

toc:
  - title: Introducción
    id: introduccion
  - title: Objetivos del laboratorio
    id: objetivos
  - title: Individualización
    id: individualizacion
  - title: Topología
    id: topologia
  - title: Inventario de red
    id: inventario
  - title: IP estática
    id: ip-estatica
  - title: Cliente de prueba
    id: cliente
  - title: Servicio temporal
    id: servicio-temporal
  - title: Diagnóstico
    id: diagnostico
  - title: Cierre y siguiente unidad
    id: cierre
---

## Introducción {#introduccion}

> **Objetivo de la unidad**  
> Dejar preparado un laboratorio individual, reproducible y seguro para comenzar **UT01 · DHCP con Kea**.  
> La UT00 no añade un RA nuevo: prepara herramientas, vocabulario y un método de trabajo que reutilizaremos durante todo el módulo.

---

## 1. Qué debe quedar preparado {#objetivos}

Al finalizar UT00 cada alumno debe disponer de:

- código individual `Pxx-Lyy`;
- servidor Debian 13 con nombre `srv-pXX-lYY`;
- **NIC 1 en NAT**, utilizada únicamente cuando haga falta instalar paquetes o actualizar;
- **NIC 2 en Red Interna** `SRI-Pxx`;
- snapshot `00_BASE`;
- snapshot `10_RED_OK`;
- dirección IPv4 estática y persistente en la NIC interna;
- un cliente de pruebas en la misma red interna;
- conectividad IP servidor ↔ cliente;
- un pequeño servicio HTTP temporal probado desde el cliente;
- inventario técnico, evidencias y un primer ticket de diagnóstico.

> **Idea importante**  
> En esta unidad no queremos memorizar comandos sin contexto. Queremos entender qué tarjeta tenemos, a qué red está conectada, quién la configura y cómo comprobar que realmente funciona.

---

## 2. Variante individual {#individualizacion}

Cada alumno trabajará con valores propios.

- `P`: número de puesto (`01–40`).
- `L`: inicial normalizada del primer apellido: `A=01 … Z=26`.

| Dato | Fórmula | Qué representa |
|---|---|---|
| Red interna | `10.37.P.0/24` | La subred privada del laboratorio del alumno |
| Servidor | `10.37.P.(20+L)` | IP estática del servidor |
| Cliente inicial | `10.37.P.(120+L)` | IP manual inicial del cliente |
| Puerto HTTP temporal | `8000+P` | Puerto usado en UT00 por un servidor web temporal |
| Red VirtualBox | `SRI-Pxx` | Nombre del **switch virtual / red interna** |
| Host servidor | `srv-pXX-lYY` | Nombre de la máquina Debian dentro del sistema |

### Ejemplo docente `P07-L03`

```text
Red interna:           10.37.7.0/24
Servidor:              10.37.7.23/24
Cliente inicial:       10.37.7.123/24
Puerto HTTP temporal:  8007
Red VirtualBox:        SRI-P07
Hostname servidor:     srv-p07-l03
```

### 2.1 ¿Qué es `SRI-P07`?

`SRI-P07` **no es una IP**.

Es el nombre que damos a una **Red Interna de VirtualBox**. Las tarjetas virtuales conectadas a una red interna con el mismo nombre quedan conectadas entre sí como si estuvieran enchufadas al mismo switch.

```text
                   SRI-P07
              ┌────────────────┐
              │ switch virtual │
              └───────┬────────┘
                      │
           ┌──────────┴──────────┐
           │                     │
       SERVIDOR               CLIENTE
     10.37.7.23            10.37.7.123
```

En VirtualBox, servidor y cliente deben usar exactamente el mismo nombre de red interna.

### 2.2 ¿Qué es `srv-p07-l03`?

Es el **hostname** del servidor.

Puedes consultarlo con:

```bash
hostname
hostnamectl
```

Y establecerlo, si fuera necesario, con:

```bash
sudo hostnamectl set-hostname srv-p07-l03
```

El hostname permite identificar claramente cada máquina. Más adelante tendremos servidores DNS, web, correo, etc.; trabajar con nombres coherentes evita terminar con varias máquinas llamadas simplemente `debian`.

### 2.3 ¿Por qué aparece ya un puerto HTTP?

Todavía **no estamos estudiando Apache**.

Usaremos un servidor HTTP temporal de Python para comprobar una idea fundamental:

> **La IP identifica la máquina. El puerto ayuda a identificar el servicio dentro de esa máquina.**

Ejemplo:

```text
10.37.7.23:8007
│           │
│           └── puerto del servicio temporal
└────────────── IP del servidor
```

Más adelante estudiaremos puertos conocidos como `22`, `53`, `67/68`, `80`, `443`, etc.

---

## 3. Topología del laboratorio {#topologia}

![Topología base del laboratorio SRI](/assets/docencia/sri/ut00/01_topologia_sri_lab.svg)

La máquina servidor tendrá inicialmente dos tarjetas:

```text
                    SERVIDOR DEBIAN

             ┌────────────────────────┐
Internet ───▶│ NIC 1            NIC 2 │──────▶ Red interna
             │ NAT            SRI-Pxx │
             └────────────────────────┘
```

### NIC 1 · NAT

La usamos para:

- `apt update`;
- instalar paquetes;
- descargar actualizaciones;
- tareas de mantenimiento puntuales.

### NIC 2 · Red Interna

La usamos para:

- las prácticas de SRI;
- comunicar servidor y clientes;
- crear servicios aislados;
- evitar interferir con la red real del centro.

![Funciones de la NIC NAT y de la NIC interna](/assets/docencia/sri/ut00/02_nic_nat_vs_interna.svg)

> **Importante**  
> Nunca utilices **modo puente** para un servidor DHCP de laboratorio salvo indicación expresa del profesor. Un DHCP mal aislado puede interferir con una red real.

---

## 4. Inventario antes de configurar {#inventario}

Antes de cambiar ningún fichero debemos responder:

> **¿Qué tarjetas tengo y qué componente está gestionando mi red?**

Ejecuta:

```bash
hostnamectl

ip -br link
ip -br address
ip route

systemctl is-active networking
systemctl is-active NetworkManager
systemctl is-active systemd-networkd

command -v ifup
command -v nmcli
command -v networkctl

ls -l /etc/network/interfaces
```

### 4.1 Cómo interpretar los resultados

Debian puede utilizar distintos mecanismos para gestionar las interfaces de red.

En este módulo distinguiremos tres rutas principales:

```text
                     ¿QUIÉN GESTIONA LA RED?
                              │
             ┌────────────────┼──────────────────┐
             │                │                  │
         ifupdown       NetworkManager     systemd-networkd
             │                │                  │
       networking           nmcli            networkctl
             │                │                  │
 /etc/network/interfaces  perfiles NM   /etc/systemd/network/
```

> **No debes realizar las tres rutas.**  
> Debes identificar cuál utiliza tu instalación y seguir **solo esa**.

> **Importante:** que un servicio aparezca como `active` demuestra que el demonio está activo, pero **no basta por sí solo para afirmar que gestiona una interfaz concreta**. Confirma también la configuración real de esa NIC con la herramienta correspondiente (`/etc/network/interfaces`, `nmcli device status` o `networkctl status`).

### 4.2 Qué significa `active`, `inactive` o `not found`

Al usar `systemctl is-active ...` puedes encontrar resultados diferentes:

- `active`: el servicio está ejecutándose.
- `inactive`: la unidad existe, pero en ese momento no está activa.
- `failed`: existe, pero ha fallado.
- `Unit ... could not be found`: esa unidad no está disponible en el sistema; normalmente el componente no está instalado.

Por tanto:

> `inactive` **no significa automáticamente** “no está instalado”.

También puedes comprobar la presencia de las herramientas:

```bash
command -v ifup
command -v nmcli
command -v networkctl
```

Ejemplo:

```text
/usr/sbin/ifup
```

indica que `ifup` está disponible.

Si:

```bash
command -v nmcli
```

no devuelve nada, `nmcli` no está disponible en esa instalación.

### 4.3 En nuestro Debian Server

En la instalación habitual del laboratorio es normal encontrar:

```text
networking          active
NetworkManager      inactive / no disponible
systemd-networkd    inactive
```

y una configuración real en:

```text
/etc/network/interfaces
```

En ese caso utilizaremos **Ruta A · ifupdown**.

---

## 5. Configurar la IP estática del servidor {#ip-estatica}

### 5.1 Regla común

La NIC interna recibe la IP calculada para cada alumno.

**No configuramos gateway en esa NIC interna.**

La salida general hacia otras redes o Internet corresponde, en esta fase del laboratorio, a la NIC NAT.

Ejemplo docente:

```text
NIC NAT       → dirección obtenida automáticamente
NIC interna   → 10.37.7.23/24
gateway LAN   → ninguno
```

> **No mezcles gestores de red.**  
> Si una interfaz está siendo administrada mediante `ifupdown`, no empieces a crear perfiles NetworkManager ni ficheros de `systemd-networkd` para esa misma interfaz.

---

### 5.2 Ruta A · ifupdown (`/etc/network/interfaces`) — ruta principal del laboratorio

Utiliza esta ruta cuando:

```bash
systemctl is-active networking
```

muestre:

```text
active
```

y `/etc/network/interfaces` sea el fichero que administra la interfaz.

Primero identifica el nombre real de la NIC:

```bash
ip -br link
```

Supongamos que la NIC interna es `enp0s8`.

#### Paso 1 · copia de seguridad

```bash
sudo cp /etc/network/interfaces /etc/network/interfaces.bak-ut00
```

#### Paso 2 · editar la configuración

```bash
sudo nano /etc/network/interfaces
```

Ejemplo docente:

```text
auto enp0s8
iface enp0s8 inet static
    address 10.37.7.23
    netmask 255.255.255.0
```

> Sustituye `enp0s8` y la dirección por los valores reales de tu máquina.

#### Paso 3 · guardar y aplicar sin reiniciar la VM

Guardar el fichero **no implica que la interfaz vuelva a leerlo inmediatamente**.

Aplica la nueva configuración con:

```bash
sudo systemctl restart networking
```

Haz este cambio desde la **consola local de VirtualBox**, especialmente si estás modificando una interfaz por la que podrías estar conectado remotamente.

#### Paso 4 · comprobar

```bash
ip -br address
ip route
```

En el ejemplo podríamos obtener:

```text
enp0s3   UP   10.0.2.15/24
enp0s8   UP   10.37.7.23/24
```

Pregúntate:

- ¿Por qué aparecen dos tarjetas?
- ¿Por qué cada una tiene una IP de una red distinta?
- ¿Cuál utilizaremos para las prácticas de SRI?

#### Alternativa puntual

Si sabes exactamente qué interfaz quieres bajar y levantar:

```bash
sudo ifdown enp0s8
sudo ifup enp0s8
```

Para UT00 utilizaremos preferentemente:

```bash
sudo systemctl restart networking
```

porque resulta más sencillo de verificar en el laboratorio.

---

### 5.3 Ruta B · NetworkManager — solo si realmente lo utiliza tu sistema

Utiliza esta ruta **solo si** NetworkManager está activo **y la NIC interna aparece gestionada por él**.

Comprueba:

```bash
systemctl is-active NetworkManager
nmcli device status
nmcli connection show
```

Si la interfaz aparece como `unmanaged`, no debes configurarla con NetworkManager.

Comprueba después los perfiles disponibles y cuál está asociado a la interfaz:

```bash
nmcli connection show
```

Ejemplo de creación de un perfil:

```bash
sudo nmcli con add type ethernet ifname enp0s8 con-name SRI-LAN \
  ipv4.method manual \
  ipv4.addresses 10.37.7.23/24 \
  ipv4.never-default yes \
  ipv6.method disabled

sudo nmcli con up SRI-LAN
```

Si ya existe un perfil para esa tarjeta, **modifícalo en lugar de crear perfiles duplicados**.

#### ¿Y si aparece `nmcli: command not found`?

No significa que el ejercicio esté roto.

Significa que `nmcli` no está disponible en esa instalación. Si tu sistema está siendo gestionado correctamente mediante `ifupdown`, **no necesitas instalar NetworkManager para completar UT00**.

---

### 5.4 Ruta C · systemd-networkd — solo si realmente lo utiliza tu sistema

Utiliza esta ruta **solo si** `systemd-networkd` está activo **y la NIC interna aparece administrada por él**.

Comprueba, por ejemplo:

```bash
systemctl is-active systemd-networkd
networkctl status enp0s8
```

Sustituye `enp0s8` por el nombre real de tu interfaz.

Ejemplo:

```text
/etc/systemd/network/20-sri-lan.network
```

Contenido:

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

Comprueba:

```bash
networkctl status enp0s8
ip -br address
```

#### ¿Y si `networkctl reload` o `reconfigure` no funciona?

Antes de buscar comandos alternativos, vuelve a comprobar:

```bash
systemctl is-active systemd-networkd
```

Si `systemd-networkd` no está administrando la red de esa máquina, **esta no es tu ruta**.

---

### 5.5 Comprobación obligatoria

Sea cual sea el método correcto de tu sistema:

```bash
ip -br address
ip route
```

Debes poder identificar:

- qué interfaz es NAT;
- qué interfaz pertenece a `SRI-Pxx`;
- qué dirección IPv4 tiene cada una;
- si existe una ruta por defecto;
- por qué la NIC interna no necesita una segunda ruta por defecto.

#### Persistencia

Después de comprobar que todo funciona:

1. crea el snapshot `10_RED_OK`;
2. reinicia la VM una vez;
3. vuelve a ejecutar:

```bash
ip -br address
ip route
```

Si la IP interna desaparece tras reiniciar, la configuración todavía no es persistente.

---

## 6. Configurar el cliente de prueba {#cliente}

En UT00 el cliente tendrá una dirección IPv4 **manual**.

En UT01 eliminaremos esta configuración manual y el cliente pasará a solicitarla mediante DHCP.

Ejemplo docente `P07-L03`:

```text
Servidor:  10.37.7.23/24
Cliente:   10.37.7.123/24
Gateway:   ninguno en la NIC interna
```

Servidor y cliente deben estar conectados en VirtualBox a:

```text
SRI-P07
```

### Configuración manual temporal del cliente Debian

Como en UT01 sustituiremos esta configuración por DHCP, en UT00 podemos configurar **solo la NIC interna del cliente** de forma temporal desde consola. Primero identifica su nombre con:

```bash
ip -br link
```

Si la NIC interna fuera `enp0s8`, para el ejemplo `P07-L03`:

```bash
sudo ip -4 addr flush dev enp0s8
sudo ip link set enp0s8 up
sudo ip address add 10.37.7.123/24 dev enp0s8
ip -br address
```

Esta configuración no pretende ser persistente: desaparecerá al reiniciar, y en UT01 la interfaz pasará a obtener IPv4 mediante DHCP. No ejecutes estos comandos sobre la NIC por la que estés administrando remotamente la máquina.

### Prueba básica

Desde el cliente:

```bash
ping -c 3 10.37.7.23
```

Si responde, hemos demostrado conectividad IP básica entre ambos equipos.

### Si no responde

No empieces cambiando direcciones al azar.

Comprueba en este orden:

```bash
ip -br link
ip -br address
ip route
```

Después verifica en VirtualBox:

- que ambas NIC están habilitadas;
- que ambas usan **Red Interna**;
- que las dos redes internas tienen exactamente el mismo nombre `SRI-Pxx`.

---

## 7. Servicio temporal: ¿para qué sirve ahora? {#servicio-temporal}

Hasta este punto hemos demostrado conectividad IP.

Ahora queremos demostrar algo diferente:

> **Que exista conectividad IP no garantiza que un servicio concreto esté funcionando.**

Para ello utilizaremos un servidor HTTP temporal de Python. No estamos estudiando todavía Apache.

### 7.1 En el servidor

Antes de usar el servidor temporal, comprueba que Python está disponible:

```bash
command -v python3
```

Si no devuelve una ruta, utiliza temporalmente la NIC NAT para instalarlo:

```bash
sudo apt update
sudo apt install python3
```

Después prepara el contenido de prueba:

```bash
mkdir -p ~/sri-ut00
cd ~/sri-ut00

printf '<h1>SRI · %s</h1>\n' "$(hostname)" > index.html

python3 -m http.server 8007 --bind 0.0.0.0
```

Sustituye `8007` por tu puerto `8000+P`.

Mientras el proceso siga abierto, el servidor estará escuchando.

### 7.2 Comprobar que existe un proceso escuchando

Desde otra terminal del servidor:

```bash
ss -lntp
```

Busca el puerto correspondiente.

### 7.3 Desde el cliente

Comprueba primero que `curl` está disponible:

```bash
command -v curl
```

Si no está instalado, instálalo mientras el cliente disponga temporalmente de salida a Internet o inclúyelo en la plantilla base:

```bash
sudo apt update
sudo apt install curl
```

Después realiza la petición desde la red interna:

```bash
curl -v http://10.37.7.23:8007/
```

Si funciona, ya no hemos demostrado solamente:

```text
cliente → servidor
```

sino:

```text
cliente → servidor → puerto TCP → servicio HTTP
```

### 7.4 Prueba negativa

Detén el servidor temporal con `Ctrl+C`.

Repite:

```bash
ping -c 3 10.37.7.23
```

y después:

```bash
curl -v http://10.37.7.23:8007/
```

La situación puede ser:

```text
PING   → funciona
CURL   → falla
```

Esto demuestra una idea esencial para todo SRI:

> **“Tengo red” y “funciona el servicio” son dos afirmaciones diferentes.**

![Evidencias técnicas para validar el laboratorio](/assets/docencia/sri/ut00/04_evidencias_ut00.svg)

---

## 8. Método de diagnóstico: ¿por qué lo aprendemos ya? {#diagnostico}

Este procedimiento no pertenece exclusivamente a UT00.

Lo reutilizaremos en:

- DHCP;
- DNS;
- Apache;
- FTP;
- correo;
- mensajería;
- streaming.

Cuando algo falle, **no cambies varias cosas a la vez**.

Sigue una secuencia reproducible:

1. describe el síntoma sin interpretar;
2. identifica la capa o componente probable;
3. formula una hipótesis;
4. elige una prueba que pueda confirmar o descartar esa hipótesis;
5. observa el dato obtenido;
6. aplica el cambio mínimo necesario;
7. repite exactamente la prueba;
8. documenta el resultado.

### Ejemplo

Síntoma:

```text
No puedo abrir http://10.37.7.23:8007/
```

No empezamos reinstalando nada.

#### Paso 1 · ¿Tengo una IP correcta?

```bash
ip -br address
```

#### Paso 2 · ¿Tengo conectividad hasta el servidor?

```bash
ping -c 3 10.37.7.23
```

#### Paso 3 · ¿Existe un proceso escuchando en el puerto?

En el servidor:

```bash
ss -lntp
```

#### Paso 4 · ¿Responde el servicio?

Desde el cliente:

```bash
curl -v http://10.37.7.23:8007/
```

Así podemos distinguir:

```text
Problema de interfaz
        ↓
Problema de direccionamiento
        ↓
Problema de conectividad
        ↓
Problema de puerto
        ↓
Problema del servicio
```

![Flujo profesional de diagnóstico](/assets/docencia/sri/ut00/03_flujo_diagnostico.svg)

---

## 9. Ticket de salida

Antes de terminar la unidad debes poder responder sin consultar los apuntes:

1. ¿Qué diferencia hay entre una NIC NAT y una NIC en Red Interna?
2. ¿Qué representa `SRI-Pxx`?
3. ¿Qué representa `srv-pXX-lYY`?
4. ¿Por qué nuestra NIC interna no tiene gateway en UT00?
5. ¿Por qué no debes configurar la misma interfaz simultáneamente con `ifupdown`, NetworkManager y `systemd-networkd`?
6. Si `NetworkManager` aparece `inactive`, ¿significa necesariamente que no está instalado?
7. ¿Qué comando aplicamos después de cambiar `/etc/network/interfaces` en nuestro laboratorio?
8. ¿Qué demuestra `ping`?
9. ¿Qué demuestra `curl` que no demuestra `ping`?
10. Si `ping` funciona pero `curl` falla, ¿qué comprobarías después?

---

## 10. Siguiente unidad {#cierre}

> **UT01 · Configuración automática profesional: DHCP con Kea**

En UT00 el cliente tiene una dirección configurada manualmente.

El primer cambio de UT01 será deliberado:

```text
IP manual
    ↓
IPv4 automática
    ↓
DHCPDISCOVER
    ↓
Servidor Kea
```

A partir de ahí estudiaremos:

- qué problema resuelve DHCP;
- DORA;
- pool;
- reservas;
- lease;
- T1 y T2;
- gateway entregado por DHCP;
- análisis de tráfico;
- y posteriormente DHCP Relay.

---

> Las instrucciones concretas de entrega, archivos y criterios de evaluación se gestionan en el aula virtual. La web pública conserva el procedimiento de aprendizaje y las evidencias técnicas necesarias para comprenderlo.
