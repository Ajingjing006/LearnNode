import Chat from './chat.js';
const socket = io.connect();
function divEscapedContentElement(message) {
    const divNode = getNewDom('div');
    divNode.className = 'es';
    divNode.textContent = message;
    return divNode
}
function getNewDom(nodeName) {
    return document.createElement(nodeName);
}
function divSystemContentElement(message) {
    const divNode = getNewDom('div');
    divNode.className = 'sys';
    divNode.innerHTML = message;
    return divNode;
}

function processUserInput(chatApp) {
    const message = document.querySelector('#send-message').value || '';
    document.querySelector('#send-message').value = '';
    let systemMessage;
    if (message.startsWith('/')) {
        systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            document.querySelector('#messages').appendChild(divSystemContentElement(systemMessage))
        }
    } else {
        chatApp.sendMessage(document.querySelector('#room').value, message);
        const newMessageNode = divEscapedContentElement(message)
        document.querySelector('#messages').appendChild(newMessageNode);
        newMessageNode.scrollIntoView();
    }
}

var chatApp = new Chat(socket);
socket.on('nameResult', (result) => {
    let message;
    if (result.success) {
        message = `You are know known as ${result.name}.`
    } else {
        message = result.message;
    }
    document.querySelector('#messages').appendChild(divSystemContentElement(message))
})

socket.on('joinResult', (result) => {
    document.querySelector('#room').textContent = result.room;
    document.querySelector('#messages').appendChild(divEscapedContentElement('Room changed.'))
})

socket.on('message', (message) => {
    document.querySelector('#messages').appendChild(divEscapedContentElement(message.text))
})

socket.on('rooms', (rooms) => {
    document.querySelector('#room-list').innerHTML = rooms?.map(room => `<div>${room}</div>`);
    Array.from(document.querySelectorAll('#room-list div')).forEach(rooNode => {
        rooNode.addEventListener('click', () => {
            chatApp.processCommand(`/join ${rooNode.textContent}`);
            document.querySelector('#send-message').focus();
        })
    })
})

function loopCheck(timePrev) {
    requestAnimationFrame((currentTime) => {
        if (!timePrev || currentTime - timePrev > 1000) {
            timePrev = currentTime;
            socket.emit('rooms');
        }
        loopCheck(timePrev)
    })
}
loopCheck();
document.querySelector('#send-btn').addEventListener('click', function (e) {
    processUserInput(chatApp);
    return;
})
