---
title: Novedades
permalink: /novedades/
intro: Últimos contenidos, cambios y mejoras publicados en fjcanogra.es.
---

<div class="updates-list">

{% assign updates =
   site.data.updates
   | sort: "date"
   | reverse %}

{% for update in updates %}

<a
  class="update-row"
  href="{{ update.url | relative_url }}"
>

  <time>
    {{ update.date | date: "%d/%m/%Y" }}
  </time>

  <span>
    {{ update.title }}
  </span>

  <small>
    {{ update.type }}
  </small>

</a>

{% endfor %}

</div>