import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Icon from "../components/Icon/Icon";
import Swal from "sweetalert2";

interface DocumentContent {
  id: string;
  title: string;
  category: string;
  patient: string;
  createdAt: string;
  status: "draft" | "final" | "archived" | "pending_review";
  content: string;
  lastModified: string;
}


const formatStatus = (status: DocumentContent["status"]) => {
  const statusMap = {
    draft: "Rascunho",
    final: "Final",
    archived: "Arquivado",
    pending_review: "Revisão Pendente",
  };
  return statusMap[status] || status;
};


const StatusBadge: React.FC<{ status: DocumentContent["status"] }> = ({ status }) => {
  const statusClasses = {
    draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
    final: "bg-green-100 text-green-800 border-green-200",
    archived: "bg-gray-100 text-gray-800 border-gray-200",
    pending_review: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium border ${statusClasses[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
};


const DocumentViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));

        const mockDocument: DocumentContent = {
          id: id || "1",
          title: `Documento ${id}`,
          category: "Anamnese",
          patient: `Paciente ${Math.floor(Number(id) / 3) + 1}`,
          createdAt: new Date(Date.now() - Number(id) * 86400000).toLocaleDateString("pt-BR"),
          status: Number(id) % 4 === 0 ? "draft" : Number(id) % 4 === 1 ? "final" : Number(id) % 4 === 2 ? "archived" : "pending_review",
          content: `# ${document?.title || `Documento ${id}`}

## Informações do Paciente
- **Nome:** ${`Paciente ${Math.floor(Number(id) / 3) + 1}`}
- **Data de nascimento:** 15/03/1985
- **CPF:** 111.111.111-11

## Anamnese

### Queixa Principal
Paciente relata ansiedade excessiva e dificuldades para dormir há aproximadamente 3 meses.

### História da Doença Atual
- Início dos sintomas após mudança de emprego
- Sintomas se intensificam durante a noite
- Já tentou técnicas de respiração sem sucesso
- Procurou ajuda após recomendação de familiar

### História Pessoal
- Primeira experiência com terapia
- Demonstra motivação para o tratamento
- Bom insight sobre sua condição

### Observações Clínicas
Paciente apresenta-se colaborativo durante a sessão, com discurso coerente e organizado. Demonstra consciência sobre seus sintomas e motivação para mudança.

### Plano Terapêutico
1. Sessões semanais de 50 minutos
2. Técnicas de relaxamento
3. Reestruturação cognitiva
4. Higiene do sono

### Próximos Passos
- Retorno em 1 semana
- Aplicação de escala de ansiedade
- Início das técnicas de relaxamento`,
          lastModified: new Date().toLocaleDateString("pt-BR")
        };
        
        setDocument(mockDocument);
      } catch (error) {
        console.error("Erro ao carregar documento:", error);
        Swal.fire("Erro", "Não foi possível carregar o documento", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadDocument();
    }
  }, [id]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    Swal.fire("Sucesso!", "Documento salvo com sucesso!", "success");
    setIsEditing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    Swal.fire("Info", "Funcionalidade de download será implementada", "info");
  };


  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando documento...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!document) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <Icon type="folder" size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Documento não encontrado</h2>
          <p className="text-gray-600 mb-6">O documento solicitado não pôde ser carregado.</p>
          <Button onClick={() => navigate("/documents")} variant="primary">
            Voltar aos Documentos
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            onClick={() => navigate("/documents")}
            icon={<Icon type="arrow-left" size={16} />}
          >
            Voltar
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Title level={1} className="mb-2">{document.title}</Title>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Paciente: <strong>{document.patient}</strong></span>
              <span>•</span>
              <span>Categoria: <strong>{document.category}</strong></span>              
              <span>Criado em: <strong>{document.createdAt}</strong></span>
              <span>•</span>
              <span>Modificado em: <strong>{document.lastModified}</strong></span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <StatusBadge status={document.status} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={isEditing ? handleSave : handleEdit}
              icon={<Icon type={isEditing ? "save" : "edit"} size={16} />}
            >
              {isEditing ? "Salvar" : "Editar"}
            </Button>
            
            {isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              icon={<Icon type="print" size={16} />}
            >
              Imprimir
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownload}
              icon={<Icon type="download" size={16} />}
            >
              Download
            </Button>
            
          </div>
        </div>
      </Card>

      {/* Document Content */}
      <Card>
        <div className="prose max-w-none">
          {isEditing ? (
            <textarea
              className="w-full h-96 p-4 border border-gray-300 rounded-md resize-y focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={document.content}
              onChange={(e) => setDocument({ ...document, content: e.target.value })}
              placeholder="Conteúdo do documento..."
            />
          ) : (
            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {document.content}
            </div>
          )}
        </div>
      </Card>

    </MainLayout>
  );
};

export default DocumentViewer;