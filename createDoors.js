/*
  SECTION ONE
  VARIABLE DECLARATIONS AND SVG SETUP
*/
var numEntered = 0;
var numPlayers; 

var screenHeight = 700;
var screenWidth = 1200;
var player_h = 32, player_w = 20; // player height and player widhth

var rad = 10;
var player_list = {};
var exit_list = [];

var done = false;
var playersCreated = false;


var success_exits = 0;


var roomIsSafe = true;

var main = d3.select("body").append("svg")
       .attr("width" , "100%")    
       .attr("height" , screenHeight)

var background = d3.select("svg").append("rect")
       .attr("width", "100%") //should always be 100% do not change
       .attr("height", "100%") //100% of parent SVG
       .attr("fill", "white"); //white color

var instructions = {};

var score = main.append("text").attr("id", "score")
  .text("successful exits = " + success_exits)
  .attr({
    "x":10,
    "y":20
  });


var upbound; // = 0;
var lowbound; // = screenHeight - player_h;
var rightbound; // = helpers.screenWidth() - player_w;
var leftbound; // = 0;

/*
    SECTION TWO
    CLASS AND FUNCTION DEFINITIONS 
*/
var doorcount = 0;
// Door class //
var Door = function(boundary, position, size) {
  this.id = doorcount;
  doorcount++;

  var doorWidth = 10;
  

  if( boundary === "top") {
    this.y = 0 - doorWidth/2;
    this.x = position-size/2;
    this.width = size;
    this.height = doorWidth;
  

  } else if(boundary === "bottom"){
    this.y = screenHeight - doorWidth/2;
    this.x = position-size/2;
    this.width = size;
    this.height = doorWidth;

  } else if(boundary === "left"){
    this.x=0 - doorWidth/2;
    this.y=position-size/2;
    this.width = doorWidth;
    this.height = size;


  }else{
    this.x=helpers.screenWidth()-doorWidth/2;
    this.y=position-size/2;
    this.width = doorWidth;
    this.height = size;

  }


  this.bounds = {
        left: this.x,
        right:this.x + this.width,
        top:this.y,
        bottom:this.y + this.height,
    };

  main.append("rect").attr("id", "d" + this.id)
    .attr({
      "x": this.x,
      "y": this.y,
      "width": this.width,
      "height": this.height,
      "fill": "#D50000" //red
    })


    this.center = {
      x: this.x + this.width/2,
      y: this.y + this.height/2,
    }
}
Door.prototype.getCenter = function() {
  return {
    x: this.center.x,
    y: this.center.y,
  }
}



var Player = function(id, x, y){
    this.height = player_h;
    this.width = player_w;

    this.inside = false;
    this.hasBeenInside = false; 
    this.randomVelocitySet;

    //used so that they spawn in a line int the middle
    this.x = x; //helpers.randomInt(helpers.screenWidth() - this.width);
    this.y = y; // helpers.randomInt(helpers.screenHeight() - this.height);

    //used for debugging
    this.originalX = this.x;
    this.originalY = this.y;

    this.logging  = false;

    this.free = true;

    this.center = { 
      x:this.x+this.width/2,
      y:this.y+this.height/2,
    }

    this.bounds = {
        
    }
    // this.walking_speed = (helpers.randomInt(5)+2)/2; // 1-3
    this.walking_speed = helpers.randomInt(5) + 1; // 1-3


    this.xvel = helpers.randomInt(this.walking_speed)+1;
    this.yvel =helpers.randomInt(this.walking_speed)+1;

    var sign1 = helpers.randomInt(2)+1;
    var sign2 = helpers.randomInt(2)+1;
    if(sign1 === 1) this.xvel = -1*this.xvel;
    if(sign2 === 1) this.yvel = -1*this.yvel;


    this.fill = "#0000ff"; //blue
    this.id = id;

    //this.angle = 0;
    
    this.myExit;
    this.bounds = {
        left:this.x,
        right:this.x+this.width,
        top:this.y,
        bottom:this.y+this.height,
    }

    //if hasmoved = true it's time to calculate the pathway to the door again. 
    this.hasMoved = true;

    main.append("rect")
    .attr({
        "id": this.id,
        "x": this.x,
        "y": this.y,
        "height": this.height,
        "width": this.width,
        "fill": this.fill,
    });

    instructions[id] = {
        "xvel": this.xvel,
        "yvel": this.yvel,
        "fill": this.fill,
        "x": this.x,
        "y": this.y
    };

}     


Player.prototype.log = function(){
  if (this.logging) console.log(this.id + " " + this.bounds.left + " "+  this.bounds.right + " " + this.bounds.top + " " + this.bounds.top + " xvel: " + this.xvel+ "yvel: " + this.yvel);
}

// SECTION 2 PROTOTPES AND SUBFUNCTIONS

Player.prototype.getFutureBounds = function(velocities) {
  current_bounds = this.getBounds();

  return {
      top: current_bounds.top + velocities.y,
      right: current_bounds.right + velocities.x,
      bottom: current_bounds.bottom + velocities.y,
      left: current_bounds.left + velocities.x
  };

}


Player.prototype.updateCenter = function(){
    this.center.x = this.x+this.width/2;
    this.center.y = this.y+this.height/2;
}


Player.prototype.render = function(id, x, y, fill) {
  var player = d3.selectAll("#" + id);
  player.attr({
    "x": x,
    "y": y,
    "fill": fill,
  });
}

Player.prototype.updateBounds = function(){
    this.bounds = {
        left:this.x,
        right:this.x+this.width,
        top:this.y,
        bottom:this.y+this.height,
    }
}

Player.prototype.update = function(){
    this.updateCenter();
    this.updateBounds();

}

Player.prototype.getBounds = function(){
  return {
    "top": this.center.y - this.height/2,
    "right": this.center.x + this.width/2,
    "bottom": this.center.y + this.height/2,
    "left": this.center.x - this.width/2
  };
}



Player.prototype.delete = function(){
  d3.select("#" + this.id).remove();
  delete player_list[this.id];
  success_exits++;
}


Player.prototype.checkForCurrentCollisions = function(){

    var currentCollisions = [];
    for(var player in player_list){
        if (player_list[player] === this){ continue;}

    
        var otherPeopleBounds = player_list[player].getBounds();
        var myCurrentBounds = this.getBounds();
        
        //if bounds overlap
        if(myCurrentBounds.right > otherPeopleBounds.left && myCurrentBounds.left < otherPeopleBounds.right
            && myCurrentBounds.bottom > otherPeopleBounds.top && myCurrentBounds.top < otherPeopleBounds.bottom) {

            currentCollisions.push(player_list[player]);
        }
    }   
    return currentCollisions;
}



Player.prototype.lookAtExit = function(){

    if (this.myExit == null){
      var nearest = this.findNearestExit();
      this.myExit = nearest.myExit;
    }   
    
    var x_distance = this.myExit.center.x - this.center.x;
    var y_distance = this.myExit.center.y - this.center.y;
    var hypotenuse = Math.sqrt(x_distance*x_distance + y_distance*y_distance); 

    var x_comp = Math.abs(x_distance*(this.walking_speed/hypotenuse));
    var y_comp = Math.abs(y_distance*(this.walking_speed/hypotenuse));
 

    if(this.center.x < this.myExit.center.x &&  this.center.y > this.myExit.center.y){            
        x_comp = x_comp;
        y_comp = -1*y_comp;
    } else if(this.center.x > this.myExit.center.x &&  this.center.y > this.myExit.center.y){ // SECOND QUAD
        x_comp = -1*x_comp; 
        y_comp = -1*y_comp
    
    } else if(this.center.x > this.myExit.center.x &&  this.center.y < this.myExit.center.y){ // THIRD QUADRANT
        x_comp = -1*x_comp;
        y_comp = y_comp;
    
    } else {
        x_comp = x_comp;
        y_comp = y_comp;
    }
    
    return {
        xvel: x_comp,
        yvel: y_comp,
    }


}


Player.prototype.findNearestExit = function(){
  //use first exit as the test case
  var myExit;
  var first = exit_list[0].getCenter();
  var x_distance = first.x - this.center.x;
  var y_distance = first.y - this.center.y;
    
  var hypotenuse = Math.sqrt(x_distance*x_distance + y_distance*y_distance); 
  //this loop makes sure that hypotense stores the smallest hypotenuse out of all the exits
  for(var i =0; i < exit_list.length; i++){
    var exitCenter = exit_list[i].getCenter();
    var x = exitCenter.x - this.center.x;
    var y = exitCenter.y - this.center.y;
    
    h = Math.sqrt(x*x + y*y); 
    
    if(h <= hypotenuse) {
      hypotenuse = h;
      y_distance = y;
      x_distance = x;
      myExit = exit_list[i];
    }

  }
  return{
    myExit: myExit,
  } ;

}


Player.prototype.action = function() {
    upbound = 0;
    lowbound = screenHeight - player_h;
    rightbound = helpers.screenWidth() - player_w;
    leftbound = 0;


    if(roomIsSafe){ // bounce off walls if no danger in room
        if(this.x<= leftbound || this.x >= rightbound) {this.xvel = -1*this.xvel;}
        if(this.y <= upbound || this.y >= lowbound) {this.yvel = -1*this.yvel}
    } else { // test whether at a boundary and at an exit
        if(this.center.x >= rightbound || this.center.x <= leftbound || this.center.y >= lowbound || this.center.y <= upbound){ 
            if(this.myExit){
              // if the rectangle fits inside of the door at its current trajectory
              if( this.bounds.top >= this.myExit.bounds.top && this.bounds.bottom <= this.myExit.bounds.bottom){
                  console.log("fits");
                  this.xvel = this.walking_speed;
                  this.yvel = 0;
                  this.delete();
              }
              else{ // otherwise it doesnt fit and it has to adjust. 
                console.log("doesnt fit");
                if(this.bounds.top < this.myExit.bounds.top){
                  this.yvel = this.walking_speed;
                  this.xvel = 0;
                }
                if(this.bounds.top > this.myExit.bounds.top){
                  this.yvel = -1*this.walking_speed;
                  this.xvel = 0;
                }
              }
            } 
        } 

    }

    if(!roomIsSafe && this.hasMoved){
        var path = this.lookAtExit(); //shortest path

        this.xvel = path.xvel;
        this.yvel = path.yvel;
        this.fill = "red";
        this.hasMoved = false;
    } 
    // else{
    //   this.fill = "blue";
    // }

    this.x = this.x + this.xvel;
    this.y = this.y + this.yvel;

    this.update();
    this.render(this.id, this.x, this.y, this.fill);

    updateScore();
}




var updateScore = function(){
  d3.select("#score").text("Successful exits = " + success_exits);
}



/*
  SECTION 3

  CONTROL FUNCTIONS TO START AND STOP SIMULATION

*/

function findCollisions(){
    
    var p_list = [];
    for(player in player_list){
        p_list.push(player_list[player].id)
    }
    unique_pairs = helpers.combinations(p_list);
    for (pair in unique_pairs){
        var r1 = player_list[unique_pairs[pair][0]];
        var r2 = player_list[unique_pairs[pair][1]];

        existsCollision = collides(r1,r2);

        if(existsCollision && roomIsSafe){
            //  console.log(r1.id + " collides with " + r2.id);
            // console.log("r1 vel = " + r1.xvel + " , " +r1.yvel + "and r2 vel =  " + r2.xvel + " , " + r2.yvel);
            r1.fill = "green";
            r2.fill = "green";


            var faster_walker = (r1.walking_speed > r2.walking_speed) ? r1 : r2;
            // if they collide: 
            var same_xvel = (r1.xvel * r2.xvel) > 0;
            var same_yvel = (r1.yvel * r2.yvel) > 0;

            if(same_xvel || same_yvel){ // faster one will move away
                faster_walker.xvel = faster_walker.xvel * -1;
                faster_walker.yvel = faster_walker.yvel * -1;
                faster_walker.hasMoved = true;
            }
            else{ // if going opposite directions they both bounce off
                r1.xvel = r1.xvel * -1;
                r2.xvel = r2.xvel * -1;
                r1.yvel = r1.yvel * -1;
                r2.yvel = r2.yvel * -1;
                r1.hasMoved = true;
                r2.hasMoved = true;
            } 
            

        } 

        else if(existsCollision && !roomIsSafe){
            // here they are trying to exit the building.
            // if someone is in front of you you are not allowed to go through them. you must walk at the same speed 
            // that they are walking in. 
            
            if(r1.xvel > 0 ){ // people are moving forward

              var personInFront = (r1.x > r2.x) ? r1 : r2;
              var personInBack = (r1.x <= r2.x) ? r1 : r2;

              var same_xdir = (r1.xvel * r2.xvel) >= 0;
              var same_ydir = (r1.yvel * r2.yvel) >= 0;

              if(same_xdir || same_ydir){ // faster one will slow down
                 
                  personInBack.x = personInBack.x - player_w/2;
                  personInBack.hasMoved = true;
              }
            }
            if(r1.xvel < 0 ){ // people are moving back

              var personInFront = (r1.x < r2.x) ? r1 : r2;
              var personInBack = (r1.x >= r2.x) ? r1 : r2;

              var same_xdir = (r1.xvel * r2.xvel) >= 0;
              var same_ydir = (r1.yvel * r2.yvel) >= 0;

              if(same_xdir || same_ydir){ // faster one will slow down
                 
                  personInBack.x = personInBack.x + player_w/2;
                  personInBack.hasMoved = true;
              }     
            }
            if(r1.yvel < 0 ){ // people are moving upward

              var personAbove = (r1.y < r2.y) ? r1 : r2;
              var personBelow = (r1.y >= r2.y) ? r1 : r2;

              var same_xdir = (r1.xvel * r2.xvel) >= 0;
              var same_ydir = (r1.yvel * r2.yvel) >= 0;

              if(same_xdir || same_ydir){ // faster one will slow down
                  personBelow.y = personBelow.y + player_h/2;
                  personBelow.hasMoved = true;
              }
            }
            if(r1.yvel > 0 ){ // people are moving downwards

              var personAbove = (r1.y > r2.y) ? r1 : r2;
              var personBelow = (r1.y <= r2.y) ? r1 : r2;

              var same_xdir = (r1.xvel * r2.xvel) >= 0;
              var same_ydir = (r1.yvel * r2.yvel) >= 0;

              if(same_xdir || same_ydir){ // faster one will slow down
                 
                  personAbove.y = personAbove.y - player_h/2;
                  personAbove.hasMoved = true;
              }     
            }

            
        }

        else {
            r1.fill = "blue";
            r2.fill = "blue";
        }
    }
}

function collides(rect1, rect2){
    
    var b1 = rect1.getBounds();
    var b2 = rect2.getBounds();

    return (b1.right > b2.left && b1.left < b2.right
        && b1.bottom > b2.top && b1.top < b2.bottom);

}



  
function getMedianFactors(num){
  var factors = [],
  quotient = 0;

  for(var i = 1; i <= num; i++){
    quotient = num/i;

    if(quotient === Math.floor(quotient)){
      factors.push(i); 
    }
  }

  //return factors;
  // 1,3,9
  // 0,1,2,
  if(factors.length%2===0){
    return [factors[(factors.length/2) - 1], factors[(factors.length/2)] ];
  } 
  else {
    return [factors[(factors.length-1)/2],factors[(factors.length-1)/2]];
  }
}

function makePlayers(num){
    var padding = 20;
    var count = 0;

    factors = getMedianFactors(num);

    for(var i = 0; i < num/factors[0]; i++){
      for(var j = 0; j < num/factors[1]; j++){
        // var p = new Player("p" + i, -1*((player_w+padding)*i+player_w));
        var p = new Player("p" + count, (helpers.screenWidth()/2 - (player_w+padding)*i+player_w), (screenHeight/2 - (player_h+padding)*j+player_h));
        player_list[p.id] = p;
        count++;
      }
        
    }
    playersCreated = true;     
}


var makeDoor = function(){
    var text=document.getElementById('input2').value;
    arguments = text.split(',');
    console.log(arguments[0] + " " + arguments[1] + " " + arguments[2]);
    var x = new Door(arguments[0], arguments[1], arguments[2]);
    exit_list.push(x);
}

var createDoors = function(){
  // door with padding
  var a = new Door("right", screenHeight/2, 100);
  var b = new Door("left", screenHeight/2, 100);
  // var b = new Door("left", 400, 200);
  // var c = new Door("top", 300, 50);
  exit_list.push(a);
  exit_list.push(b);
  // exit_list.push(b);
  // exit_list.push(c);

}


function moveAll(){
    // program will only run if there are Players.
      if (!playersCreated) {alert("Please enter the number of players in the textbox and then click on the blue textbox: ");return true;}
    
    // This loop will run in the beginning before the danger occurs. Playes are just bouncind around randomly.
    if(!done){
        for(var q in player_list){
          player_list[q].action();
        }
        findCollisions();
        d3.select("#p10").attr("fill","orange");
    }

    else return done;

}


function run(){
  d3.timer(moveAll);
}



function stop(){
  done = true;
}

function exit(){
  roomIsSafe = false;
}

function numPlayers(){
  var text=document.getElementById('input1').value;
  console.log("inside numPLayers() : " + text);
  makePlayers(text);

}

function restart(){
  done = true;
}

var helpers = {
       randomInt: function(x){
               return Math.floor(Math.random()*x);
       },
       randomColor: function(){
               return "rgba(" + helpers.randomInt(255) +
                          "," + helpers.randomInt(255) +
                          "," + helpers.randomInt(255) + ",0.75)";
       },
       parse: function(attr){
               return Number(attr.replace("px", ""));
       },
       screenHeight: function(){
               return helpers.parse(main.style("height"));
       }, 
       screenWidth: function(){
               return helpers.parse(main.style("width"));
       },
       combinations: function(list) { //found at http://codereview.stackexchange.com/questions/75658/pairwise-combinations-of-an-array-in-javascript
          var pairs = [];
          list
            .slice(0, list.length - 1)
            .forEach(function (first, n) {
              var tail = list.slice(n + 1, list.length);
              tail.forEach(function (item) {
                pairs.push([first, item])
              });
            })
          return pairs;
        },

  
};
