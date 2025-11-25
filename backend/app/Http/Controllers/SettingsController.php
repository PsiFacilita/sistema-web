<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\Controller;
use App\Models\Configuration;
use App\Models\User;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class SettingsController extends Controller
{
    private User $usuario;
    private Configuration $config;

    public function __construct()
    {
        $this->usuario = new User();
        $this->config = new Configuration();
    }

    public function index(Request $request, Response $response): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        if (!$userId) return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);
        try {
            $profile = $this->usuario->getProfile($userId);
            $collabs = $this->usuario->listSecretarias($userId);
            $schedule = $this->config->getAggregated($userId);
            return $this->json($response, [
                'sucesso' => true,
                'profile' => $profile,
                'collaborators' => $collabs,
                'schedule' => $schedule
            ]);
        } catch (\Throwable $e) {
            return $this->json($response, ['erro' => 'Erro ao carregar configurações'], 500);
        }
    }

    public function updateProfile(Request $request, Response $response): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        if (!$userId) return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);
        $data = $request->getParsedBody() ?? [];
        $nome = trim((string)($data['name'] ?? ''));
        $email = trim((string)($data['email'] ?? ''));
        $telefone = trim((string)($data['phone'] ?? ''));
        $crp = isset($data['crp']) ? trim((string)$data['crp']) : null;
        if ($nome === '' || $email === '') return $this->json($response, ['erro' => 'Nome e email são obrigatórios'], 422);
        try {
            $this->usuario->updateProfile($userId, $nome, $email, $telefone, $crp);
            $profile = $this->usuario->getProfile($userId);
            return $this->json($response, ['sucesso' => true, 'profile' => $profile]);
        } catch (\Throwable $e) {
            return $this->json($response, ['erro' => 'Erro ao atualizar perfil: '.$e->getMessage()], 400);
        }
    }

    public function listCollaborators(Request $request, Response $response): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        if (!$userId) return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);
        try {
            $collabs = $this->usuario->listSecretarias($userId);
            return $this->json($response, ['sucesso' => true, 'collaborators' => $collabs]);
        } catch (\Throwable $e) {
            return $this->json($response, ['erro' => 'Erro ao listar colaboradores'], 500);
        }
    }

    public function addCollaborator(Request $request, Response $response): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        if (!$userId) return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);
        $data = $request->getParsedBody() ?? [];
        $nome = trim((string)($data['name'] ?? ''));
        $email = trim((string)($data['email'] ?? ''));
        $telefone = trim((string)($data['phone'] ?? ''));
        $senha = (string)($data['password'] ?? '');
        if ($nome === '' || $email === '' || $senha === '') return $this->json($response, ['erro' => 'Nome, email e senha são obrigatórios'], 422);
        try {
            $collabId = $this->usuario->createOrAttachSecretaria($userId, $nome, $email, $telefone, $senha);
            $collabs = $this->usuario->listSecretarias($userId);
            return $this->json($response, ['sucesso' => true, 'collaborator_id' => $collabId, 'collaborators' => $collabs], 201);
        } catch (\Throwable $e) {
            return $this->json($response, ['erro' => 'Erro ao adicionar colaborador: '.$e->getMessage()], 400);
        }
    }

    public function updateCollaborator(Request $request, Response $response, array $args): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        if (!$userId) return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);

        $collabId = (int)($args['id'] ?? 0);
        if ($collabId <= 0) return $this->json($response, ['erro' => 'ID inválido'], 422);

        $data = $request->getParsedBody() ?? [];
        $nome = trim((string)($data['name'] ?? ''));
        $email = trim((string)($data['email'] ?? ''));
        $telefone = trim((string)($data['phone'] ?? ''));
        $cargo = trim((string)($data['role'] ?? 'secretaria'));

        if ($nome === '' || $email === '') {
            return $this->json($response, ['erro' => 'Nome e email são obrigatórios'], 422);
        }

        try {
            $this->usuario->updateSecretaria($collabId, $nome, $email, $telefone, $cargo);
            $collabs = $this->usuario->listSecretarias($userId);
            return $this->json($response, ['sucesso' => true, 'collaborators' => $collabs]);
        } catch (\Throwable $e) {
            return $this->json($response, ['erro' => 'Erro ao atualizar colaborador: ' . $e->getMessage()], 400);
        }
    }


    public function removeCollaborator(Request $request, Response $response, array $args): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        if (!$userId) return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);
        $collabId = (int)($args['id'] ?? 0);
        if ($collabId <= 0) return $this->json($response, ['erro' => 'ID inválido'], 422);
        try {
            $this->usuario->detachSecretaria($userId, $collabId);
            $collabs = $this->usuario->listSecretarias($userId);
            return $this->json($response, ['sucesso' => true, 'collaborators' => $collabs]);
        } catch (\Throwable $e) {
            return $this->json($response, ['erro' => 'Erro ao remover colaborador'], 400);
        }
    }

    public function getSchedule(Request $request, Response $response): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        if (!$userId) return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);
        try {
            $schedule = $this->config->getAggregated($userId);
            return $this->json($response, ['sucesso' => true, 'schedule' => $schedule]);
        } catch (\Throwable $e) {
            return $this->json($response, ['erro' => 'Erro ao carregar horários'], 500);
        }
    }

    public function saveSchedule(Request $request, Response $response): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        if (!$userId) return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);
        $data = $request->getParsedBody() ?? [];
        $schedule = $data['schedule'] ?? [];
        $exceptions = $data['exceptions'] ?? [];
        try {
            $this->config->saveSchedule($userId, $schedule, $exceptions);
            $newSchedule = $this->config->getAggregated($userId);
            return $this->json($response, ['sucesso' => true, 'schedule' => $newSchedule]);
        } catch (\Throwable $e) {
            return $this->json($response, ['erro' => 'Erro ao salvar horários: '.$e->getMessage()], 400);
        }
    }
}
