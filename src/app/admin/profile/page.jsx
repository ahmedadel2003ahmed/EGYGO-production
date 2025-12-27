'use client';

import { useAuth } from '@/app/context/AuthContext';
import adminService from '@/services/adminService';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        adminService.logout();
        logout();
        router.push('/admin/login');
    };

    return (
        <div className="container">
            <h1 className="h3 mb-4">My Profile</h1>

            <div className="card shadow-sm border-0 mw-600" style={{ maxWidth: '600px' }}>
                <div className="card-body">
                    <div className="text-center mb-4">
                        <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 80, height: 80, fontSize: '2rem' }}>
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <h4 className="mt-3">{user?.name || 'Admin User'}</h4>
                        <span className="badge bg-primary">Administrator</span>
                    </div>

                    <hr />

                    <div className="mb-3">
                        <label className="text-muted small text-uppercase fw-bold">Email</label>
                        <p className="fw-medium">{user?.email || 'admin@egygo.com'}</p>
                    </div>

                    <div className="mb-3">
                        <label className="text-muted small text-uppercase fw-bold">Role</label>
                        <p className="fw-medium text-capitalize">{user?.role || 'Admin'}</p>
                    </div>

                    <div className="d-grid mt-5">
                        <button className="btn btn-outline-danger" onClick={handleLogout}>
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
