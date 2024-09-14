<?php
// Arquivo de configuração do chat plugin

return [
    'websocket_url' => 'http://localhost:3000',
    'ajax_url'      => admin_url('admin-ajax.php'),
    'base_url'      => home_url(),
    'socket_io_url' => 'https://cdn.socket.io/4.7.5/socket.io.min.js',  // Adiciona a URL do Socket.io
];
