document.addEventListener('DOMContentLoaded', function () {
    // Seleciona os elementos do DOM
    const chatToggle = document.getElementById('chat-toggle');
    const chatBox = document.getElementById('chat-box');
    const chatForm = document.getElementById('chat-form');
    const chatRoomInput = document.getElementById('chat-room');
    const chatMessages = document.getElementById('listmessage');
    const userInfo = document.getElementById('user-info');
    const chatPhone = document.getElementById('chat-phone');
    const chatEmail = document.getElementById('chat-email');

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
    
    // Função para obter a URL do AJAX
    function getAjaxUrl(action) {
        return `${chatPluginConfig.ajax_url}?action=${action}`;
    }

    // Gera um ID de sala de chat aleatório
    function generateRoom() {
        return 'room-' + Math.random().toString(36).substr(2, 9);
    }

    // Função para carregar mensagens via AJAX
    function loadMessages() {
        fetch(getAjaxUrl('chat_plugin_load_messages'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `room=${chatRoom}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                chatMessages.innerHTML = '';
                socket.emit('join-room', { room: chatRoom });
                data.data.forEach(msg => appendMessage(msg.sender, msg.message));
            } else {
                console.error('Sala não encontrada.');
            }
        })
        .catch(err => {
            console.error('Erro ao carregar as mensagens.', err);
        });
    }

    // Função para adicionar uma mensagem ao chat
    function appendMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        messageElement.innerHTML = `<strong>${sender}</strong>: ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll para o fim
    }

    // Função para enviar uma mensagem via AJAX
    function sendMessage(chatRoom, message, sender, email) {
        fetch(getAjaxUrl('chat_plugin_save_message'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `room=${chatRoom}&message=${message}&sender=${sender}&email=${email}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                appendMessage(sender, message);
                chatForm.reset();
                socket.emit('join-room', { room: chatRoom });
                socket.emit('message', { room: chatRoom, message: message, sender: sender });
            } else {
                console.error('Erro ao salvar a mensagem no banco de dados.');
            }
        })
        .catch(err => {
            console.error('Erro ao enviar a mensagem para o servidor.', err);
        });
    }

    // Recupera ou gera o ID da sala de chat
    let chatRoom = localStorage.getItem('chatRoom') || generateRoom();
    localStorage.setItem('chatRoom', chatRoom);
    chatRoomInput.value = chatRoom;

    // Preenche os campos de telefone e e-mail a partir do localStorage
    const storedPhone = localStorage.getItem('chatPhone');
    const storedEmail = localStorage.getItem('chatEmail');
    if (storedPhone && storedEmail) {
        chatPhone.value = storedPhone;
        chatEmail.value = storedEmail;
    }

    // Evento de envio do formulário de chat
    chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(chatForm);
        const message = formData.get('message');
        const phone = formData.get('phone');
        const email = formData.get('email');

        if (!storedPhone || !storedEmail) {
            localStorage.setItem('chatPhone', phone);
            localStorage.setItem('chatEmail', email);
        }
        sendMessage(chatRoom, message, 'User', email);
    });

    // Inicializa o WebSocket e o carregamento de mensagens
    let socket = io(`${chatPluginConfig.websocket_url}`, { query: `room=${chatRoom}` });
    socket.on('message', function (data) {
        if (data.room === chatRoom) {
            appendMessage(data.sender, data.message);
        }
    });

    loadMessages();
});
