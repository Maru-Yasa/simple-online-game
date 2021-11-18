const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server)
const path = require('path')

app.use(express.static('static'))

app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname+'/static/index.html'));
})


app.use("*" , (req,res) => {
    res.send('<h1>404</h1>')
})

var  clients = {};
const canvasWidth =  360;
const canvasHeight = 480;
var clientsScore = {};
var clientCount = 0;
io.on('connection', (socket) => {

    io.emit("updatePlayer",clients)

    io.emit("food",{
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight
    })

    // io.emit("updateScore", clientsScore)

    socket.on('setNickname',(data) => {
        socket.nickname = data
        clientsScore[socket.nickname] = 0;
        clientCount++;
    })

    
    socket.on("onCollision",(data) => {
        io.emit("food",{
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight
        })
        clientsScore[socket.nickname] += 1
        io.emit("updateScore", clientsScore)

    })

    socket.on("newPlayer", (player) => {
        clients[socket.id] = player;
        io.emit("updatePlayer",clients)
    })

    socket.on("update",(data) => {
        clients[socket.id] = data;
        clients[socket.id].nickname = socket.nickname
        io.emit("updatePos", clients)
    })

    socket.on("disconnect",() => {
        delete clients[socket.id];
        io.emit("updatePlayer",clients)
        delete clientsScore[socket.nickname]
        clientCount--;
    })

})


server.listen(3000,() => {
    console.log('server ok');
})
