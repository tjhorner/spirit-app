Spirit = (function(){
  var gui = require('nw.gui'),
      fs = require('fs'),
      mustache = require('mustache'),
      cache = {templates: {}},
      session = {games: {}, user: {}},
      SPIRIT_BASE = "http://spirit.horner.tj/",
      PROGRAM_DIRECTORY = process.env["PROGRAMFILES"] + "\\Spirit\\" || "~/.local/Spirit/",
      APPDATA_DIRECTORY = process.env["APPDATA"] + "\\Spirit\\" || "~/.local/Spirit/data/";

  // The installer installs everything in the 32-bit program files, will need to fix later.
  if(process.env["PROGRAMFILES(x86)"]){
    PROGRAM_DIRECTORY = process.env["PROGRAMFILES(x86)"] + "\\Spirit";
  }

  function handle(error){
    alert("Bummer. Something went wrong (" + error + "). If you keep seeing this, please contact us.");
    process.exit(1);
  }

  $.ajax({
    url: SPIRIT_BASE + "games.json",
    success: function(d){
      session.games = d;
    }
  });

  var extend = function(method, func){
    this[method] = func;
    return this[method];
  };

  this.extend = extend;

  var loadTemplate = function(template, templateData, container){
    templateData = templateData || {};
    $container = $(container);

    if(!cache.templates[template]){
      fs.readFile('templates/' + template + '.mu', function(err, data){
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
  };

  var listen = function(el){
    $.each($(el).find("[data-template]"), function(index, element){
      var $el = $(element);
      var $container = $("#container-" + $el.attr("data-template-container"));
      $el.click(function(){
        loadTemplate($el.attr("data-template"), eval($el.attr("data-template-data")), $container);
      });
    });
  };

  var init = function(){
    // Check for first-time use
    try {
      stats = fs.lstatSync(PROGRAM_DIRECTORY);

      if(!stats.isDirectory()){

      }else{
        fs.readFile(PROGRAM_DIRECTORY + "user.json", function(err, data){
          if(err || data.toString() === ""){
            window.location = "login.html";
          }else{
            // READY!
            session.user = JSON.parse(data);
            gui.Window.get().maximize();
          }
        });
      }
    }
    catch (e) {
      handle(e);
    }

    return {then: function(f){f()}};
  };

  this.init = init;
  this.listen = listen;
  this.session = session;

  return this;
}());
