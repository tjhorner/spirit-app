<h2 class="no-margin">{{ title }}</h2>

<br>
{{#downloaded}}
  <input type="hidden" data-for-trigger="play-{{ id }}" value="{{ id }}" name="id">
  <button data-trigger="play" id="play-{{ id }}">Play</button>
{{/downloaded}}

{{^downloaded}}
  <input type="hidden" data-for-trigger="download-{{ id }}" value="{{ id }}" name="id">
  <button data-trigger="download" id="download-{{ id }}">Download</button>
{{/downloaded}}
<br><br>

{{ description }}<br><br>

Game created by {{ developer.first_name }} {{ developer.last_name }}
