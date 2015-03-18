<h2 class="no-margin">{{ title }}</h2>

<br>
<input type="hidden" data-for-trigger="download-{{ id }}" value="{{ id }}" name="id">
<button data-trigger="download" id="download-{{ id }}">Download</button>
<br><br>

{{ description }}<br><br>

Game created by {{ developer.first_name }} {{ developer.last_name }}
