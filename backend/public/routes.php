<?php
declare(strict_types=1);

use App\Http\Controllers\DashboardController;
use App\Http\Middleware\AuthMiddleware;
use Slim\App;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LoginController;
use Slim\Routing\RouteCollectorProxy;

final class Routes
{
    public static function register(App $app): void
    {
        $app->get('/hello-world', [HomeController::class, 'index']);

        $app->get('/auth/me', [LoginController::class, 'me']);
        $app->post('/auth/login', [LoginController::class, 'login']);

        $app->group('/api', function (RouteCollectorProxy $group) {
            $group->get('/dashboard', [DashboardController::class, 'index']);

        })->add(new AuthMiddleware());
    }
}
