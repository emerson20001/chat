<?php

class ChatPluginAjax {
    public function __construct() {
        add_action('wp_ajax_chat_plugin_save_message', [$this, 'saveMessage']);
        add_action('wp_ajax_nopriv_chat_plugin_save_message', [$this, 'saveMessage']);
        add_action('wp_ajax_chat_plugin_load_messages', [$this, 'loadMessages']);
        add_action('wp_ajax_nopriv_chat_plugin_load_messages', [$this, 'loadMessages']);
    }

    

    public function saveMessage() {
        global $wpdb;

        // Sanitização dos campos recebidos
        $room = sanitize_text_field($_POST['room']);
        $message = sanitize_textarea_field($_POST['message']);
        $sender = sanitize_text_field($_POST['sender']);
        $email = sanitize_email($_POST['email']);
        $phone = sanitize_text_field($_POST['phone']);

        // Verifica se a sala já existe
        $room_id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}chat_rooms WHERE room_name = %s",
            $room
        ));

        // Se a sala não for encontrada, cria a sala no banco de dados
        if (!$room_id) {
            $wpdb->insert("{$wpdb->prefix}chat_rooms", [
                'room_name' => $room
            ]);
            $room_id = $wpdb->insert_id; // Recupera o ID da nova sala inserida
        }

        // Verifica se o usuário já existe pelo e-mail
        $user_id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}chat_users WHERE email = %s",
            $email
        ));

        // Se o usuário não existir, insere no banco de dados
        if (!$user_id) {
            $wpdb->insert("{$wpdb->prefix}chat_users", [
                'phone' => $phone,
                'email' => $email
            ]);
            $user_id = $wpdb->insert_id;
        }

        // Faz a requisição externa para enviar a mensagem
     
                $wpdb->insert(
                    "{$wpdb->prefix}chat_messages",
                    [
                        'chat_room_id' => $room_id,
                        'chat_user_id' => $user_id,
                        'message' => $message,
                        'sender' => $sender
                    ]
                );
                wp_send_json_success($room);
           
    }


    public function loadMessages() {
        global $wpdb;

        $room = sanitize_text_field($_POST['room']);

        $room_id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}chat_rooms WHERE room_name = %s",
            $room
        ));

        if ($room_id) {
            $messages = $wpdb->get_results($wpdb->prepare(
                "SELECT message, sender, created_at FROM {$wpdb->prefix}chat_messages WHERE chat_room_id = %d ORDER BY created_at ASC",
                $room_id
            ));

            wp_send_json_success($messages);
        } else {
            wp_send_json_error('Room not found.');
        }
    }
}
