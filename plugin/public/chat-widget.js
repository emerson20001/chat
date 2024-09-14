document.addEventListener('DOMContentLoaded', function () {
    const chatToggle = document.getElementById('chat-toggle');
    const chatBox = document.getElementById('chat-box');
    const chatForm = document.getElementById('chat-form');
    const chatRoomInput = document.getElementById('chat-room');
    const chatMessages = document.getElementById('listmessage');
    const userInfo = document.getElementById('user-info');
    const chatPhone = document.getElementById('chat-phone');
    const chatEmail = document.getElementById('chat-email');

    function getAjaxUrl(action) {
        const url = new URL(window.location.href);
        return `${url.origin}/wpchat/wp-admin/admin-ajax.php?action=${action}`;
    }

    function generateRoom() {
        return 'room-' + Math.random().toString(36).substr(2, 9);
    }

    let chatRoom = localStorage.getItem('chatRoom');
    
    if (!chatRoom || chatRoom === null) {
        chatRoom = generateRoom();
        localStorage.setItem('chatRoom', chatRoom);
    }
    
    chatRoomInput.value = chatRoom;

    const storedPhone = localStorage.getItem('chatPhone');
    const storedEmail = localStorage.getItem('chatEmail');

    if (storedPhone && storedEmail) {
        chatPhone.value = storedPhone;
        chatEmail.value = storedEmail;
       // userInfo.style.display = 'none';
    }

    let socket;

    loadMessages();

    /*
    chatToggle.addEventListener('click', function () {
        chatBox.style.display = chatBox.style.display === 'none' ? 'block' : 'none';
        loadMessages();
        if (socket) {
            socket.close();
        }
        socket = io(`http://localhost:3000`, { query: `room=${chatRoom}` });
        socket.on('message', function (data) {
            if (data.room === chatRoom) {
                appendMessage(data.sender, data.message);
                alert('Nova mensagem recebida!');
            }
        });
    });
    */

    chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        // pega os dados enviados do fornm do chat
        const formData = new FormData(chatForm);
        const message = formData.get('message');
        const phone = formData.get('phone');
        const email = formData.get('email');
        let chatRoom = localStorage.getItem('chatRoom');

        if (!storedPhone || !storedEmail) {
            // seta em localstorage os dados enviados do fornm do chat
            localStorage.setItem('chatPhone', phone);
            localStorage.setItem('chatEmail', email);
            sendMessage(chatRoom, message, 'User', email);
                
        } else {
            sendMessage(chatRoom, message, 'User', email);
        }
    });

    function appendMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        messageElement.innerHTML = `<strong>${sender}</strong>: ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
    }

    function sendMessage(chatRoom, message, sender, email) {
        // Primeiro salva no banco do WordPress
        fetch(getAjaxUrl('chat_plugin_save_message'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `room=${chatRoom}&message=${message}&sender=${sender}&email=${email}`
        })
        .then(response => {
        return response.json();
        })
        .then(data => {
            if (data.success) {
                // Adiciona a mensagem localmente no chat
                appendMessage(sender, message);

                // Reseta o formulário de chat e esconde informações do usuário
                chatForm.reset();
                // userInfo.style.display = 'none';

                // Primeiro, junta-se à sala no WebSocket (caso ainda não esteja na sala)
                socket.emit('join-room', { room: chatRoom });

                // Emite a mensagem para os participantes da sala via WebSocket
                socket.emit('message', { room: chatRoom, message: message, sender: sender });

            } else {
                console.error('Erro ao salvar a mensagem no banco de dados.');
                alert('Erro ao enviar a mensagem para o banco de dados.');
            }
        })
        .catch(err => {
            console.error('Erro ao enviar a mensagem para o servidor.', err);
            alert('Erro ao enviar a mensagem para o servidor.');
        });
    }


    function loadMessages() {
        fetch(getAjaxUrl('chat_plugin_load_messages'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `room=${chatRoom}`
        }).then(response => response.json())
        .then(data => {
            if (data.success) {
                chatMessages.innerHTML = '';
                 // Primeiro, junta-se à sala no WebSocket (caso ainda não esteja na sala)
                socket.emit('join-room', { room: chatRoom });
                data.data.forEach(msg => {
                    appendMessage(msg.sender, msg.message);
                });
               
            } else {
                console.error('Sala não encontrada.');
                alert('Sala não encontrada.');
            }
        }).catch(err => {
            console.error('Erro ao carregar as mensagens.', err);
            alert('Erro ao carregar as mensagens.');
        });
    }
    
    socket = io(`http://localhost:3000`, { query: `room=${chatRoom}` });
    socket.on('message', function (data) {
        console.log("Nova mensagem recebida!");
        if (data.room === chatRoom) {
            appendMessage(data.sender, data.message);
        }
    });

});
