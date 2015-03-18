<spirit-grid>
  <div class="grid-left">
    <h2 class="no-margin">Games</h2>
    <spirit-list>
      {{#games}}
        <spirit-list-item data-template="games/game"
                          data-template-container="game"
                          data-template-data="Spirit.getGame({{ id }})">{{ title }}</spirit-list-item>
      {{/games}}
      {{^games}}
        Loading...
      {{/games}}
    </spirit-list>
  </div>
  <div class="grid-right">
    <spirit-container id="container-game" class="no-margin" style="padding-left: 10px;">
    </spirit-container>
  </div>
</spirit-grid>
