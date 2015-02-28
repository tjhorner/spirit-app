Spirit = (function(){
  var gui = require('nw.gui'),
      mustache = require('mustache'),
      fs = require('fs'),
      cache = {templates: {}},
      session = {games: []},
      SPIRIT_BASE = "http://spirit.horner.tj/";

  $.ajax({
    url: SPIRIT_BASE + "games.json",
    success: function(d){
      session.games = d;
    }
  });

  var loadTemplate = function(template, templateData, container){
    templateData = templateData || {};
    $container = $(container);

    if(!cache.templates[template]){
      fs.readFile('templates/' + template + '.mst', function(err, data){
        if (err) {
          throw err;
        }
        console.log("Caching template \"" + template + "\"...");

        cache.templates[template] = data.toString();
        $container.html(mustache.render(data.toString(), templateData));
        listen($container);
      });
    }else{
      templateData.cached = true;
      $container.html(mustache.render(cache.templates[template], templateData));
      listen($container);
    }

    return true;
  }

  var listen = function(el){
    $.each($(el).find("[data-template]"), function(index, element){
      var $el = $(element);
      var $container = $("#container-" + $el.attr("data-template-container"));
      $el.click(function(){
        loadTemplate($el.attr("data-template"), eval($el.attr("data-template-data")), $container);
      });
    });
  }

  // this.load = loadTemplate;
  this.listen = listen;
  this.session = session;

  gui.Window.get().maximize();

  return this;
}());

$(document).ready(function(){
  Spirit.listen("spirit-wrapper");
});
