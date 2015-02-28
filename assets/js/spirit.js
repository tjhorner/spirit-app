Spirit = (function(){
  var gui = require('nw.gui'),
      Twig = require('twig').twig,
      render = Twig.twig,
      fs = require('fs'),
      cache = {templates: {}},
      session = {games: [{title: "The Dank Game", title: "Another Dank Game"}]};

  var loadTemplate = function(template, templateData, container){
    templateData = templateData || {};
    $container = $(container);
    if(!cache.templates[template]){
      fs.readFile('templates/' + template + '.twig', function(err, data){
        if (err) {
          throw err;
        }

        var loadedTemplate = Twig({data: data.toString()});
        cache.templates[template] = loadedTemplate;
        $container.html(loadedTemplate.render(templateData));
      });
    }else{
      templateData.cached = true;
      $container.html(cache.templates[template].render(templateData));
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
