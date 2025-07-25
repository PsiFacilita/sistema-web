import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Input from "../components/Form/Input/Input";
import Table from "../components/Table/Table";
import DocumentCategoryDropdown from "../components/DocumentCategoryDropdown";
import Icon from "../components/Icon/Icon";
import Modal from "../components/Modal/Modal";
import { Select } from "../components/Form/Select/Select";
import { FiChevronLeft, FiChevronRight, FiEye } from "react-icons/fi";
import Swal from "sweetalert2";

export interface Document {
  id: string;
  title: string;
  category: string;
  patient: string;
  createdAt: string;
  status: "draft" | "final" | "archived" | "pending_review";
}

const handleDeleteDocument = (id: string) => {
  Swal.fire({
    title: 'Tem certeza?',
    text: 'Essa ação não poderá ser desfeita!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#aaa',
    confirmButtonText: 'Sim, deletar',
    cancelButtonText: 'Cancelar',
  }).then((result) => {
    if (result.isConfirmed) {
      console.log("Documento deletado:", id);
      // Aqui você pode fazer a lógica real de exclusão (API, estado, etc.)
      Swal.fire('Deletado!', 'O documento foi deletado.', 'success');
    }
  });
};

const formatStatus = (status: Document["status"]) => {
  const statusMap = {
    draft: "Rascunho",
    final: "Final",
    archived: "Arquivado",
    pending_review: "Revisão Pendente",
  };
  return statusMap[status] || status;
};

const StatusCell: React.FC<{ value: Document["status"] }> = ({ value }) => {
  const statusClasses = {
    draft: "bg-yellow-100 text-yellow-800",
    final: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-800",
    pending_review: "bg-blue-100 text-blue-800",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[value]}`}
    >
      {formatStatus(value)}
    </span>
  );
};

const ActionsCell: React.FC<{ value: string }> = ({ value }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex space-x-2">
      {/* Botão Visualizar */}
      <button
        onClick={() => console.log("Visualizar documento", value)}
               className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1 text-sm text-blue-700 hover:bg-blue-700  hover:text-white transition"
      
        >
        
        <FiEye size={16} />
        Visualizar
      </button>


      {/* Botão Editar */}
      <button
        onClick={() => console.log("Edit document", value)}
        className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1 text-sm text-green-700 hover:bg-green-700  hover:text-white transition"
      >
        <Icon type="edit" size={16} />
        Editar
      </button>

      {/* Botão Deletar */}
      <button
        onClick={() => handleDeleteDocument(value)}
        className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1 text-sm text-red-500 hover:bg-red-500 hover:text-white transition"

      >
        <Icon type="trash" size={16} />
        Deletar
      </button>
    </div>
  );
};



const Documents: React.FC = () => {
  const [documents] = useState<Document[]>(
    Array.from({ length: 100 }, (_, i) => ({
      id: `doc-${i + 1}`,
      title: `Documento ${i + 1}`,
      category:
        i % 3 === 0 ? "Anamnese" : i % 3 === 1 ? "Relatório" : "Evolução",
      patient: `Paciente ${Math.floor(i / 3) + 1}`,
      createdAt: new Date(Date.now() - i * 86400000).toLocaleDateString("pt-BR"),
      status:
        i % 4 === 0
          ? "draft"
          : i % 4 === 1
          ? "final"
          : i % 4 === 2
          ? "archived"
          : "pending_review",
    }))
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: "",
    category: "",
    patient: "",
  });
  const documentsPerPage = 11;

  const documentCategories = [
    {
      name: "Prontuário",
      documents: [
        { id: "1", name: "Anamnese", route: "/documents/anamnese" },
        { id: "2", name: "Evolução", route: "/documents/evolucao" },
      ],
    },
    {
      name: "Relatórios",
      documents: [
        { id: "3", name: "Relatório Psicológico", route: "/documents/relatorio" },
        { id: "4", name: "Laudo", route: "/documents/laudo" },
      ],
    },
  ];

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastDocument = currentPage * documentsPerPage;
  const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
  const currentDocuments = filteredDocuments.slice(
    indexOfFirstDocument,
    indexOfLastDocument
  );

  const columns = [
    { header: "Título", accessor: "title" as keyof Document },
    { header: "Categoria", accessor: "category" as keyof Document },
    { header: "Paciente", accessor: "patient" as keyof Document },
    { header: "Data", accessor: "createdAt" as keyof Document },
    {
      header: "Status",
      accessor: "status" as keyof Document,
      Cell: StatusCell,
    },
    {
      header: "Ações",
      accessor: "id" as keyof Document,
      Cell: ActionsCell,
    },
  ];
  const totalPages = Math.ceil(filteredDocuments.length / documentsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleCreateDocument = () => {
    if (!newDocument.title || !newDocument.category || !newDocument.patient) {
      Swal.fire('Erro', 'Preencha todos os campos obrigatórios', 'error');
      return;
    }

    // Aqui você adicionaria a lógica para salvar o documento na API
    console.log("Criando documento:", newDocument);
    
    Swal.fire('Sucesso!', 'Documento criado com sucesso!', 'success');
    setIsModalOpen(false);
    setNewDocument({ title: "", category: "", patient: "" });
  };

  const handleInputChange = (field: string, value: string) => {
    setNewDocument(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const categoryOptions = [
    { value: "Anamnese", label: "Anamnese" },
    { value: "Relatório", label: "Relatório" },
    { value: "Evolução", label: "Evolução" },
    { value: "Laudo", label: "Laudo" },
  ];

  // Lista de pacientes 
  const patientOptions = [
    { value: "1", label: "Paciente 1" },
    { value: "2", label: "Paciente 2" },
    { value: "3", label: "Paciente 3" },
  ];

  return (
    <MainLayout>
      <div className="mb-6">
        <Title level={1}>Documentos</Title>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="w-full md:w-1/3">
          <Input
            id="search"
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div className="flex gap-2">          <Button
            variant="primary"
            icon={<Icon type="plus" size={16} />}
            onClick={() => setIsModalOpen(true)}
          >
            Novo Documento
          </Button>
        </div>
      </div>      
       <Card>
        {currentDocuments.length > 0 ? (
          <>
            <Table data={currentDocuments} columns={columns} />

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{" "}
                      <span className="font-medium">{indexOfFirstDocument + 1}</span> a{" "}
                      <span className="font-medium">
                        {Math.min(indexOfLastDocument, filteredDocuments.length)}
                      </span>{" "}
                      de{" "}
                      <span className="font-medium">{filteredDocuments.length}</span>{" "}
                      resultados
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                      aria-label="Pagination"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 hover:bg-gray-50 focus:z-20"
                      >
                        <span className="sr-only">Anterior</span>
                        <FiChevronLeft size={16} />
                      </Button>

                      {/* Exibir no máximo 5 páginas com elipses */}
                      {(() => {
                        const visiblePages = 5;
                        const pages: number[] = [];
                        let start = Math.max(1, currentPage - Math.floor(visiblePages / 2));
                        let end = Math.min(totalPages, start + visiblePages - 1);

                        if (end - start < visiblePages - 1) {
                          start = Math.max(1, end - visiblePages + 1);
                        }

                        for (let i = start; i <= end; i++) {
                          pages.push(i);
                        }

                        return (
                          <>
                            {start > 1 && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => paginate(1)}
                                  className="px-3 py-1 text-sm"
                                >
                                  1
                                </Button>
                                <span className="px-2 py-1 text-sm text-gray-500">...</span>
                              </>
                            )}

                            {pages.map((pageNumber) => (
                              <Button
                                key={pageNumber}
                                variant={pageNumber === currentPage ? "primary" : "outline"}
                                size="sm"
                                onClick={() => paginate(pageNumber)}
                                className={`px-4 py-2 text-sm font-semibold ${
                                  pageNumber === currentPage
                                    ? "z-10 bg-primary-600 text-white"
                                    : "text-gray-900 hover:bg-gray-50"
                                }`}
                              >
                                {pageNumber}
                              </Button>
                            ))}

                            {end < totalPages && (
                              <>
                                <span className="px-2 py-1 text-sm text-gray-500">...</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => paginate(totalPages)}
                                  className="px-3 py-1 text-sm"
                                >
                                  {totalPages}
                                </Button>
                              </>
                            )}
                          </>
                        );
                      })()}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 hover:bg-gray-50 focus:z-20"
                      >
                        <span className="sr-only">Próximo</span>
                        <FiChevronRight size={16} />
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum documento encontrado.</p>
          </div>
        )}
      </Card>

      {/* Modal para criar novo documento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Novo Documento"
        size="medium"
        showCloseButton={true}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label htmlFor="document-title" className="block text-sm font-medium text-gray-700 mb-1">
              Título do Documento *
            </label>
            <Input
              id="document-title"
              type="text"
              placeholder="Digite o título do documento"
              value={newDocument.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="document-category" className="block text-sm font-medium text-gray-700 mb-1">
              Categoria *
            </label>
            <Select
              id="document-category"
              value={newDocument.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              options={categoryOptions}
              placeholder="Selecione uma categoria"
              required
            />
          </div>          <div>
            <label htmlFor="document-patient" className="block text-sm font-medium text-gray-700 mb-1">
              Paciente *
            </label>
            <Select
              id="document-patient"
              value={newDocument.patient}
              onChange={(e) => handleInputChange("patient", e.target.value)}
              options={patientOptions}
              placeholder="Selecione um paciente"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateDocument}
            >
              Criar Documento
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Documents;
