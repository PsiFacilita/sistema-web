<?php

namespace App\Http\Controllers;

use App\Config\Controller;
use App\Models\Document;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

final class DocumentsController extends Controller
{
    private Document $document;

    public function __construct()
    {
        $this->document = new Document();
    }

    /**
     * GET /api/documents - Lista todos os documentos do usuário
     */
    public function index(Request $request, Response $response): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        
        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);
        }

        // Verifica se há filtro por paciente
        $queryParams = $request->getQueryParams();
        $pacienteId = isset($queryParams['paciente_id']) ? (int)$queryParams['paciente_id'] : null;

        try {
            if ($pacienteId) {
                // Valida se o paciente pertence ao usuário
                if (!$this->document->patientBelongsToUser($pacienteId, $userId)) {
                    return $this->json($response, ['erro' => 'Paciente não encontrado'], 404);
                }
                $documentos = $this->document->findByPatientId($pacienteId, $userId);
            } else {
                $documentos = $this->document->findByUserId($userId);
            }

            return $this->json($response, [
                'sucesso' => true,
                'documents' => $documentos
            ]);
        } catch (\Exception $e) {
            return $this->json($response, [
                'erro' => 'Erro ao buscar documentos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/documents/{id} - Busca um documento específico
     */
    public function show(Request $request, Response $response, array $args): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        $documentoId = (int)$args['id'];

        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);
        }

        try {
            $documento = $this->document->findById($documentoId, $userId);

            if (!$documento) {
                return $this->json($response, ['erro' => 'Documento não encontrado'], 404);
            }

            return $this->json($response, [
                'sucesso' => true,
                'document' => $documento
            ]);
        } catch (\Exception $e) {
            return $this->json($response, [
                'erro' => 'Erro ao buscar documento: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/documents - Cria um novo documento
     */
    public function create(Request $request, Response $response): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        $dados = $request->getParsedBody();

        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);
        }

        // Validação dos campos obrigatórios
        if (empty($dados['paciente_id'])) {
            return $this->json($response, ['erro' => 'ID do paciente é obrigatório'], 400);
        }
        if (empty($dados['tipo_documento_id'])) {
            return $this->json($response, ['erro' => 'Tipo de documento é obrigatório'], 400);
        }
        if (empty($dados['conteudo'])) {
            return $this->json($response, ['erro' => 'Conteúdo é obrigatório'], 400);
        }

        try {
            // Valida se o paciente pertence ao usuário
            if (!$this->document->patientBelongsToUser((int)$dados['paciente_id'], $userId)) {
                return $this->json($response, ['erro' => 'Paciente não encontrado'], 404);
            }

            // Cria o documento
            $novoDocumentoId = $this->document->create([
                'usuario_id' => $userId,
                'paciente_id' => (int)$dados['paciente_id'],
                'tipo_documento_id' => (int)$dados['tipo_documento_id'],
                'conteudo' => $dados['conteudo'],
                'status' => $dados['status'] ?? 'rascunho'
            ]);

            // Busca o documento criado para retornar os dados completos
            $documentoCriado = $this->document->findById($novoDocumentoId, $userId);

            return $this->json($response, [
                'sucesso' => true,
                'mensagem' => 'Documento criado com sucesso!',
                'document' => $documentoCriado
            ], 201);
        } catch (\Exception $e) {
            return $this->json($response, [
                'erro' => 'Erro ao criar documento: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/documents/{id} - Atualiza um documento existente
     */
    public function update(Request $request, Response $response, array $args): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        $documentoId = (int)$args['id'];
        $dados = $request->getParsedBody();

        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);
        }

        try {
            // Verifica se o documento existe e pertence ao usuário
            if (!$this->document->belongsToUser($documentoId, $userId)) {
                return $this->json($response, ['erro' => 'Documento não encontrado'], 404);
            }

            // Se está alterando o paciente, valida se o novo paciente pertence ao usuário
            if (isset($dados['paciente_id'])) {
                if (!$this->document->patientBelongsToUser((int)$dados['paciente_id'], $userId)) {
                    return $this->json($response, ['erro' => 'Paciente não encontrado'], 404);
                }
            }

            // Atualiza apenas os campos enviados
            $dadosParaAtualizar = [];
            if (isset($dados['paciente_id'])) {
                $dadosParaAtualizar['paciente_id'] = (int)$dados['paciente_id'];
            }
            if (isset($dados['tipo_documento_id'])) {
                $dadosParaAtualizar['tipo_documento_id'] = (int)$dados['tipo_documento_id'];
            }
            if (isset($dados['conteudo'])) {
                $dadosParaAtualizar['conteudo'] = $dados['conteudo'];
            }
            if (isset($dados['status'])) {
                $dadosParaAtualizar['status'] = $dados['status'];
            }

            if (empty($dadosParaAtualizar)) {
                return $this->json($response, ['erro' => 'Nenhum campo para atualizar'], 400);
            }

            $this->document->update($documentoId, $userId, $dadosParaAtualizar);

            // Busca o documento atualizado
            $documentoAtualizado = $this->document->findById($documentoId, $userId);

            return $this->json($response, [
                'sucesso' => true,
                'mensagem' => 'Documento atualizado com sucesso!',
                'document' => $documentoAtualizado
            ]);
        } catch (\Exception $e) {
            return $this->json($response, [
                'erro' => 'Erro ao atualizar documento: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/documents/{id} - Remove um documento
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        $documentoId = (int)$args['id'];

        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);
        }

        try {
            // Verifica se o documento existe e pertence ao usuário
            if (!$this->document->belongsToUser($documentoId, $userId)) {
                return $this->json($response, ['erro' => 'Documento não encontrado'], 404);
            }

            $this->document->delete($documentoId, $userId);

            return $this->json($response, [
                'sucesso' => true,
                'mensagem' => 'Documento excluído com sucesso!'
            ]);
        } catch (\Exception $e) {
            return $this->json($response, [
                'erro' => 'Erro ao excluir documento: ' . $e->getMessage()
            ], 500);
        }
    }

    public function byPatient(Request $request, Response $response, array $args): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        $patientId = (int)$args['id'];

        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não autenticado'], 401);
        }

        if (!$this->document->patientBelongsToUser($patientId, $userId)) {
            return $this->json($response, ['erro' => 'Paciente não encontrado'], 404);
        }

        try {
            $docs = $this->document->findByPatientId($patientId, $userId);
            return $this->json($response, ['sucesso' => true, 'documents' => $docs]);
        } catch (Throwable $e) {
            return $this->json($response, ['erro' => 'Erro ao buscar documentos: '.$e->getMessage()], 500);
        }
    }
}
