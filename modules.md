---
title: Módulos
permalink: /modulos/
eyebrow: modules
intro: Módulos, materias y líneas de trabajo que merece la pena mostrar de forma pública.
---

<div class="post-list">
{% for module in site.modules %}
  <article class="list-item">
    <small>{{ module.cycle }} · {{ module.level }} · {{ module.mode }}</small>
    <h3><a href="{{ module.url | relative_url }}">{{ module.title }}</a></h3>
    <p>{{ module.summary }}</p>
  </article>
{% endfor %}
</div>
