<?php

namespace App\Http\Controllers;

use App\Config\Controller;
use App\Models\Patient;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class PatientsController extends Controller
{
    private Patient $patient;

    public function __construct()
    {
        $this->patient = new Patient();
    }

    // 1. LISTAR todos os pacientes
    public function listarPacientes(Request $request, Response $response): Response
    {
        // Pega o ID do usuário logado
        $userId = $this->resolveAuthenticatedUserId($request);
        
        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não logado'], 401);
        }

        // Busca os pacientes no banco
        $pacientes = $this->patient->buscarPorUsuario($userId);

        return $this->json($response, [
            'sucesso' => true,
            'patients' => $pacientes
        ]);
    }

    // 2. BUSCAR um paciente específico
    public function buscarPaciente(Request $request, Response $response, array $args): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        $pacienteId = (int)$args['id'];

        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não logado'], 401);
        }

        $paciente = $this->patient->buscarPorId($pacienteId, $userId);

        if (!$paciente) {
            return $this->json($response, ['erro' => 'Paciente não encontrado'], 404);
        }

        // Mapear para o formato esperado pelo frontend
        $dadosPaciente = [
            'id' => (string)$paciente['id'],
            'name' => $paciente['nome'],
            'cpf' => $paciente['cpf'] ?? '',
            'rg' => $paciente['rg'] ?? '',
            'birthDate' => $paciente['data_nascimento'] ?? '',
            'email' => $paciente['email'] ?? '',
            'phone' => $paciente['telefone'] ?? '',
            'notes' => $paciente['notas'] ?? '',
            'status' => $paciente['ativo'],
            'customFields' => []
        ];

        return $this->json($response, $dadosPaciente);
    }

    // 3. CRIAR novo paciente
    public function criarPaciente(Request $request, Response $response): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        $dados = $request->getParsedBody();

        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não logado'], 401);
        }

        // Validação simples
        if (empty($dados['nome']) || empty($dados['email'])) {
            return $this->json($response, ['erro' => 'Nome e email são obrigatórios'], 400);
        }

        // Cria o paciente
        $novoPacienteId = $this->patient->criar([
            'nome' => $dados['nome'],
            'email' => $dados['email'],
            'telefone' => $dados['telefone'] ?? '',
            'cpf' => $dados['cpf'] ?? null,
            'rg' => $dados['rg'] ?? null,
            'data_nascimento' => $dados['data_nascimento'] ?? null,
            'usuario_id' => $userId
        ]);

        // Busca o paciente criado para retornar os dados completos
        $pacienteCriado = $this->patient->buscarPorId($novoPacienteId, $userId);

        return $this->json($response, [
            'sucesso' => true,
            'mensagem' => 'Paciente criado com sucesso!',
            'id' => $novoPacienteId,
            'nome' => $pacienteCriado['nome'],
            'email' => $pacienteCriado['email'],
            'telefone' => $pacienteCriado['telefone'],
            'ativo' => $pacienteCriado['ativo'],
            'criado_em' => $pacienteCriado['criado_em']
        ]);
    }

    // 4. EDITAR paciente
    public function editarPaciente(Request $request, Response $response, array $args): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        $pacienteId = (int)$args['id'];
        $dados = $request->getParsedBody();

        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não logado'], 401);
        }

        // Verifica se o paciente existe e pertence ao usuário
        if (!$this->patient->pertenceAoUsuario($pacienteId, $userId)) {
            return $this->json($response, ['erro' => 'Paciente não encontrado'], 404);
        }

        // Atualiza apenas os campos enviados
        $dadosParaAtualizar = [];
        if (isset($dados['nome'])) $dadosParaAtualizar['nome'] = $dados['nome'];
        if (isset($dados['email'])) $dadosParaAtualizar['email'] = $dados['email'];
        if (isset($dados['telefone'])) $dadosParaAtualizar['telefone'] = $dados['telefone'];
        if (isset($dados['cpf'])) $dadosParaAtualizar['cpf'] = $dados['cpf'];
        if (isset($dados['rg'])) $dadosParaAtualizar['rg'] = $dados['rg'];
        if (isset($dados['data_nascimento'])) $dadosParaAtualizar['data_nascimento'] = $dados['data_nascimento'];
        if (isset($dados['notas'])) $dadosParaAtualizar['notas'] = $dados['notas'];
        if (isset($dados['ativo'])) $dadosParaAtualizar['ativo'] = $dados['ativo'] === 'active' ? 1 : 0;

        $this->patient->atualizar($pacienteId, $dadosParaAtualizar);

        return $this->json($response, [
            'sucesso' => true,
            'mensagem' => 'Paciente atualizado com sucesso!'
        ]);
    } 

    public function findByPhone(Request $request, Response $response, array $args): Response
    {
        $logger = new BaseLogger('patients');

        try {
            $userId = $this->resolveAuthenticatedUserId($request);
            if ($userId === null) {
                return $this->json($response, ['ok' => false, 'message' => 'Unauthorized'], 401);
            }

            $phone = $args['phone'] ?? '';
            if (empty($phone)) {
                return $this->json($response, ['ok' => false, 'message' => 'Telefone é obrigatório'], 422);
            }

            // Normalizar telefone: remover caracteres especiais
            $normalizedPhone = preg_replace('/[^0-9]/', '', $phone);

            $logger->info('Searching patient by phone', [
                'user_id' => $userId,
                'original_phone' => $phone,
                'normalized_phone' => $normalizedPhone
            ]);

            $patient = $this->patient->findByPhone($userId, $normalizedPhone);

            if (!$patient) {
                $logger->info('Patient not found by phone', ['phone' => $normalizedPhone]);
                return $this->json($response, ['ok' => false, 'message' => 'Paciente não encontrado'], 404);
            }

            $logger->info('Patient found by phone', [
                'patient_id' => $patient['id'],
                'phone' => $normalizedPhone
            ]);

            return $this->json($response, [
                'ok' => true,
                'patient' => $patient,
            ], 200);
        } catch (Throwable $e) {
            $logger->error('Find patient by phone error', ['exception' => $e->getMessage()]);
            return $this->json($response, [
                'ok'    => false,
                'message' => 'Erro ao buscar paciente por telefone',
            ], 500);
        }
    }
}