---
layout: post
title: "Rediseñando mi portfolio docente: de una web personal a una plataforma de documentación"
date: 2026-09-07
categories:
  - portfolio
  - desarrollo
tags:
  - jekyll
  - github-pages
  - git
  - arquitectura
  - docencia
---

## El punto de partida

El portfolio nació como una web sencilla para reunir
información profesional, proyectos y materiales docentes.

Conforme el contenido empezó a crecer apareció un problema:
una lista de módulos no era suficiente.


## El problema

Necesitaba representar una estructura real de Formación Profesional:

Nivel → Ciclo → Módulo → Unidad → Contenido.


## La solución

La nueva arquitectura utiliza Collections de Jekyll:

- cycles
- modules
- units

Cada elemento contiene metadatos que permiten generar
automáticamente la navegación.


## Navegación

El área Docencia permite ahora recorrer:

CFGS / CFGM → ciclo → módulo → unidad.

Cada módulo incluye además una barra lateral para moverse
entre sus contenidos.


## Tecnologías

El proyecto utiliza:

- Jekyll
- Liquid
- Markdown
- SCSS
- JavaScript
- Git
- GitHub Actions
- GitHub Pages


## Flujo de desarrollo

El rediseño se ha realizado mediante una rama independiente,
commits progresivos y un Pull Request antes de integrarlo
en la rama principal.


## Seguridad

Se ha comenzado además a separar claramente:

- contenido público;
- material de muestra;
- contenido privado.

El material sensible o privado nunca forma parte del
repositorio público.


## Próximos pasos

La siguiente evolución del portfolio será continuar
incorporando materiales de Programación, Bases de Datos,
Sistemas y Redes, además de mejorar progresivamente la
experiencia de navegación.