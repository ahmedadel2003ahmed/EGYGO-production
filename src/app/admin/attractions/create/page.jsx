'use client';

import { useRouter } from 'next/navigation';
import AttractionForm from '@/components/admin/AttractionForm';
import adminService from '@/services/adminService';

export default function CreateAttractionPage() {
    const router = useRouter();

    const handleSubmit = async (values) => {
        try {
            await adminService.createAttraction(values);
            router.push('/admin/attractions');
        } catch (error) {
            alert('Failed to create attraction: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div>
            <h1 className="h3 mb-4">Create New Attraction</h1>
            <AttractionForm onSubmit={handleSubmit} />
        </div>
    );
}
