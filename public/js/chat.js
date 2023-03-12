class Chat {
    constructor(socket) {
        this.socket = socket
    }
}
Chat.prototype.sendMessage = function (room, text) {
    this.socket.emit('message', {
        room,
        text
    })
}
Chat.prototype.changeRoom = function (room) {
    this.socket.emit('join', {
        newRoom: room
    })
}
Chat.prototype.processCommand = function (commands) {
    const words = commands.split(/\s+/)
    let message = false;
    const command = words.shift();
    const leftWords = words.join(' ');
    switch (command.toLowerCase()) {
        case '/join':
            this.changeRoom(leftWords)
            break;
        case '/nick':
            this.socket.emit('nameAttempt', leftWords)
            break;
        default:
            message = 'Unrecognized command.'
    }
    return message
}
export default Chat;