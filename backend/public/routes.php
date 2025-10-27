<?php
declare(strict_types=1);

use App\Http\Controllers\AppointmentsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentsController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\PatientsController;
use App\Http\Middleware\AuthMiddleware;
use App\Http\Middleware\RateLimitMiddleware;
use Slim\App;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LoginController;
use Slim\Routing\RouteCollectorProxy;

final class Routes
{
    public static function register(App $app): void
    {
        $app->get('/hello-world', [HomeController::class, 'index']);

        // Aplicando rate limiting apenas em rotas de autenticação
        $rateLimitMiddleware = new RateLimitMiddleware(
            maxAttempts: 5,
            decaySeconds: 60,
            storagePath: __DIR__ . '/../storage/rate_limit'
        );
        
        // Rotas de autenticação com rate limiting
        $app->get('/auth/me', [LoginController::class, 'me'])->add($rateLimitMiddleware);
        $app->post('/auth/login', [LoginController::class, 'login'])->add($rateLimitMiddleware);
        $app->post('/auth/logout', [LoginController::class, 'logout']);
        $app->post('/auth/2fa/verify', [LoginController::class, 'verify2fa'])->add($rateLimitMiddleware);
        $app->post('/auth/2fa/resend', [LoginController::class, 'resend2fa'])->add($rateLimitMiddleware);

        $app->post('/auth/password/forgot', [PasswordResetController::class, 'forgot'])->add($rateLimitMiddleware);
        $app->get('/auth/password/validate/{token}', [PasswordResetController::class, 'validate']);
        $app->post('/auth/password/reset', [PasswordResetController::class, 'reset'])->add($rateLimitMiddleware);

        $app->group('/api', function (RouteCollectorProxy $group) {
            $group->get('/dashboard', [DashboardController::class, 'index']);

            // Rotas novas (para API/chatbot)
            $group->get('/patients/by-phone/{phone}', [PatientsController::class, 'findByPhone']);

            $group->get('/appointments/availability', [AppointmentsController::class, 'availability']);
            $group->get('/appointments', [AppointmentsController::class, 'index']);
            $group->get('/appointments/{id: [0-9]+}', [AppointmentsController::class, 'show']);
            $group->post('/appointments', [AppointmentsController::class, 'create']);
            $group->put('/appointments/{id}', [AppointmentsController::class, 'update']);
            $group->delete('/appointments/{id}', [AppointmentsController::class, 'delete']);
            

            $group->get('/patients', [PatientsController::class, 'listarPacientes']);
            $group->get('/patients/{id}', [PatientsController::class, 'buscarPaciente']);
            $group->post('/patients', [PatientsController::class, 'criarPaciente']);
            $group->put('/patients/{id}', [PatientsController::class, 'editarPaciente']);

            // Rotas de Documentos
            $group->get('/documents', [DocumentsController::class, 'index']);
            $group->get('/documents/{id:[0-9]+}', [DocumentsController::class, 'show']);
            $group->post('/documents', [DocumentsController::class, 'create']);
            $group->put('/documents/{id:[0-9]+}', [DocumentsController::class, 'update']);
            $group->delete('/documents/{id:[0-9]+}', [DocumentsController::class, 'delete']);
        })->add(new AuthMiddleware());
    }
}
