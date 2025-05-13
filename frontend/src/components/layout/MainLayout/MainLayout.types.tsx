export interface MainLayoutProps {
  children?: React.ReactNode;
  sidebarOpen: boolean;  // 
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>; // Função para alterar o estado
}