'use client';

import { useEffect, useState } from 'react';
import adminService from '@/services/adminService';

export default function SystemPage() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkSystem = async () => {
        setLoading(true);
        try {
            const data = await adminService.checkHealth();
            setHealth(data);
        } catch (error) {
            setHealth({ status: 'error', message: 'Could not connect to server' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkSystem();
    }, []);

    return (
        <div>
            <h1 className="h3 mb-4">System Status</h1>

            <div className="card shadow-sm border-0">
                <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <h5 className="card-title mb-0">API Health Check</h5>
                        <button className="btn btn-sm btn-outline-primary" onClick={checkSystem} disabled={loading}>
                            {loading ? 'Checking...' : 'Refresh Status'}
                        </button>
                    </div>

                    {loading ? (
                        <div className="d-flex align-items-center">
                            <div className="spinner-grow spinner-grow-sm text-primary me-2" role="status"></div>
                            <span>Pinging server...</span>
                        </div>
                    ) : (
                        <div className="d-flex align-items-center">
                            <div className={`rounded-circle p-1 me-3 ${health?.status === 'error' ? 'bg-danger' : 'bg-success'}`} style={{ width: '12px', height: '12px' }}></div>
                            <div>
                                <h6 className="mb-1">{health?.status === 'success' || health?.status === 'ok' ? 'System Operational' : 'System Issues Detected'}</h6>
                                <pre className="mb-0 text-muted small bg-light p-2 rounded mt-2">
                                    {JSON.stringify(health, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
