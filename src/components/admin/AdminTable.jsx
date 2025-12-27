'use client';

import styles from './AdminTable.module.css';

const AdminTable = ({
    columns,
    data,
    loading,
    actions,
    onRowClick,
    pagination,
    onPageChange
}) => {
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading data...</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className={styles.emptyContainer}>
                <p>No records found.</p>
            </div>
        );
    }

    return (
        <div className={styles.tableWrapper}>
            <table className="table table-hover mb-0">
                <thead className={styles.thead}>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} style={{ width: col.width }}>{col.label}</th>
                        ))}
                        {actions && <th style={{ width: '100px' }} className="text-end">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        <tr key={row.id || idx} onClick={() => onRowClick && onRowClick(row)} className={onRowClick ? styles.clickable : ''}>
                            {columns.map((col) => (
                                <td key={`${row.id}-${col.key}`}>
                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                </td>
                            ))}
                            {actions && (
                                <td className="text-end" onClick={(e) => e.stopPropagation()}>
                                    {actions(row)}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {pagination && (
                <div className={styles.pagination}>
                    <span className={styles.pageInfo}>
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <div className="btn-group">
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            disabled={pagination.currentPage <= 1}
                            onClick={() => onPageChange(pagination.currentPage - 1)}
                        >
                            Previous
                        </button>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            disabled={pagination.currentPage >= pagination.totalPages}
                            onClick={() => onPageChange(pagination.currentPage + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTable;
