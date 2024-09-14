<?php

class ChatPluginWidget {
    public function __construct() {
        add_action('wp_enqueue_scripts', [$this, 'enqueueScripts']);
        add_action('wp_footer', [$this, 'displayWidget']);
    }

    // Enfileirar os scripts e estilos necessários
    public function enqueueScripts() {
        // Carregar configurações do arquivo config.php
        $config = include plugin_dir_path(__FILE__) . '../includes/Config.php';
        
        // Enfileirar o CSS do widget
        wp_enqueue_style('chat-widget', plugin_dir_url(__FILE__) . 'chat-widget.css');

        // Enfileirar o script do Socket.io
        wp_enqueue_script('socket-io', $config['socket_io_url'], [], null, true);

        // Enfileirar o script do chat widget
        wp_enqueue_script('chat-widget-js', plugin_dir_url(__FILE__) . 'chat-widget.js', ['socket-io'], false, true);

        // Passar as configurações para o JavaScript
        wp_localize_script('chat-widget-js', 'chatPluginConfig', [
            'base_url'      => $config['base_url'],
            'ajax_url'      => $config['ajax_url'],
            'websocket_url' => $config['websocket_url'],
        ]);
    }

    // Exibir o widget no rodapé do site
    public function displayWidget() {
        ?>
        <div id="chat-widget" class="chat-widget">
            <button id="chat-toggle" class="chat-toggle">Chat</button>
            <div id="chat-box" class="chat-box">
                <div id="listmessage" class="chat-messages"></div>
                <form id="chat-form" class="chat-form">
                    <input type="hidden" id="chat-room" name="room">
                    <div id="user-info">
                        <input type="text" id="chat-phone" name="phone" placeholder="Telefone" required class="chat-input">
                        <input type="email" id="chat-email" name="email" placeholder="Email" required class="chat-input">
                    </div>
                    <textarea id="chat-message" name="message" placeholder="Sua mensagem" required class="chat-input"></textarea>
                    <button type="submit" class="chat-submit">Enviar</button>
                </form>
            </div>
        </div>
        <?php
    }
}
