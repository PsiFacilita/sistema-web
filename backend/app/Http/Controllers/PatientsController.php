<?php

namespace App\Http\Controllers;

use App\Config\Controller;
use App\Helpers\BaseLogger;
use App\Models\Patient;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

final class PatientsController extends Controller
{
    public function __construct(
        private ?Patient $patient = null
    )
    {
        $this->patient = $this->patient ?? new Patient();
    }
    public function getPatients(Request $request, Response $response): Response
    {
        $logger = new BaseLogger('patients');

        try {
            $userId = $this->resolveAuthenticatedUserId($request);
            if ($userId === null) {
                return $this->json($response, ['ok' => false, 'message' => 'Unauthorized'], 401);
            }

            $patients = $this->patient->getPatientsByUserId($userId);

            return $this->json($response, [
                'ok' => true,
                'patients' => $patients,
            ], 200);
        } catch (Throwable $e) {
            $logger->error('Patients error', ['exception' => $e->getMessage()]);
            return $this->json($response, [
                'ok'    => false,
                'error' => 'Failed to fetch patients data',
            ], 500);
        }
    }
}