<?php

class ChatPluginAdmin {
    public function __construct() {
        add_action('admin_menu', [$this, 'adminMenu']);
    }

    public function adminMenu() {
        add_menu_page('Chat Plugin', 'Chat Plugin', 'manage_options', 'chat-plugin', [$this, 'adminPage']);
    }

    public function adminPage() {
        ?>
        <div class="wrap">
            <h1>Chat Plugin</h1>
            <form id="select-room-form">
                <select id="chat-room-select" name="room">
                    <?php
                    global $wpdb;
                    $rooms = $wpdb->get_results("SELECT room_name FROM {$wpdb->prefix}chat_rooms");
                    foreach ($rooms as $room) {
                        echo "<option value='{$room->room_name}'>{$room->room_name}</option>";
                    }
                    ?>
                </select>
                <button type="submit">Selecionar Sala</button>
            </form>
            <div id="chat-container" style="width: 100%; height: 100%; display: flex; flex-direction: column;">
                <div id="listmessage" style="flex: 1; border: 1px solid #ccc; overflow-y: auto; margin-top: 10px; max-height:150px; padding:15px 15px;"></div>
                <div id="chat-reply" style="display: none; flex-direction: column; margin-top: 10px;">
                    <textarea id="reply-message" placeholder="Digite sua mensagem" style="width: 100%; height: 50px;"></textarea>
                    <button id="send-reply" style="background: #0073aa; color: #fff; border: none; padding: 10px 20px; border-radius: 5px;">Enviar</button>
                </div>
            </div>
        </div>
         <!-- Importando o Socket.IO -->
        <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
        <script>
            document.addEventListener('DOMContentLoaded', function () {
                const roomSelect = document.getElementById('chat-room-select');
                const chatMessages = document.getElementById('listmessage');
                const chatReply = document.getElementById('chat-reply');
                const replyMessage = document.getElementById('reply-message');
                const sendReply = document.getElementById('send-reply');

                function getAjaxUrl(action) {
                    const url = new URL(window.location.href);
                    return `${url.origin}/wpchat/wp-admin/admin-ajax.php?action=${action}`;
                }

                let chatRoom = null;
                let socket = null;              
                
                roomSelect.addEventListener('click', function () {
                    // seleciona a sala ao clicar no option pela administração
                    chatRoom = roomSelect.value;
                    loadMessages(chatRoom);

                    // Verifique se o socket já está aberto antes de fechá-lo
                    if (socket && socket.connected) {
                        socket.close();
                    }

                    // Conectando ao servidor com a nova sala selecionada
                    socket = io(`http://localhost:3000`, { query: `room=${chatRoom}` });

                    // Receber e exibir a mensagem do servidor
                    socket.on('message', (data) => {
                        loadMessages(chatRoom);
                    });

                });

   

                sendReply.addEventListener('click', function () {
                    const message = replyMessage.value;
                    
                    // Exibir mensagem no chat localmente antes de enviar
                    appendMessage('Admin', message);
                    replyMessage.value = ''; // Limpa o campo de entrada de mensagem

                    // Enviar a mensagem via AJAX para salvar no servidor
                    fetch(getAjaxUrl('chat_plugin_save_message'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: `room=${chatRoom}&message=${message}&sender=Admin`
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Sala selecionada
                            // Emitir a mensagem para a sala no socket
                            socket.emit('join-room', { room: chatRoom });
                            
                            // Emitir a mensagem para os usuários na sala
                            socket.emit('message', { room: chatRoom, message: message, sender: 'Admin' });

                        } else {
                            console.error('Erro ao enviar a mensagem.');
                            alert('Erro ao enviar a mensagem.');
                        }
                    })
                    .catch(err => {
                        console.error('Erro ao enviar a mensagem.', err);
                        alert('Erro ao enviar a mensagem.');
                    });
                });


                function appendMessage(sender, message) {
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('chat-message');
                    messageElement.innerHTML = `<strong>${sender}</strong>: ${message}`;
                    chatMessages.appendChild(messageElement);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }

                function loadMessages(chatRoom) {
                    fetch(getAjaxUrl('chat_plugin_load_messages'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: `room=${chatRoom}`
                    })
                    .then(response => {                         
                        
                        return response.json();
                    })
                    .then(data => {
                      
                        if (data.success) {
                            chatMessages.innerHTML = '';
                            // Primeiro, junta-se à sala no WebSocket (caso ainda não esteja na sala)
                            socket.emit('join-room', { room: chatRoom });
                            
                            data.data.forEach(msg => {
                                appendMessage(msg.sender, msg.message);
                            });
                            chatReply.style.display = 'flex';
                        } else {
                            console.error('Sala não encontrada.');
                            alert('Sala não encontrada.');
                        }
                       
                    })
                    .catch(err => {
                        console.error('Erro ao carregar as mensagens.', err);
                        alert('Erro ao carregar as mensagens.');
                    });
                }
            });
        </script>
        <?php
    }
}
