import React, { useState, useEffect } from 'react';
import List from '../components/List/List';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const ListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    // Simulating an API call
    const fetchData = async () => {
      try {
        // In a real app, this would be a fetch to your backend API
        setTimeout(() => {
          const mockUsers: User[] = [
            { id: 1, name: 'João Silva', email: 'joao@example.com', role: 'Admin' },
            { id: 2, name: 'Maria Santos', email: 'maria@example.com', role: 'User' },
            { id: 3, name: 'Pedro Almeida', email: 'pedro@example.com', role: 'Manager' },
            { id: 4, name: 'Ana Costa', email: 'ana@example.com', role: 'User' },
            { id: 5, name: 'Carlos Oliveira', email: 'carlos@example.com', role: 'Developer' }
          ];
          setUsers(mockUsers);
          setLoading(false);
        }, 1500);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  const renderUser = (user: User) => (
    <div className="py-2">
      <h3 className="text-lg font-medium m-0 mb-1">{user.name}</h3>
      <p className="text-gray-600 m-0 mb-1">{user.email}</p>
      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
        {user.role}
      </span>
    </div>
  );

  const customLoadingComponent = (
    <div className="flex flex-col items-center py-8">
      <p className="mb-3">Carregando usuários...</p>
      <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Lista de Usuários</h1>
      
      <div className="border border-gray-200 rounded-md mb-5">
        <List<User>
          items={users}
          renderItem={renderUser}
          keyExtractor={(user) => user.id.toString()}
          onItemClick={handleUserClick}
          loading={loading}
          loadingComponent={customLoadingComponent}
          emptyMessage="Nenhum usuário encontrado"
          divider={true}
          scrollable={true}
          maxHeight="400px"
        />
      </div>

      {selectedUser && (
        <div className="bg-gray-100 rounded-md p-4">
          <h2 className="text-xl font-semibold mb-2">Detalhes do Usuário</h2>
          <p className="mb-1"><span className="font-medium">Nome:</span> {selectedUser.name}</p>
          <p className="mb-1"><span className="font-medium">Email:</span> {selectedUser.email}</p>
          <p className="mb-1"><span className="font-medium">Função:</span> {selectedUser.role}</p>
        </div>
      )}
    </div>
  );
};

export default ListPage;