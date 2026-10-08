<?php
require __DIR__ . '/auth.php';
header('X-Robots-Tag: noindex, nofollow, noarchive');

if (isset($_GET['logout'])) {
  $_SESSION = array();
  session_destroy();
  header('Location: /');
  exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $postedCsrf = isset($_POST['csrf']) ? $_POST['csrf'] : null;
  $postedUser = isset($_POST['username']) ? (string) $_POST['username'] : '';
  $postedPassword = isset($_POST['password']) ? (string) $_POST['password'] : '';
  if (!ameei_check_csrf($postedCsrf)) {
    $error = 'Sesion vencida. Intenta de nuevo.';
  } elseif (ameei_verify_login($postedUser, $postedPassword)) {
    $_SESSION['ameei_admin_authenticated'] = true;
    session_regenerate_id(true);
    header('Location: /ameei-admin-7f3c9b/');
    exit;
  } else {
    $error = 'Usuario o contrasena incorrectos.';
  }
}

if (!ameei_is_logged_in()) {
  $csrf = htmlspecialchars(ameei_csrf_token(), ENT_QUOTES, 'UTF-8');
  $errorHtml = $error ? '<p class="login-error">' . htmlspecialchars($error, ENT_QUOTES, 'UTF-8') . '</p>' : '';
  echo <<<HTML
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Acceso privado AMEEI</title>
    <link rel="stylesheet" href="/assets/css/styles.css?v=20260714-admin-final2">
  </head>
  <body class="admin-login-body">
    <main class="admin-login-card">
      <img src="/assets/images/logo-ameei-transparente.png" alt="AMEEI">
      <h1>Administrador privado</h1>
      <p>Acceso protegido para actualizar el contenido del sitio publico.</p>
      {$errorHtml}
      <form method="post">
        <input type="hidden" name="csrf" value="{$csrf}">
        <label>Usuario<input name="username" autocomplete="username" required></label>
        <label>Contrasena<input name="password" type="password" autocomplete="current-password" required></label>
        <button class="button" type="submit">Entrar</button>
      </form>
    </main>
  </body>
</html>
HTML;
  exit;
}

$csrf = json_encode(ameei_csrf_token());
$html = file_get_contents(__DIR__ . '/../editor-ameei-interno-2026.html');
$html = str_replace(
  '<body class="admin-body">',
  '<body class="admin-body"><script>window.AMEEI_CMS_API="/ameei-admin-7f3c9b/api.php";window.AMEEI_CMS_CSRF=' . $csrf . ';</script>',
  $html
);
$html = str_replace(
  'Este editor solo funciona desde el administrador protegido.',
  'Administrador protegido. Al presionar Guardar, los cambios se publican en el sitio publico. Usa Seguridad para cambiar usuario o contrasena cuando una persona deje de administrar la pagina.',
  $html
);
$html = str_replace(
  '<button class="danger-button" data-reset>Restaurar</button>',
  '<button class="danger-button" data-reset>Restaurar</button><a class="admin-link-button" href="/ameei-admin-7f3c9b/seguridad.php">Seguridad</a><a class="admin-link-button" href="/ameei-admin-7f3c9b/?logout=1">Salir</a>',
  $html
);
echo $html;
