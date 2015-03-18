Spirit = (function(){
  var gui = require('nw.gui'),
      fs = require('fs'),
      mustache = require('mustache'),
      cache = {templates: {}},
      session = {games: {}, user: {}, steam: {}},
      Steam = require('steam'),
      SPIRIT_BASE = "http://spirit.horner.tj/",
      API_BASE = SPIRIT_BASE + "api/",
      PROGRAM_DIRECTORY = process.env["PROGRAMFILES"] ? process.env["PROGRAMFILES"] + "\\Spirit\\" : "/home/" + process.env["USER"] + "/.local/Spirit/",
      APPDATA_DIRECTORY = process.env["APPDATA"] ? process.env["APPDATA"] + "\\Spirit\\" : "/home/" + process.env["USER"] + "/.local/Spirit/data/";

  var triggers = {
    login: function(params){
      $.post(API_BASE + "authenticate",
        {
          user: {
            username: params["username"],
            password: params["password"]
          }
        },
        function(d){
          console.log(d);
          if(d.success){
            session.user = d.user;
            // TODO add error handling here
            fs.writeFile(PROGRAM_DIRECTORY + "user.json", JSON.stringify(d.user));
            window.open("spirit.html");
            gui.Window.get().close(true);
          }else{
            alert(d.message);
          }
        });
    },
    logout: function(){
      fs.unlink(PROGRAM_DIRECTORY + "user.json");
      window.location = "login.html";
    }
  };

  var connectWithSteam = function(username, password){
    var client = new Steam.SteamClient();

    client.logOn({
      accountName: username,
      password: password
    });

    client.on('error', function(err){
      if(err && err.eresult === client.EResult.AccountLogonDenied){
        prompt("Please enter your SteamGuard code:");
      }
    });

    session.steam.client = client;
  };

  // The installer installs everything in the 32-bit program files, will need to fix later.
  if(process.env["PROGRAMFILES(x86)"]){
    PROGRAM_DIRECTORY = process.env["PROGRAMFILES(x86)"] + "\\Spirit\\";
  }

  function handle(error){
    alert("Bummer. Something went wrong (" + error + "). If you keep seeing this, please contact us.");
    process.exit(1);
  }

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

    $.each($(el).find("[data-trigger]"), function(index, element){
      var $el = $(element);
      $el.click(function(){
        var params = {};
        console.log($el.attr("id"));
        $.each($("input[data-for-trigger=\"" + $el.attr("id") + "\"]"), function(i, e){
          params[$(e).attr("id")] = $(e).val();
          console.log($(e).val());
        });
        triggers[$el.attr("data-trigger")](params);
        console.log("#triggered");
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
            $("[data-value=\"user.username\"]").text(session.user.username);

            $.ajax({
              url: API_BASE + "my_games",
              data: {token: session.user.token},
              success: function(d){
                session.games = d;
              }
            });

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
