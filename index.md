---
layout: default
title: Inicio
description: Portfolio docente y técnico de Fco. Javier Cano Granado.
---
<section class="hero">
  <div class="container hero-grid">
    <div class="terminal-card">
      <div class="terminal-bar">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <span>bash · portfolio</span>
      </div>
      <div class="eyebrow">profesor + builder + documentación</div>
      <h1><span class="prompt">$</span> Fco. Javier Cano Granado</h1>
      <p class="lead">Profesor de Informática de Formación Profesional. Diseño materiales claros, prácticas útiles y recursos con enfoque real: DAW, ASIR, SMR, bases de datos, programación, redes y formación tecnológica aplicada.</p>
      <div class="button-row">
        <a class="button" href="{{ '/modulos/' | relative_url }}">Ver módulos</a>
        <a class="button ghost" href="{{ '/blog/' | relative_url }}">Entrar al blog</a>
        <a class="button ghost" href="{{ site.social.buymeacoffee }}">Invítame a un café</a>
      </div>
    </div>

    <div class="panel stat-grid">
      <div class="stat">
        <strong>Foco</strong>
        <span>FP Informática, materiales y formación</span>
      </div>
      <div class="stat">
        <strong>Zona</strong>
        <span>Extremadura · España</span>
      </div>
      <div class="stat">
        <strong>Formato</strong>
        <span>Presencial, online y documentación propia</span>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <div>
        <h2>Qué encontrará quien llegue aquí</h2>
        <p>No un escaparate vacío, sino trabajo real y organizado.</p>
      </div>
    </div>
    <div class="card-grid">
      <article class="card">
        <h3>Módulos</h3>
        <p>Resumen limpio de los módulos que impartes o dominas, con nivel, modalidad, tecnologías y enfoque docente.</p>
        <a href="{{ '/modulos/' | relative_url }}">Abrir módulos →</a>
      </article>
      <article class="card">
        <h3>Talleres y cursos</h3>
        <p>Formaciones, ponencias, cursos de FEVAL o talleres que te interese mostrar como portfolio profesional.</p>
        <a href="{{ '/talleres/' | relative_url }}">Abrir talleres →</a>
      </article>
      <article class="card">
        <h3>Blog</h3>
        <p>Artículos con fecha, categorías y etiquetas para demostrar criterio técnico, experiencia y estilo docente.</p>
        <a href="{{ '/blog/' | relative_url }}">Abrir blog →</a>
      </article>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <div>
        <h2>Destacado ahora</h2>
        <p>Una mezcla de lo docente y lo técnico, sin ruido.</p>
      </div>
    </div>

    <div class="card-grid">
      {% assign featured_module = site.modules | first %}
      {% if featured_module %}
      <article class="card">
        <small>MÓDULO DESTACADO</small>
        <h3>{{ featured_module.title }}</h3>
        <p>{{ featured_module.summary }}</p>
        <a href="{{ featured_module.url | relative_url }}">Entrar →</a>
      </article>
      {% endif %}

      {% assign featured_workshop = site.workshops | first %}
      {% if featured_workshop %}
      <article class="card">
        <small>TALLER / CURSO</small>
        <h3>{{ featured_workshop.title }}</h3>
        <p>{{ featured_workshop.summary }}</p>
        <a href="{{ featured_workshop.url | relative_url }}">Entrar →</a>
      </article>
      {% endif %}

      {% assign latest_post = site.posts | first %}
      {% if latest_post %}
      <article class="card">
        <small>ÚLTIMO ARTÍCULO</small>
        <h3>{{ latest_post.title }}</h3>
        <p>{{ latest_post.description | default: latest_post.excerpt | strip_html }}</p>
        <a href="{{ latest_post.url | relative_url }}">Leer →</a>
      </article>
      {% endif %}
    </div>
  </div>
</section>

