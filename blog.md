---
title: Blog
permalink: /blog/
eyebrow: blog
intro: Artículos ordenados del más reciente al más antiguo, con categorías y etiquetas para mantener el sitio limpio.
---

<div class="post-list">
{% for post in site.posts %}
  <article class="post-item">
    <small>{{ post.date | date: "%d/%m/%Y" }}{% if post.categories and post.categories.size > 0 %} · {{ post.categories | join: " · " }}{% endif %}</small>
    <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
    <p>{{ post.description | default: post.excerpt | strip_html }}</p>
    {% if post.tags and post.tags.size > 0 %}
      <div class="chip-row">
        {% for tag in post.tags limit: 4 %}<span class="chip">#{{ tag }}</span>{% endfor %}
      </div>
    {% endif %}
  </article>
{% endfor %}
</div>
