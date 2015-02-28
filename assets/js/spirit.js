Spirit = (function(){
  var gui = require('nw.gui'),
      mustache = require('mustache'),
      fs = require('fs'),
      cache = {templates: {}},
      session = {games: []},
      SPIRIT_BASE = "http://spirit.horner.tj";

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
      });
    }else{
      templateData.cached = true;
      $container.html(mustache.render(cache.templates[template], templateData));
    }

    return true;
  }

  this.load = loadTemplate;
  this.session = session;

  // gui.Window.get().maximize();

  return this;
}());

$(document).ready(function(){
  $container = $("spirit-container");

  $.each($("[data-template]"), function(index, element){
    $el = $(element);
    $el.click(function(){
      $("li.active").removeClass("active");
      $el.addClass("active");
      Spirit.load($el.attr("data-template"), Spirit.session, $container);
    });
  });
});
