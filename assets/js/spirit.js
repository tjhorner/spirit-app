Spirit = (function(){
  var gui = require('nw.gui'),
      fs = require('fs'),
      http = require('http'),
      https = require('https'),
      url = require('url'),
      yauzl = require('yauzl'),
      mkdirp = require('mkdirp'),
      mustache = require('mustache'),
      exec = require('child_process').exec,
      os = require('os'),
      cache = {templates: {}},
      session = {games: [], user: {}, steam: {}},
      Steam = require('steam'),
      SPIRIT_BASE = "http://spirit.horner.tj/",
      API_BASE = SPIRIT_BASE + "api/",
      PROGRAM_DIRECTORY = process.env["PROGRAMFILES"] ? process.env["PROGRAMFILES"] + "\\Spirit\\" : "/home/" + process.env["USER"] + "/.local/Spirit/",
      APPDATA_DIRECTORY = process.env["APPDATA"] ? process.env["APPDATA"] + "\\Spirit\\" : "/home/" + process.env["USER"] + "/.local/Spirit/data/";

  var PLATFORM = (function(){
    switch(os.platform()){
      case 'win32':
        return "windows";
        break;
      case 'darwin':
        return "osx";
        break;
      case 'linux':
        return "linux";
        break;
      default:
        return "linux";
        break;
    }
  }());

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
    },
    download: function(params){
      $.ajax({
        url: SPIRIT_BASE + "games/" + params["id"] + ".json",
        success: function(game){
          var file = fs.createWriteStream(APPDATA_DIRECTORY + "game_" + game.id + "_" + game.current_revision.version + ".spk");
          var uri = url.parse(game.current_revision.content_url);
          var options = {
            host: uri.host,
            port: 443,
            path: uri.path,
            method: 'GET'
          };

          var req = https.request(options, function(res) {
            res.on('data', function(d) {
              console.log("data");
              file.write(d);
            });

            // so close to callback hell pls fix
            res.on('end', function(){
              console.log("end");
              file.on('finish', function () {
                file.close();
              });
              mkdirp(_gameDir(game), function(){
                yauzl.open(APPDATA_DIRECTORY + "game_" + game.id + "_" + game.current_revision.version + ".spk", function(err, zipfile) {
                  if (err) throw err;
                  zipfile.on("entry", function(entry) {
                    if (/\/$/.test(entry.fileName)) {
                      // directory file names end with '/'
                      return;
                    }

                    zipfile.openReadStream(entry, function(err, readStream) {
                      if (err) throw err;
                      // ensure parent directory exists, and then:
                      readStream.pipe(fs.createWriteStream(_gameDir(game) + entry.fileName));
                    });
                  });

                  zipfile.on("end", function(){
                    console.log("end zipfile");
                    zipfile.close();
                    setTimeout(function(){
                      fs.unlink(APPDATA_DIRECTORY + "game_" + game.id + "_" + game.current_revision.version + ".spk");
                      game.downloaded = true;
                      loadTemplate("games/game", game, $("#container-game"));
                    }, 500);
                  });
                });
              });
            });
          });
          req.end();

          req.on('error', function(e) {
            console.error(e);
          });
        }
      });
    },
    play: function(params){
      var manifestFile = _gameDir({id: params["id"]}) + "spirit.json";
      fs.readFile(manifestFile, 'utf8', function (err,data) {
        if (err) {
          return console.log(err);
        }
        var manifest = JSON.parse(data);
        if(manifest.scripts.start[PLATFORM] && !manifest.scripts.start[PLATFORM].unsupported_error){
          exec("cd " + _gameDir({id: params["id"]}) + " && " + manifest.scripts.start[PLATFORM].exec);
        }else{
          if(manifest.scripts.start[PLATFORM] && manifest.scripts.start[PLATFORM].unsupported_error){
            var err = manifest.scripts.start[PLATFORM].unsupported_error;
          }else{
            var err = "Sorry! This game doesn't support your platform right now."
          }
          alert(err);
        }
      });
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
          params[$(e).attr("name")] = $(e).val();
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

  var _gameDir = function(game){
    return APPDATA_DIRECTORY + "games/" + game.id + "/";
  }

  var _gameDownloaded = function(game){
    try {
      stats = fs.lstatSync(_gameDir(game));

      if (stats.isDirectory()) {
        return true;
      }
    }
    catch (e) {
      return false;
    }
  };

  var getGame = function(id){
    console.log("game id: " + id);
    for(i in session.games){
      var game = session.games[i];
      if(game.id === id){
        game.downloaded = _gameDownloaded(game);
        return game;
      }
    }
  };

  this.init = init;
  this.listen = listen;
  this.session = session;
  this.getGame = getGame;

  return this;
}());
