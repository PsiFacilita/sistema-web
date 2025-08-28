<?php
declare(strict_types=1);

use Slim\Factory\AppFactory;
use Symfony\Component\Dotenv\Dotenv;

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/routes.php';

$envPath = dirname(__DIR__) . '/.env';
if (is_file($envPath)) {
    (new Dotenv())->load($envPath);
}

$app = AppFactory::create();
$app->addRoutingMiddleware();
$app->addErrorMiddleware(
    filter_var($_ENV['APP_DEBUG'] ?? true, FILTER_VALIDATE_BOOL),
    true,
    true
);

Routes::register($app);

$app->run();
