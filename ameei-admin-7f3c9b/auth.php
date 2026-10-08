<?php

session_name('ameei_admin_session');
$secureCookie = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_set_cookie_params(0, '/ameei-admin-7f3c9b/', '', $secureCookie, true);
if (session_id() === '') {
  session_start();
}

function ameei_config() {
  return require __DIR__ . '/config.php';
}

function ameei_hex_to_binary($hex) {
  if (function_exists('hex2bin')) {
    return hex2bin($hex);
  }
  return pack('H*', $hex);
}

function ameei_safe_equals($known, $user) {
  if (function_exists('hash_equals')) {
    return hash_equals($known, $user);
  }
  if (strlen($known) !== strlen($user)) return false;
  $result = 0;
  for ($i = 0; $i < strlen($known); $i++) {
    $result |= ord($known[$i]) ^ ord($user[$i]);
  }
  return $result === 0;
}

function ameei_password_hash_value($password, $salt, $iterations) {
  return hash_pbkdf2('sha256', $password, ameei_hex_to_binary($salt), (int) $iterations, 64);
}

function ameei_verify_login($username, $password) {
  $config = ameei_config();
  if (!ameei_safe_equals($config['username'], $username)) return false;
  $hash = ameei_password_hash_value($password, $config['password_salt'], $config['password_iterations']);
  return ameei_safe_equals($config['password_hash'], $hash);
}

function ameei_is_logged_in() {
  return !empty($_SESSION['ameei_admin_authenticated']);
}

function ameei_require_login() {
  if (!ameei_is_logged_in()) {
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array('ok' => false, 'error' => 'Sesion no autorizada.'));
    exit;
  }
}

function ameei_random_hex($bytes) {
  if (function_exists('random_bytes')) {
    return bin2hex(random_bytes($bytes));
  }
  if (function_exists('openssl_random_pseudo_bytes')) {
    return bin2hex(openssl_random_pseudo_bytes($bytes));
  }
  return sha1(uniqid('', true) . mt_rand());
}

function ameei_csrf_token() {
  if (empty($_SESSION['ameei_csrf'])) {
    $_SESSION['ameei_csrf'] = ameei_random_hex(32);
  }
  return $_SESSION['ameei_csrf'];
}

function ameei_check_csrf($token) {
  return is_string($token) && ameei_safe_equals(ameei_csrf_token(), $token);
}

function ameei_save_credentials($username, $password) {
  $username = trim($username);
  if ($username === '' || strlen($username) < 6) {
    throw new RuntimeException('El usuario debe tener al menos 6 caracteres.');
  }
  if (strlen($password) < 14) {
    throw new RuntimeException('La contrasena debe tener al menos 14 caracteres.');
  }

  $salt = ameei_random_hex(16);
  $iterations = 240000;
  $hash = ameei_password_hash_value($password, $salt, $iterations);
  $payload = "<?php\n"
    . "if (isset(\$_SERVER['SCRIPT_FILENAME']) && realpath(\$_SERVER['SCRIPT_FILENAME']) === __FILE__) {\n"
    . "  http_response_code(403);\n"
    . "  exit('Acceso no autorizado.');\n"
    . "}\n\n"
    . "return array(\n"
    . "  'username' => " . var_export($username, true) . ",\n"
    . "  'password_salt' => " . var_export($salt, true) . ",\n"
    . "  'password_hash' => " . var_export($hash, true) . ",\n"
    . "  'password_iterations' => " . $iterations . ",\n"
    . ");\n";
  file_put_contents(__DIR__ . '/config.php', $payload, LOCK_EX);
}
