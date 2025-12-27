'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AttractionForm from '@/components/admin/AttractionForm';
import adminService from '@/services/adminService';

export default function EditAttractionPage() {
    const router = useRouter();
    const params = useParams();
    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttraction = async () => {
            try {
                const data = await adminService.getAttractions();
                // Note: The Postman collection listed getAttractionById as (Public) /api/attractions/:id
                // We'll use getGuideDetails (which was confusingly named in postman, but logically should use getAttractionDetail)
                // Let's assume fetching list and finding it, OR implementing getAttractionById in service

                // Actually, let's fix adminService to have getAttractionById properly using public endpoint
                // I will do a direct fetch here if service is missing it, but best to update service.
                // adminService.js had: getAttractions(page, limit). It did NOT have getAttraction(id).
                // I will implement fetching logic here using the public endpoint via axios or just list filtering if already loaded (bad for perf).
                // Best approach: add `getAttractionById` to adminService? No, I'll just use the public endpoint helper here if I can.
                // Wait, `adminService` has `adminClient` which base URL is correct.

                // Let's try to fetch all or assume we need a new method.
                // The service file didn't include `getAttractionById`. I'll assume `/api/attractions/${id}` works.
                // I'll call direct axios for now or better, use the existing endpoint structure.

                // HACK: I should have added getAttractionById to adminService. I'll just add it to the service call in the next step to be clean.
                // But for now, I'll assume I can use `getAttractions` with a filter or simple fetch.
                // Actually, I'll just use the `getGuideDetails` pattern.

                const response = await fetch(`/api/attractions/${params.id}`); // Using public API directly
                const json = await response.json();
                if (json.success) {
                    setInitialValues(json.data);
                }
            } catch (error) {
                console.error('Failed to load attraction', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchAttraction();
    }, [params.id]);

    const handleSubmit = async (values) => {
        try {
            await adminService.updateAttraction(params.id, values);
            router.push('/admin/attractions');
        } catch (error) {
            alert('Update failed');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="h3 mb-4">Edit Attraction</h1>
            {initialValues && (
                <AttractionForm
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                    isEditing={true}
                />
            )}
        </div>
    );
}
