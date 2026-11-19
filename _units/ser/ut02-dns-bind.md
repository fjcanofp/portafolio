---
title: "UT02 · Resolución de nombres: DNS con BIND9"
description: "DNS en Debian 13 con BIND9: jerarquía, caché y reenviadores, zonas directa e inversa, SOA/NS/A/AAAA/CNAME/MX/PTR, validación, transferencias y diagnóstico."
summary: "De la necesidad de usar nombres a un DNS real con BIND9 en Debian 13, clientes Linux/Windows y transferencia de zona hacia Windows Server."

module_key: ser
cycle_key: smr
order: 2

module_title: "Servicios en Red"
module_code: "0227"
cycle_title: "Sistemas Microinformáticos y Redes"
course: "2.º SMR"
unit: "UT02"
hours: 18
level: "base-intermedio"

authors:
  - fjcano

reviewers:
  - fjcano

rights: all-rights-reserved
version: "1.0"
last_reviewed: 2026-11-19
visibility: public

ra:
  - "RA2"

ce:
  - "RA2.a"
  - "RA2.b"
  - "RA2.c"
  - "RA2.d"
  - "RA2.e"
  - "RA2.f"
  - "RA2.g"
  - "RA2.h"

tags:
  - dns
  - bind9
  - debian13
  - cache
  - forwarders
  - zonas
  - soa
  - ns
  - a
  - cname
  - mx
  - ptr
  - axfr
  - diagnostico
  - ra2

permalink: /docencia/smr/ser/ut02/
published: true

toc:
  - title: Introducción
    id: introduccion
  - title: RA2 y CE
    id: ra-ce
  - title: Misión profesional
    id: mision
  - title: Cómo funciona DNS
    id: fundamentos
  - title: Jerarquía y FQDN
    id: jerarquia
  - title: Caché y reenviadores
    id: cache
  - title: Registros
    id: registros
  - title: Laboratorio
    id: laboratorio
  - title: BIND9 en Debian
    id: bind
  - title: Zona directa
    id: directa
  - title: Zona inversa
    id: inversa
  - title: Clientes y consultas
    id: clientes
  - title: Validación
    id: validacion
  - title: Transferencias
    id: transferencias
  - title: Diagnóstico
    id: diagnostico
  - title: Individualización
    id: individualizacion
  - title: Prácticas
    id: practicas
  - title: Chuleta
    id: chuleta
  - title: Recursos
    id: recursos
  - title: Cierre
    id: cierre
---

## Introducción {#introduccion}

> **Pregunta de partida:** si una red funciona con direcciones IP, ¿por qué necesitamos DNS?

Porque las IP son adecuadas para las máquinas, pero poco cómodas y poco estables para las personas y las aplicaciones.

```text
192.168.157.80
```

puede convertirse en:

```text
www.p07-l03.ser.test
```

DNS es una base de datos **distribuida, jerárquica y consultable** que relaciona nombres con información.

En UT02 construiremos esta cadena:

```text
cliente
   ↓
servidor DNS
   ↓
zona local / caché / reenviador
   ↓
respuesta
   ↓
comprobación
   ↓
segundo servidor
   ↓
transferencia de zona
```

> **Importante para las prácticas:** la web enseña el procedimiento con datos de ejemplo. En la práctica final tendrás red y dominio individualizados y deberás adaptar el diseño.

---

## 1. RA2 y criterios de evaluación {#ra-ce}

### RA2

> **Instala servicios de resolución de nombres, describiendo sus características y aplicaciones.**

| CE | Criterio |
|---|---|
| **a)** | Se han identificado y descrito escenarios en los que surge la necesidad de un servicio de resolución de nombres. |
| **b)** | Se han clasificado los principales mecanismos de resolución de nombres. |
| **c)** | Se ha descrito la estructura, nomenclatura y funcionalidad de los sistemas de nombres jerárquicos. |
| **d)** | Se ha instalado un servicio jerárquico de resolución de nombres. |
| **e)** | Se ha preparado el servicio para almacenar las respuestas procedentes de servidores de redes públicas y servirlas a los equipos de la red local. |
| **f)** | Se han añadido registros de nombres correspondientes a una zona nueva, con opciones relativas a servidores de correo y alias. |
| **g)** | Se ha trabajado en grupo para realizar transferencias de zona entre dos o más servidores. |
| **h)** | Se ha comprobado el funcionamiento correcto del servidor. |

En esta UT trabajaremos el **RA2 completo**.

**Referencia oficial:** Real Decreto 1691/2007, módulo 0227 Servicios en red.

---

## 2. Misión profesional {#mision}

Una pequeña organización tiene:

```text
servidor web
servidor de ficheros
correo
impresoras
varios clientes
```

Trabajar únicamente con IP provoca problemas:

- cuesta recordarlas;
- una IP puede cambiar;
- un mismo servidor puede ofrecer varios servicios;
- una aplicación no debería depender de memorizar direcciones.

Queremos usar:

```text
www.empresa
files.empresa
mail.empresa
```

sin perder el control técnico.

---

## 3. De `/etc/hosts` a DNS {#fundamentos}

Un fichero `hosts` permite resolución local:  192.168.157.80  www.p07-l03.ser.test


pero:

| N.º | Limitación |
| ---: | --- |
| 1 | Cada equipo tiene su copia. |
| 2 | Hay que mantenerlo manualmente. |
| 3 | No existe una base centralizada. |
| 4 | No escala. |

DNS centraliza esta información.

### Mecanismos que reconoceremos

```text
hosts local
DNS configurado en el sistema
caché
servidor autoritativo
reenviador / resolución recursiva
```

---

## 4. Jerarquía, dominio, zona y FQDN {#jerarquia}

![Jerarquía DNS]({{ '/assets/docencia/ser/ut02/dns/01_jerarquia_dns.svg' | relative_url }})

DNS organiza los nombres como un árbol.

Conceptos:

- **raíz**: `.`;
- **TLD**: nivel superior;
- **dominio**;
- **subdominio**;
- **FQDN**: nombre completo;
- **zona**: parte del espacio de nombres administrada por un servidor.

Ejemplo: www.p07-l03.ser.test.


El punto final representa el nombre absoluto.

### ¿Por qué usamos `.test`?

`.test` está reservado para pruebas y documentación, evitando conflictos con dominios públicos reales.

### Dominio no es exactamente lo mismo que zona

Un **dominio** describe una parte del árbol de nombres.

Una **zona** es la información que un servidor administra de forma autoritativa.


---

## 5. Autoridad, recursión, caché y reenviadores {#cache}

![Flujo de consulta]({{ '/assets/docencia/ser/ut02/dns/02_flujo_consulta.svg' | relative_url }})

Nuestro DNS puede responder de tres formas principales:

### Datos de su propia zona

www.p07-l03.ser.test


Si administra esa zona, responde como **autoritativo**.

### Datos almacenados en caché

Si resolvió antes un nombre externo, puede conservar temporalmente la respuesta.

### Consultas que no conoce

Puede:

```text
resolverlas
o
reenviarlas a otro DNS
```

### TTL

El **TTL** indica cuánto tiempo puede mantenerse una respuesta en caché.

TTL pequeño:

- cambios se propagan antes
- más consultas



TTL grande:

- cambios tardan más en desaparecer de caché
- menos consultas

---

## 6. Registros que vamos a utilizar {#registros}

![Registros DNS]({{ '/assets/docencia/ser/ut02/dns/03_registros.svg' | relative_url }})

| Registro | Significado | Ejemplo |
|---|---|---|
| `SOA` | autoridad y parámetros de zona | serial, refresh... |
| `NS` | servidor DNS de la zona | `dns1...` |
| `A` | nombre → IPv4 | `www → 192.168...` |
| `AAAA` | nombre → IPv6 | ampliación |
| `CNAME` | alias → nombre canónico | `intranet → www` |
| `MX` | servidor de correo | `mail...` |
| `PTR` | IPv4 → nombre | zona inversa |

### Regla importante

DNS publica información.

Un registro: www → 192.168.157.80


no demuestra que exista un servidor web en esa IP.

---

## 7. Zona directa y zona inversa {#directa-inversa}

![Directa e inversa]({{ '/assets/docencia/ser/ut02/dns/04_directa_inversa.svg' | relative_url }})

### Directa

```text
nombre → IP
```

### Inversa

```text
IP → nombre
```

Para: 192.168.157.0/24

la zona inversa es: 157.168.192.in-addr.arpa

***No confundas un registro A con registro PTR***

Son datos distintos en zonas distintas.

---

# PARTE I · LABORATORIO {#laboratorio}

## 8. Topología

Trabajaremos inicialmente con:

- ser-dns01  → Debian 13 + BIND9
- ser-cli01  → Debian / Windows cliente

Y después incorporaremos: ser-dns02  → Windows Server 2022/2025


El escenario final será:

```text
BIND9 primary
      ↓ transferencia
Windows secondary
      ↓
clientes
```

---

## 9. Direccionamiento tipo

Ejemplo de aprendizaje:

```text
Red             192.168.160.0/24
BIND primary    192.168.160.10
Windows sec.    192.168.160.20
Cliente         192.168.160.100
Dominio         demo.ser.test
```

---

# PARTE II · BIND9 EN DEBIAN 13 {#bind}

## 10. Instalar BIND9

Debian 13 estable utiliza BIND9 de la rama 9.20.

```bash
sudo apt update
sudo apt install -y bind9 bind9-utils bind9-dnsutils
```

Comprueba:

```bash
named -v
systemctl status named.service --no-pager
sudo ss -luntp | grep ':53'
```

Ficheros principales:

```text
/etc/bind/named.conf
/etc/bind/named.conf.options
/etc/bind/named.conf.local
```

---

## 11. Antes de editar

Guarda copia:

```bash
sudo cp -a /etc/bind /etc/bind.bak-ut02
```

Revisa:

```bash
cat /etc/bind/named.conf
```

Debian separa:


- opciones globales
- zonas locales
- zonas por defecto


---

## 12. Caché y reenviadores

Edita:

```bash
sudo nano /etc/bind/named.conf.options
```

Ejemplo didáctico:

```conf
options {
    directory "/var/cache/bind";

    listen-on {
        127.0.0.1;
        192.168.160.10;
    };

    listen-on-v6 { none; };

    recursion yes;

    allow-query {
        127.0.0.1;
        192.168.160.0/24;
    };

    allow-recursion {
        127.0.0.1;
        192.168.160.0/24;
    };

    forwarders {
        1.1.1.1;
        8.8.8.8;
    };

    forward first;
};
```

**VERIFICA estas IPs con las tuyas.**

### Validar

```bash
sudo named-checkconf
```

### Recargar

```bash
sudo rndc reload
```

### Probar nombre externo

```bash
dig @192.168.160.10 www.debian.org A
```

---

# PARTE III · ZONA DIRECTA {#directa}

## 13. Declarar la zona

Edita:

```bash
sudo nano /etc/bind/named.conf.local
```

Añade:

```conf
zone "demo.ser.test" {
    type primary;
    file "/etc/bind/db.demo.ser.test";
};
```

En BIND 9.20 utilizaremos los términos:


- primary
- secondary


---

## 14. Crear la zona

```bash
sudo nano /etc/bind/db.demo.ser.test
```

Ejemplo:

```dns
$TTL 3600

@   IN  SOA dns1.demo.ser.test. admin.demo.ser.test. (
        2026111901 ; serial
        3600       ; refresh
        900        ; retry
        604800     ; expire
        300        ; negative cache
)

@           IN  NS      dns1.demo.ser.test.

dns1        IN  A       192.168.160.10
www         IN  A       192.168.160.80
files       IN  A       192.168.160.81
mail        IN  A       192.168.160.82

intranet    IN  CNAME   www.demo.ser.test.

@           IN  MX 10   mail.demo.ser.test.
```

---

## 15. El SOA y el serial

El SOA identifica información básica de la zona.

Nos interesa especialmente: *serial*


Usaremos: **AAAAMMDDNN**

Ejemplo: *2026111901*


Si vuelves a modificar la zona ese mismo día: *2026111902*

Cuando exista un secundario, aumentar el serial será fundamental.

---

## 16. El punto final

Observa:

```dns
intranet IN CNAME www.demo.ser.test.
```

El punto final indica que el *nombre ya es absoluto*.

Sin él, BIND puede completar el nombre añadiendo el origen de la zona.

Es uno de los errores más comunes de aprendizaje.

---

## 17. Validar la zona directa

```bash
sudo named-checkzone demo.ser.test /etc/bind/db.demo.ser.test
```

Resultado esperado: **OK**

Después:

```bash
sudo named-checkconf -z
sudo rndc reload
```

---

# PARTE IV · ZONA INVERSA {#inversa}

## 18. Declararla

Para: *192.168.160.0/24*

declaramos:

```conf
zone "160.168.192.in-addr.arpa" {
    type primary;
    file "/etc/bind/db.192.168.160";
};
```

---

## 19. Crear PTR

```dns
$TTL 3600

@   IN  SOA dns1.demo.ser.test. admin.demo.ser.test. (
        2026111901
        3600
        900
        604800
        300
)

@       IN  NS      dns1.demo.ser.test.

10      IN  PTR     dns1.demo.ser.test.
80      IN  PTR     www.demo.ser.test.
81      IN  PTR     files.demo.ser.test.
82      IN  PTR     mail.demo.ser.test.
```

Valida:

```bash
sudo named-checkzone 160.168.192.in-addr.arpa /etc/bind/db.192.168.160
```

---

# PARTE V · CLIENTES Y CONSULTAS {#clientes}

## 20. Configurar un cliente

El cliente debe utilizar realmente nuestro DNS.

Windows:

```text
IPv4
→ DNS preferido
→ 192.168.160.10
```

En Debian, **no edites** `/etc/resolv.conf` a ciegas.

Comprueba primero:

```bash
systemctl is-active NetworkManager systemd-networkd
resolvectl status
```

---

## 21. Herramientas de consulta

### `dig`

```bash
dig @192.168.160.10 www.demo.ser.test A
```

### `host`

```bash
host www.demo.ser.test 192.168.160.10
```

### `nslookup`

```text
nslookup www.demo.ser.test 192.168.160.10
```

---

## 22. Pruebas mínimas

```bash
dig @192.168.160.10 demo.ser.test SOA
dig @192.168.160.10 demo.ser.test NS
dig @192.168.160.10 www.demo.ser.test A
dig @192.168.160.10 intranet.demo.ser.test CNAME
dig @192.168.160.10 demo.ser.test MX
dig @192.168.160.10 -x 192.168.160.80
```

---

## 23. Autoridad

Prueba:

```bash
dig @192.168.160.10 demo.ser.test SOA +norecurse
```

En una respuesta autoritativa esperamos la bandera: **aa**

`aa` significa: `Authoritative Answer`

---

## 24. ¿Qué DNS usa realmente el cliente?

Este caso es muy habitual:

```text
dig @192.168.160.10 www.demo.ser.test → funciona

dig www.demo.ser.test → falla
```

Conclusión probable: `BIND funciona pero el cliente está usando otro DNS`


No modifiques la zona antes de comprobar:

```bash
resolvectl status
```

o en Windows:

```bat
ipconfig /all
```

---

# PARTE VI · VALIDACIÓN {#validacion}

## 25. Validar antes de recargar

Configuración:

```bash
sudo named-checkconf
```

Configuración + carga de zonas primarias:

```bash
sudo named-checkconf -z
```

Zona concreta:

```bash
sudo named-checkzone ZONA FICHERO
```

Estado:

```bash
systemctl status named.service --no-pager
```

Logs:

```bash
journalctl -u named.service -n 50 --no-pager
```

---

## 26. UDP y TCP 53

DNS utiliza:

- **UDP 53**
- **TCP 53**


No memorices:

> «DNS solo usa UDP».

Las transferencias de zona utilizan transporte TCP.

---

# PARTE VII · TRANSFERENCIA DE ZONA {#transferencias}

## 27. Primario y secundario

![Transferencia de zona]({{ '/assets/docencia/ser/ut02/dns/05_transferencia.svg' | relative_url }})

En nuestro escenario final:

```text
Debian BIND9 → primary

Windows Server → secondary
```

El secundario obtiene una copia de la zona.

También es **autoritativo** para esa zona, aunque no editemos allí los registros.

---

## 28. Autorizar la transferencia

BIND 9.20 no habilita transferencias salientes si no se autorizan explícitamente.

En la zona:

```conf
zone "demo.ser.test" {
    type primary;
    file "/etc/bind/db.demo.ser.test";

    allow-transfer {
        192.168.160.20;
    };

    notify yes;
};
```

Así:

```text
Windows secundario → permitido
otros clientes → no permitidos
```

---

## 29. El serial y los cambios

Cuando modifiques una zona:

```text
1. cambia el registro
2. incrementa serial
3. valida
4. recarga
5. comprueba el secundario
```

Sin un serial superior, el secundario puede considerar que ya tiene la versión actual.

---

# PARTE VIII · DIAGNÓSTICO {#diagnostico}

## 30. Escalera DNS

![Diagnóstico DNS]({{ '/assets/docencia/ser/ut02/dns/06_diagnostico.svg' | relative_url }})

Orden recomendado:

```text
1. red
2. DNS configurado en el cliente
3. servicio / puerto 53
4. configuración
5. zona y registros
6. caché / reenviador / transferencia
```

---

## 31. NXDOMAIN y SERVFAIL

### NXDOMAIN

Significa, simplificando: *el nombre solicitado no existe*

### SERVFAIL

Significa: *el servidor no ha podido completar correctamente la consulta*

**No** son los mismos fallos.

---

## 32. Casos de diagnóstico

### Local funciona, Internet no

```text
zona local correcta
↓
revisar salida exterior / forwarders / recursión
```

### `dig @IP` funciona, consulta normal no

```text
revisar DNS configurado en cliente
```

### Zona no carga

```text
named-checkconf -z
named-checkzone
journalctl
```

### Secundario no recibe la zona

```text
IP del primary
allow-transfer
TCP 53
serial
```

---

# PARTE IX · INDIVIDUALIZACIÓN {#individualizacion}

## 33. Variante P/L

En la práctica final:


- P = número de puesto
- L = inicial del primer apellido


Se utilizará:


- Red: 192.168.(150+P).0/24

- Dominio: pXX-lYY.ser.test

- Debian primary: host (10+L)

- Windows secondary: host (50+L)

- Cliente: host (100+P)

Ejemplo :

| Servicio | Dirección | 
|---|---|
|Red|192.168.157.0/24|
|Dominio| p03-l13.ser.test|
|Debian primary |192.168.157.13|
|Windows sec. |192.168.157.53|
|Cliente |192.168.157.107|

---

# PARTE XI · CHULETA {#chuleta}

## BIND

```bash
sudo apt install -y bind9 bind9-utils bind9-dnsutils

named -v
sudo named-checkconf
sudo named-checkconf -z
sudo named-checkzone ZONA FICHERO

sudo rndc reload

systemctl status named.service --no-pager
journalctl -u named.service -n 50 --no-pager

sudo ss -luntp | grep ':53'
```

## Consultas

```bash
dig @DNS nombre A
dig @DNS zona SOA +norecurse
dig @DNS zona MX
dig @DNS alias CNAME
dig @DNS -x IP
```

## Cliente

```bash
resolvectl status
```

Windows:

```bat
ipconfig /all
nslookup nombre IP_DNS
```

---

# PARTE XII · RECURSOS {#recursos}

- [Real Decreto 1691/2007 · RA2 de Servicios en red](https://www.boe.es/buscar/doc.php?id=BOE-A-2008-819)
- [Debian 13 · paquete BIND9](https://packages.debian.org/stable/net/bind9)
- [BIND 9 Administrator Reference Manual](https://bind9.readthedocs.io/en/stable/)
- [BIND · herramientas `named-checkconf` y `named-checkzone`](https://bind9.readthedocs.io/en/stable/manpages.html)
- [RFC 2606 · `.test` reservado para pruebas](https://www.rfc-editor.org/info/rfc2606/)
- [Server World · Debian 13 / DNS Server (BIND)](https://www.server-world.info/en/note?os=Debian_13)

---

# PARTE XIII · CIERRE {#cierre}

Antes de pasar a otro servicio deberías poder responder:

- ¿qué problema resuelve DNS?
- ¿qué diferencia hay entre dominio y zona?
- ¿qué es un FQDN?
- ¿qué significa autoritativo?
- ¿qué hace una caché?
- ¿qué es TTL?
- ¿qué diferencia hay entre A y PTR?
- ¿para qué sirven CNAME y MX?
- ¿qué hace el serial?
- ¿qué diferencia hay entre primary y secondary?
- ¿cómo separo un fallo del servidor de un fallo del cliente?


➡️ **[Continuar: DNS en Windows Server 2022/2025]({{ '/docencia/smr/ser/ut02-windows/' | relative_url }})**
