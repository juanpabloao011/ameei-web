<?php
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
  http_response_code(403);
  exit('Acceso no autorizado.');
}

return array(
  'username' => 'ameei_admin',
  'password_salt' => '987f91c5928c4d76c85fc6645b2cb080',
  'password_hash' => '3e35795925f0feea4dd4642d94de642986b7e9e5f97ae97299c0aa485cc88225',
  'password_iterations' => 240000,
);
