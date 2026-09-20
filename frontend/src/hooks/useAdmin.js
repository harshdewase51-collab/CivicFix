import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@civicfix/client';

export function useAdmin(initialFilters = {}) {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (filters = initialFilters) => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, reportsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getAllReports(filters)
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
      }
      if (reportsRes.success) {
        setReports(reportsRes.reports || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load administrative data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const changeStatus = async (id, status) => {
    return await adminService.updateReportStatus(id, status);
  };

  const getDossier = async (id) => {
    return await adminService.getAdminReportById(id);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    reports,
    stats,
    loading,
    error,
    refresh: loadData,
    changeStatus,
    getDossier
  };
}

export default useAdmin;
