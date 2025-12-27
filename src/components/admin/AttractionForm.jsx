'use client';

import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function AttractionForm({ initialValues, onSubmit, isEditing }) {
    const router = useRouter();

    const formik = useFormik({
        initialValues: initialValues || {
            name: '',
            category: 'Historical Site',
            description: '',
            location: {
                address: '',
                coordinates: [0, 0] // [lat, lng] usually, but backend might want [long, lat] for GeoJSON. Postman says coordinates: [31.13, 29.97]
            },
            images: [],
            entryFee: {
                adult: 0,
                child: 0,
                currency: 'EGP'
            }
        },
        validationSchema: Yup.object({
            name: Yup.string().required('Required'),
            category: Yup.string().required('Required'),
            location: Yup.object({
                address: Yup.string().required('Address is required')
            }),
            description: Yup.string().required('Required'),
        }),
        onSubmit: (values) => {
            onSubmit(values);
        },
    });

    return (
        <div className="card shadow-sm border-0">
            <div className="card-body">
                <h5 className="card-title mb-4">{isEditing ? 'Edit Attraction' : 'New Attraction Details'}</h5>

                <form onSubmit={formik.handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-8">
                            <label className="form-label">Name</label>
                            <input
                                className={`form-control ${formik.touched.name && formik.errors.name ? 'is-invalid' : ''}`}
                                {...formik.getFieldProps('name')}
                            />
                            {formik.touched.name && formik.errors.name && <div className="invalid-feedback">{formik.errors.name}</div>}
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Category</label>
                            <select
                                className="form-select"
                                {...formik.getFieldProps('category')}
                            >
                                <option value="Historical Site">Historical Site</option>
                                <option value="Museum">Museum</option>
                                <option value="Beach">Beach</option>
                                <option value="Park">Park</option>
                                <option value="Restaurant">Restaurant</option>
                            </select>
                        </div>

                        <div className="col-12">
                            <label className="form-label">Description</label>
                            <textarea
                                className={`form-control ${formik.touched.description && formik.errors.description ? 'is-invalid' : ''}`}
                                rows="4"
                                {...formik.getFieldProps('description')}
                            ></textarea>
                        </div>

                        <div className="col-12">
                            <label className="form-label">Address</label>
                            <input
                                className="form-control"
                                {...formik.getFieldProps('location.address')}
                            />
                            {/* Coordinates inputs could go here */}
                        </div>

                        {/* Fees */}
                        <div className="col-md-4">
                            <label className="form-label">Adult Fee ({formik.values.entryFee.currency})</label>
                            <input
                                type="number"
                                className="form-control"
                                {...formik.getFieldProps('entryFee.adult')}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Child Fee ({formik.values.entryFee.currency})</label>
                            <input
                                type="number"
                                className="form-control"
                                {...formik.getFieldProps('entryFee.child')}
                            />
                        </div>

                        {/* Images placeholder */}
                        <div className="col-12">
                            <label className="form-label">Images (URLs)</label>
                            {/* Simple comma separated for now */}
                            <input
                                className="form-control"
                                placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                                onChange={(e) => formik.setFieldValue('images', e.target.value.split(',').map(s => s.trim()))}
                                defaultValue={initialValues?.images?.join(', ')}
                            />
                            <div className="form-text">Enter image URLs separated by comma</div>
                        </div>

                        <div className="col-12 mt-4 d-flex justify-content-end gap-2">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => router.back()}>
                                <FaTimes className="me-1" /> Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={formik.isSubmitting}>
                                <FaSave className="me-1" /> {isEditing ? 'Update Attraction' : 'Create Attraction'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
