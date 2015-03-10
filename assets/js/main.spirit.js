// READY. SET. GOOOOO!

$(document).ready(function(){
  Spirit.init()
        .then(function(){
          Spirit.listen("spirit-wrapper");
        });
});
