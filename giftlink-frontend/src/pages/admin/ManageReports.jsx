import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import './AdminPages.css';

export default function ManageReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0
  });
  
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    const role = sessionStorage.getItem('role');
    if (role !== 'admin') {
      navigate('/app');
    }
  }, [navigate]);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, pagination.currentPage]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth-token');
      
      // Build query params
      let url = `${urlConfig.backendUrl}/api/admin/reports?page=${pagination.currentPage}&limit=20`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports);
      setPagination(data.pagination);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to mark this report as resolved?')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('auth-token');
      const response = await fetch(`${urlConfig.backendUrl}/api/admin/reports/${reportId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resolve report');
      }

      setSuccess('Report resolved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchReports();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  return (
    <div className="manage-reports-container">
      <div className="page-header">
        <h1>📝 Manage Reports</h1>
        <p>Review and resolve user reports</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filters */}
      <div className="filters-section">
        <h2>Filters</h2>
        <div className="filters">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="reports-table-container">
        {loading ? (
          <div className="loading">Loading reports...</div>
        ) : (
          <>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Reported User</th>
                  <th>Item ID</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reported On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                      No reports found
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report._id}>
                      <td>
                        {report.reporterInfo?.name}
                        <br />
                        <small>{report.reporterInfo?.email}</small>
                      </td>
                      <td>
                        {report.reportedUserInfo?.name}
                        <br />
                        <small>{report.reportedUserInfo?.email}</small>
                      </td>
                      <td>
                        <code>{report.itemId || 'N/A'}</code>
                      </td>
                      <td>
                        <div className="report-reason">
                          {report.reason}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${report.status?.toLowerCase()}`}>
                          {report.status}
                        </span>
                      </td>
                      <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td>
                        {report.status === 'OPEN' ? (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleResolveReport(report._id)}
                            title="Resolve Report"
                          >
                            ✓ Resolve
                          </button>
                        ) : (
                          <span className="text-muted">
                            Resolved
                            {report.resolvedBy && (
                              <><br /><small>by {report.resolvedBy}</small></>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="btn btn-sm"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="btn btn-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
