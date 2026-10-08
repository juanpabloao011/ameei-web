<?php
require __DIR__ . '/auth.php';
ameei_require_login();
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow, noarchive');

$contentPath = __DIR__ . '/../assets/js/content-data.js';
$contentFile = realpath($contentPath);
if (!$contentFile) {
  http_response_code(500);
  echo json_encode(array('ok' => false, 'error' => 'No se encontro el archivo de contenido.'));
  exit;
}

function ameei_read_content($file) {
  $raw = file_get_contents($file);
  if (!preg_match('/window\.AMEEI_CONTENT\s*=\s*(\{.*\});\s*$/s', $raw, $matches)) {
    throw new RuntimeException('El archivo de contenido no tiene el formato esperado.');
  }
  $content = json_decode($matches[1], true);
  if (!is_array($content)) {
    throw new RuntimeException('No se pudo leer el contenido actual.');
  }
  return $content;
}

function ameei_write_content($file, $content) {
  $backupDir = __DIR__ . '/backups';
  if (!is_dir($backupDir)) mkdir($backupDir, 0755, true);
  @copy($file, $backupDir . '/content-data-' . date('Ymd-His') . '.js');
  $payload = 'window.AMEEI_CONTENT = ' . json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ";\n";
  file_put_contents($file, $payload, LOCK_EX);
}

try {
  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(array('ok' => true, 'csrf' => ameei_csrf_token(), 'content' => ameei_read_content($contentFile)), JSON_UNESCAPED_UNICODE);
    exit;
  }

  $input = json_decode(file_get_contents('php://input'), true);
  $token = is_array($input) && isset($input['csrf']) ? $input['csrf'] : null;
  if (!is_array($input) || !ameei_check_csrf($token)) {
    http_response_code(403);
    echo json_encode(array('ok' => false, 'error' => 'Solicitud no autorizada.'));
    exit;
  }

  $action = isset($input['action']) ? $input['action'] : '';
  if ($action === 'save') {
    if (!isset($input['content']) || !is_array($input['content'])) {
      throw new RuntimeException('Contenido invalido.');
    }
    ameei_write_content($contentFile, $input['content']);
    echo json_encode(array('ok' => true, 'csrf' => ameei_csrf_token()));
    exit;
  }

  http_response_code(400);
  echo json_encode(array('ok' => false, 'error' => 'Accion no reconocida.'));
} catch (Exception $error) {
  http_response_code(500);
  echo json_encode(array('ok' => false, 'error' => $error->getMessage()));
}
