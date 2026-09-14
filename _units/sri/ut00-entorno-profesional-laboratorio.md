---
title: "UT00 · Entorno profesional, laboratorio y método de diagnóstico"
description: "Puesta a punto de SRI: laboratorio aislado, Debian, redes virtuales, servicios, evidencias y diagnóstico profesional antes de comenzar DNS."
summary: "Laboratorio base de SRI, individualización, observación de servicios, evidencias técnicas y método de diagnóstico antes de comenzar DNS."

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
version: "1.0"
last_reviewed: 2026-09-14
visibility: public

ra:
  - "Transversal a RA1–RA8"

tags:
  - virtualizacion
  - debian
  - linux
  - redes
  - systemd
  - logs
  - diagnostico
  - evidencias

permalink: /docencia/asir/sri/ut00/
published: true

toc:
  - title: Introducción
    id: introduccion
  - title: Objetivos
    id: objetivos
  - title: Administrar un servicio
    id: administrar-servicio
  - title: RA, CE y evidencia
    id: ra-ce-evidencia
  - title: Laboratorio SRI
    id: laboratorio
  - title: Redes virtuales
    id: redes-virtuales
  - title: Individualización
    id: individualizacion
  - title: Inventario
    id: inventario
  - title: Estado, socket y registro
    id: estado-socket-log
  - title: Prueba extremo a extremo
    id: prueba-extremo-extremo
  - title: Diagnóstico
    id: diagnostico
  - title: Método
    id: metodo
  - title: Evidencias
    id: evidencias
  - title: Incidencias
    id: incidencias
  - title: Checklist
    id: checklist
  - title: Recursos
    id: recursos
---

## Introducción {#introduccion}

> **Objetivo:** comenzar SRI con un laboratorio reproducible y una forma profesional de trabajar.  
> En este módulo no basta con conseguir que un servicio «arranque»: hay que **entender su arquitectura, comprobarlo desde un cliente, interpretar evidencias, diagnosticar fallos y documentar el procedimiento**.

Servicios de Red e Internet es el módulo en el que una red deja de ser únicamente direccionamiento y conectividad para convertirse en una **plataforma de servicios**. Durante el curso administraremos DNS, configuración automática, servicios web, transferencia de archivos, correo, colaboración, audio y vídeo.

La infraestructura crecerá de forma acumulativa:

```text
UT00        UT01      UT02        UT03         UT04
LAB ─────▶ DNS ─────▶ DHCP ─────▶ WEB/HTTPS ─▶ TRANSFERENCIA
                                               │
                                               ▼
UT08        UT07      UT06        UT05
VÍDEO ◀─── AUDIO ◀── COLAB. ◀─── CORREO
```

La UT00 **no crea un resultado de aprendizaje nuevo**. Es una puesta a punto transversal para que todo el grupo parta de un entorno técnico común antes de entrar en el **RA1 · DNS**.

---

## 1. Qué deberías ser capaz de hacer al terminar {#objetivos}

Al finalizar esta puesta a punto deberías poder:

- diferenciar **host, hipervisor, VM, guest, interfaz virtual y red virtual**;
- justificar cuándo utilizar **NAT, red interna, solo-anfitrión o puente**;
- comprobar IP, prefijo, rutas, DNS y sockets desde Linux;
- utilizar `systemctl`, `ss` y `journalctl` para observar un servicio;
- diferenciar **proceso**, **servicio**, **socket**, **puerto** y **protocolo**;
- probar un servicio desde el propio servidor y desde un cliente;
- distinguir una **prueba positiva** de una **prueba negativa**;
- formular una hipótesis antes de modificar configuración;
- aplicar un cambio mínimo, volver a medir y realizar rollback si procede;
- presentar una evidencia técnica que otra persona pueda interpretar;
- utilizar tu variante individual `Pxx-Lyy` durante todo el curso.

---

## 2. Qué significa administrar un servicio {#administrar-servicio}

Un servicio de red no es solamente un programa instalado.

```text
CLIENTE
   │
   │ protocolo / puerto
   ▼
RED ──▶ DIRECCIÓN ──▶ SOCKET ──▶ PROCESO ──▶ CONFIGURACIÓN
                                      │
                                      ├──▶ DATOS
                                      └──▶ LOGS
```

Cuando algo falla pueden existir muchas causas:

- el cliente utiliza un nombre incorrecto;
- DNS devuelve una dirección inesperada;
- no existe ruta hacia el servidor;
- un firewall bloquea el tráfico;
- el proceso no está arrancado;
- el proceso escucha solo en `127.0.0.1`;
- el servicio escucha en otro puerto;
- la configuración contiene un error;
- el usuario no tiene permisos;
- TLS no confía en el certificado;
- la aplicación responde, pero lo hace con un error.

> **«No funciona» es un síntoma, no un diagnóstico.**

---

## 3. RA, CE, actividad y evidencia {#ra-ce-evidencia}

Durante el curso aparecerán cuatro conceptos que no debemos mezclar.

| Concepto | Qué significa |
|---|---|
| **RA · Resultado de aprendizaje** | competencia global que debe alcanzar el alumnado |
| **CE · Criterio de evaluación** | evidencia oficial que concreta cómo se demuestra un RA |
| **Actividad / práctica** | situación de aprendizaje para trabajar uno o varios CE |
| **Evidencia** | dato verificable que permite comprobar lo que ha ocurrido |

Ejemplo:

```text
RA1 · Administrar DNS
        ↓
CE · instalar/configurar un servicio jerárquico
        ↓
PRÁCTICA · primario + secundario
        ↓
EVIDENCIAS · config + validación + dig + transferencia + logs
```

Una captura de pantalla aislada puede ser bonita y, aun así, demostrar muy poco.

---

## 4. Laboratorio de SRI {#laboratorio}

Trabajaremos, siempre que sea posible, en una **red interna de VirtualBox**. Así podemos desplegar servicios reales sin convertir la red física del aula en un campo de pruebas.

```text
                    INTERNET
                       ▲
                       │
                 [ NAT opcional ]
                       │
                ┌──────┴──────┐
                │ SERVIDOR SRI│
                │ Debian 13   │
                └──────┬──────┘
                       │
                 SRI-LAB-Pxx
                       │
             ┌─────────┴─────────┐
             │                   │
      CLIENTE LINUX        CLIENTE WINDOWS
      cuando proceda       cuando proceda
```

### Regla de seguridad

La NIC NAT se utiliza **solo cuando necesitamos instalar o actualizar paquetes**. El tráfico de servicios se valida en la red interna.

Esto será especialmente importante al trabajar con DHCP, FTP en claro con fines didácticos, correo, consolas de administración y servicios multimedia.

---

## 5. Modos de red de una VM {#redes-virtuales}

| Modo | VM ↔ Internet | VM ↔ VM | Host ↔ VM | Uso habitual |
|---|---:|---:|---:|---|
| **NAT** | Sí | depende del diseño | indirecto | instalar paquetes / salida |
| **Red interna** | No | Sí | No | laboratorio principal aislado |
| **Solo-anfitrión** | No por defecto | Sí | Sí | gestión desde el host |
| **Puente** | depende de red real | Sí | Sí | integración controlada con la red física |

En SRI utilizaremos **red interna como opción por defecto**. El puente se reserva para situaciones justificadas y autorizadas.

---

## 6. Individualización `Pxx-Lyy` {#individualizacion}

Las prácticas deben evaluar la misma competencia con datos distintos.

- `P` = número de puesto.
- `L` = primera letra normalizada del primer apellido convertida a número `A=01 ... Z=26`.
- Las tildes se eliminan y `Ñ` se normaliza como `N`.
- El identificador se escribe siempre con dos dígitos.

Ejemplo conceptual:

```text
puesto 7
apellido cuya inicial normalizada es C

P = 07
L = 03
código = P07-L03
```

### Parámetros de la UT00

| Elemento | Regla |
|---|---|
| Red interna | `10.37.P.0/24` |
| Servidor | `10.37.P.(20+L)` |
| Cliente | `10.37.P.(120+L)` |
| Puerto de prueba | `8000 + P` |
| Host servidor | `srv-pXX-lYY` |
| FQDN de laboratorio | `srv-pXX-lYY.sri.test` |

Ejemplo **solo para comprender la fórmula**, con `P07-L03`:

```text
Red       10.37.7.0/24
Servidor  10.37.7.23
Cliente   10.37.7.123
Puerto    8007
FQDN      srv-p07-l03.sri.test
```

> La individualización cambia datos, nombres, puertos, tickets o incidencias; **no cambia la dificultad ni el RA**.

---

## 7. Antes de tocar nada: inventario {#inventario}

Un administrador empieza observando.

### Identidad del sistema

```bash
hostnamectl
whoami
id
uname -a
cat /etc/os-release
```

### Interfaces, direcciones y rutas

```bash
ip -br link
ip -br address
ip route
```

### Resolución de nombres

```bash
getent hosts example.org
resolvectl status
```

Si `dig` está instalado:

```bash
dig example.org
```

### Puertos y sockets

```bash
ss -lntup
```

### Procesos y servicios

```bash
systemctl --failed
systemctl list-units --type=service --state=running
```

La pregunta profesional no es «¿qué comando tengo que copiar?», sino:

> **¿Qué dato necesito y qué herramienta me permite observarlo?**

---

## 8. Estado, socket y registro {#estado-socket-log}

Para cualquier servicio utilizaremos tres perspectivas mínimas.

### 8.1 Estado

```bash
systemctl status NOMBRE_SERVICIO
```

Nos ayuda a responder:

- ¿está activo?;
- ¿ha fallado?;
- ¿cuándo arrancó?;
- ¿qué proceso principal tiene?

### 8.2 Socket

```bash
ss -lntup
```

Nos ayuda a responder:

- ¿está escuchando?;
- ¿TCP o UDP?;
- ¿en qué IP?;
- ¿en qué puerto?;
- ¿qué proceso está asociado?

### 8.3 Registro

```bash
journalctl -u NOMBRE_SERVICIO
```

Nos ayuda a responder:

- ¿qué ocurrió?;
- ¿qué error se registró?;
- ¿cuándo?;
- ¿antes o después de nuestro cambio?

> `active (running)` **no demuestra** por sí solo que el servicio sea accesible desde un cliente.

---

## 9. Primera prueba extremo a extremo {#prueba-extremo-extremo}

Para validar el laboratorio no necesitamos instalar todavía Apache. Podemos crear temporalmente un servidor HTTP con Python.

En el servidor:

```bash
mkdir -p ~/sri-ut00
cd ~/sri-ut00
printf '<h1>SRI · %s</h1>\n' "$(hostname)" > index.html
python3 -m http.server PUERTO --bind 0.0.0.0
```

Sustituye `PUERTO` por tu valor individual `8000 + P`.

En otra terminal del servidor:

```bash
ss -lntp
```

Desde el cliente:

```bash
curl -v http://IP_SERVIDOR:PUERTO/
```

Después detén el servidor temporal y repite la prueba.

### Pregunta de diagnóstico

¿El segundo fallo demuestra un problema de IP?

No respondas con una receta. Identifica qué capas ya habías demostrado que funcionaban.

---

## 10. Escalera de diagnóstico {#diagnostico}

Cuando un servicio falla, reducimos el problema por capas.

```text
1. VM / ENLACE
      ↓
2. IP / PREFIJO
      ↓
3. VECINDAD
      ↓
4. RUTA
      ↓
5. DNS / NOMBRE
      ↓
6. PUERTO / SOCKET
      ↓
7. SERVICIO / PROCESO
      ↓
8. PROTOCOLO / APLICACIÓN
      ↓
9. LOGS Y SEGURIDAD
```

| Pregunta | Herramientas habituales |
|---|---|
| ¿la interfaz existe y está arriba? | `ip -br link` |
| ¿qué IP tiene? | `ip -br a` |
| ¿por dónde saldrá el paquete? | `ip route`, `ip route get` |
| ¿resuelve el nombre? | `getent`, `dig` |
| ¿hay conectividad IP? | `ping` |
| ¿el puerto está escuchando? | `ss` |
| ¿puedo conectar al puerto? | `nc`, `curl`, `openssl s_client` |
| ¿qué dice el servicio? | `systemctl` |
| ¿qué ocurrió? | `journalctl`, logs |
| ¿qué viaja realmente? | `tcpdump`, Wireshark |

> **No vuelvas a modificar una capa que ya has demostrado correcta salvo que aparezca una evidencia nueva.**

---

## 11. Hipótesis → prueba → observación → decisión {#metodo}

### Enfoque poco útil

```text
No funciona
→ reinicio
→ cambio varios archivos
→ desactivo seguridad
→ vuelve a funcionar
→ no sé por qué
```

### Enfoque profesional

```text
SÍNTOMA
   ↓
HIPÓTESIS
   ↓
PRUEBA DISCRIMINANTE
   ↓
OBSERVACIÓN
   ↓
CONCLUSIÓN
   ↓
CAMBIO MÍNIMO
   ↓
RETEST
   ↓
ROLLBACK / DOCUMENTACIÓN
```

Plantilla:

```text
Síntoma:
Hipótesis:
Prueba:
Resultado observado:
Interpretación:
Cambio aplicado:
Prueba posterior:
Resultado final:
Prevención / rollback:
```

---

## 12. Evidencia débil y evidencia fuerte {#evidencias}

| Evidencia débil | Evidencia fuerte |
|---|---|
| captura sin contexto | captura + comando/URL + dato + explicación |
| `systemctl` muestra active | estado + socket + prueba cliente + log |
| «la web abre» | nombre/IP + TCP + HTTP + respuesta + log |
| PCAP «con tráfico» | filtro + paquete/campo + interpretación |
| configuración pegada | configuración propia + validador + prueba negativa + rollback |
| «he reiniciado» | motivo, estado anterior, cambio y retest |

---

{% comment %}

## 13. Práctica P00 · SRI-LAB {#practica}

Esta práctica es de **puesta a punto**. La web pública no contiene soluciones.

### Fase A · Identidad

1. Calcula tu código `Pxx-Lyy`.
2. Nombra las VM utilizando tu código.
3. Documenta CPU, RAM, disco y tarjetas virtuales.
4. Justifica por qué existe una NIC interna y cuándo activarías NAT.

### Fase B · Red

1. Crea `SRI-LAB-Pxx`.
2. Configura las direcciones derivadas de tu variante.
3. Verifica IP, prefijo y ruta.
4. Comprueba comunicación servidor ↔ cliente.
5. Realiza una prueba negativa controlada.

### Fase C · Servicio temporal

1. Calcula tu puerto `8000 + P`.
2. Levanta el servidor HTTP temporal.
3. Demuestra el socket.
4. Accede desde el cliente.
5. Detén el servicio.
6. Predice qué prueba fallará y qué prueba debería seguir funcionando.

### Fase D · Ticket

Recibirás una incidencia individual. Tu entrega debe incluir:

- síntoma;
- hipótesis;
- prueba discriminante;
- dato observado;
- causa;
- cambio mínimo;
- retest;
- prevención o rollback.

---

{% endcomment %}

## 14. Incidencias para pensar {#incidencias}

No contienen la solución. El objetivo es decidir **qué medir primero**.

### INC-00A

> El servidor responde a `ping`, pero `curl` al puerto individual devuelve error de conexión.

¿Qué puedes afirmar ya? ¿Qué todavía no sabes?

### INC-00B

> Desde el servidor funciona `curl http://127.0.0.1:PUERTO`, pero desde el cliente no.

¿Qué diferencia existe entre probar por loopback y probar desde otra máquina?

### INC-00C

> El cliente llega por IP, pero el nombre `srv-pXX-lYY.sri.test` no resuelve.

¿Debes tocar primero el servicio HTTP?

---

## 15. Checklist antes de UT01 · DNS {#checklist}

- [ ] Distingo red interna y NAT.
- [ ] Conozco mi código `Pxx-Lyy`.
- [ ] Puedo localizar mi IP y mis rutas.
- [ ] Sé qué significa que un socket esté escuchando.
- [ ] Distingo proceso, servicio y protocolo.
- [ ] Sé consultar el estado de un servicio.
- [ ] Sé consultar su registro.
- [ ] Puedo hacer una prueba desde cliente.
- [ ] Sé que `ping` no demuestra HTTP, DNS ni TLS.
- [ ] Puedo redactar hipótesis y pruebas antes de modificar.
- [ ] Entiendo qué hace fuerte a una evidencia.
- [ ] Tengo una snapshot/base limpia del laboratorio.

Cuando esta base está lista comenzamos:

> **UT01 · DNS profesional**

---

## 16. Recursos {#recursos}

### Currículo

- [Real Decreto 1629/2009 · Título de ASIR](https://www.boe.es/eli/es/rd/2009/10/30/1629)
- [Decreto 210/2010 · Currículo de ASIR en Extremadura](https://doe.juntaex.es/pdfs/doe/2010/2270o/2270o.pdf)

### Linux y operación

- [Debian Administrator's Handbook](https://www.debian.org/doc/manuals/debian-handbook/)
- [systemd](https://systemd.io/)
- [curl](https://curl.se/docs/)
- [Wireshark Documentation](https://www.wireshark.org/docs/)

### Virtualización

- [VirtualBox User Manual](https://www.virtualbox.org/manual/)
- [VMware Workstation documentation](https://docs.vmware.com/)
