---
title: Talleres y cursos
permalink: /talleres/
eyebrow: workshops
intro: Formación impartida, diseñada o preparada para mostrar solvencia técnica y docente.
---

<div class="post-list">
{% assign ordered = site.workshops | sort: 'date' | reverse %}
{% for workshop in ordered %}
  <article class="list-item">
    <small>{{ workshop.date | date: "%d/%m/%Y" }} · {{ workshop.format }} · {{ workshop.audience }}</small>
    <h3><a href="{{ workshop.url | relative_url }}">{{ workshop.title }}</a></h3>
    <p>{{ workshop.summary }}</p>
  </article>
{% endfor %}
</div>
