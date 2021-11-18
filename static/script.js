const socket = io(window.location.href)
const canvas = document.getElementById('canvas');
var ctx = canvas.getContext("2d");

const nickname = prompt('set name:')

socket.emit("setNickname",nickname)


// // UI
// let scoreUl = document.getElementById('ul-score')
// function createList(text,color){
//     let li = document.createElement('li')
//     li.innerHTML = text
//     li.style.color = color;
//     li.id = "li-user"
//     scoreUl.appendChild(li)
// }

var ulScore = document.getElementById("scoreUl")
socket.on("updateScore",(data) => {
	ulScore.innerHTML = ''
	for(let key in data){
		if(!data.hasOwnProperty(key)){
			continue
		}
		var li = document.createElement('li');
		li.setAttribute("class","list-group-item")
		li.innerHTML = `${key}       <span class="badge bg-primary rounded-pill">${data[key]}</span>`
		ulScore.appendChild(li)
	}
})



// GAME
let LEFT,RIGHT,UP,DOWN;
var BALLS = [];
var FOODS = [];
var clientBalls = {};
var userCommand = {
    UP:false,
    LEFT:false,
    RIGHT:false,
    DOWN:false,
}
var justPressed = false

class Ball{
    constructor(x,y,r){
        this.x = x;
        this.y = y;
        this.r = r
        this.maxRadius = 50
        this.nickname = nickname
        this.speed = 10;
        this.player = false;
        BALLS.push(this)
    }

    drawBall(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.fillStyle = "blue";
        ctx.fill();
        ctx.font = "10px Arial";
        ctx.textAlign = "center"; 
        ctx.fillText(this.nickname,this.x,this.y - (this.r + 10));
        ctx.closePath();
    }

    remove(){
        ctx.clearRect(this.x,this.y,1000,1000)
    }

}

class Food{

    constructor(x,y,r,color){
        this.x = x,
        this.y = y
        this.r = r
        this.score = 1
        this.color = color
        FOODS.push(this)
    }

    drawFood(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

}

// let w = document.getElementById('w')
//     a = document.getElementById('a')
//     s = document.getElementById('s')
//     d = document.getElementById('d')


// function pressListener() {
//     w.addEventListener('click',() => {
//         UP = true
        
//     })
//     a.addEventListener('click',() => {
//         LEFT = true
//     })
//     s.addEventListener('click',() => {
//         DOWN = true
//     })
//     d.addEventListener('click',() => {
//         RIGHT = true
//     })
//     UP = false
// }

function keyControl(b) {
    // pressListener()
    canvas.addEventListener('keydown', function(e){
        if(e.key === "a"){
            if (!LEFT) {
                justPressed = true;
            }
            LEFT = true;
            userCommand.LEFT = true;
        }
        if(e.key === "w"){
            if (!UP) {
                justPressed = true;
            }
            UP = true;
            userCommand.UP = true;
        }
        if(e.key === "d"){
            if (!RIGHT) {
                justPressed = true;
            }
            RIGHT = true;
            userCommand.RIGHT = true;
        }
        if(e.key === "s"){
            if (!DOWN) {
                justPressed = true;
            }
            DOWN = true;
            userCommand.DOWN = true;
        }

    });
    
    canvas.addEventListener('keyup', function(e){
        if(e.key === "a"){
            LEFT = false;
            userCommand.LEFT = false;
        }
        if(e.key === "w"){
            UP = false;
            userCommand.UP = false;
        }
        if(e.key === "d"){
            RIGHT = false;
            userCommand.RIGHT = false;
        }
        if(e.key === "s"){
            DOWN = false;
            userCommand.DOWN = false;
        }

    });

    if(LEFT){
        b.x -= b.speed;
    }
    if(UP){
        b.y -= b.speed;
    }
    if(RIGHT){
        b.x += b.speed;
    }
    if(DOWN){
        b.y += b.speed;
    }
}

function emitUpdate(obj) {
    socket.emit("update", {
        x : obj.x,
        y : obj.y,
        r : obj.r
    })
}

function random(min,max) {
    return Math.random() * (max - min) + min;
}


//main loop that runs around 60 times per second
function mainLoop() {
    ctx.clearRect(0, 0, 840, 680);

    BALLS.forEach(b => {
        b.drawBall()
    });
    let food
    FOODS.forEach(b => {
        b.drawFood()
        collision(ball,b)
    });

    // ball.drawBall()
    let tmp_x = ball.x
        tmp_y = ball.y
    keyControl(ball)
    if (tmp_x !== ball.x || tmp_y !== ball.y) {
        emitUpdate(ball)        
    }
    

    gameLogic()
    requestAnimationFrame(mainLoop);
}

var  ball;
ball  = new Ball(random(10,canvas.clientWidth),random(10,canvas.clientHeight),20)

socket.emit("newPlayer", {
    nickname : nickname,
    x : ball.x,
    y : ball.y,
    r : ball.r
})

function gameLogic() {
    if(ball.x < 0 + ball.r){
        ball.x += ball.speed
    }
    if(ball.x > canvas.clientWidth - ball.r){
        ball.x -= ball.speed
    }
    if(ball.y < 0 + ball.r){
        ball.y += ball.speed
    }
    if(ball.y > canvas.clientHeight - ball.r){
        ball.y -= ball.speed
    }
    if(ball.r >= 50){
       ball.r   = 22;
  }
	if(ball.r === 22){
	ball.speed = 10
}
}

function getDistance(x1,y1,x2,y2) {
    let x = x1 - x2
        y = y1 - y2
    return Math.hypot(x,y) 
}
    
function collision(obj1,obj2) {
    let dis = getDistance(
        obj1.x,
        obj1.y,
        obj2.x,
        obj2.y
    )
    if (dis <= 0 + obj2.r + obj1.r) {
        FOODS.splice(0,1)
        obj1.speed -= 0.25
        if (obj1.r < 100) {
            obj1.r += 2
        }
        socket.emit("onCollision",{
            nickname:socket.nickname,
	    obj:obj1
        })
        emitUpdate(obj1)
        // food = new Food(random(10,canvas.clientWidth),random(10,canvas.clientHeight),50,"red")
    }
}



socket.on("updatePlayer", (players) => {
    ctx.clearRect(0, 0, 840, 680);
    let playersFound = {};
    for(let id in players){
        if(clientBalls[id] === undefined && id !== socket.id){
            clientBalls[id] = new Ball(players[id].x,players[id].y,players[id].r)
            clientBalls[id].nickname = players[id].nickname
        }
        playersFound[id] = true

    }
    for(let id in clientBalls){
        if(playersFound[id] === undefined){
            clientBalls[id].remove()
            let index = BALLS.indexOf(id)
            BALLS.splice(index)
            delete clientBalls[id];
        }
    }
})

socket.on('food',(data) => {
    let food = new Food(data.x,data.y,10,"red")
    if(FOODS.length > 1){
        FOODS.splice(0,1)
    }
})

socket.on("updatePos",(data) => {
    for(let id in clientBalls){
        clientBalls[id].x = data[id].x
        clientBalls[id].y = data[id].y
        clientBalls[id].r = data[id].r
    }
})


requestAnimationFrame(mainLoop);
