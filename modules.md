---
title: Docencia
permalink: /docencia/
eyebrow: docencia
intro: Recursos, materiales y documentación de Formación Profesional de Informática.
---

<p class="lead">
Selecciona el nivel formativo y después el ciclo para acceder
a los módulos y contenidos publicados.
</p>

{% assign cfgs = site.cycles | where: "level_key", "cfgs" | sort: "order" %}
{% assign cfgm = site.cycles | where: "level_key", "cfgm" | sort: "order" %}


<details class="level-selector" open>

<summary>
  <strong>Grado Superior</strong>
  <span>CFGS</span>
</summary>

<div class="cycle-grid">

{% for cycle in cfgs %}

<a class="cycle-card" href="{{ cycle.url | relative_url }}">

  <span class="cycle-code">
    {{ cycle.code }}
  </span>

  <h2>
    {{ cycle.title }}
  </h2>

  <p>
    {{ cycle.summary }}
  </p>

  <strong>
    Explorar ciclo →
  </strong>

</a>

{% endfor %}

</div>

</details>


<details class="level-selector">

<summary>
  <strong>Grado Medio</strong>
  <span>CFGM</span>
</summary>

<div class="cycle-grid">

{% for cycle in cfgm %}

<a class="cycle-card" href="{{ cycle.url | relative_url }}">

  <span class="cycle-code">
    {{ cycle.code }}
  </span>

  <h2>
    {{ cycle.title }}
  </h2>

  <p>
    {{ cycle.summary }}
  </p>

  <strong>
    Explorar ciclo →
  </strong>

</a>

{% endfor %}

</div>

</details>