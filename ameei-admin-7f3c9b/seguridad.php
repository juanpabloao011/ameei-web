<?php
require __DIR__ . '/auth.php';
header('X-Robots-Tag: noindex, nofollow, noarchive');

if (!ameei_is_logged_in()) {
  header('Location: /ameei-admin-7f3c9b/');
  exit;
}

$message = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  try {
    $postedCsrf = isset($_POST['csrf']) ? $_POST['csrf'] : null;
    if (!ameei_check_csrf($postedCsrf)) {
      throw new RuntimeException('Sesion vencida. Intenta de nuevo.');
    }
    $password = isset($_POST['password']) ? (string) $_POST['password'] : '';
    $confirm = isset($_POST['confirm']) ? (string) $_POST['confirm'] : '';
    if ($password !== $confirm) {
      throw new RuntimeException('Las contrasenas no coinciden.');
    }
    $username = isset($_POST['username']) ? (string) $_POST['username'] : '';
    ameei_save_credentials($username, $password);
    $message = 'Acceso actualizado correctamente.';
  } catch (Exception $exception) {
    $error = $exception->getMessage();
  }
}

$config = ameei_config();
$csrf = htmlspecialchars(ameei_csrf_token(), ENT_QUOTES, 'UTF-8');
$username = htmlspecialchars($config['username'], ENT_QUOTES, 'UTF-8');
$messageHtml = $message ? '<p class="login-success">' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</p>' : '';
$errorHtml = $error ? '<p class="login-error">' . htmlspecialchars($error, ENT_QUOTES, 'UTF-8') . '</p>' : '';

echo <<<HTML
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Seguridad | Administrador AMEEI</title>
    <link rel="stylesheet" href="/assets/css/styles.css?v=20260714-admin-final2">
  </head>
  <body class="admin-login-body">
    <main class="admin-login-card">
      <img src="/assets/images/logo-ameei-transparente.png" alt="AMEEI">
      <h1>Seguridad del administrador</h1>
      <p>Cambia el usuario y contrasena cuando necesites retirar o renovar accesos.</p>
      {$messageHtml}{$errorHtml}
      <form method="post">
        <input type="hidden" name="csrf" value="{$csrf}">
        <label>Usuario<input name="username" value="{$username}" autocomplete="username" required></label>
        <label>Nueva contrasena<input name="password" type="password" autocomplete="new-password" required></label>
        <label>Confirmar contrasena<input name="confirm" type="password" autocomplete="new-password" required></label>
        <button class="button" type="submit">Actualizar acceso</button>
      </form>
      <a class="admin-back-link" href="/ameei-admin-7f3c9b/">Volver al editor</a>
    </main>
  </body>
</html>
HTML;
