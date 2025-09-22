<?php
declare(strict_types=1);

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\PatientsController;
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
        $app->post('/auth/2fa/verify', [LoginController::class, 'verify2fa']);
        $app->post('/auth/2fa/resend', [LoginController::class, 'resend2fa']);

        $app->post('/auth/password/forgot', [PasswordResetController::class, 'forgot']);
        $app->get('/auth/password/validate/{token}', [PasswordResetController::class, 'validate']);
        $app->post('/auth/password/reset', [PasswordResetController::class, 'reset']);

        $app->group('/api', function (RouteCollectorProxy $group) {
            $group->get('/dashboard', [DashboardController::class, 'index']);

            $group->get('/patients', [PatientsController::class, 'getPatients']);
        })->add(new AuthMiddleware());
    }
}
