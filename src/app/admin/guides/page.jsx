'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import adminService from '@/services/adminService';
import AdminTable from '@/components/admin/AdminTable';
import { FaEye } from 'react-icons/fa';

export default function GuidesPage() {
    const router = useRouter();
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1
    });

    const fetchGuides = async (page = 1) => {
        setLoading(true);
        try {
            const data = await adminService.getPendingGuides(page);
            // API returns array in `data.data` or `data` directly
            const results = data.data || data.results || (Array.isArray(data) ? data : []);
            setGuides(results);

            // Handle pagination if present, otherwise mock
            setPagination({
                currentPage: data.pagination?.currentPage || data.currentPage || page,
                totalPages: data.pagination?.totalPages || data.totalPages || 1
            });
        } catch (error) {
            console.error('Error fetching guides:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGuides();
    }, []);

    const columns = [
        { key: 'name', label: 'Name', render: (val, row) => row.user?.name || row.fullname || 'Unknown' },
        { key: 'email', label: 'Email', render: (val, row) => row.user?.email || row.email },
        { key: 'phone', label: 'Phone', render: (val, row) => row.user?.phone || row.phone },
        {
            key: 'status',
            label: 'Status',
            render: (val) => (
                <span className={`badge bg-${val === 'pending' ? 'warning' : 'secondary'}`}>
                    {val || 'Pending'}
                </span>
            )
        },
        {
            key: 'createdAt',
            label: 'Applied On',
            render: (val) => val ? new Date(val).toLocaleDateString() : '-'
        }
    ];

    const actions = (row) => (
        <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => router.push(`/admin/guides/${row._id}`)}
        >
            <FaEye className="me-1" /> Review
        </button>
    );

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3">Pending Guide Applications</h1>
            </div>

            <AdminTable
                columns={columns}
                data={guides}
                loading={loading}
                pagination={pagination}
                onPageChange={fetchGuides}
                actions={actions}
            />
        </div>
    );
}
