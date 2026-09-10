---
title: "UT00 · Entorno profesional, Linux y scripting base"

description: "Laboratorio de partida de Servicios en Red: Debian 13, terminal Linux, sistema de ficheros, usuarios, grupos, permisos, procesos, servicios, red, diagnóstico y scripting Bash."

summary: "Base práctica de Linux y Bash para administrar, verificar y diagnosticar los servicios de red que utilizaremos durante el curso."

module_key: ser
cycle_key: smr

order: 0

unit: UT00
module_code: "0227"
course: "2.º SMR"
level: "base-intermedio"

ra:
  - "Transversal a RA1–RA8"

tags:
  - linux
  - debian
  - bash
  - scripting
  - permisos
  - usuarios
  - systemd
  - redes
  - virtualbox
  - diagnostico

permalink: /docencia/smr/ser/ut00/

published: true

toc:
  - title: Introducción y objetivos
    id: introduccion

  - title: Laboratorio
    id: laboratorio

  - title: Dominio de la consola
    id: consola

  - title: Usuarios y permisos
    id: usuarios-permisos

  - title: Procesos, servicios y logs
    id: servicios

  - title: Red y diagnóstico
    id: red

  - title: Bash y scripting
    id: bash

  - title: Laboratorio público
    id: laboratorio-publico

  - title: Práctica individualizable
    id: practica

  - title: Chuleta operativa
    id: chuleta

  - title: Autoevaluación
    id: autoevaluacion

  - title: Recursos oficiales
    id: recursos
---

> **Objetivo de la unidad:** empezar el módulo con una base común y útil de Linux. La meta no es memorizar cien comandos, sino ser capaz de entrar en un servidor, orientarse, modificarlo con seguridad, comprobar qué ha ocurrido, automatizar tareas sencillas y dejar evidencia técnica de lo realizado.

En **Servicios en Red** trabajaremos durante todo el curso con servicios que se ejecutan sobre un sistema operativo: DHCP, DNS, transferencia de archivos, correo, web, acceso remoto, redes inalámbricas y pasarelas. Antes de administrar esos servicios necesitamos dominar el terreno donde viven: **archivos, directorios, usuarios, grupos, permisos, procesos, sockets, servicios y logs**.

Esta UT00 parte deliberadamente desde un nivel muy básico y avanza hasta un manejo de consola comparable al que se espera en una **formación Linux de fundamentos**. No pretende sustituir una certificación oficial ni preparar un examen concreto: adopta su filosofía de trabajo práctico, vocabulario preciso y autonomía en terminal.

---
## Introducción y objetivos {#introduccion}
### 1. Qué deberías ser capaz de hacer al terminar

Al finalizar esta unidad deberías poder:

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
- escribir scripts Bash con variables, argumentos, condiciones, bucles, funciones y códigos de salida;
- crear pequeños scripts de inventario y comprobación;
- diagnosticar un fallo siguiendo una secuencia y no mediante ensayo y error;
- documentar qué cambiaste, cómo lo comprobaste y cómo volverías atrás.

---

### 2. Relación con los RA y CE de Servicios en Red

La **UT00 es preparatoria y transversal**. No cierra por sí sola un resultado de aprendizaje oficial. Construye las destrezas de sistema que necesitaremos para demostrar posteriormente los RA1–RA8 del módulo 0227.

| RA del módulo | Lo que UT00 prepara |
|---|---|
| **RA1 · Configuración dinámica** | instalación de paquetes, edición de configuración, procesos, sockets, captura y verificación desde cliente |
| **RA2 · Resolución de nombres** | manejo de archivos, permisos, servicios, logs y herramientas de consulta |
| **RA3 · Transferencia de ficheros** | usuarios, grupos, permisos, árbol de directorios y clientes de terminal |
| **RA4 · Correo electrónico** | cuentas, servicios, registros, puertos y comprobaciones cliente-servidor |
| **RA5 · Servidores web** | DocumentRoot, permisos, servicio, procesos, puertos, logs y automatización |
| **RA6 · Acceso remoto** | consola, usuarios, claves, permisos y administración desde terminal |
| **RA7 · Redes inalámbricas** | interfaces, herramientas de red, servicios y diagnóstico |
| **RA8 · Redes privadas/públicas** | rutas, reenvío, sockets, procesos, comprobación extremo a extremo y scripting |

Los CE que reaparecerán durante el curso exigen, entre otras cosas, **instalar, configurar, verificar, crear usuarios/grupos, probar clientes, aplicar seguridad y demostrar el funcionamiento de los servicios**. UT00 entrena esas operaciones antes de aplicarlas a un servicio concreto.

> **Importante:** que un alumno domine `chmod`, `systemctl` o un `if` de Bash no significa que haya superado un RA de SER. Esas herramientas adquieren valor curricular cuando se utilizan para construir y verificar los servicios asociados a cada RA.

---

### 3. Contexto profesional: trabajar como técnico, no como “usuario que prueba cosas”

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
- automatización de tareas;
- documentación técnica;
- aplicación del mínimo privilegio;
- recuperación ante errores.

---

## PARTE I · EL LABORATORIO {#laboratorio}

### 4. Arquitectura de referencia

Trabajaremos con máquinas virtuales para poder experimentar, romper configuraciones y recuperar el entorno sin afectar a la red real.

```text
                         INTERNET
                            |
                   [ NAT de VirtualBox ]
                            |
             +--------------+--------------+
             |                             |
       ser-ser01                       ser-cli01
       Debian 13                       Debian 13
       NIC 1: NAT                      NIC 1: NAT
       NIC 2: SER-LAB                  NIC 2: SER-LAB
       192.168.50.10/24                192.168.50.20/24
             |                             |
             +--------- SER-LAB -----------+
                   192.168.50.0/24

           opcional: ser-win01 · Windows 11
                     192.168.50.30/24
```

La red interna no necesita una puerta de enlace si solo comunica equipos del mismo segmento. La salida general a Internet pertenece al adaptador NAT.

#### ¿Por qué dos adaptadores?

Porque separan dos funciones:

- **NAT**: actualizar paquetes o descargar software.
- **SER-LAB**: prestar y consumir los servicios del módulo en una red controlada.

Esta separación obliga a entender qué interfaz utiliza cada flujo.

---

### 5. Antes de escribir comandos: terminal, consola y shell

Estos conceptos suelen mezclarse:

- **terminal**: interfaz desde la que escribimos y vemos texto;
- **shell**: programa que interpreta las órdenes;
- **Bash**: una shell ampliamente utilizada en GNU/Linux;
- **prompt**: texto que aparece antes de escribir una orden;
- **comando**: instrucción que ejecuta la shell;
- **script**: archivo de texto que contiene una secuencia de órdenes y lógica.

Comprueba tu shell:

```bash
echo "$SHELL"
ps -p $$ -o pid,comm,args=
bash --version
```

Y comprueba tu identidad:

```bash
whoami
id
groups
hostname
hostnamectl
```

#### Regla de oro

Antes de copiar un comando con `sudo`, pregúntate:

1. ¿qué modifica?;
2. ¿qué ruta afecta?;
3. ¿necesita realmente privilegios?;
4. ¿cómo comprobaré el resultado?;
5. ¿cómo volveré atrás?

---

## PARTE II · DOMINIO DE LA CONSOLA {#consola}

### 6. Pedir ayuda sin salir del sistema

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

### 7. Saber dónde estás

```bash
pwd
ls
ls -l
ls -la
ls -lh
```

`pwd` muestra el directorio actual. `ls -l` añade información fundamental:

```text
-rwxr-x--- 1 ana operadores 1240 sep 10 09:30 comprobar.sh
│└───────┘   │      │
│ permisos   dueño  grupo
└ tipo
```

El primer carácter indica el tipo:

- `-` archivo regular;
- `d` directorio;
- `l` enlace simbólico.

---

### 8. Rutas absolutas y relativas

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
./script.sh
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

### 9. Crear, copiar, mover y eliminar

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

### 10. Leer archivos sin abrir un editor

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

### 11. Buscar archivos y buscar dentro de archivos

#### Buscar nombres

```bash
find /etc -name "*.conf" 2>/dev/null
find . -type f -name "*.sh"
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

### 12. Tuberías: convertir comandos pequeños en herramientas potentes

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

### 13. Redirecciones: stdout y stderr

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

### 14. Comodines y expansión

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

### 15. Comillas: una pequeña diferencia que evita muchos bugs

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

## PARTE III · USUARIOS, GRUPOS Y PERMISOS {#usuarios-permisos}

### 16. Usuarios y grupos

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

### 17. Crear usuarios y grupos en Debian

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

### 18. `sudo`, root y mínimo privilegio

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

### 19. Permisos: `r`, `w`, `x`

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

### 20. Permisos numéricos

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
chmod 750 script.sh
chmod 755 directorio_publico
```

Interpretación de `640`:

```text
6  -> rw-  propietario
4  -> r--  grupo
0  -> ---  resto
```

---

### 21. Permisos simbólicos

También podemos expresar cambios sin calcular números:

```bash
chmod u+x script.sh
chmod g+w compartido
chmod o-r secreto.txt
chmod u=rw,g=r,o= archivo.conf
```

Suele ser más legible cuando se modifica una única capacidad.

---

### 22. Propietario y grupo

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

### 23. `umask`: permisos iniciales

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

### 24. Un mini laboratorio de permisos

```bash
mkdir -p ~/perm-lab
cd ~/perm-lab
touch publico.txt privado.txt
chmod 644 publico.txt
chmod 600 privado.txt
ls -l
```

Crea un script:

```bash
printf '#!/usr/bin/env bash\necho "Hola desde SER"\n' > hola.sh
ls -l hola.sh
```

Intenta ejecutarlo:

```bash
./hola.sh
```

Después:

```bash
chmod u+x hola.sh
./hola.sh
```

La diferencia entre ambos intentos es más útil que memorizar la definición de `x`.

---

## PARTE IV · PAQUETES, PROCESOS, SERVICIOS Y LOGS {#servicios}

### 25. Paquetes en Debian

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

### 26. Procesos

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

### 27. Servicios con systemd

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

### 28. Logs con `journalctl`

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

### 29. Puertos y sockets

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

### 30. Identificar interfaces, IP y rutas

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

### 31. Probar conectividad y transporte

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

### 32. La escalera de diagnóstico

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

## PARTE VI · BASH Y SCRIPTING DESDE CERO {#bash}

### 33. ¿Por qué scripting en Servicios en Red?

Durante el curso repetiremos secuencias como:

```bash
systemctl status ...
ss ...
journalctl ...
curl ...
dig ...
ip ...
```

Al principio conviene ejecutarlas manualmente para comprenderlas. Después podemos automatizar comprobaciones repetitivas.

Un script permite:

- reducir errores de escritura;
- repetir pruebas;
- inventariar un servidor;
- comprobar precondiciones;
- crear health-checks;
- guardar evidencias;
- realizar operaciones homogéneas sobre varios objetos;
- convertir conocimiento operativo en un procedimiento reproducible.

Automatizar no significa “no entender”. **Solo automatizamos lo que sabemos explicar.**

---

### 34. Primer script

Crea:

```bash
nano hola-ser.sh
```

Contenido:

```bash
#!/usr/bin/env bash

echo "Servicios en Red"
echo "Equipo: $(hostname)"
echo "Usuario: $(whoami)"
date
```

Guarda, comprueba permisos y ejecuta:

```bash
ls -l hola-ser.sh
chmod u+x hola-ser.sh
./hola-ser.sh
```

También podrías:

```bash
bash hola-ser.sh
```

La primera forma utiliza el *shebang* del archivo; la segunda solicita explícitamente Bash.

---

### 35. El shebang

```bash
#!/usr/bin/env bash
```

Indica qué intérprete debe utilizar el sistema cuando el archivo se ejecuta directamente.

No es un comentario decorativo.

---

### 36. Variables

```bash
#!/usr/bin/env bash

servicio="ssh"
puerto=22

echo "Servicio: $servicio"
echo "Puerto: $puerto"
```

Buenas prácticas iniciales:

```bash
nombre="ser-ser01"
ruta="/srv/ser lab"
echo "$nombre"
ls -ld "$ruta"
```

Cita las expansiones salvo que tengas una razón clara para no hacerlo.

---

### 37. Sustitución de comandos

```bash
equipo="$(hostname)"
fecha="$(date +%F)"
kernel="$(uname -r)"

echo "$fecha - $equipo - $kernel"
```

La construcción:

```bash
$(comando)
```

ejecuta el comando y utiliza su salida.

---

### 38. Argumentos

Script `saluda.sh`:

```bash
#!/usr/bin/env bash

echo "Script: $0"
echo "Primer argumento: ${1:-no indicado}"
echo "Número de argumentos: $#"
```

Ejecuta:

```bash
./saluda.sh Ana
```

Variables especiales básicas:

| Variable | Significado |
|---|---|
| `$0` | nombre usado para invocar el script |
| `$1` | primer argumento |
| `$2` | segundo argumento |
| `$#` | número de argumentos |
| `"$@"` | todos los argumentos preservando separación |
| `$?` | código de salida del último comando |

---

### 39. Códigos de salida

En sistemas Unix, por convenio:

```text
0      éxito
distinto de 0   error o condición no satisfecha
```

Prueba:

```bash
true
echo "$?"

false
echo "$?"
```

Con comandos reales:

```bash
grep "PermitRootLogin" /etc/ssh/sshd_config
echo "$?"
```

Los scripts profesionales comunican su estado mediante códigos de salida.

---

### 40. Condiciones con `if`

```bash
#!/usr/bin/env bash

archivo="/etc/passwd"

if [[ -f "$archivo" ]]; then
    echo "OK: existe $archivo"
else
    echo "ERROR: no existe $archivo"
    exit 1
fi
```

Pruebas frecuentes:

```text
-f archivo     existe y es archivo regular
-d ruta        existe y es directorio
-e ruta        existe
-r archivo     se puede leer
-w archivo     se puede escribir
-x archivo     se puede ejecutar/atravesar
-z "$var"      cadena vacía
-n "$var"      cadena no vacía
```

---

### 41. Comparaciones

Cadenas:

```bash
if [[ "$modo" == "produccion" ]]; then
    echo "Modo producción"
fi
```

Números:

```bash
if (( puerto < 1024 )); then
    echo "Puerto dentro del rango privilegiado tradicional"
fi
```

Otra sintaxis habitual:

```bash
if [[ "$numero" -gt 10 ]]; then
    echo "Mayor que diez"
fi
```

---

### 42. `case`: elegir entre varias opciones

```bash
#!/usr/bin/env bash

accion="${1:-}"

case "$accion" in
    estado)
        systemctl status ssh --no-pager
        ;;
    puerto)
        ss -lnt
        ;;
    red)
        ip -br address
        ;;
    *)
        echo "Uso: $0 {estado|puerto|red}"
        exit 2
        ;;
esac
```

Ejecuta:

```bash
./ser-check.sh red
```

---

### 43. Bucles `for`

```bash
#!/usr/bin/env bash

for host in 192.168.50.10 192.168.50.20 192.168.50.30; do
    echo "== $host =="
    ping -c 1 -W 1 "$host"
done
```

Otro ejemplo sin red:

```bash
for fichero in /etc/*.conf; do
    echo "$fichero"
done
```

---

### 44. Bucles `while`

```bash
contador=1

while (( contador <= 3 )); do
    echo "Intento $contador"
    ((contador++))
done
```

Con lectura:

```bash
while IFS= read -r linea; do
    printf '>> %s\n' "$linea"
done < archivo.txt
```

---

### 45. Funciones

```bash
#!/usr/bin/env bash

cabecera() {
    printf '\n=== %s ===\n' "$1"
}

cabecera "Sistema"
hostnamectl

cabecera "Red"
ip -br address
```

Las funciones permiten organizar scripts sin repetir bloques.

---

### 46. Conectar condiciones con comandos

```bash
systemctl is-active --quiet ssh && echo "SSH activo"
```

Y:

```bash
systemctl is-active --quiet ssh || echo "SSH no está activo"
```

`&&` ejecuta la siguiente orden si la anterior termina correctamente.

`||` la ejecuta si la anterior falla.

Úsalos cuando hagan el código más claro, no para construir líneas imposibles de leer.

---

### 47. Un script de inventario útil

```bash
#!/usr/bin/env bash

echo "=== IDENTIDAD ==="
printf 'Host: %s\n' "$(hostname)"
printf 'Usuario: %s\n' "$(whoami)"
printf 'Fecha: %s\n' "$(date --iso-8601=seconds)"

echo
echo "=== SISTEMA ==="
uname -a
cat /etc/os-release

echo
echo "=== DISCO Y MEMORIA ==="
df -h /
free -h

echo
echo "=== RED ==="
ip -br address
ip route

echo
echo "=== SOCKETS TCP EN ESCUCHA ==="
ss -lnt
```

Guárdalo como:

```text
inventario-ser.sh
```

y conviértelo en ejecutable:

```bash
chmod 750 inventario-ser.sh
```

---

### 48. Un health-check básico

```bash
#!/usr/bin/env bash

host="${1:-192.168.50.10}"
puerto="${2:-80}"

printf 'Comprobando %s:%s\n' "$host" "$puerto"

if nc -z -w 2 "$host" "$puerto"; then
    echo "OK: conexión TCP posible"
    exit 0
else
    echo "ERROR: no se pudo establecer la conexión"
    exit 1
fi
```

Ejemplos:

```bash
./check-port.sh 192.168.50.10 80
./check-port.sh 192.168.50.10 81
```

Este pequeño script será reutilizable más adelante para distinguir pruebas positivas y negativas.

---

### 49. Modo estricto: útil, pero hay que entenderlo

En scripts de administración encontrarás:

```bash
set -Eeuo pipefail
```

Conceptualmente:

- `-e`: facilita abortar ante determinados fallos no controlados;
- `-u`: considera error utilizar variables no definidas;
- `pipefail`: una tubería no oculta tan fácilmente el fallo de una etapa;
- `-E`: ayuda a propagar ciertos traps de error.

No es magia ni debe copiarse sin comprender las excepciones de `set -e`.

Para empezar, podemos trabajar con:

```bash
set -u
```

y añadir control explícito con `if`.

---

### 50. Validar la sintaxis de un script

Antes de ejecutarlo:

```bash
bash -n script.sh
```

Si no muestra errores, Bash ha aceptado la sintaxis.

Después ejecútalo:

```bash
./script.sh
```

Una sintaxis válida **no demuestra** que la lógica sea correcta. Por eso necesitaremos casos positivos y negativos.

---

### 51. Script de comprobación con prueba positiva y negativa

```bash
#!/usr/bin/env bash

objetivo="${1:-/srv/serlab}"

if [[ ! -d "$objetivo" ]]; then
    echo "FAIL: no existe el directorio $objetivo" >&2
    exit 1
fi

propietario="$(stat -c '%U' "$objetivo")"
grupo="$(stat -c '%G' "$objetivo")"
modo="$(stat -c '%a' "$objetivo")"

echo "Ruta: $objetivo"
echo "Propietario: $propietario"
echo "Grupo: $grupo"
echo "Modo: $modo"

exit 0
```

Prueba positiva:

```bash
./check-dir.sh /tmp
```

Prueba negativa:

```bash
./check-dir.sh /ruta/que/no/existe
echo "$?"
```

La segunda prueba es tan importante como la primera.

---

## PARTE VII · LABORATORIO PÚBLICO {#laboratorio-publico}

### 52. Laboratorio: construir una estación Linux administrable

#### Escenario

Dispones de una VM Debian 13 recién instalada. Debes convertirla en una estación de trabajo administrable y reproducible.

#### Fase A · Reconocimiento

Obtén y explica:

```bash
whoami
id
pwd
hostnamectl
cat /etc/os-release
ip -br address
ip route
df -h
free -h
```

No copies toda la salida. Selecciona qué línea responde a cada pregunta.

#### Fase B · Árbol de trabajo

Crea:

```text
~/ser-lab/
├── configs/
├── evidencias/
├── logs/
└── scripts/
```

Comprueba:

```bash
find ~/ser-lab -maxdepth 2 -type d
```

Crea tres archivos de prueba y practica:

```bash
touch
cp
mv
rm -i
```

#### Fase C · Usuarios y permisos

En un laboratorio autorizado, crea:

```text
grupo: serops
usuario: tecnico-lab
```

Haz que el usuario pertenezca al grupo y construye un directorio compartido:

```text
/srv/ser-lab
```

Objetivo de permisos:

- root conserva la propiedad administrativa;
- el grupo de operadores puede trabajar dentro;
- otros usuarios no deben obtener escritura;
- deberás justificar el modo elegido.

Comprueba el resultado con:

```bash
id
ls -ld
stat
```

#### Fase D · Scripting

Crea `inventario.sh` que muestre como mínimo:

- hostname;
- usuario;
- fecha;
- distribución;
- kernel;
- disco de `/`;
- memoria;
- interfaces;
- rutas;
- sockets TCP en escucha.

Requisitos:

```text
[ ] shebang correcto
[ ] variables citadas
[ ] al menos una función
[ ] al menos una condición
[ ] código de salida coherente
[ ] bash -n sin errores
```

#### Fase E · Diagnóstico

Provoca de manera reversible **un único fallo** en tu propio laboratorio:

- quitar permiso de ejecución a tu script;
- pasar una ruta inexistente al comprobador;
- detener un servicio de prueba;
- consultar un puerto donde no haya escucha.

Documenta:

```text
síntoma
→ hipótesis
→ prueba
→ resultado
→ causa
→ cambio
→ validación positiva
→ prueba negativa/regresión
```

---

## PARTE VIII · PRÁCTICA DE MUESTRA INDIVIDUALIZABLE  {#practica}

### 53. SER-Linux Checkpoint

Esta práctica pública permite generar variantes equivalentes sin utilizar nombres reales.

#### Variables de personalización

Cada estudiante utiliza:

- `P`: número de puesto del aula;
- `L`: valor de la primera letra de su primer apellido, normalizada a A–Z (`A=1`, `B=2`, ..., `Z=26`; tildes se normalizan y `Ñ` se trata como `N`);
- `X = 100 + ((P + L) % 100)`.

Con esos valores:

```text
hostname: ser-u00-pPP
usuario:  tecPP
grupo:    opsK
IP lab:   192.168.50.X/24
K = ((L - 1) % 4) + 1
```

Ejemplo **ficticio** para `P=7`, `L=7`:

```text
hostname: ser-u00-p07
usuario:  tec07
grupo:    ops3
IP lab:   192.168.50.114/24
```

#### Reto

Sin utilizar datos personales:

1. identifica tu variante;
2. configura el hostname asignado;
3. crea el usuario y grupo correspondientes;
4. crea `/srv/ser-u00-pPP/{public,private,scripts,logs}`;
5. decide y aplica permisos razonables para cada subdirectorio;
6. demuestra mediante `ls -ld`, `stat`, `id` y una prueba con otro usuario qué accesos funcionan y cuáles no;
7. crea `estado-ser.sh`;
8. el script debe aceptar una ruta como argumento;
9. debe devolver `0` si la ruta existe y cumple la condición que hayas definido;
10. debe devolver un código distinto de cero en el caso negativo;
11. debe mostrar un pequeño inventario de sistema y red;
12. valida sintaxis con `bash -n`;
13. ejecuta un caso positivo;
14. ejecuta un caso negativo;
15. explica cómo desharías los cambios del laboratorio.

#### Condiciones de calidad

La práctica se considera técnicamente convincente cuando otra persona puede responder:

```text
¿Qué has cambiado?
¿Por qué?
¿Qué permisos efectivos quedan?
¿Cómo lo demuestras?
¿Qué caso debe fallar?
¿Qué código devuelve tu script?
¿Cómo vuelves al estado anterior?
```

> La web no publica una solución cerrada porque hay muchas configuraciones correctas si satisfacen los requisitos y se justifican técnicamente.

---

## PARTE IX · CHULETA OPERATIVA {#chuleta}

### 54. Moverse y manipular

```bash
pwd
ls -lah
cd /ruta
cd ..
cd ~
mkdir -p ruta
touch fichero
cp origen destino
mv origen destino
rm -i fichero
find . -type f -name "*.conf"
```

### 55. Leer y filtrar

```bash
cat fichero
less fichero
head -n 20 fichero
tail -n 30 fichero
grep -n "texto" fichero
grep -R "texto" directorio
sort
uniq
wc -l
```

### 56. Identidad y permisos

```bash
whoami
id
groups
getent passwd usuario
getent group grupo
ls -l
stat fichero
chmod 640 fichero
chmod u+x script.sh
chown usuario:grupo fichero
umask
```

### 57. Sistema

```bash
hostnamectl
uname -a
cat /etc/os-release
df -h
du -sh ruta
free -h
ps aux
top
```

### 58. Servicios y logs

```bash
systemctl status SERVICIO
systemctl is-active SERVICIO
sudo systemctl restart SERVICIO
journalctl -u SERVICIO -b -n 50 --no-pager
sudo ss -lntup
```

### 59. Red

```bash
ip -br address
ip route
ip route get DESTINO
ip neigh
ping -c 4 DESTINO
nc -vz HOST PUERTO
curl -v URL
```

### 60. Bash

```bash
bash -n script.sh
chmod u+x script.sh
./script.sh argumento
echo "$?"
```

---

## PARTE X · AUTOEVALUACIÓN {#autoevaluacion}

Intenta responder antes de desplegar cada solución.

<details>
<summary><strong>1. ¿Qué diferencia hay entre una ruta absoluta y una relativa?</strong></summary>

Una absoluta empieza en la raíz `/`; una relativa se interpreta desde el directorio actual.
</details>

<details>
<summary><strong>2. ¿Qué diferencia existe entre <code>></code> y <code>>></code>?</strong></summary>

`>` reemplaza la salida del archivo de destino; `>>` añade al final.
</details>

<details>
<summary><strong>3. ¿Qué significa <code>chmod 640 fichero</code>?</strong></summary>

Propietario: lectura y escritura; grupo: lectura; otros: ningún permiso.
</details>

<details>
<summary><strong>4. ¿El permiso <code>x</code> significa exactamente lo mismo en un archivo que en un directorio?</strong></summary>

No. En un archivo permite ejecutarlo; en un directorio permite atravesarlo/acceder a sus entradas si el resto de permisos y la ruta lo permiten.
</details>

<details>
<summary><strong>5. ¿Por qué es peligroso usar <code>usermod -G</code> olvidando <code>-a</code>?</strong></summary>

Porque puede sustituir los grupos suplementarios del usuario en vez de añadir uno nuevo.
</details>

<details>
<summary><strong>6. ¿Qué diferencia hay entre que un servicio esté instalado y que esté escuchando?</strong></summary>

El paquete puede existir sin que el proceso esté activo. Incluso activo, el servicio puede no escuchar en la dirección o puerto esperado.
</details>

<details>
<summary><strong>7. ¿Qué aporta <code>ss -lnt</code> que no aporta <code>systemctl status</code>?</strong></summary>

Muestra sockets TCP en escucha; permite comprobar si realmente existe una escucha de transporte y dónde.
</details>

<details>
<summary><strong>8. ¿Qué demuestra <code>bash -n script.sh</code>?</strong></summary>

Que Bash acepta la sintaxis del script. No demuestra que su lógica sea correcta.
</details>

<details>
<summary><strong>9. ¿Qué significa un código de salida 0?</strong></summary>

Por convenio, indica que el comando o script terminó correctamente.
</details>

<details>
<summary><strong>10. ¿Por qué conviene escribir <code>"$variable"</code> entre comillas?</strong></summary>

Para preservar la expansión como un único argumento cuando contiene espacios u otros caracteres que la shell podría separar o expandir.
</details>

<details>
<summary><strong>11. Si <code>ping</code> funciona pero <code>curl</code> a un servicio falla, ¿puedes afirmar que la red está totalmente correcta?</strong></summary>

No. Solo tienes una evidencia de conectividad ICMP. Debes comprobar ruta, puerto, escucha, filtrado y capa de aplicación.
</details>

<details>
<summary><strong>12. ¿Por qué hacemos una prueba negativa además de una positiva?</strong></summary>

Porque demuestra que el sistema discrimina correctamente entre lo permitido/esperado y lo que debe fallar, y evita falsos positivos.
</details>

---

### 61. Reto de salida

Sin consultar esta página, intenta realizar en una VM de laboratorio:

```text
1. Averiguar usuario, hostname, distribución e IP.
2. Ir a /var/log sin usar interfaz gráfica.
3. Volver a tu home.
4. Crear ~/reto/{entrada,salida,scripts}.
5. Crear un archivo, copiarlo, moverlo y borrarlo conscientemente.
6. Crear un grupo y un usuario de laboratorio.
7. Asignar el usuario al grupo.
8. Explicar 640, 750 y 755.
9. Hacer ejecutable un script.
10. Escribir un script que reciba un argumento.
11. Añadir una condición que detecte si una ruta existe.
12. Mostrar un código de salida diferente cuando falle.
13. Listar sockets TCP en escucha.
14. Revisar el log de un servicio.
15. Explicar qué prueba harías después si el cliente no conecta.
```

Si puedes hacer esos quince puntos **y explicar por qué**, ya tienes la base necesaria para empezar a administrar servicios de red con criterio.

---

## PARTE XI · ENLACES OFICIALES {#recursos}

### 62. Currículo

- [BOE · Real Decreto 1691/2007 · Técnico en Sistemas Microinformáticos y Redes](https://www.boe.es/buscar/doc.php?id=BOE-A-2008-819)

### 63. Debian

- [Debian 13 “trixie”](https://www.debian.org/releases/trixie/)
- [Guía de referencia de Debian](https://www.debian.org/doc/manuals/debian-reference/index.es.html)
- [Tutorial GNU/Linux de la Guía de referencia de Debian](https://www.debian.org/doc/manuals/debian-reference/ch01.es.html)
- [Manuales de usuario de Debian](https://www.debian.org/doc/user-manuals.es.html)

### 64. Bash y utilidades GNU

- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html)
- [GNU Coreutils Manual](https://www.gnu.org/software/coreutils/manual/coreutils.html)

### 65. Virtualización

- [Oracle VirtualBox · Networking](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/networkingdetails.html)

---

### 66. Qué viene después

La UT00 nos deja un laboratorio y un lenguaje común:

```text
archivos
+ usuarios
+ permisos
+ procesos
+ servicios
+ sockets
+ logs
+ red
+ Bash
          ↓
      SERVICIOS EN RED
```

A partir de aquí dejamos de practicar Linux de forma aislada. En las siguientes unidades estas herramientas se aplicarán a **problemas reales de infraestructura**.

**Siguiente unidad: UT01 · Configuración dinámica de red (DHCP).**
