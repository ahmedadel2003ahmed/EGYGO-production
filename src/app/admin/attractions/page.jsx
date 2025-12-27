'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import adminService from '@/services/adminService';
import AdminTable from '@/components/admin/AdminTable';

export default function AttractionsPage() {
    const router = useRouter();
    const [attractions, setAttractions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

    const fetchAttractions = async (page = 1) => {
        setLoading(true);
        try {
            const data = await adminService.getAttractions(page);
            setAttractions(data.results || data.data || []);
            // Handling varied API responses (paginated vs array)
            if (Array.isArray(data)) {
                setAttractions(data);
            }

            if (data.pagination) {
                setPagination({
                    currentPage: data.pagination.currentPage,
                    totalPages: data.pagination.totalPages
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttractions();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this attraction?')) return;
        try {
            await adminService.deleteAttraction(id);
            setAttractions(list => list.filter(item => item._id !== id));
        } catch (e) {
            alert('Failed to delete attraction');
        }
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        {
            key: 'status', label: 'Featured', render: (_, row) => (
                row.isFeatured ? <FaCheckCircle className="text-success" /> : <FaTimesCircle className="text-muted" />
            )
        },
        { key: 'city', label: 'Location', render: (_, row) => row.location?.city || row.location?.address || '-' }
    ];

    const actions = (row) => (
        <div className="btn-group">
            <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => router.push(`/admin/attractions/${row._id}/edit`)}
            >
                <FaEdit />
            </button>
            <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDelete(row._id)}
            >
                <FaTrash />
            </button>
        </div>
    );

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3">Attractions</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => router.push('/admin/attractions/create')}
                >
                    <FaPlus className="me-2" /> Add New
                </button>
            </div>

            <AdminTable
                columns={columns}
                data={attractions}
                loading={loading}
                pagination={pagination}
                onPageChange={fetchAttractions}
                actions={actions}
            />
        </div>
    );
}
