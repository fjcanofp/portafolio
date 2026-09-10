---
title: "UT00 · Virtualización y fundamentos Linux"

description: "Introducción profesional a la virtualización, creación del laboratorio SER-LAB y fundamentos de administración Linux desde terminal."

summary: "Preparación del entorno de trabajo mediante VirtualBox y adquisición de una base sólida de Linux desde terminal para administrar servicios de red."

module_key: ser
cycle_key: smr

order: 0

unit: "UT00"
module_code: "0227"
course: "2.º SMR"
level: "iniciacion"

ra:
  - "Transversal a RA1–RA8"

tags:
  - virtualizacion
  - virtualbox
  - linux
  - debian
  - terminal
  - permisos
  - usuarios
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

  - title: Consola Linux
    id: consola

  - title: Usuarios y permisos
    id: permisos

  - title: Servicios y logs
    id: servicios

  - title: Red y diagnóstico
    id: red

  - title: Laboratorio guiado
    id: laboratorio

  # - title: Práctica
  #   id: practica

  - title: Ejercicios
    id: ejercicios

  - title: Chuleta
    id: chuleta

  # - title: Autoevaluación
  #   id: autoevaluacion

  - title: Referencias
    id: referencias
---

## Introducción {#introduccion}

> **Objetivo de la unidad:** empezar desde cero con dos ideas fundamentales para el resto del curso: **entender cómo funciona un laboratorio virtual** y adquirir un **manejo sólido de la consola Linux**. La meta no es memorizar comandos, sino saber qué hace cada uno, probarlo, interpretar el resultado y utilizarlo después para administrar servicios de red.

En **Servicios en Red** trabajaremos durante todo el curso con servicios que se ejecutan sobre un sistema operativo: DHCP, DNS, transferencia de archivos, correo, web, acceso remoto, redes inalámbricas y pasarelas. Antes de administrar esos servicios necesitamos dominar el terreno donde viven: **archivos, directorios, usuarios, grupos, permisos, procesos, sockets, servicios y logs**.

Esta UT00 parte deliberadamente desde un nivel muy básico. Primero veremos **host, hipervisor, máquina virtual, ISO, CPU, RAM, disco, snapshots y redes virtuales**. Después entraremos en Debian y trabajaremos paso a paso con la terminal. El nivel de Linux busca una base sólida similar a la de una formación introductoria profesional, pero **sin scripting en esta unidad**.

---

### Qué deberías ser capaz de hacer al terminar

Al finalizar esta unidad deberías poder:

- explicar qué son **host, guest, hipervisor, VM e ISO**;
- crear una VM de laboratorio y justificar CPU, RAM y disco;
- distinguir NAT, Red NAT, Red interna, Solo-anfitrión y Puente;
- crear y restaurar snapshots;
- abrir una terminal y saber **dónde estás, quién eres y con qué privilegios trabajas**;
- moverte con soltura por el árbol de directorios de Linux;
- crear, copiar, mover, localizar, inspeccionar y borrar archivos de forma consciente;
- usar ayuda integrada (`man`, `--help`, `apropos`) en lugar de depender siempre de una receta;
- entender rutas absolutas, rutas relativas, `.` y `..`;
- trabajar con comodines, tuberías y redirecciones;
- crear y gestionar usuarios y grupos de un laboratorio;
- interpretar y modificar propietario, grupo y permisos;
- comprender el significado real de `r`, `w` y `x` en **archivos y directorios**;
- usar `sudo` aplicando el principio de mínimo privilegio;
- instalar y consultar paquetes en Debian;
- inspeccionar procesos, servicios, sockets y registros;
- revisar direccionamiento y rutas de red;
- diagnosticar un fallo siguiendo una secuencia y no mediante ensayo y error;
- documentar qué cambiaste, cómo lo comprobaste y cómo volverías atrás.

---

### Relación con los RA y CE de Servicios en Red

La **UT00 es preparatoria y transversal**. No cierra por sí sola un resultado de aprendizaje oficial. Construye las destrezas de sistema que necesitaremos para demostrar posteriormente los RA1–RA8 del módulo 0227.

| RA del módulo | Lo que UT00 prepara |
|---|---|
| **RA1 · Configuración dinámica** | instalación de paquetes, edición de configuración, procesos, sockets, captura y verificación desde cliente |
| **RA2 · Resolución de nombres** | manejo de archivos, permisos, servicios, logs y herramientas de consulta |
| **RA3 · Transferencia de ficheros** | usuarios, grupos, permisos, árbol de directorios y clientes de terminal |
| **RA4 · Correo electrónico** | cuentas, servicios, registros, puertos y comprobaciones cliente-servidor |
| **RA5 · Servidores web** | DocumentRoot, permisos, servicio, procesos, puertos, logs y comprobación |
| **RA6 · Acceso remoto** | consola, usuarios, claves, permisos y administración desde terminal |
| **RA7 · Redes inalámbricas** | interfaces, herramientas de red, servicios y diagnóstico |
| **RA8 · Redes privadas/públicas** | rutas, interfaces, sockets, procesos y comprobación extremo a extremo |

Los CE que reaparecerán durante el curso exigen, entre otras cosas, **instalar, configurar, verificar, crear usuarios/grupos, probar clientes, aplicar seguridad y demostrar el funcionamiento de los servicios**. UT00 entrena esas operaciones antes de aplicarlas a un servicio concreto.

> **Importante:** que un alumno domine `chmod`, `systemctl` o `ip route` no significa que haya superado un RA de SER. Estas herramientas adquieren valor curricular cuando se utilizan para construir y verificar los servicios asociados a cada RA.

---

### Contexto profesional: trabajar como técnico, no como “usuario que prueba cosas”

Imagina este ticket:

> “La web interna no abre desde un equipo cliente. En el servidor parece que sí funciona.”

Una reacción poco profesional sería reiniciar máquinas, cambiar IP, desactivar el cortafuegos y reinstalar el servidor “a ver si así va”.

Un técnico intenta **reducir el problema**:

1. ¿La interfaz existe y está activa?
2. ¿Tiene la dirección esperada?
3. ¿Existe una ruta hacia el destino?
4. ¿El nombre resuelve?
5. ¿El puerto es alcanzable?
6. ¿Hay un proceso escuchando?
7. ¿El servicio está activo?
8. ¿Qué dicen los logs?
9. ¿La aplicación responde correctamente?
10. ¿El cambio realizado resolvió el problema sin romper otra cosa?

Esa forma de pensar será el hilo conductor del módulo.

#### Competencias profesionales que empezamos a construir

- administración Linux y Windows;
- virtualización;
- operación de servicios;
- control de permisos;
- lectura de logs;
- diagnóstico de red;
- documentación técnica;
- aplicación del mínimo privilegio;
- recuperación ante errores.

---

## PARTE I · VIRTUALIZACIÓN DESDE CERO {#virtualizacion}

### Antes de tocar VirtualBox: ¿qué estamos virtualizando?

Un ordenador físico tiene recursos reales:

```text
CPU · memoria RAM · disco · tarjetas de red · USB · pantalla
```

Sin virtualización podríamos tener:

```text
ORDENADOR DEL AULA
└── Windows 11
```

Con virtualización podemos utilizar parte de esos recursos para construir otros ordenadores **virtuales**:

```text
ORDENADOR DEL AULA
│
├── Windows 11 del host
│
└── HIPERVISOR
    ├── VM 1 · Debian servidor
    ├── VM 2 · Debian cliente
    └── VM 3 · Windows cliente
```

La máquina virtual no “inventa” CPU ni RAM. El hipervisor reparte recursos del ordenador real.

#### Vocabulario imprescindible

| Concepto | Significado | Ejemplo del curso |
|---|---|---|
| **Host / anfitrión** | ordenador físico que ejecuta el hipervisor | PC Windows del aula |
| **Guest / invitado** | SO instalado dentro de una VM | Debian 13 |
| **VM** | ordenador virtual | `ser-ser01` |
| **Hipervisor** | software que crea/administra VM | VirtualBox |
| **ISO** | imagen utilizada como medio de instalación | ISO Debian 13 |

#### Ejercicio resuelto 1 · host o guest

**Situación:** ejecutas Windows 11 en el PC físico y dentro de VirtualBox arrancas Debian.

**Solución:**

```text
Windows 11 del PC → host
VirtualBox         → hipervisor
Debian             → guest
```

---

### ¿Por qué usamos virtualización en Servicios en Red?

Durante el curso vamos a:

- instalar servidores;
- cambiar direcciones IP;
- crear usuarios;
- modificar permisos;
- abrir puertos;
- arrancar y detener servicios;
- configurar DHCP y DNS;
- provocar fallos para diagnosticarlos.

Hacer todo eso directamente sobre la red y los equipos reales sería incómodo y, en algunos casos, peligroso.

Con VM podemos:

```text
crear → probar → romper → diagnosticar → restaurar
```

sin convertir cada práctica en una reinstalación completa.

Esto conecta además con el contexto profesional de la unidad: administración Windows/Linux, virtualización, redes, DHCP/DNS, soporte y documentación aparecen juntos en perfiles de sistemas porque forman parte de una misma infraestructura.

---

### VirtualBox, VMware e Hyper-V

#### Oracle VirtualBox

Será la herramienta principal del aula. Nos permite crear VM, discos virtuales, redes virtuales, snapshots y clones mediante una interfaz suficientemente accesible para empezar.

#### VMware Workstation

Es otra plataforma de virtualización de escritorio. Cambian los menús, pero no las ideas esenciales: crear hardware virtual, instalar un SO, conectar redes y gestionar estados. A fecha del curso, Broadcom distribuye VMware Workstation Pro a través de su portal de soporte.

#### Microsoft Hyper-V

Es el hipervisor de Microsoft integrado como característica opcional en ediciones compatibles de Windows. Microsoft exige, entre otros requisitos, CPU de 64 bits con SLAT, virtualización habilitada y suficiente memoria; Hyper-V completo no está disponible como rol en Windows Home.

#### Lo que queremos aprender de verdad

No queremos recordar solo “qué botón pulsar”. Queremos poder cambiar mañana de VirtualBox a VMware o Hyper-V y seguir entendiendo:

```text
VM → CPU → RAM → disco → ISO → NIC → red virtual → snapshot
```

#### Ejercicio resuelto 2 · cambia la herramienta

**Pregunta:** si mañana una empresa utiliza VMware, ¿deja de servir lo aprendido con VirtualBox?

**Solución:** no. La ubicación de las opciones cambia, pero conceptos como vCPU, RAM virtual, disco, snapshot y NIC virtual siguen existiendo.

---

### Recursos del host: no podemos asignarlo todo

Supongamos un PC con:

```text
16 GB RAM
8 procesadores lógicos
```

Queremos ejecutar dos Debian.

Un punto de partida razonable puede ser:

```text
ser-ser01  → 2 vCPU · 2 GB RAM
ser-cli01  → 2 vCPU · 2 GB RAM
```

El host conserva recursos para Windows, VirtualBox, navegador y resto de aplicaciones.

#### Ejercicio resuelto 3 · reparto de RAM

**Propuesta:** 8 GB para la primera VM + 8 GB para la segunda en un host de 16 GB.

**¿Buena idea?** No como configuración inicial. Dejaría prácticamente sin margen al sistema anfitrión.

**Principio:** asignar más recursos no siempre mejora el laboratorio.

---

### ¿Qué es una ISO?

La ISO es el medio de instalación.

En un PC físico podríamos arrancar desde un USB. En una VM podemos conectar virtualmente la ISO:

```text
ISO Debian
    │
    v
lector virtual
    │
    v
ser-ser01
```

Para nuestro servidor utilizaremos Debian 13 y, cuando una práctica lo justifique, Windows 11 como cliente.

#### Descargas oficiales

- [Oracle VirtualBox · Downloads](https://www.virtualbox.org/wiki/Downloads)
- [Debian · instalación netinst](https://www.debian.org/distrib/netinst)
- [Microsoft · Descargar Windows 11](https://www.microsoft.com/es-es/software-download/windows11)
- [Broadcom · VMware / descargas](https://support.broadcom.com/)
- [Microsoft Learn · Instalar Hyper-V](https://learn.microsoft.com/es-es/windows-server/virtualization/hyper-v/get-started/Install-Hyper-V)

Para los equipos Intel/AMD habituales utilizaremos normalmente la arquitectura Debian `amd64`.

---

### Crear `ser-ser01` paso a paso

#### Paso 1 · Nueva máquina

En VirtualBox selecciona **Nueva**.

Nombre:

```text
ser-ser01
```

Evita nombres ambiguos como `debian nuevo`, `prueba2` o `maquina definitiva`.

#### Paso 2 · ISO

Selecciona la ISO de Debian descargada desde la web oficial.

#### Paso 3 · CPU

Punto de partida:

```text
2 vCPU
```

#### Paso 4 · RAM

Punto de partida para Debian servidor sin escritorio:

```text
2048 MB
```

#### Paso 5 · Disco

Ejemplo de aula:

```text
25 GB · asignación dinámica
```

Un disco dinámico crece en el host según se utiliza, hasta el máximo configurado.

#### Ejercicio resuelto 4 · ¿25 GB significa ocupar 25 GB inmediatamente?

No necesariamente si el disco es dinámico. El sistema invitado puede ver un disco virtual de 25 GB mientras el fichero del host ocupa menos inicialmente.

---

### Instalación inicial de Debian

Utilizaremos valores de laboratorio. Como ejemplo didáctico:

```text
Nombre completo: Fran Cano
Usuario:         francano
Hostname:        ser-ser01
```

Para las contraseñas se emplearán **contraseñas exclusivas de laboratorio**, nunca una contraseña personal. Un ejemplo ficticio para entender el formato podría ser:

```text
SerLab-2026-Prueba
```

No reutilices esa contraseña fuera del laboratorio.

#### ¿Servidor con o sin escritorio?

Nuestro servidor de referencia se trabajará preferentemente **sin escritorio gráfico**. Así aprenderemos a administrarlo con la terminal, que es precisamente la competencia que necesitaremos durante el módulo.

#### Apagado correcto

```bash
sudo poweroff
```

Cerrar la ventana “a lo bruto” no debe ser el procedimiento normal de apagado.

---

### Snapshot: nuestro punto de vuelta atrás

Una instantánea guarda un estado de referencia de la VM.

Después de instalar y comprobar Debian crearemos:

```text
00_BASE_LIMPIA
```

Más adelante podremos tener:

```text
00_BASE_LIMPIA
   └── 01_RED_OK
        └── 02_DHCP_OK
```

#### Ejercicio resuelto 5 · antes de DHCP

**Situación:** Debian funciona y mañana empezaremos a tocar la red.

**Solución:** crear una instantánea antes del cambio. Si la práctica destruye la configuración podremos regresar a un estado conocido.

> Un snapshot es muy útil, pero **no sustituye una copia de seguridad independiente**.

---

### Clonar una VM

Después de preparar una Debian base podemos reutilizarla:

```text
Debian base
├── ser-ser01
└── ser-cli01
```

Después de clonar hay que revisar identidad y configuración: hostname, NIC, MAC cuando proceda e IP. Dos clones con la misma identidad pueden provocar problemas.

---

### Redes virtuales: la parte que más confunde al principio

Una VM puede tener varias tarjetas de red virtuales, aunque tu PC solo tenga Wi-Fi y Ethernet físicos.

Dentro de Debian podrías ver nombres como:

```text
enp0s3
enp0s8
```

No memorices esos nombres: **comprueba siempre los de tu VM**.

---

### NAT

Es el modo cómodo para dar salida a Internet a una VM.

```text
VM → NAT de VirtualBox → host → Internet
```

Uso típico:

```text
actualizar Debian
instalar paquetes
consultar repositorios
```

#### Ejercicio resuelto 6 · actualizar sin exponer la VM

Necesitamos Internet para `apt update`, pero no queremos colocar al servidor directamente en la red física del centro.

**Elección inicial:** NAT.

---

### Red interna

Conecta VM entre sí dentro de un segmento virtual:

```text
ser-ser01 ←→ SER-LAB ←→ ser-cli01
```

No proporciona Internet por sí misma y el host no participa normalmente.

Es ideal para servicios como DHCP porque podemos experimentar sin enviar sus respuestas a la red física.

#### Ejercicio resuelto 7 · laboratorio DHCP

**Pregunta:** ¿qué red elegirías para que un DHCP de prácticas no atienda ordenadores reales?

**Solución:** una **Red interna**, por ejemplo `SER-LAB`.

---

### Solo-anfitrión

Permite comunicar el host y las VM en una red virtual:

```text
HOST ←→ red host-only ←→ VM1 / VM2
```

Es útil cuando queremos administrar una VM desde el equipo físico sin colocarla directamente en la LAN real.

---

### Red NAT

Una Red NAT permite que varias VM compartan una red virtual y tengan salida a Internet:

```text
VM1 ─┐
     ├─ Red NAT ─→ Internet
VM2 ─┘
```

La diferencia con NAT individual será más clara cuando midamos los flujos en el laboratorio.

---

### Adaptador puente

En puente, la VM se aproxima a comportarse como otro equipo conectado a la LAN física:

```text
LAN REAL
├── host
├── otros equipos
└── VM
```

Es útil profesionalmente, pero también puede exponer servicios o interferir con la red real.

> **Norma de aula:** puente solo por indicación del profesor y con un objetivo concreto.

---

### Comparativa de modos

| Modo | Internet | VM ↔ VM | Host ↔ VM | Uso inicial |
|---|---:|---:|---:|---|
| NAT | Sí | no directo por defecto | limitado | actualizar una VM |
| Red NAT | Sí | Sí | según configuración | varias VM con salida |
| Red interna | No | Sí | No | laboratorio aislado |
| Solo-anfitrión | No por defecto | Sí | Sí | gestión desde el host |
| Puente | según LAN | Sí | Sí | VM en red física |

---

### Arquitectura SER-LAB

Cada máquina tendrá inicialmente:

```text
Adaptador 1 → NAT
Adaptador 2 → Red interna SER-LAB
```

```text
                         INTERNET
                            |
                     NAT VirtualBox
                            |
          +-----------------+-----------------+
          |                                   |
      ser-ser01                           ser-cli01
      Debian 13                           Debian 13
      NAT                                 NAT
      SER-LAB .10                         SER-LAB .20
          |                                   |
          +-------- 192.168.50.0/24 ----------+

          opcional: ser-win01 · 192.168.50.30/24
```

La interfaz de SER-LAB **no tendrá gateway** en este escenario. La ruta por defecto pertenece a NAT.

#### Ejercicio resuelto 8 · dos adaptadores

**Pregunta:** ¿por qué no dejamos solo NAT?

**Solución:** porque queremos separar claramente dos funciones: salida a Internet para mantenimiento y una red aislada para los servicios de clase.

---

### Configurar SER-LAB en VirtualBox

Con la VM apagada:

1. abre **Configuración → Red**;
2. Adaptador 1 → **NAT**;
3. habilita Adaptador 2;
4. selecciona **Red interna**;
5. escribe exactamente:

```text
SER-LAB
```

Haz lo mismo en las dos VM.

Estos nombres no deben considerarse iguales:

```text
SER-LAB
SER_LAB
SERLAB
```

#### Mini comprobación

Antes de entrar en Linux debes poder explicar:

- qué VM es servidor y cuál cliente;
- por qué existen dos NIC;
- para qué sirve NAT;
- para qué sirve SER-LAB;
- cómo volver a `00_BASE_LIMPIA`.

---

### Antes de escribir comandos: terminal, consola y shell

Estos conceptos suelen mezclarse:

- **terminal**: interfaz desde la que escribimos y vemos texto;
- **shell**: programa que interpreta las órdenes;
- **Bash**: una shell muy habitual en GNU/Linux;
- **prompt**: texto que aparece antes de escribir una orden;
- **comando**: instrucción que ejecuta la shell.

Un prompt puede verse así:

```text
francano@ser-ser01:~$
```

Lee sus partes:

```text
francano   usuario
ser-ser01  máquina
~          home actual
$          sesión de usuario normal
```

Comprueba identidad:

```bash
whoami
id
groups
hostname
```

#### Ejercicio resuelto 9 · ¿en qué máquina estoy?

Salida:

```text
$ whoami
francano
$ hostname
ser-ser01
```

**Conclusión:** trabajamos como `francano` dentro de `ser-ser01`.

#### Regla de oro

Antes de copiar un comando con `sudo`, pregúntate:

1. ¿qué modifica?;
2. ¿qué ruta afecta?;
3. ¿necesita realmente privilegios?;
4. ¿cómo comprobaré el resultado?;
5. ¿cómo volveré atrás?

---

## PARTE II · DOMINIO DE LA CONSOLA {#consola}

### Pedir ayuda sin salir del sistema

Un buen administrador no memoriza todas las opciones. Sabe encontrarlas.

```bash
man ls
man chmod
ls --help
chmod --help
apropos permissions
whatis passwd
```

Dentro de `man`:

```text
/ palabra    buscar
n            siguiente coincidencia
N            coincidencia anterior
q            salir
```

Para averiguar qué ejecutará la shell:

```bash
type cd
type ls
type printf
command -v bash
command -v systemctl
```

---

### Saber dónde estás

#### Ejemplo guiado

```bash
whoami
hostname
pwd
ls -la
```

No ejecutes los cuatro como una “receta”. Relaciona cada salida con una pregunta: **quién soy, en qué máquina estoy, dónde estoy y qué hay aquí**.


```bash
pwd
ls
ls -l
ls -la
ls -lh
```

`pwd` muestra el directorio actual. `ls -l` añade información fundamental:

```text
-rwxr-x--- 1 ana operadores 1240 sep 10 09:30 configuracion.conf
│└───────┘   │      │
│ permisos   dueño  grupo
└ tipo
```

El primer carácter indica el tipo:

- `-` archivo regular;
- `d` directorio;
- `l` enlace simbólico.

---

### Rutas absolutas y relativas

#### Mini ejercicio resuelto

Si estás en `/home/francano` y quieres entrar en `/home/francano/practicas`, funcionan ambas:

```bash
cd practicas
cd /home/francano/practicas
```

La primera es relativa; la segunda, absoluta.


Una **ruta absoluta** comienza en `/`:

```text
/etc/ssh/sshd_config
/var/log
/home/ana
```

Una **ruta relativa** parte del directorio actual:

```text
documentos/informe.txt
../copias
./documentos/informe.txt
```

Símbolos fundamentales:

| Símbolo | Significado |
|---|---|
| `/` | raíz del sistema |
| `.` | directorio actual |
| `..` | directorio padre |
| `~` | home del usuario actual |
| `-` | directorio anterior en `cd -` |

Ejemplos:

```bash
cd /etc
cd ..
cd ~
cd -
```

#### Ejercicio mental

Si estás en `/srv/serlab/scripts`:

```bash
cd ..
```

te lleva a `/srv/serlab`.

```bash
cd ../..
```

te lleva a `/srv`.

---

### Crear, copiar, mover y eliminar

#### Ejercicio guiado completo

```bash
mkdir -p ~/ser/ut00
cd ~/ser/ut00
touch notas.txt
cp notas.txt notas.bak
mv notas.txt apuntes.txt
ls -l
rm -i notas.bak
```

**Resultado:** has creado una carpeta, un archivo, una copia, un renombrado y una eliminación consciente. Repite después cambiando nombres sin mirar el ejemplo.


#### Crear directorios y archivos

```bash
mkdir laboratorio
mkdir -p laboratorio/config laboratorio/logs laboratorio/scripts
touch laboratorio/README.txt
```

#### Copiar

```bash
cp origen.txt copia.txt
cp origen.txt laboratorio/
cp -r directorio copia_directorio
```

#### Mover o renombrar

```bash
mv viejo.txt nuevo.txt
mv nuevo.txt laboratorio/
```

#### Eliminar

```bash
rm archivo.txt
rmdir directorio_vacio
rm -r directorio
```

> **Precaución:** `rm` no funciona como una papelera tradicional. Antes de usar `rm -r`, comprueba con `pwd` y `ls` dónde estás y qué vas a borrar.

Una estrategia útil durante el aprendizaje:

```bash
rm -i archivo.txt
cp -i origen destino
mv -i origen destino
```

La opción `-i` solicita confirmación en situaciones básicas.

---

### Leer archivos sin abrir un editor

#### Ejercicio resuelto

Un log tiene miles de líneas y solo quieres las 20 últimas:

```bash
tail -n 20 archivo.log
```

`cat archivo.log` funcionaría, pero sería una herramienta peor elegida para esa pregunta.


```bash
cat archivo.txt
less archivo.txt
head archivo.txt
head -n 20 archivo.txt
tail archivo.txt
tail -n 30 archivo.txt
tail -f /var/log/syslog
```

`cat` es cómodo para archivos pequeños. `less` es preferible cuando el archivo crece.

Para conocer el tipo:

```bash
file archivo.txt
stat archivo.txt
```

---

### Buscar archivos y buscar dentro de archivos

#### Ejercicio resuelto

Quieres localizar archivos `.conf` bajo `/etc`:

```bash
find /etc -type f -name "*.conf" 2>/dev/null
```

Después quieres buscar la palabra `listen` dentro de configuraciones:

```bash
grep -Rni "listen" /etc 2>/dev/null
```


#### Buscar nombres

```bash
find /etc -name "*.conf" 2>/dev/null
find . -type f -name "*.log"
find /var/log -type f -mtime -1 2>/dev/null
```

#### Buscar contenido

```bash
grep "error" aplicacion.log
grep -i "failed" aplicacion.log
grep -n "Listen" /etc/apache2/ports.conf
grep -R "192.168.50.10" /etc 2>/dev/null
```

#### Una combinación profesional

```bash
find /etc -type f -name "*.conf" 2>/dev/null | head
```

Aquí aparece nuestro siguiente concepto.

---

### Tuberías: convertir comandos pequeños en herramientas potentes

#### Ejercicio resuelto

Queremos observar procesos y quedarnos con líneas relacionadas con SSH:

```bash
ps aux | grep ssh
```

Primero `ps aux` produce información; después `grep` la filtra.


La tubería `|` envía la salida de un comando a la entrada del siguiente.

```bash
ip address | less
ps aux | grep apache
ss -lntup | grep ':80'
journalctl -b | grep -i error
```

No memorices la tubería como “un símbolo”. Piensa:

```text
COMANDO A  --> produce datos -->  COMANDO B los filtra/procesa
```

Otros comandos útiles para procesar texto:

```bash
sort
uniq
wc
cut
tr
sed
```

Ejemplos:

```bash
cut -d: -f1 /etc/passwd
cut -d: -f1 /etc/passwd | sort
printf "uno\ndos\ntres\n" | wc -l
```

---

### Redirecciones: stdout y stderr

#### Ejercicio resuelto

Crear un pequeño inventario manual:

```bash
hostname > datos-equipo.txt
date >> datos-equipo.txt
ip -br address >> datos-equipo.txt
cat datos-equipo.txt
```

Observa que solo el primer `>` crea/sustituye; los siguientes `>>` añaden.


Un proceso suele trabajar con:

- entrada estándar: `stdin`;
- salida estándar: `stdout`;
- salida de error: `stderr`.

Guardar salida:

```bash
ip -br address > inventario_red.txt
```

Añadir sin sobrescribir:

```bash
date >> inventario_red.txt
```

Guardar errores:

```bash
find /root -type f 2> errores.txt
```

Guardar salida y errores:

```bash
comando > salida.txt 2>&1
```

En Bash moderno también puedes encontrar:

```bash
comando &> salida_completa.txt
```

#### Diferencia crítica

```bash
echo "A" > archivo.txt
```

**reemplaza** el contenido.

```bash
echo "B" >> archivo.txt
```

**añade** al final.

---

### Comodines y expansión

```bash
ls *.conf
ls informe?.txt
cp *.log copias/
```

- `*` coincide con cero o más caracteres;
- `?` coincide con un carácter;
- `[abc]` coincide con uno de los caracteres indicados.

Comprueba siempre la expansión antes de una operación destructiva:

```bash
printf '%s\n' *.log
```

y solo después:

```bash
rm -- *.log
```

---

### Comillas: una pequeña diferencia que evita muchos bugs

```bash
nombre="Servidor principal"
echo "$nombre"
echo '$nombre'
```

Resultado conceptual:

```text
"..."   expande variables
'...'   conserva el texto literalmente
```

Siempre que una variable pueda contener espacios, cita la expansión:

```bash
cp "$origen" "$destino"
```

No:

```bash
cp $origen $destino
```

---

## PARTE III · USUARIOS, GRUPOS Y PERMISOS {#permisos}

### Usuarios y grupos

Linux identifica usuarios y grupos internamente mediante números:

- UID: identificador de usuario;
- GID: identificador de grupo.

Consulta:

```bash
id
id root
getent passwd
getent group
```

No es necesario leer `/etc/passwd` entero cada vez:

```bash
getent passwd "$USER"
```

Campos habituales de `/etc/passwd`:

```text
usuario:x:UID:GID:comentario:home:shell
```

---

### Crear usuarios y grupos en Debian

#### Ejercicio resuelto

Queremos un grupo `serops` y un usuario de laboratorio `tecnico01`:

```bash
sudo addgroup serops
sudo adduser tecnico01
sudo usermod -aG serops tecnico01
id tecnico01
```

La última orden no modifica nada: **verifica**.


En un laboratorio:

```bash
sudo addgroup operadores
sudo adduser tecnico01
sudo usermod -aG operadores tecnico01
```

Verifica:

```bash
id tecnico01
getent group operadores
```

#### Cuidado con `usermod -G`

Para **añadir** grupos suplementarios suele utilizarse:

```bash
sudo usermod -aG grupo usuario
```

Olvidar `-a` al utilizar `-G` puede sustituir la lista de grupos suplementarios existente.

Después de modificar la pertenencia a grupos, una sesión ya abierta puede no reflejar inmediatamente el nuevo estado. Cierra y abre sesión o crea una nueva sesión para comprobarlo.

---

### `sudo`, root y mínimo privilegio

`root` puede realizar prácticamente cualquier operación administrativa. No es una invitación a trabajar siempre como root.

Comprueba:

```bash
whoami
sudo -l
```

Ejecuta una operación administrativa puntual:

```bash
sudo systemctl status ssh
```

Abre una shell de root solo cuando tenga sentido y ciérrala al terminar:

```bash
sudo -i
exit
```

#### Patrón recomendado

```text
usuario normal
      |
      +--> inspección sin privilegios
      |
      +--> sudo SOLO para el cambio administrativo
      |
      +--> validación
```

---

### Permisos: `r`, `w`, `x`

Linux separa permisos para:

```text
u = owner / propietario
g = group / grupo
o = others / resto
```

Ejemplo:

```text
-rwxr-x---
```

Se divide así:

```text
rwx | r-x | ---
 u      g      o
```

#### En un archivo

- `r`: leer;
- `w`: modificar;
- `x`: ejecutar.

#### En un directorio

- `r`: listar nombres;
- `w`: crear/eliminar entradas;
- `x`: atravesar el directorio y acceder a sus elementos.

El significado de `x` en un directorio es especialmente importante para servidores web, FTP/SFTP y servicios que necesitan recorrer una ruta.

---

### Permisos numéricos

#### Ejercicios resueltos rápidos

```text
640 → rw- r-- ---
600 → rw- --- ---
750 → rwx r-x ---
755 → rwx r-x r-x
```

Pregunta clave: en un directorio, `x` significa poder **atravesarlo**, no “ejecutar la carpeta”.


Cada permiso tiene un valor:

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

```bash
chmod 640 configuracion.conf
chmod 750 directorio_privado
chmod 755 directorio_publico
```

Interpretación de `640`:

```text
6  -> rw-  propietario
4  -> r--  grupo
0  -> ---  resto
```

---

### Permisos simbólicos

También podemos expresar cambios sin calcular números:

```bash
chmod u+x directorio_privado
chmod g+w compartido
chmod o-r secreto.txt
chmod u=rw,g=r,o= archivo.conf
```

Suele ser más legible cuando se modifica una única capacidad.

---

### Propietario y grupo

```bash
ls -l
chown usuario archivo
chgrp grupo archivo
chown usuario:grupo archivo
```

Normalmente un cambio de propiedad administrativo requiere privilegios:

```bash
sudo chown root:operadores /srv/serlab
```

Verificación:

```bash
stat /srv/serlab
ls -ld /srv/serlab
```

---

### `umask`: permisos iniciales

`umask` limita los permisos que se asignan inicialmente a nuevos archivos y directorios.

Consulta:

```bash
umask
umask -S
```

Ejemplo conceptual habitual:

```text
umask 0022
archivo solicitado 666  -> 644
directorio solicitado 777 -> 755
```

No pienses que `umask` “pone permisos”. Actúa como una máscara que restringe los permisos solicitados al crear el objeto.

---

### Un mini laboratorio de permisos

```bash
mkdir -p ~/perm-lab/publico ~/perm-lab/privado
cd ~/perm-lab
touch publico/aviso.txt privado/datos.txt
chmod 755 publico
chmod 700 privado
chmod 644 publico/aviso.txt
chmod 600 privado/datos.txt
ls -ld publico privado
ls -l publico privado
```

#### Ejercicio resuelto

`privado` tiene modo `700`:

```text
rwx --- ---
```

Solo el propietario puede listar, crear elementos y atravesar el directorio. Así podemos practicar el significado de `x` en directorios sin introducir todavía programas propios.

Prueba después a cambiar únicamente el permiso del grupo:

```bash
chmod 750 privado
ls -ld privado
```

Ahora el grupo puede leer la lista y atravesar el directorio, pero no escribir en él.

---

## PARTE IV · PAQUETES, PROCESOS, SERVICIOS Y LOGS {#servicios}

### Paquetes en Debian

Consultar:

```bash
apt policy nginx
dpkg -l | less
dpkg -l | grep openssh
```

Actualizar el índice de paquetes:

```bash
sudo apt update
```

Instalar un paquete de laboratorio:

```bash
sudo apt install nombre-paquete
```

La instalación es solo una capa. Un servicio puede estar instalado y no estar activo.

---

### Procesos

```bash
ps
ps aux
ps aux | less
pgrep -a ssh
top
```

Finalizar un proceso propio:

```bash
kill PID
```

Evita convertir `kill -9` en la primera opción. Una señal forzada impide al proceso realizar su cierre normal.

---

### Servicios con systemd

#### Ejercicio resuelto

“Apache está instalado” no demuestra que una web esté funcionando. Una secuencia mejor:

```bash
systemctl status apache2
sudo ss -lntp | grep ':80'
```

Más adelante añadiremos una petición desde cliente. Cada orden responde a una pregunta diferente.


```bash
systemctl status ssh
systemctl is-active ssh
systemctl is-enabled ssh
```

Operaciones administrativas:

```bash
sudo systemctl start ssh
sudo systemctl stop ssh
sudo systemctl restart ssh
sudo systemctl reload ssh
sudo systemctl enable ssh
```

No todos los servicios admiten `reload`. Consulta su unidad y documentación.

Una secuencia segura para cambiar un servicio:

```text
1. inspeccionar
2. guardar configuración anterior
3. editar
4. validar sintaxis con la herramienta propia
5. recargar/reiniciar
6. revisar estado
7. revisar socket
8. probar desde cliente
9. leer logs
10. ejecutar prueba de regresión
```

---

### Logs con `journalctl`

```bash
journalctl -b
journalctl -p warning
journalctl -u ssh
journalctl -u ssh -b
journalctl -u ssh -b -n 50 --no-pager
```

Seguir eventos:

```bash
sudo journalctl -u ssh -f
```

Filtrar después:

```bash
journalctl -b | grep -i failed
```

> El log no es “algo que miramos si todo sale mal”. Forma parte de la evidencia normal de operación.

---

### Puertos y sockets

```bash
ss -lnt
ss -lnu
sudo ss -lntup
```

Lectura de opciones frecuentes:

```text
-l  listening
-n  no resolver nombres
-t  TCP
-u  UDP
-p  proceso asociado (cuando hay permisos)
```

Ejemplo:

```bash
sudo ss -lntp | grep ':22'
```

Un proceso activo no demuestra automáticamente que escuche en la interfaz o puerto esperado.

---

## PARTE V · RED Y DIAGNÓSTICO MÍNIMO {#red}

### Identificar interfaces, IP y rutas

#### Ejercicio resuelto

Si observas:

```text
enp0s3  UP  10.0.2.15/24
enp0s8  UP  192.168.50.10/24
```

y SER-LAB es `192.168.50.0/24`, la interfaz interna será previsiblemente `enp0s8`. **Compruébalo con las rutas; no lo deduzcas solo por el nombre de interfaz.**


```bash
ip -br address
ip link
ip route
ip route get 192.168.50.10
ip neigh
```

`ip -br address` ofrece una vista rápida. `ip route get DESTINO` es especialmente útil porque muestra qué decisión tomaría el kernel para un destino concreto.

Ejemplo:

```bash
ip route get 192.168.50.10
ip route get 1.1.1.1
```

En nuestro laboratorio deberían utilizar interfaces distintas si la arquitectura tiene NAT + SER-LAB.

---

### Probar conectividad y transporte

#### Ejercicio resuelto

```text
ping servidor → responde
curl web       → falla
```

No hay contradicción. Ping aporta evidencia ICMP; HTTP necesita además TCP, una escucha y una aplicación funcionando.


```bash
ping -c 4 192.168.50.10
```

Para TCP:

```bash
nc -vz 192.168.50.10 22
curl -v --connect-timeout 3 http://192.168.50.10/
```

Cada herramienta demuestra algo diferente:

| Prueba | Demuestra principalmente |
|---|---|
| `ip -br a` | configuración local de interfaces |
| `ip route get` | decisión de encaminamiento |
| `ping` | intercambio ICMP si no está filtrado |
| `nc -vz host puerto` | intento de conexión de transporte |
| `ss -lntup` | sockets locales |
| `curl` | conversación de aplicación HTTP |
| `journalctl` | eventos registrados por sistema/servicio |

---

### La escalera de diagnóstico

Cuando algo no funciona, recorre capas:

```text
[1] enlace
      |
[2] dirección IP
      |
[3] vecino / red local
      |
[4] ruta
      |
[5] resolución de nombre
      |
[6] transporte / puerto
      |
[7] proceso / servicio
      |
[8] aplicación
      |
[9] seguridad / permisos
      |
[10] logs y regresión
```

No avances a la capa 8 si la 2 ya es incorrecta.

---

## PARTE VI · LABORATORIO PÚBLICO GUIADO {#laboratorio}

### Construir una estación Linux administrable

El objetivo no es terminar rápido, sino poder explicar cada paso.

#### Fase A · Crear las VM

Servidor:

```text
Nombre:      ser-ser01
SO:          Debian 13
RAM:         2 GB
CPU:         2 vCPU
Disco:       25 GB dinámico
NIC 1:       NAT
NIC 2:       Red interna SER-LAB
Usuario:     francano
```

Cliente:

```text
Nombre:      ser-cli01
SO:          Debian 13
NIC 1:       NAT
NIC 2:       Red interna SER-LAB
```

Crea `00_BASE_LIMPIA` cuando el sistema esté instalado y comprobado.

#### Fase B · Reconocimiento manual

```bash
whoami
hostname
pwd
ls -la
cat /etc/os-release
ip -br address
ip route
```

Para cada orden escribe una frase:

```text
comando → dato que busco → salida relevante → interpretación
```

#### Fase C · Árbol de trabajo

Crea:

```text
~/ser-lab/
├── apuntes/
├── evidencias/
├── practicas/
└── copias/
```

Practica conscientemente:

```bash
mkdir
touch
cp
mv
rm -i
```

#### Fase D · Usuarios y permisos

En un laboratorio autorizado:

```text
grupo:   serops
usuario: tecnico01
```

Crea un directorio compartido y utiliza `ls -ld`, `id` y `stat` para explicar qué acceso tiene cada identidad.

#### Fase E · Sistema y red

Obtén e interpreta:

```bash
systemctl --type=service --state=running
journalctl -b -n 20 --no-pager
ss -lnt
ip -br address
ip route
```

#### Fase F · Incidencia sencilla

El profesor o el propio alumno puede provocar **un único fallo reversible** dentro del laboratorio, por ejemplo:

- una NIC virtual desconectada;
- un nombre de Red interna distinto;
- un servicio de prueba detenido;
- permisos insuficientes en un archivo de práctica.

Documenta:

```text
síntoma → hipótesis → prueba → resultado → cambio mínimo → validación → rollback
```

---

{% comment %}

## PARTE VII · PRÁCTICA DE MUESTRA INDIVIDUALIZABLE {#practica}

### Mi primera Debian administrable

La variante usa únicamente el número de puesto `P`.

Ejemplo para puesto 7:

```text
hostname: ser-p07
usuario técnico de laboratorio: tec07
```

#### Reto

1. crea una VM Debian y justifica CPU, RAM y disco;
2. configura NAT + Red interna `SER-LAB`;
3. instala Debian;
4. crea snapshot `00_BASE_LIMPIA`;
5. demuestra `whoami`, `hostname`, `pwd` y `ls -la`;
6. crea `~/ser/{apuntes,evidencias,practicas}`;
7. crea, copia, mueve y elimina archivos de prueba;
8. crea el usuario técnico correspondiente a tu puesto;
9. crea el grupo `serops` y añade el usuario sin borrar otros grupos;
10. aplica permisos `600`, `640` y `750` a objetos de prueba y explica cada uno;
11. localiza tu interfaz SER-LAB;
12. identifica la ruta por defecto;
13. consulta un servicio activo;
14. consulta sockets TCP en escucha;
15. explica cómo volverías al snapshot base.

> La web no publica una única solución cerrada: interesa que el procedimiento pueda defenderse y reproducirse.

---

{% endcomment %}

## PARTE VIII · BATERÍA DE EJERCICIOS {#ejercicios}

### Nivel 1 · Orientación

1. Muestra tu usuario actual.
2. Muestra el hostname.
3. Indica tu directorio actual.
4. Ve a `/etc`.
5. Regresa al home.
6. Ve a `/var/log`.
7. Sube un nivel.
8. Regresa al directorio anterior.
9. Lista archivos ocultos.
10. Explica la diferencia entre `/home/francano` y `home/francano`.

### Nivel 2 · Archivos y directorios

11. Crea `~/ser/ut00`.
12. Crea de una vez `practicas`, `copias` y `logs`.
13. Crea `practicas/uno.txt`.
14. Cópialo a `copias/uno.bak`.
15. Renombra `uno.txt` como `original.txt`.
16. Comprueba los resultados con `ls -l`.
17. Elimina la copia solicitando confirmación.
18. Crea un archivo oculto y demuestra la diferencia entre `ls` y `ls -a`.

### Nivel 3 · Leer y buscar

19. Muestra `/etc/hostname`.
20. Muestra las primeras cinco líneas de `/etc/passwd`.
21. Muestra las últimas cinco.
22. Busca `root` dentro de `/etc/passwd`.
23. Busca tu usuario.
24. Abre `/etc/services` con `less` y busca `http`.
25. Guarda el hostname en `equipo.txt`.
26. Añade la fecha sin borrar lo anterior.

### Nivel 4 · Usuarios y permisos

27. Interpreta `644`.
28. Interpreta `600`.
29. Interpreta `750` aplicado a un directorio.
30. Explica `r`, `w` y `x` para archivo.
31. Explica `r`, `w` y `x` para directorio.
32. Crea un archivo y aplícale `600`.
33. Cámbialo a `640`.
34. Crea un grupo de laboratorio.
35. Crea un usuario de laboratorio.
36. Añádelo al grupo sin sustituir otras membresías.
37. Comprueba el resultado.
38. Explica por qué `777` no debe ser tu primera respuesta a un problema.

### Nivel 5 · Servicios y red

39. Lista interfaces en formato breve.
40. Identifica qué interfaz pertenece a SER-LAB.
41. Muestra la tabla de rutas.
42. Identifica la ruta por defecto.
43. Pregunta al kernel qué ruta usaría hacia el servidor.
44. Prueba conectividad al servidor.
45. Lista sockets TCP en escucha.
46. Selecciona un servicio activo y consulta su estado.
47. Consulta sus últimas líneas de log.
48. Explica diferencia entre proceso, servicio y socket.
49. Explica por qué ping correcto no demuestra HTTP correcto.
50. Describe qué revisarías tras un `Connection refused`.

---

## PARTE IX · CHULETA OPERATIVA {#chuleta}

### Identidad y orientación

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

### Archivos y texto

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

### Usuarios y permisos

```bash
sudo adduser usuario
sudo addgroup grupo
sudo usermod -aG grupo usuario
id usuario
ls -l
stat fichero
chmod 600 fichero
chmod 640 fichero
chmod 750 directorio
sudo chown usuario:grupo fichero
```

### Sistema y servicios

```bash
cat /etc/os-release
ps aux
systemctl status SERVICIO
systemctl is-active SERVICIO
journalctl -u SERVICIO -b -n 30 --no-pager
sudo ss -lntup
```

### Red

```bash
ip -br address
ip route
ip route get DESTINO
ip neigh
ping -c 4 DESTINO
curl -v URL
```

---

{% comment %}

## PARTE X · AUTOEVALUACIÓN {#autoevaluacion}

<details>
<summary><strong>1. ¿Qué diferencia hay entre host, hipervisor y guest?</strong></summary>

El host es el equipo físico; el hipervisor administra las VM; el guest es el sistema operativo instalado dentro de una VM.
</details>

<details>
<summary><strong>2. ¿Para qué utilizamos NAT?</strong></summary>

Para dar una salida sencilla a Internet a una VM sin convertirla directamente en otro equipo de la LAN física.
</details>

<details>
<summary><strong>3. ¿Por qué SER-LAB utiliza Red interna?</strong></summary>

Porque queremos un segmento donde las VM puedan experimentar con servicios sin interferir directamente con la red física.
</details>

<details>
<summary><strong>4. ¿Snapshot es lo mismo que backup?</strong></summary>

No. Es un estado recuperable muy útil del entorno virtual, pero no sustituye una copia independiente.
</details>

<details>
<summary><strong>5. ¿Qué diferencia hay entre una ruta absoluta y una relativa?</strong></summary>

Una absoluta comienza desde `/`; una relativa se interpreta desde el directorio actual.
</details>

<details>
<summary><strong>6. ¿Qué diferencia existe entre <code>&gt;</code> y <code>&gt;&gt;</code>?</strong></summary>

`>` reemplaza el contenido del destino; `>>` añade al final.
</details>

<details>
<summary><strong>7. ¿Qué significa <code>chmod 640 fichero</code>?</strong></summary>

Propietario lectura/escritura; grupo lectura; otros sin permisos.
</details>

<details>
<summary><strong>8. ¿Significa lo mismo <code>x</code> en archivo y directorio?</strong></summary>

No. En archivo permite ejecución; en directorio permite atravesarlo/acceder a sus entradas si el resto de condiciones lo permiten.
</details>

<details>
<summary><strong>9. ¿Por qué se utiliza <code>usermod -aG</code> para añadir un grupo?</strong></summary>

`-a` añade. Sin esa opción, `-G` puede sustituir la lista de grupos suplementarios.
</details>

<details>
<summary><strong>10. ¿Un paquete instalado implica un servicio funcionando?</strong></summary>

No. Hay que distinguir paquete, proceso, servicio, socket y prueba real desde cliente.
</details>

<details>
<summary><strong>11. ¿Qué aporta <code>ss -lnt</code>?</strong></summary>

Muestra sockets TCP en escucha; ayuda a comprobar si existe realmente una escucha de transporte.
</details>

<details>
<summary><strong>12. ¿Por qué ping correcto no demuestra que una web funcione?</strong></summary>

Ping usa ICMP. HTTP necesita además TCP, un servidor escuchando, configuración válida y respuesta de aplicación.
</details>

---

### Reto de salida

Sin consultar la chuleta, intenta:

```text
1. explicar host / guest / hipervisor / ISO;
2. crear una VM razonable;
3. explicar NAT y Red interna;
4. crear un snapshot;
5. iniciar sesión en Debian;
6. mostrar usuario, hostname y ruta actual;
7. moverte por /etc, /var/log y tu home;
8. crear, copiar, mover y borrar archivos;
9. localizar información con grep;
10. crear usuario y grupo de laboratorio;
11. interpretar 600, 640 y 750;
12. consultar un servicio y sus logs;
13. localizar IP y rutas;
14. listar sockets;
15. explicar una secuencia de diagnóstico.
```

Si puedes hacerlo **y explicarlo**, ya tienes la base que necesitamos para comenzar DHCP.

---

{% endcomment %}

## PARTE XI · REFERENCIAS OFICIALES {#referencias}

### Virtualización

- [Oracle VirtualBox · Descargas](https://www.virtualbox.org/wiki/Downloads)
- [Oracle VirtualBox · Networking](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/networkingdetails.html)
- [Broadcom Support · VMware](https://support.broadcom.com/)
- [Microsoft Learn · Instalar Hyper-V](https://learn.microsoft.com/es-es/windows-server/virtualization/hyper-v/get-started/Install-Hyper-V)
- [Microsoft Learn · Requisitos de Hyper-V](https://learn.microsoft.com/es-es/windows-server/virtualization/hyper-v/host-hardware-requirements)

### Sistemas operativos

- [Debian · Descargar mediante netinst](https://www.debian.org/distrib/netinst)
- [Debian 13 “trixie”](https://www.debian.org/releases/trixie/)
- [Microsoft · Descargar Windows 11](https://www.microsoft.com/es-es/software-download/windows11)

### Linux

- [Debian Reference](https://www.debian.org/doc/manuals/debian-reference/index.es.html)
- [Debian Reference · introducción a GNU/Linux](https://www.debian.org/doc/manuals/debian-reference/ch01.es.html)
- [GNU Coreutils Manual](https://www.gnu.org/software/coreutils/manual/coreutils.html)

### Currículo

- [BOE · Técnico en Sistemas Microinformáticos y Redes](https://www.boe.es/buscar/doc.php?id=BOE-A-2008-819)

---

### Qué viene después

```text
VIRTUALIZACIÓN
      ↓
SER-LAB
      ↓
DEBIAN
      ↓
TERMINAL
      ↓
ARCHIVOS / USUARIOS / PERMISOS
      ↓
SERVICIOS / LOGS
      ↓
RED / RUTAS / SOCKETS
      ↓
DIAGNÓSTICO
      ↓
UT01 · DHCP
```

En UT01 dejaremos de practicar estos comandos de forma aislada y los utilizaremos para desplegar y comprobar un servicio real.
