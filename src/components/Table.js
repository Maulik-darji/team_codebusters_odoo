import React from 'react';

const Table = ({ columns, data, onRowClick }) => {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No records found.
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr 
                key={row.id || rowIdx} 
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
