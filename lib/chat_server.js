import { Server } from 'socket.io';
let guestNumber = 1;
let nickNames = {};
const namesUsed = [];
const currentRoom = {};
let ioServer
export const listen = (server) => {
    ioServer = new Server();
    ioServer.listen(server);
    // io.set('log level', 1);
    ioServer.sockets.on('connection', (socket) => {
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
        joinRoom(socket, 'Lobby');
        handleMessageBroadacasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);
        socket.on('rooms', () => {
            socket.emit('rooms', [...new Set(Object.values(currentRoom))]);
        })
        handleClientDisconnection(socket, nickNames, namesUsed)
    })
    return ioServer
}
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    const name = `Guest${guestNumber}`;
    nickNames[socket.id] = name;
    socket.emit('nameResult', {
        success: true,
        name
    })
    namesUsed.push(name);
    return guestNumber + 1;
}
//加入房间
function joinRoom(socket, room) {
    ioServer.in(socket.id).socketsJoin(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', { room });
    ioServer.to(room).emit('message', {
        text: `${nickNames[socket.id]} has joined ${room}.`
    });
    // const usersInRoom = socket.socketsJoin(room);
    // if (usersInRoom.length > 0) {
    // const usersInRoomSummary = `Users currently in ${room} :${usersInRoom.filter(({ id }) => id != socket.id).map(({ id }) => nickNames[id]).join(',')
    //     }.`
    const usersInRoomSummary = `Users currently in ${room}`
    socket.emit('message', {
        text: usersInRoomSummary
    })
    // }
}

//更改名称
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', (name) => {
        if (name.indexOf('Guest') == 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Names cannot begin with "Guest".'
            })
        } else {
            if (!namesUsed.includes(name)) {
                const previousName = nickNames[socket.id];
                const previousNameIndex = namesUsed.findIndex(item => item == previousName)
                namesUsed.push(name)
                nickNames[socket.id] = name;
                namesUsed.splice(previousNameIndex, 1);
                socket.emit('nameResult', {
                    success: true,
                    name
                })
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: `${previousName} is now known as ${name}.`
                })
            } else {
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already in use.'
                })
            }
        }
    })
}

//发送聊天信息
function handleMessageBroadacasting(socket) {
    socket.on('message', (message) => {
        socket.to(currentRoom[socket.id]).emit('message', {
            text: `${nickNames[socket.id]}: ${message.text}`
        })
    })
}

//创建房间
function handleRoomJoining(socket) {
    socket.on('join', (room) => {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    })

}

//用户离开
function handleClientDisconnection(socket) {
    socket.on('disconnect', () => {
        const nameIndex = namesUsed.findIndex(name => nickNames[socket.id])
        namesUsed.splice(nameIndex, 1);
        delete nickNames[socket.id]
    })
}