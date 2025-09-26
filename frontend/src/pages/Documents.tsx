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
import { FiChevronLeft, FiChevronRight, FiEye, FiSearch, FiFileText, FiPlus } from "react-icons/fi";
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
    background: '#fff',
    color: '#374151'
  }).then((result) => {
    if (result.isConfirmed) {
      console.log("Documento deletado:", id);
      Swal.fire({
        title: 'Deletado!',
        text: 'O documento foi deletado.',
        icon: 'success',
        background: '#fff',
        color: '#374151'
      });
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
    draft: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    final: "bg-green-100 text-green-800 border border-green-200",
    archived: "bg-gray-100 text-gray-800 border border-gray-200",
    pending_review: "bg-blue-100 text-blue-800 border border-blue-200",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses[value]}`}
    >
      {formatStatus(value)}
    </span>
  );
};

const ActionsCell: React.FC<{ value: string }> = ({ value }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex space-x-2">
      <button
        onClick={() => console.log("Visualizar documento", value)}
        className="flex items-center gap-2 rounded-lg bg-sage-100 px-3 py-2 text-sm text-sage-700 hover:bg-sage-200 hover:text-sage-800 transition-all duration-300"
      >
        <FiEye size={16} />
        Visualizar
      </button>

      <button
        onClick={() => console.log("Edit document", value)}
        className="flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2 text-sm text-sage-600 hover:bg-sage-100 hover:text-sage-700 transition-all duration-300 border border-sage-200"
      >
        <Icon type="edit" size={16} />
        Editar
      </button>

      <button
        onClick={() => handleDeleteDocument(value)}
        className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-300 border border-red-200"
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
      Swal.fire({
        title: 'Erro',
        text: 'Preencha todos os campos obrigatórios',
        icon: 'error',
        background: '#fff',
        color: '#374151'
      });
      return;
    }

    console.log("Criando documento:", newDocument);
    
    Swal.fire({
      title: 'Sucesso!',
      text: 'Documento criado com sucesso!',
      icon: 'success',
      background: '#fff',
      color: '#374151'
    });
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

  const patientOptions = [
    { value: "1", label: "Paciente 1" },
    { value: "2", label: "Paciente 2" },
    { value: "3", label: "Paciente 3" },
  ];

  return (
    <MainLayout>
      <div className="mb-8">
        <Title level={1} className="text-sage-700">Documentos</Title>
      </div>

      {/* Header com busca e ações */}
      <Card variant="elevated" className="mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="relative w-full lg:w-1/3">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={20} />
            <Input
              id="search"
              placeholder="Buscar documentos por título, paciente ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 border-sage-200 focus:border-sage-400"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="primary"
              icon={<FiPlus size={18} />}
              onClick={() => setIsModalOpen(true)}
              className="bg-sage-600 hover:bg-sage-700 border-sage-600"
            >
              Novo Documento
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabela de documentos */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        {currentDocuments.length > 0 ? (
          <>
            <div className="p-6 border-b border-sage-100">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-sage-800">
                <FiFileText size={20} />
                Lista de Documentos
                <span className="text-sage-600 font-normal ml-2">
                  ({filteredDocuments.length} encontrados)
                </span>
              </h3>
            </div>
            
            <Table data={currentDocuments} columns={columns} />
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-sage-100 bg-sage-50 px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                  <div>
                    <p className="text-sm text-sage-700">
                      Mostrando{" "}
                      <span className="font-semibold">{indexOfFirstDocument + 1}</span> a{" "}
                      <span className="font-semibold">
                        {Math.min(indexOfLastDocument, filteredDocuments.length)}
                      </span>{" "}
                      de <span className="font-semibold">{filteredDocuments.length}</span> documentos
                    </p>
                  </div>
                  <div>
                    <nav className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg border-sage-300 text-sage-700 hover:bg-sage-50 disabled:opacity-50"
                      >
                        <FiChevronLeft size={16} />
                      </Button>
                      
                      <div className="flex gap-1">
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
                                    className="px-3 py-1 rounded-lg border-sage-300 text-sage-700 hover:bg-sage-50"
                                  >
                                    1
                                  </Button>
                                  <span className="px-2 py-1 text-sm text-sage-400">...</span>
                                </>
                              )}

                              {pages.map((pageNumber) => (
                                <Button
                                  key={pageNumber}
                                  variant={pageNumber === currentPage ? "primary" : "outline"}
                                  size="sm"
                                  onClick={() => paginate(pageNumber)}
                                  className={`rounded-lg ${
                                    pageNumber === currentPage 
                                      ? 'bg-sage-600 border-sage-600 text-white' 
                                      : 'border-sage-300 text-sage-700 hover:bg-sage-50'
                                  }`}
                                >
                                  {pageNumber}
                                </Button>
                              ))}

                              {end < totalPages && (
                                <>
                                  <span className="px-2 py-1 text-sm text-sage-400">...</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => paginate(totalPages)}
                                    className="px-3 py-1 rounded-lg border-sage-300 text-sage-700 hover:bg-sage-50"
                                  >
                                    {totalPages}
                                  </Button>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-lg border-sage-300 text-sage-700 hover:bg-sage-50 disabled:opacity-50"
                      >
                        <FiChevronRight size={16} />
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="bg-sage-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FiFileText size={32} className="text-sage-400" />
            </div>
            <h3 className="text-lg font-semibold text-sage-700 mb-2">Nenhum documento encontrado</h3>
            <p className="text-sage-600 mb-4">
              {searchTerm ? "Tente ajustar os termos da busca." : "Comece criando seu primeiro documento."}
            </p>
            {!searchTerm && (
              <Button
                variant="primary"
                icon={<FiPlus size={16} />}
                onClick={() => setIsModalOpen(true)}
                className="bg-sage-600 hover:bg-sage-700"
              >
                Criar Primeiro Documento
              </Button>
            )}
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
        <div className="space-y-6 mt-4">
          <div className="bg-sage-50 rounded-xl p-4">
            <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-4">
              <FiFileText size={18} />
              Informações do Documento
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="document-title" className="block text-sm font-medium text-sage-700 mb-2">
                  Título do Documento *
                </label>
                <Input
                  id="document-title"
                  type="text"
                  placeholder="Digite o título do documento"
                  value={newDocument.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                  className="border-sage-200 focus:border-sage-400"
                />
              </div>

              <div>
                <label htmlFor="document-category" className="block text-sm font-medium text-sage-700 mb-2">
                  Categoria *
                </label>
                <Select
                  id="document-category"
                  value={newDocument.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  options={categoryOptions}
                  placeholder="Selecione uma categoria"
                  required
                  className="border-sage-200 focus:border-sage-400"
                />
              </div>

              <div>
                <label htmlFor="document-patient" className="block text-sm font-medium text-sage-700 mb-2">
                  Paciente *
                </label>
                <Select
                  id="document-patient"
                  value={newDocument.patient}
                  onChange={(e) => handleInputChange("patient", e.target.value)}
                  options={patientOptions}
                  placeholder="Selecione um paciente"
                  required
                  className="border-sage-200 focus:border-sage-400"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-sage-100">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateDocument}
              className="bg-sage-600 hover:bg-sage-700 border-sage-600"
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