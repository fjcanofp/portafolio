---
title: "UT00 · Virtualización y fundamentos Linux"
description: "Desde cero: virtualización, VirtualBox, laboratorio SER-LAB, Debian y manejo sólido de la consola Linux para Servicios en Red."
summary: "Creación del laboratorio virtual SER-LAB y adquisición de una base sólida de Linux desde terminal para administrar servicios de red."

module_key: ser
cycle_key: smr
order: 0

module_title: "Servicios en Red"
module_code: "0227"
cycle_title: "Sistemas Microinformáticos y Redes"
course: "2.º SMR"
unit: "UT00"
hours: 18
level: "iniciacion"
authors:
  - fjcano

reviewers:
  - fjcano

rights: all-rights-reserved
version: "1.0"
last_reviewed: 2026-09-13

visibility: public

ra:
  - "RA8"
ce:
  - "RA8.a"

tags:
  - virtualizacion
  - virtualbox
  - debian
  - linux
  - terminal
  - usuarios
  - permisos
  - systemd
  - redes
  - diagnostico

permalink: /docencia/smr/ser/ut00/
published: true

toc:
  - title: Introducción
    id: introduccion
  - title: Virtualización
    id: virtualizacion
  - title: Redes virtuales
    id: redes-virtuales
  - title: Terminal Linux
    id: terminal
  - title: Sistema de archivos
    id: sistema-archivos
  - title: Leer, buscar y combinar
    id: leer-buscar
  - title: Usuarios y permisos
    id: usuarios-permisos
  - title: Servicios y logs
    id: servicios-logs
  - title: Red y diagnóstico
    id: red-diagnostico
  - title: Laboratorio guiado
    id: laboratorio
  #- title: Ejercicios
  #  id: ejercicios
  - title: Chuleta
    id: chuleta
  - title: Referencias
    id: referencias
---

## Introducción {#introduccion}

> **Objetivo de la unidad:** construir desde cero el laboratorio que utilizaremos durante el curso y adquirir un **manejo sólido de la consola Linux**.  
> No buscamos memorizar una lista interminable de órdenes. Buscamos que puedas responder cuatro preguntas: **qué quiero comprobar, qué comando me ayuda, qué significa su salida y qué hago después**.

En **Servicios en Red** instalaremos DHCP, DNS, transferencia de archivos, correo, servidores web, acceso remoto, redes inalámbricas y mecanismos de conexión entre redes. Todos esos servicios se ejecutan sobre sistemas operativos y redes reales o virtuales.

Por eso empezaremos por la base:

```text
VIRTUALIZACIÓN
      ↓
LABORATORIO AISLADO
      ↓
DEBIAN
      ↓
TERMINAL
      ↓
ARCHIVOS · USUARIOS · PERMISOS
      ↓
PROCESOS · SERVICIOS · LOGS
      ↓
IP · RUTAS · PUERTOS
      ↓
DIAGNÓSTICO
      ↓
UT01 · DHCP
```

**En esta unidad no trabajaremos scripting ni archivos `.sh`.** Primero necesitamos que la consola deje de ser algo que se copia y pase a ser una herramienta que entendemos.

---

### 1. Qué deberías ser capaz de hacer al terminar

Al finalizar UT00 deberías poder:

- explicar qué son **host, guest, máquina virtual, hipervisor e ISO**;
- distinguir **hardware virtual** de **modo de conexión de una tarjeta virtual**;
- crear una VM razonable y justificar CPU, RAM y disco;
- instalar Debian en una VM;
- crear y restaurar una instantánea;
- distinguir **NAT, Red NAT, Red interna, Solo-anfitrión y Puente**;
- construir el laboratorio `SER-LAB` sin afectar a la red física del centro;
- iniciar sesión en Debian y saber **quién eres, en qué máquina estás y dónde estás**;
- moverte con seguridad por el árbol de directorios;
- crear, copiar, mover, buscar, leer y eliminar archivos;
- utilizar ayuda integrada (`man`, `--help`) antes de depender de una receta;
- crear usuarios y grupos de laboratorio;
- interpretar y modificar permisos Linux;
- utilizar `sudo` de forma consciente;
- consultar paquetes, procesos, servicios, puertos y registros;
- identificar interfaces, direcciones IP y rutas;
- diagnosticar una incidencia sencilla siguiendo una secuencia lógica.

---

### 2. Relación con los RA y CE de Servicios en Red

La **UT00 tiene un carácter principalmente introductorio y transversal**. Proporciona la base técnica que necesitaremos durante todo el módulo: virtualización, administración básica de Debian, terminal, sistema de archivos, usuarios, grupos, permisos, procesos, servicios, registros e interfaces de red.

No obstante, una parte concreta de esta unidad se relaciona directamente con un criterio oficial del módulo.

#### RA8 · Acceso desde redes locales a redes públicas

> **RA8.** Establece el acceso desde redes locales a redes públicas identificando posibles escenarios y aplicando software específico.

En UT00 comenzamos a trabajar este RA al construir una máquina con:

- una interfaz orientada a nuestra **red privada de laboratorio**;
- otra interfaz con salida hacia una **red externa** mediante NAT del hipervisor.

#### CE trabajado directamente

> **RA8 · CE a)** Se ha instalado y configurado el hardware de un sistema con acceso a una red privada local y a una red pública.

En nuestro laboratorio utilizaremos hardware **virtualizado**, pero las decisiones técnicas que debemos comprender son las mismas: qué interfaz existe, a qué red se conecta, qué dirección utiliza y por dónde debe circular cada tráfico.

> **Importante:** UT00 no completa el RA8.  
> Aquí obtenemos una primera evidencia del **CE a)**. El resto del RA8 se desarrollará en **UT08**, cuando trabajemos pasarelas, encaminamiento, filtrado, NAT/DNAT, publicación y resolución de incidencias entre redes.

#### Aprendizajes transversales

| Aprendizaje de UT00 | Para qué lo reutilizaremos |
|---|---|
| Virtualización | laboratorios seguros y reproducibles |
| Terminal Linux | administración de todos los servidores |
| Archivos y rutas | configuración de servicios |
| Usuarios y grupos | transferencia, correo, web y acceso remoto |
| Permisos | control de acceso |
| Procesos y servicios | DHCP, DNS, Apache, SSH, correo… |
| Logs | diagnóstico |
| Interfaces y rutas | DHCP, acceso remoto y conexión entre redes |
| Puertos y sockets | comprobación real del servicio |

Estos aprendizajes **no son nuevos CE inventados**. Son herramientas que permitirán demostrar los CE oficiales de las unidades posteriores.

**Referencia curricular de Extremadura:**  
[Decreto 272/2009, de 28 de diciembre · módulo 0227 · RA8 y CE](https://doe.juntaex.es/pdfs/doe/2010/10o/10o.pdf#page=69)

---

### 3. Por qué esto se parece al trabajo real

Un técnico no debería trabajar diciendo:

> «He reiniciado tres cosas y ahora parece que funciona».

Trabaja reduciendo el problema.

Imagina:

> «Desde el cliente no abre la web interna; en el servidor dicen que sí funciona».

Antes de tocar nada podemos preguntar:

1. ¿la VM está arrancada?;
2. ¿la tarjeta virtual está conectada?;
3. ¿la interfaz aparece `UP`?;
4. ¿tiene la IP esperada?;
5. ¿existe una ruta hacia el destino?;
6. ¿el puerto está escuchando?;
7. ¿el servicio está activo?;
8. ¿qué registran los logs?;
9. ¿responde la aplicación?;
10. ¿el cambio realizado ha solucionado el problema sin romper otra cosa?

Ese modo de pensar será más importante durante el curso que memorizar un comando concreto.

---

## PARTE I · VIRTUALIZACIÓN DESDE CERO {#virtualizacion}

### 4. Qué estamos virtualizando

Un PC físico aporta:

```text
CPU · RAM · almacenamiento · tarjetas de red · USB · pantalla…
```

El hipervisor utiliza parte de esos recursos para presentar a cada máquina virtual un ordenador independiente.

![Capas de virtualización]({{ '/assets/ser/ut00/01_capas_virtualizacion.svg' | relative_url }})

*Figura 1. El host aporta los recursos; VirtualBox presenta hardware virtual a cada sistema invitado.*

#### Vocabulario imprescindible

| Concepto | Qué significa | Ejemplo del curso |
|---|---|---|
| **Host / anfitrión** | equipo físico que ejecuta el hipervisor | PC del aula |
| **Hipervisor** | software que crea y administra VM | VirtualBox |
| **VM** | ordenador virtual | `ser-ser01` |
| **Guest / invitado** | SO instalado en la VM | Debian 13 |
| **ISO** | medio de instalación en forma de imagen | ISO de Debian |

#### Ejercicio resuelto 1

Tenemos Windows 11 en el PC físico y Debian dentro de VirtualBox.

```text
Windows 11 del PC → host
VirtualBox         → hipervisor
Debian 13          → guest
ser-ser01          → máquina virtual
```

---

### 5. Para qué virtualizamos en SER

Durante el curso vamos a:

- modificar direcciones IP;
- instalar servicios;
- crear usuarios;
- cambiar permisos;
- abrir o cerrar puertos;
- configurar DHCP y DNS;
- provocar fallos;
- restaurar estados anteriores.

Una VM nos permite trabajar con una filosofía muy útil:

```text
crear → comprobar → modificar → romper → diagnosticar → recuperar
```

sin utilizar la red física como campo de pruebas.

---

### 6. VirtualBox, VMware e Hyper-V

#### VirtualBox

Será nuestro hipervisor principal porque permite trabajar con VM, discos, snapshots y redes virtuales de forma cómoda en el aula.

#### VMware Workstation

Utiliza los mismos conceptos fundamentales. Cambiarán los nombres de algunos menús, pero seguiremos hablando de CPU virtual, memoria, disco, NIC, snapshot y redes.

#### Hyper-V

Es la solución de virtualización de Microsoft disponible en ediciones compatibles de Windows y Windows Server.

#### Lo que realmente queremos aprender

```text
crear VM
   ↓
asignar recursos
   ↓
conectar ISO
   ↓
instalar SO
   ↓
crear tarjetas virtuales
   ↓
elegir a qué redes se conectan
   ↓
crear un punto de recuperación
```

Si entiendes ese recorrido, cambiar de hipervisor resulta mucho más sencillo.

---

### 7. Descargas oficiales

Usa siempre fuentes oficiales.

- [Oracle VirtualBox · Downloads](https://www.virtualbox.org/wiki/Downloads)
- [Debian · instalación por red (netinst)](https://www.debian.org/distrib/netinst)
- [Debian 13 “trixie”](https://www.debian.org/releases/trixie/)
- [Microsoft · Descargar Windows 11](https://www.microsoft.com/es-es/software-download/windows11)
- [Broadcom Support · VMware](https://support.broadcom.com/)
- [Microsoft Learn · Instalar Hyper-V](https://learn.microsoft.com/es-es/windows-server/virtualization/hyper-v/get-started/Install-Hyper-V)

En los PC Intel/AMD habituales utilizaremos normalmente Debian `amd64`.

> **Buena práctica:** conserva la ISO original y anota versión y procedencia. No descargues imágenes «repack» de páginas desconocidas para ahorrar unos minutos.

---

### 8. Crear la primera VM: `ser-ser01`

#### 8.1. Nombre

```text
ser-ser01
```

El nombre tiene significado:

```text
ser    → Servicios en Red
ser01  → servidor principal
```

Evita nombres ambiguos como `debian nuevo`, `prueba2` o `maquina definitiva final`.

#### 8.2. Recursos iniciales

Para una Debian de servidor sin escritorio, un punto de partida razonable en un PC de aula puede ser:

```text
2 vCPU
2 GB RAM
25 GB de disco dinámico
```

No es una ley. Es una **decisión inicial que podemos revisar**.

#### Ejercicio resuelto 2 · RAM

Host:

```text
16 GB RAM
```

Propuesta:

```text
VM1 → 8 GB
VM2 → 8 GB
```

**Problema:** hemos consumido prácticamente toda la RAM disponible y olvidado al host.

Una propuesta inicial más prudente:

```text
VM1 → 2 GB
VM2 → 2 GB
```

y dejamos margen al sistema anfitrión.

#### 8.3. Disco dinámico

Si creamos un disco virtual con máximo de 25 GB y crecimiento dinámico, el invitado puede ver un disco de 25 GB sin que el archivo del host ocupe necesariamente 25 GB desde el primer minuto.

---

### 9. La ISO y el proceso de instalación

Conceptualmente:

```text
ISO Debian
    ↓
lector virtual
    ↓
arranque de la VM
    ↓
instalador Debian
    ↓
disco virtual
```

Durante la instalación utilizaremos valores de laboratorio.

Ejemplo:

```text
Nombre completo: Fran Cano
Usuario:         francano
Hostname:        ser-ser01
```

Para contraseñas usa una contraseña **exclusiva de laboratorio**.

Ejemplo didáctico:

```text
SerLab-2026-Prueba
```

No reutilices una contraseña personal.

#### Servidor sin escritorio

El servidor se trabajará preferentemente sin entorno gráfico.

Eso no significa que «le falte algo». Significa que aprenderemos a administrarlo con herramientas reutilizables en servidores reales y remotos.

#### Apagar correctamente

```bash
sudo poweroff
```

No conviertas cerrar bruscamente la ventana de VirtualBox en tu forma habitual de apagar Debian.

---

### 10. Snapshots e instantáneas

Después de instalar, actualizar y comprobar Debian:

```text
00_BASE_LIMPIA
```

Más adelante:

```text
00_BASE_LIMPIA
      ↓
01_RED_OK
      ↓
02_DHCP_OK
```

#### Ejercicio resuelto 3

Mañana vamos a comenzar DHCP y hoy todo funciona.

**¿Cuándo es buen momento para crear snapshot?**

Ahora, antes de realizar cambios.

> Un snapshot facilita volver atrás en el laboratorio, pero **no sustituye una copia de seguridad independiente**.

---

### 11. Clonar una máquina

Podemos preparar una Debian base y clonarla:

```text
Debian base
├── ser-ser01
└── ser-cli01
```

Después del clon revisa:

- hostname;
- función de la máquina;
- adaptadores;
- direcciones MAC cuando proceda;
- IP.

**Clonar no significa que dos máquinas deban conservar la misma identidad.**

---

## PARTE II · TARJETAS Y REDES VIRTUALES {#redes-virtuales}

### 12. Tarjeta virtual y modo de red no son lo mismo

Esta diferencia evita muchos errores.

![vNIC frente a modo de conexión]({{ '/assets/ser/ut00/02_vnic_vs_modo.svg' | relative_url }})

*Figura 2. Debian ve una tarjeta virtual; VirtualBox decide a qué tipo de red está conectada.*

Una **vNIC** es el adaptador que ve el sistema invitado. VirtualBox puede presentarle una o varias.

Después elegimos dónde se conecta cada una:

```text
NAT
Red NAT
Red interna
Solo-anfitrión
Puente
```

Dentro de Debian pueden aparecer nombres como:

```text
enp0s3
enp0s8
```

No memorices que «enp0s3 siempre es NAT». **Compruébalo en tu VM.**

#### Ejercicio resuelto 4

Dos VM tienen:

```text
192.168.50.10/24
192.168.50.20/24
```

pero una está conectada a `SER-LAB` y otra a `SER_LAB`.

¿Arreglarías el problema cambiando otra vez las IP?

**No.** El problema está en el hipervisor: las vNIC están conectadas a redes virtuales distintas.

---

### 13. NAT

![Red NAT individual]({{ '/assets/ser/ut00/03_red_nat.svg' | relative_url }})

*Figura 3. NAT permite que una VM salga a Internet sin aparecer directamente como otro equipo de la LAN física.*

Uso típico:

```text
apt update
instalar paquetes
consultar repositorios
```

En VirtualBox, NAT da salida de forma sencilla. La VM no queda publicada automáticamente hacia la red exterior; si necesitáramos entrada hacia un servicio concreto habría que configurar una redirección.

#### Ejercicio resuelto 5

Necesitamos descargar actualizaciones, pero no queremos que el servidor sea visible directamente en la red física.

**Elección:** NAT.

---

### 14. Red interna

![Red interna]({{ '/assets/ser/ut00/04_red_interna.svg' | relative_url }})

*Figura 4. En una Red interna se comunican las VM que utilizan el mismo nombre de red, sin depender del host ni de la LAN física.*

Es nuestra opción principal para servicios de laboratorio.

Ejemplo:

```text
SER-LAB
```

Es especialmente útil para DHCP: evita que las ofertas de nuestro servidor de prácticas lleguen a equipos reales del centro.

#### Ejercicio resuelto 6

Vamos a arrancar un DHCP creado por un alumno.

¿Puente o Red interna?

**Red interna.** En puente el tráfico podría alcanzar la red real.

---

### 15. Solo-anfitrión

![Red solo-anfitrión]({{ '/assets/ser/ut00/05_red_hostonly.svg' | relative_url }})

*Figura 5. Solo-anfitrión crea una red privada en la que participan el host y las VM.*

Resulta útil cuando queremos acceder a una VM desde herramientas instaladas en el host.

> **Atención para futuras prácticas DHCP:** una red host-only puede tener un servidor DHCP de VirtualBox. Si vamos a estudiar nuestro propio DHCP, debemos saber exactamente qué otros servidores pueden responder.

---

### 16. Red NAT

![Red NAT compartida]({{ '/assets/ser/ut00/06_red_natnetwork.svg' | relative_url }})

*Figura 6. Una Red NAT ofrece un segmento compartido entre varias VM y salida al exterior.*

La utilizaremos solo cuando el escenario lo justifique.

Es cómoda, pero puede introducir elementos automáticos —por ejemplo DHCP— que debemos conocer antes de estudiar nuestros propios servicios.

---

### 17. Adaptador puente

![Adaptador puente]({{ '/assets/ser/ut00/07_red_puente.svg' | relative_url }})

*Figura 7. En modo puente la VM se comporta de forma mucho más parecida a otro equipo conectado a la LAN física.*

Profesionalmente es útil.

En el aula también puede ser peligroso:

- un DHCP de prácticas puede interferir con clientes reales;
- un servidor puede quedar accesible desde otros equipos;
- una mala configuración puede afectar a terceros.

---

### 18. Comparativa de modos de VirtualBox

| Modo | VM → Internet/LAN | VM ↔ VM | Host → VM | Uso en SER |
|---|---:|---:|---:|---|
| **NAT** | Sí | No directamente por defecto | mediante redirección si se necesita | actualizar una VM |
| **Red NAT** | Sí | Sí | mediante reglas cuando proceda | varias VM con salida compartida |
| **Red interna** | No | Sí, mismo nombre | No | **laboratorio de servicios** |
| **Solo-anfitrión** | No por defecto | Sí | Sí | administración desde el host |
| **Puente** | Sí, según LAN | Sí | Sí | solo con autorización |

[Oracle VirtualBox 7.2 · Virtual Networking](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/networkingdetails.html)

---

### 19. Topología base de SER-LAB

Nuestro patrón será:

```text
NIC 1 → NAT
NIC 2 → Red interna SER-LAB
```

![Topología SER-LAB]({{ '/assets/ser/ut00/08_topologia_ser_lab.svg' | relative_url }})

*Figura 8. Cada VM separa el acceso exterior de la red de servicios.*

Direcciones iniciales:

```text
ser-ser01 → 192.168.50.10/24
ser-cli01 → 192.168.50.20/24
ser-win01 → 192.168.50.30/24   (cuando lo necesitemos)
```

#### Idea crítica

```text
NAT      → mantenimiento / Internet
SER-LAB  → tráfico de las prácticas
```

La interfaz de `SER-LAB` **no necesita gateway** en este escenario. La ruta por defecto debe continuar asociada a la salida NAT.

---

### 20. Configurar los dos adaptadores

Con la VM **apagada**:

#### Adaptador 1

```text
Habilitado
Conectado a: NAT
Cable conectado: sí
```

#### Adaptador 2

```text
Habilitado
Conectado a: Red interna
Nombre: SER-LAB
Cable conectado: sí
```

Repite en `ser-ser01` y `ser-cli01`.

#### Ejercicio resuelto 7

Servidor:

```text
Red interna: SER-LAB
```

Cliente:

```text
Red interna: SER-LAB2
```

Las IP parecen correctas pero no se comunican.

**Primera corrección:** no toques las IP todavía. Conecta ambas vNIC al mismo segmento virtual.

---

## PARTE III · ENTRAR EN DEBIAN Y ENTENDER LA TERMINAL {#terminal}

### 21. El primer login

Podemos encontrar:

```text
Debian GNU/Linux 13 ser-ser01 tty1

ser-ser01 login:
```

Iniciamos sesión:

```text
login: francano
password: ********
```

La contraseña no aparece en pantalla mientras la escribes. Es normal.

Después:

```text
francano@ser-ser01:~$
```

Lo podemos leer así:

```text
francano  → usuario
ser-ser01 → máquina
~         → home
$         → usuario normal
```

---

### 22. Cuatro preguntas antes de trabajar

#### ¿Quién soy?

```bash
whoami
```

#### ¿En qué máquina estoy?

```bash
hostname
```

#### ¿Dónde estoy?

```bash
pwd
```

#### ¿Qué hay aquí?

```bash
ls
```

#### Ejercicio resuelto 8

```text
$ whoami
francano
$ hostname
ser-ser01
$ pwd
/home/francano
```

Interpretación:

> Estoy conectado como `francano` al servidor `ser-ser01` y estoy situado en mi directorio personal.

Eso es más útil que pegar una captura sin explicar nada.

---

### 23. Pedir ayuda

No memorices todas las opciones.

```bash
man ls
ls --help
man chmod
chmod --help
```

En `man`:

```text
/ texto   buscar
n         siguiente resultado
q         salir
```

#### Ejercicio guiado

Abre:

```bash
man ls
```

Busca:

```text
human-readable
```

y localiza la opción que muestra tamaños en formato más legible.

**Resultado esperado:** descubrir `-h` utilizando la ayuda del propio sistema.

---

## PARTE IV · SISTEMA DE ARCHIVOS Y MOVIMIENTO {#sistema-archivos}

### 24. Un único árbol que empieza en `/`

![Árbol Linux]({{ '/assets/ser/ut00/09_arbol_linux.svg' | relative_url }})

*Figura 9. Linux organiza archivos y directorios bajo una única raíz `/`.*

Rutas importantes:

| Ruta | Idea inicial |
|---|---|
| `/home` | directorios personales |
| `/etc` | configuración |
| `/var` | datos variables y registros |
| `/srv` | datos asociados a servicios |
| `/tmp` | temporales |
| `/root` | home de root |
| `/usr` | programas y recursos del sistema |

No hay que memorizar toda la jerarquía en una tarde.

Hay que aprender a **moverse y reconocer para qué sirven las zonas que vamos utilizando**.

---

### 25. `cd`: cambiar de directorio

Ir a una ruta absoluta:

```bash
cd /etc
```

Volver al home:

```bash
cd ~
```

Subir al padre:

```bash
cd ..
```

Volver al directorio anterior:

```bash
cd -
```

#### Ejercicio resuelto 9

Estamos en:

```text
/home/francano/practicas
```

Queremos ir a:

```text
/home/francano
```

Solución:

```bash
cd ..
```

#### Ejercicio resuelto 10

Estamos en cualquier lugar y queremos llegar directamente a `/var/log`.

```bash
cd /var/log
```

---

### 26. Rutas absolutas y relativas

Absoluta:

```text
/etc/hosts
```

Relativa:

```text
practicas/uno.txt
```

Si estamos en `/home/francano`:

```bash
cd practicas
```

y:

```bash
cd /home/francano/practicas
```

pueden llevar al mismo lugar.

#### Símbolos fundamentales

| Símbolo | Significado |
|---|---|
| `/` | raíz |
| `.` | directorio actual |
| `..` | padre |
| `~` | home |
| `-` | directorio anterior con `cd -` |

#### Mini ejercicio resuelto

Si estás en:

```text
/srv/serlab/evidencias
```

`cd ..` te lleva a:

```text
/srv/serlab
```

`cd ../..` te lleva a:

```text
/srv
```

---

### 27. `ls`: mirar antes de tocar

```bash
ls
ls -l
ls -a
ls -h
ls -lah
```

Una salida de `ls -l` puede contener:

```text
-rw-r----- 1 francano serops 1240 sep 11 09:20 notas.txt
```

Todavía no hace falta entenderla entera.

Por ahora identifica:

```text
tipo
permisos
propietario
grupo
tamaño
fecha
nombre
```

#### Ejercicio resuelto 11

Existe:

```text
.config
```

pero `ls` no lo muestra.

Solución:

```bash
ls -a
```

En Linux, un nombre que comienza por `.` se trata como oculto en el listado normal.

---

### 28. Crear directorios y archivos

Crear un directorio:

```bash
mkdir practicas
```

Crear una estructura:

```bash
mkdir -p ~/ser/ut00/evidencias
```

Crear un archivo vacío:

```bash
touch notas.txt
```

#### Ejercicio guiado

Construye:

```text
~/ser/
└── ut00/
    ├── apuntes/
    ├── practicas/
    └── evidencias/
```

Solución sencilla:

```bash
mkdir -p ~/ser/ut00/apuntes
mkdir -p ~/ser/ut00/practicas
mkdir -p ~/ser/ut00/evidencias
```

Una forma compacta, cuando ya entiendas lo anterior:

```bash
mkdir -p ~/ser/ut00/{apuntes,practicas,evidencias}
```

Lo importante es entender el resultado, no escribir menos caracteres.

---

### 29. Copiar, mover y renombrar

Copiar:

```bash
cp notas.txt copia.txt
```

Mover:

```bash
mv copia.txt evidencias/
```

Renombrar:

```bash
mv notas.txt apuntes.txt
```

#### Ejercicio resuelto 12

Queremos conservar una copia antes de editar:

```bash
cp configuracion.conf configuracion.conf.bak
```

Después comprobamos:

```bash
ls -l configuracion.conf*
```

#### Ejercicio resuelto 13

Existe:

```text
practia.txt
```

y queremos corregir el nombre:

```bash
mv practia.txt practica.txt
```

---

### 30. Eliminar con cabeza

Archivo:

```bash
rm fichero.txt
```

Con confirmación:

```bash
rm -i fichero.txt
```

Directorio vacío:

```bash
rmdir directorio
```

Directorio con contenido:

```bash
rm -r directorio
```

Antes de un borrado importante:

```bash
pwd
ls -la
```

> **No utilizaremos `rm -rf` como gesto automático.**  
> Primero debemos saber exactamente qué ruta estamos afectando.

#### Ejercicio resuelto 14

Quieres eliminar `prueba.txt` pero deseas confirmación.

```bash
rm -i prueba.txt
```

---

## PARTE V · LEER, BUSCAR Y COMBINAR {#leer-buscar}

### 31. Leer archivos

Archivo corto:

```bash
cat /etc/hostname
```

Archivo largo:

```bash
less /etc/services
```

Primeras líneas:

```bash
head -n 5 /etc/passwd
```

Últimas:

```bash
tail -n 5 /etc/passwd
```

#### Ejercicio resuelto 15

Un log tiene 5.000 líneas y quieres las 20 últimas.

```bash
tail -n 20 archivo.log
```

`cat archivo.log` también mostraría información, pero no sería la herramienta mejor elegida para esa pregunta.

---

### 32. Buscar texto con `grep`

```bash
grep "root" /etc/passwd
```

Ignorar mayúsculas/minúsculas:

```bash
grep -i "error" archivo.log
```

Mostrar número de línea:

```bash
grep -n "error" archivo.log
```

#### Ejercicio resuelto 16

Queremos localizar `francano`:

```bash
grep "francano" /etc/passwd
```

---

### 33. Buscar archivos con `find`

```bash
find /etc -type f -name "*.conf" 2>/dev/null
```

En el directorio actual:

```bash
find . -type f -name "*.log"
```

#### Ejercicio resuelto 17

Necesitas encontrar archivos de configuración bajo `/etc`.

Una solución:

```bash
find /etc -type f -name "*.conf" 2>/dev/null
```

`2>/dev/null` oculta en este ejemplo los mensajes de error de permisos. Más adelante veremos con detalle la redirección de errores.

---

### 34. Tuberías `|`

La tubería envía la salida de un comando al siguiente.

```bash
ps aux | grep ssh
```

Piensa:

```text
ps aux
  ↓ produce muchas líneas
grep ssh
  ↓ conserva las relacionadas con ssh
```

Otro ejemplo:

```bash
ip address | less
```

#### Ejercicio resuelto 18

Queremos ver procesos relacionados con Apache:

```bash
ps aux | grep apache
```

Más adelante conoceremos alternativas más específicas como `pgrep`.

---

### 35. Redirecciones básicas

Crear o sustituir:

```bash
hostname > equipo.txt
```

Añadir:

```bash
date >> equipo.txt
```

Comprobar:

```bash
cat equipo.txt
```

#### Ejercicio resuelto 19

Queremos guardar hostname y fecha en el mismo fichero:

```bash
hostname > datos.txt
date >> datos.txt
```

**Clave:**

```text
>   sustituye
>>  añade
```

<details>
<summary><strong>Ampliación: salida normal y errores</strong></summary>

También existe una salida específica para errores.

Ejemplo:

```bash
find /root -type f 2> errores.txt
```

Y podemos guardar salida normal y errores:

```bash
comando > salida.txt 2>&1
```

No es necesario dominarlo el primer día.
</details>

---

## PARTE VI · USUARIOS, GRUPOS Y PERMISOS {#usuarios-permisos}

### 36. Saber quién eres de verdad

```bash
whoami
id
groups
```

Ejemplo de `id`:

```text
uid=1000(francano) gid=1000(francano) groups=1000(francano),27(sudo)
```

Esto nos permite distinguir:

- usuario;
- UID;
- grupo principal;
- grupos suplementarios.

---

### 37. Crear usuarios y grupos

Crear usuario:

```bash
sudo adduser tecnico01
```

Comprobar:

```bash
id tecnico01
```

Crear grupo:

```bash
sudo addgroup serops
```

Comprobar:

```bash
getent group serops
```

Añadir usuario:

```bash
sudo usermod -aG serops tecnico01
```

Verificar:

```bash
id tecnico01
```

#### Ejercicio resuelto 20

Queremos añadir `francano` a `serops` sin perder otros grupos.

```bash
sudo usermod -aG serops francano
```

Después:

```bash
id francano
```

> Tras cambiar grupos, una sesión que ya estaba abierta puede necesitar cerrarse y volver a abrirse para reflejar la nueva pertenencia.

---

### 38. `sudo` y mínimo privilegio

`sudo` no significa:

> «si da error, pon sudo».

Significa:

> «ejecuta esta operación concreta con privilegios administrativos».

Ejemplo:

```bash
sudo adduser tecnico02
```

No necesitas `sudo` para:

```bash
pwd
ls
cat ~/notas.txt
```

#### Ejercicio resuelto 21

Quieres comprobar tu directorio actual.

¿Usarías?

```bash
sudo pwd
```

No es necesario.

```bash
pwd
```

responde a la pregunta sin elevar privilegios.

---

### 39. Leer permisos

![Permisos Linux]({{ '/assets/ser/ut00/10_permisos_linux.svg' | relative_url }})

*Figura 10. Los permisos se dividen entre propietario, grupo y otros.*

Ejemplo:

```text
-rw-r-----
```

Separación:

```text
rw- | r-- | ---
 u      g      o
```

#### En archivos

```text
r → leer
w → modificar
x → ejecutar
```

#### En directorios

```text
r → listar nombres
w → crear/eliminar entradas
x → atravesar la ruta
```

La `x` en directorios será muy importante cuando trabajemos con servidores.

---

### 40. Permisos numéricos

```text
r = 4
w = 2
x = 1
```

Por tanto:

```text
7 = rwx
6 = rw-
5 = r-x
4 = r--
0 = ---
```

Ejemplos:

```text
600 → rw- --- ---
640 → rw- r-- ---
750 → rwx r-x ---
755 → rwx r-x r-x
```

Aplicar:

```bash
chmod 640 notas.txt
```

#### Ejercicio resuelto 22

¿Qué significa `750` en un directorio?

```text
propietario → rwx
grupo       → r-x
otros       → ---
```

El grupo puede listar y atravesar, pero no crear entradas.

---

### 41. Cambiar permisos, propietario y grupo

Añadir ejecución al dueño:

```bash
chmod u+x fichero
```

Quitar escritura al grupo:

```bash
chmod g-w fichero
```

Cambiar propietario y grupo:

```bash
sudo chown francano:serops documento.txt
```

Comprobar:

```bash
ls -l documento.txt
```

#### Ejercicio resuelto 23

Queremos que un archivo solo pueda ser leído y modificado por su propietario:

```bash
chmod 600 archivo.txt
```

---

<details>
<summary><strong>Ampliación: umask</strong></summary>

`umask` participa en los permisos iniciales de nuevos archivos y directorios.

```bash
umask
umask -S
```

Por ejemplo, con una máscara habitual `0022`, un archivo solicitado como `666` termina normalmente en `644`.

No es necesario dominarlo para superar la parte básica de UT00.
</details>

---

## PARTE VII · PAQUETES, PROCESOS, SERVICIOS Y LOGS {#servicios-logs}

### 42. Paquetes en Debian

Actualizar información de repositorios:

```bash
sudo apt update
```

Buscar:

```bash
apt search nginx
```

Consultar:

```bash
apt policy nginx
```

Instalar:

```bash
sudo apt install nginx
```

#### Idea importante

```text
paquete instalado
≠
servicio activo
≠
puerto escuchando
≠
cliente funcionando
```

---

### 43. Procesos

```bash
ps
ps aux
```

Filtrar:

```bash
ps aux | grep ssh
```

Consulta más directa:

```bash
pgrep -a ssh
```

#### Ejercicio resuelto 24

La pregunta es:

> «¿Existe algún proceso relacionado con SSH?»

Una primera comprobación puede ser:

```bash
pgrep -a ssh
```

---

### 44. Servicios con `systemctl`

Estado:

```bash
systemctl status ssh
```

¿Está activo?

```bash
systemctl is-active ssh
```

Arrancar:

```bash
sudo systemctl start ssh
```

Detener:

```bash
sudo systemctl stop ssh
```

Reiniciar:

```bash
sudo systemctl restart ssh
```

#### Ejercicio resuelto 25

Alguien afirma:

> «SSH está instalado, por tanto funciona».

No podemos concluirlo.

Podemos comprobar:

```bash
systemctl status ssh
```

y después, si buscamos una escucha:

```bash
sudo ss -lntp
```

---

### 45. Logs con `journalctl`

Arranque actual:

```bash
journalctl -b
```

Un servicio:

```bash
journalctl -u ssh
```

Últimas 30 líneas:

```bash
journalctl -u ssh -b -n 30 --no-pager
```

#### Ejercicio resuelto 26

SSH no inicia.

Antes de reiniciarlo cinco veces:

```bash
systemctl status ssh
journalctl -u ssh -b -n 30 --no-pager
```

El estado nos dice qué ocurre ahora; el log puede explicar qué ocurrió.

---

### 46. Puertos y sockets

TCP en escucha:

```bash
ss -lnt
```

TCP y UDP:

```bash
ss -lntu
```

Con procesos:

```bash
sudo ss -lntup
```

Opciones:

```text
-l → listening
-n → valores numéricos
-t → TCP
-u → UDP
-p → proceso
```

#### Ejercicio resuelto 27

Queremos comprobar si existe una escucha TCP en el puerto 22:

```bash
sudo ss -lntp | grep ':22'
```

---

## PARTE VIII · RED Y DIAGNÓSTICO {#red-diagnostico}

### 47. Interfaces y direcciones

```bash
ip -br address
```

Ejemplo:

```text
lo       UNKNOWN  127.0.0.1/8
enp0s3   UP       10.0.2.15/24
enp0s8   UP       192.168.50.10/24
```

Si `SER-LAB` es `192.168.50.0/24`, la segunda interfaz parece corresponder a la red interna.

**No lo deduzcas solo por el nombre:** confirma con rutas y configuración del hipervisor.

---

### 48. Rutas

```bash
ip route
```

Ejemplo conceptual:

```text
default via 10.0.2.2 dev enp0s3
192.168.50.0/24 dev enp0s8
```

Interpretación:

```text
destinos externos → NAT
SER-LAB           → enp0s8 directamente
```

Preguntar una ruta concreta:

```bash
ip route get 192.168.50.20
ip route get 1.1.1.1
```

#### Ejercicio resuelto 28

Para `192.168.50.20` esperamos usar la interfaz de `SER-LAB`.

Para `1.1.1.1` esperamos la interfaz NAT.

Si ambos destinos salen por la misma interfaz, tenemos algo que investigar.

---

### 49. `ping`, `ss`, `nc` y `curl` no demuestran lo mismo

Conectividad ICMP:

```bash
ping -c 4 192.168.50.20
```

Intento TCP:

```bash
nc -vz 192.168.50.10 22
```

Petición HTTP:

```bash
curl -v http://192.168.50.10/
```

| Herramienta | Pregunta principal |
|---|---|
| `ip -br a` | ¿qué interfaces e IP tengo? |
| `ip route` | ¿qué rutas conoce mi equipo? |
| `ping` | ¿hay intercambio ICMP si está permitido? |
| `ss` | ¿qué sockets existen en este equipo? |
| `nc` | ¿puedo establecer transporte hacia un puerto? |
| `curl` | ¿responde una aplicación HTTP? |
| `journalctl` | ¿qué ha registrado sistema/servicio? |

#### Ejercicio resuelto 29

```text
ping servidor → correcto
curl web      → connection refused
```

No es contradictorio.

El host responde a ICMP, pero probablemente no hay un proceso aceptando conexiones en el puerto HTTP esperado.

---

### 50. Escalera de diagnóstico

![Escalera de diagnóstico]({{ '/assets/ser/ut00/11_escalera_diagnostico.svg' | relative_url }})

*Figura 11. Diagnosticar significa comprobar una capa antes de saltar a la siguiente.*

Regla:

> **No reinicies un servicio para arreglar una IP incorrecta.**

Una secuencia útil:

```text
VM
↓
adaptador
↓
interfaz/IP
↓
red local
↓
ruta
↓
nombre
↓
puerto
↓
servicio
↓
aplicación
↓
permisos/logs
```

---
## PARTE IX · LABORATORIO GUIADO {#laboratorio}

### 51. Construir SER-LAB desde cero

#### Servidor

```text
VM:          ser-ser01
SO:          Debian 13
RAM:         2 GB
CPU:         2 vCPU
Disco:       25 GB dinámico
NIC 1:       NAT
NIC 2:       Red interna SER-LAB
IP SER-LAB:  192.168.50.10/24
Usuario:     francano
```

#### Cliente

```text
VM:          ser-cli01
SO:          Debian 13
NIC 1:       NAT
NIC 2:       Red interna SER-LAB
IP SER-LAB:  192.168.50.20/24
```

#### Fase A · virtualización

1. crea las VM;
2. instala Debian;
3. comprueba que ambas arrancan;
4. configura dos adaptadores;
5. crea `00_BASE_LIMPIA`.

#### Fase B · reconocimiento

En ambas VM:

```bash
whoami
hostname
pwd
ip -br address
ip route
```

Para cada comando escribe:

```text
qué busco → salida relevante → qué significa
```

#### Fase C · terminal

Crea:

```text
~/ser/ut00/
├── apuntes/
├── practicas/
├── evidencias/
└── copias/
```

Después practica:

```bash
touch
cp
mv
rm -i
cat
less
grep
```

#### Fase D · usuarios y permisos

Crea:

```text
grupo:   serops
usuario: tecnico01
```

Comprueba pertenencias y aplica distintos permisos a archivos de prueba.

#### Fase E · red

Comprueba que:

```text
ser-ser01 ↔ ser-cli01 por SER-LAB
```

y que la salida exterior utiliza NAT.

#### Checklist técnico antes de pasar a DHCP

Debes poder demostrar y explicar:

```text
[ ] distingo host, hipervisor, VM y guest
[ ] sé por qué tengo dos vNIC
[ ] sé qué tráfico debe ir por NAT
[ ] sé qué tráfico debe ir por SER-LAB
[ ] sé volver a 00_BASE_LIMPIA
[ ] puedo moverme por Linux sin interfaz gráfica
[ ] puedo crear/copiar/mover/eliminar archivos
[ ] entiendo usuarios, grupos y permisos básicos
[ ] sé consultar servicios, puertos, IP y rutas
```

---

{% comment %}

## PARTE X · PRÁCTICA DE MUESTRA {#practica}

### 52. Mi primera Debian administrable

> Este bloque se mantiene visible durante la revisión de la unidad. Puede ocultarse posteriormente sin afectar a la teoría.

La variante se basa únicamente en el número de puesto `P`.

Ejemplo puesto 7:

```text
hostname: ser-p07
usuario:  tec07
```

#### Tareas

1. crea una VM Debian y justifica CPU, RAM y disco;
2. configura NAT + Red interna `SER-LAB`;
3. instala Debian;
4. crea `00_BASE_LIMPIA`;
5. demuestra `whoami`, `hostname`, `pwd` y `ls -la`;
6. crea `~/ser/{apuntes,evidencias,practicas}`;
7. crea, copia, mueve y elimina archivos de prueba;
8. crea tu usuario técnico;
9. crea `serops`;
10. añade el usuario al grupo;
11. aplica y explica `600`, `640` y `750`;
12. identifica la interfaz de SER-LAB;
13. identifica la ruta por defecto;
14. consulta un servicio activo;
15. lista sockets TCP en escucha;
16. explica cómo regresarías al snapshot base.

No se busca una colección de capturas. Se busca demostrar que sabes:

```text
hacer → comprobar → explicar
```

{% endcomment %}

---
{% comment %}
## PARTE XI · BATERÍA DE EJERCICIOS {#ejercicios}

### 53. Nivel 1 · Orientación

1. Muestra tu usuario actual.
2. Muestra el hostname.
3. Indica el directorio actual.
4. Ve a `/etc`.
5. Regresa a tu home.
6. Ve a `/var/log`.
7. Sube un nivel.
8. Regresa al directorio anterior.
9. Lista archivos ocultos.
10. Explica `/home/francano` frente a `home/francano`.

### 54. Nivel 2 · Archivos

11. Crea `~/ser/ut00`.
12. Crea `practicas`, `copias` y `logs`.
13. Crea `practicas/uno.txt`.
14. Cópialo a `copias/uno.bak`.
15. Renombra `uno.txt`.
16. Comprueba el resultado.
17. Elimina la copia con confirmación.
18. Crea un archivo oculto y compáralo con `ls` y `ls -a`.

### 55. Nivel 3 · Lectura y búsqueda

19. Muestra `/etc/hostname`.
20. Muestra cinco primeras líneas de `/etc/passwd`.
21. Muestra cinco últimas.
22. Busca `root`.
23. Busca tu usuario.
24. Abre `/etc/services` con `less`.
25. Guarda el hostname en un archivo.
26. Añade la fecha sin borrar el hostname.

### 56. Nivel 4 · Usuarios y permisos

27. Interpreta `644`.
28. Interpreta `600`.
29. Interpreta `750` para un directorio.
30. Explica `r`, `w`, `x` en archivo.
31. Explica `r`, `w`, `x` en directorio.
32. Crea un archivo `600`.
33. Cámbialo a `640`.
34. Crea un grupo.
35. Crea un usuario.
36. Añádelo al grupo.
37. Comprueba el resultado.
38. Explica por qué `777` no es la respuesta profesional a todo.

### 57. Nivel 5 · Servicios y red

39. Lista interfaces.
40. Identifica SER-LAB.
41. Muestra rutas.
42. Identifica la ruta por defecto.
43. Pregunta qué ruta usaría el kernel hacia el cliente.
44. Prueba conectividad.
45. Lista sockets TCP.
46. Consulta un servicio activo.
47. Consulta sus últimas líneas de log.
48. Diferencia proceso, servicio y socket.
49. Explica por qué `ping` correcto no demuestra HTTP correcto.
50. Explica qué investigarías ante `connection refused`.

---
{% endcomment %}
## PARTE XII · CHULETA OPERATIVA {#chuleta}

### 58. Identidad y navegación

```bash
whoami
id
groups
hostname
pwd
ls -lah
cd /ruta
cd ..
cd ~
cd -
```

### 59. Archivos

```bash
mkdir -p ruta
touch fichero
cp origen destino
mv origen destino
rm -i fichero
cat fichero
less fichero
head -n 20 fichero
tail -n 20 fichero
grep -n "texto" fichero
find . -type f -name "*.conf"
```

### 60. Usuarios y permisos

```bash
sudo adduser usuario
sudo addgroup grupo
sudo usermod -aG grupo usuario
id usuario
ls -l
chmod 600 fichero
chmod 640 fichero
chmod 750 directorio
sudo chown usuario:grupo fichero
```

### 61. Sistema y red

```bash
cat /etc/os-release
ps aux
systemctl status SERVICIO
journalctl -u SERVICIO -b -n 30 --no-pager
sudo ss -lntup
ip -br address
ip route
ip route get DESTINO
ping -c 4 DESTINO
```

---

{% comment %}

## PARTE XIII · AUTOEVALUACIÓN {#autoevaluacion}

> Este bloque se mantiene visible durante la revisión. Puede ocultarse posteriormente de forma independiente.

<details>
<summary><strong>1. ¿Qué diferencia existe entre host, hipervisor, VM y guest?</strong></summary>

El host es el equipo físico; el hipervisor administra la virtualización; la VM es el hardware virtual; el guest es el sistema operativo instalado dentro de esa VM.
</details>

<details>
<summary><strong>2. ¿Una vNIC y NAT son lo mismo?</strong></summary>

No. La vNIC es la tarjeta virtual que ve el guest. NAT es uno de los modos mediante los que VirtualBox puede conectar esa tarjeta.
</details>

<details>
<summary><strong>3. ¿Por qué utilizamos Red interna en SER-LAB?</strong></summary>

Porque permite comunicar nuestras VM en un segmento aislado sin enviar el tráfico de laboratorio directamente a la red física.
</details>

<details>
<summary><strong>4. ¿Por qué Puente requiere especial cuidado?</strong></summary>

Porque la VM pasa a participar directamente en la LAN física y un servicio mal configurado puede afectar o quedar expuesto a otros equipos.
</details>

<details>
<summary><strong>5. ¿Snapshot y backup son equivalentes?</strong></summary>

No. El snapshot es excelente para volver a un estado de la VM, pero no sustituye una copia independiente.
</details>

<details>
<summary><strong>6. ¿Qué diferencia existe entre ruta absoluta y relativa?</strong></summary>

La absoluta comienza en `/`; la relativa se interpreta desde el directorio actual.
</details>

<details>
<summary><strong>7. ¿Qué significa `chmod 640 archivo`?</strong></summary>

Propietario `rw-`, grupo `r--`, otros `---`.
</details>

<details>
<summary><strong>8. ¿Qué significa `x` en un directorio?</strong></summary>

Permite atravesar la ruta y acceder a entradas cuando el resto de permisos lo permiten.
</details>

<details>
<summary><strong>9. ¿Un paquete instalado implica un servicio funcionando?</strong></summary>

No. Hay que distinguir software instalado, proceso/servicio activo, socket disponible y prueba real desde cliente.
</details>

<details>
<summary><strong>10. ¿Por qué un ping correcto no demuestra que una web funciona?</strong></summary>

Porque `ping` prueba ICMP. HTTP necesita además TCP, un puerto de escucha, un servidor y una respuesta de aplicación.
</details>

{% endcomment %}

---

## PARTE XIV · REFERENCIAS OFICIALES {#referencias}

### 62. Currículo

- [Decreto 272/2009, de 28 de diciembre · currículo SMR en Extremadura](https://doe.juntaex.es/pdfs/doe/2010/10o/10o.pdf)
- [Real Decreto 1691/2007 · título de Técnico en SMR](https://www.boe.es/buscar/doc.php?id=BOE-A-2008-819)

### 63. Virtualización

- [Oracle VirtualBox · Downloads](https://www.virtualbox.org/wiki/Downloads)
- [Oracle VirtualBox 7.2 · Virtual Networking](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/networkingdetails.html)
- [Oracle VirtualBox · Security Guide](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/Security.html)
- [Broadcom Support · VMware](https://support.broadcom.com/)
- [Microsoft Learn · Hyper-V](https://learn.microsoft.com/es-es/windows-server/virtualization/hyper-v/get-started/Install-Hyper-V)

### 64. Sistemas operativos y Linux

- [Debian · netinst](https://www.debian.org/distrib/netinst)
- [Debian 13 “trixie”](https://www.debian.org/releases/trixie/)
- [Debian Reference](https://www.debian.org/doc/manuals/debian-reference/index.es.html)
- [GNU Coreutils Manual](https://www.gnu.org/software/coreutils/manual/coreutils.html)
- [Microsoft · Descargar Windows 11](https://www.microsoft.com/es-es/software-download/windows11)

---

### 65. Qué viene después

Cuando esta base sea cómoda, comenzaremos:

```text
UT01 · DHCP
```

A partir de ese momento los comandos dejarán de aparecer como ejercicios aislados.

Los utilizaremos para:

```text
instalar
↓
configurar
↓
arrancar
↓
comprobar
↓
probar desde cliente
↓
diagnosticar
↓
explicar
```
