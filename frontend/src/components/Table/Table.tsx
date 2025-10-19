import React from 'react';

interface TableColumn<T, K extends keyof T> {
  header: string;
  accessor: K;
  Cell?: React.FC<{ value: T[K] }>;
}

interface TableProps<T> {
  data: T[];
  columns: Array<TableColumn<T, keyof T>>;
}

const Table = <T extends object>({ data, columns }: TableProps<T>) => {
  return (
    <>
      {/* Versão desktop da tabela */}
      <div className="hidden lg:block overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    {column.Cell ? (
                      <column.Cell value={row[column.accessor]} />
                    ) : (
                      String(row[column.accessor])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Versão mobile em cards */}
      <div className="lg:hidden space-y-4">
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            {columns.map((column, colIndex) => (
              <div key={colIndex} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm font-medium text-gray-500 w-1/3">
                  {column.header}:
                </span>
                <span className="text-sm text-gray-900 w-2/3 text-right">
                  {column.Cell ? (
                    <column.Cell value={row[column.accessor]} />
                  ) : (
                    String(row[column.accessor])
                  )}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

export default Table;
