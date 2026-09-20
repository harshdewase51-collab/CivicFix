import { useState, useEffect, useCallback } from 'react';
import { reportService } from '@civicfix/client';

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await reportService.getMyReports();
      if (res.success) {
        setReports(res.reports || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  const submitReport = async (formData) => {
    return await reportService.createReport(formData);
  };

  const getReport = async (id) => {
    return await reportService.getReportById(id);
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    refresh: fetchReports,
    submitReport,
    getReport
  };
}

export default useReports;
