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
    <div className="overflow-x-auto w-full">
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
            <tr key={rowIndex}>
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
  );
};

export default Table;
