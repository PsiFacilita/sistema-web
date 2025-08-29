<?php
declare(strict_types=1);

use Slim\App;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LoginController;

final class Routes
{
    public static function register(App $app): void
    {
        $app->get('/hello-world', [HomeController::class, 'index']);
        $app->post('/auth/login', [LoginController::class, 'login']);
    }
}
