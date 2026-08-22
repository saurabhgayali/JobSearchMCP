'use client';

import { useState, useMemo } from 'react';

interface Job {
  sno: number;
  company: string;
  jobTitle: string;
  description: string;
  url: string;
  expiryDate: string;
  applyLink: string;
}

interface JobError {
  sno: number;
  company: string;
  url: string;
  errorCode: string;
  httpStatus: string;
  errorMessage: string;
  attemptedAt: string;
}

type SortField = 'jobTitle' | 'expiryDate';
type SortOrder = 'asc' | 'desc';

const COMPANIES = ['amgen', 'bayer', 'gsk', 'novartis', 'pfizer'];
const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function JobSearchDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(COMPANIES);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [errors, setErrors] = useState<JobError[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobsSortField, setJobsSortField] = useState<SortField>('jobTitle');
  const [jobsSortOrder, setJobsSortOrder] = useState<SortOrder>('asc');
  const [errorsSortField, setErrorsSortField] = useState<'url' | 'errorCode'>('url');
  const [errorsSortOrder, setErrorsSortOrder] = useState<SortOrder>('asc');
  const [jobsSearchFilter, setJobsSearchFilter] = useState('');
  const [errorsSearchFilter, setErrorsSearchFilter] = useState('');
  const [jobsCurrentPage, setJobsCurrentPage] = useState(1);
  const [errorsCurrentPage, setErrorsCurrentPage] = useState(1);
  const [expandedDesc, setExpandedDesc] = useState<number | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const handleCompanyToggle = (company: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(company) ? prev.filter((c) => c !== company) : [...prev, company]
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search term');
      return;
    }

    if (selectedCompanies.length === 0) {
      alert('Please select at least one company');
      return;
    }

    setLoading(true);
    setJobsCurrentPage(1);
    setErrorsCurrentPage(1);
    try {
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          companies: selectedCompanies,
        }),
      });

      const data = await response.json();
      setJobs(data.jobs || []);
      setErrors(data.errors || []);
      setJobsSearchFilter('');
      setErrorsSearchFilter('');
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const sortJobs = (field: SortField) => {
    if (jobsSortField === field) {
      setJobsSortOrder(jobsSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setJobsSortField(field);
      setJobsSortOrder('asc');
    }
    setJobsCurrentPage(1);
  };

  const sortErrors = (field: 'url' | 'errorCode') => {
    if (errorsSortField === field) {
      setErrorsSortOrder(errorsSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setErrorsSortField(field);
      setErrorsSortOrder('asc');
    }
    setErrorsCurrentPage(1);
  };

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    return [...jobs]
      .filter((job) => {
        const searchLower = jobsSearchFilter.toLowerCase();
        return (
          job.jobTitle.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        let aVal = a[jobsSortField];
        let bVal = b[jobsSortField];

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal as string).toLowerCase();
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return jobsSortOrder === 'asc' ? comparison : -comparison;
      });
  }, [jobs, jobsSearchFilter, jobsSortField, jobsSortOrder]);

  // Pagination for jobs
  const jobsPageCount = Math.ceil(filteredAndSortedJobs.length / itemsPerPage);
  const paginatedJobs = filteredAndSortedJobs.slice(
    (jobsCurrentPage - 1) * itemsPerPage,
    jobsCurrentPage * itemsPerPage
  );

  // Filter and sort errors
  const filteredAndSortedErrors = useMemo(() => {
    return [...errors]
      .filter((error) => {
        const searchLower = errorsSearchFilter.toLowerCase();
        return (
          error.company.toLowerCase().includes(searchLower) ||
          error.url.toLowerCase().includes(searchLower) ||
          error.errorCode.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        const aVal = a[errorsSortField];
        const bVal = b[errorsSortField];

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return errorsSortOrder === 'asc' ? comparison : -comparison;
      });
  }, [errors, errorsSearchFilter, errorsSortField, errorsSortOrder]);

  // Pagination for errors
  const errorsPageCount = Math.ceil(filteredAndSortedErrors.length / itemsPerPage);
  const paginatedErrors = filteredAndSortedErrors.slice(
    (errorsCurrentPage - 1) * itemsPerPage,
    errorsCurrentPage * itemsPerPage
  );

  const downloadJobsCSV = () => {
    const headers = ['S.No', 'Company', 'Job Title', 'Description', 'Expiry Date', 'View Link', 'Apply Link'];
    const rows = filteredAndSortedJobs.map((job, idx) => [
      idx + 1,
      job.company,
      `"${job.jobTitle.replace(/"/g, '""')}"`,
      `"${job.description.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      job.expiryDate,
      job.url,
      job.applyLink,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    downloadCSV(csv, `jobs-${searchQuery}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadErrorsCSV = () => {
    const headers = ['S.No', 'Company', 'URL', 'Error Code', 'HTTP Status', 'Error Message'];
    const rows = filteredAndSortedErrors.map((err, idx) => [
      idx + 1,
      err.company,
      err.url,
      err.errorCode,
      err.httpStatus,
      `"${err.errorMessage.replace(/"/g, '""')}"`,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    downloadCSV(csv, `errors-${searchQuery}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const PaginationControls = ({ currentPage, pageCount, onPageChange, itemsPerPage, onItemsPerPageChange }: any) => (
    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
      <div style={{ fontSize: '0.9rem', color: '#555' }}>
        <div className="mb-2">
          Items per page:
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(parseInt(e.target.value));
              onPageChange(1); // Reset to first page
            }}
            style={{
              marginLeft: '0.5rem',
              padding: '0.375rem 0.5rem',
              borderColor: '#bdc3c7',
              borderRadius: '0.25rem',
              accentColor: '#2c3e50'
            }}
          >
            {ITEMS_PER_PAGE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        Page <strong>{currentPage}</strong> of <strong>{pageCount}</strong>
      </div>
      <nav aria-label="Pagination" className="ms-auto">
        <ul className="pagination mb-0">
          <li className="page-item" style={{ opacity: currentPage === 1 ? 0.5 : 1 }}>
            <button
              className="page-link"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              style={{ color: '#2c3e50', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              First
            </button>
          </li>
          <li className="page-item" style={{ opacity: currentPage === 1 ? 0.5 : 1 }}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ color: '#2c3e50', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Prev
            </button>
          </li>
          <li className="page-item">
            <input
              type="number"
              min="1"
              max={pageCount}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value) || 1;
                if (page >= 1 && page <= pageCount) onPageChange(page);
              }}
              style={{
                padding: '0.375rem 0.75rem',
                border: '1px solid #bdc3c7',
                borderRadius: '0.25rem',
                width: '60px',
                textAlign: 'center',
              }}
            />
          </li>
          <li className="page-item" style={{ opacity: currentPage === pageCount ? 0.5 : 1 }}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === pageCount}
              style={{ color: '#2c3e50', cursor: currentPage === pageCount ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </li>
          <li className="page-item" style={{ opacity: currentPage === pageCount ? 0.5 : 1 }}>
            <button
              className="page-link"
              onClick={() => onPageChange(pageCount)}
              disabled={currentPage === pageCount}
              style={{ color: '#2c3e50', cursor: currentPage === pageCount ? 'not-allowed' : 'pointer' }}
            >
              Last
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      <div style={{ flex: 1 }}>
        <div className="container py-5">
          {/* Header with GitHub Link */}
          <div className="card shadow-sm mb-5" style={{ borderColor: '#2c3e50', borderWidth: '2px' }}>
            <div className="card-body" style={{ backgroundColor: '#34495e', color: '#ecf0f1', padding: '2rem' }}>
              <div className="row align-items-center">
                <div className="col">
                  <h1 className="card-title mb-2">Job Search Portal</h1>
                  <p className="card-text mb-0">Search for positions across Amgen, Bayer, GSK, Novartis, and Pfizer</p>
                </div>
                <div className="col-auto">
                  <a href="https://github.com/saurabh-slackian/JobSearchMCP" target="_blank" rel="noopener noreferrer"
                    style={{ color: '#ecf0f1', textDecoration: 'none', fontSize: '0.9rem' }}>
                    → GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="card shadow-sm mb-5">
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label" style={{ color: '#2c3e50', fontWeight: '600' }}>
                  Job Search Query
                </label>
                <input type="text" className="form-control" placeholder="e.g., Manager, Engineer, Analyst..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ borderColor: '#bdc3c7' }} />
              </div>

              <div className="mb-4">
                <label className="form-label" style={{ color: '#2c3e50', fontWeight: '600' }}>
                  Select Companies
                </label>
                <div className="row">
                  {COMPANIES.map((company) => (
                    <div key={company} className="col-md-6 col-lg-4 mb-3">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id={company}
                          checked={selectedCompanies.includes(company)}
                          onChange={() => handleCompanyToggle(company)}
                          style={{ accentColor: '#2c3e50' }} />
                        <label className="form-check-label" htmlFor={company}>
                          <span style={{ textTransform: 'capitalize', color: '#34495e' }}>{company}</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleSearch} disabled={loading} className="btn w-100"
                style={{ backgroundColor: '#2c3e50', color: '#ecf0f1', fontWeight: '600', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Searching...' : 'Search Jobs'}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {(jobs.length > 0 || errors.length > 0) && (
            <>
              {/* Jobs Table */}
              {jobs.length > 0 && (
                <div className="card shadow-sm mb-5">
                  <div className="card-header" style={{ backgroundColor: '#34495e', color: '#ecf0f1' }}>
                    <div className="row align-items-center">
                      <div className="col">
                        <h5 className="mb-0">Search Results ({filteredAndSortedJobs.length})</h5>
                      </div>
                      <div className="col-auto">
                        <button onClick={downloadJobsCSV} className="btn btn-sm" style={{ backgroundColor: '#555', color: '#ecf0f1' }}>
                          Download CSV
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <input type="text" className="form-control form-control-sm" placeholder="Filter results..."
                        value={jobsSearchFilter}
                        onChange={(e) => {
                          setJobsSearchFilter(e.target.value);
                          setJobsCurrentPage(1);
                        }}
                        style={{ borderColor: '#bdc3c7' }} />
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover table-sm">
                        <thead style={{ backgroundColor: '#ecf0f1' }}>
                          <tr>
                            <th style={{ color: '#2c3e50', fontWeight: '600', width: '50px' }}>No.</th>
                            <th style={{ color: '#2c3e50', fontWeight: '600', width: '100px' }}>Company</th>
                            <th onClick={() => sortJobs('jobTitle')}
                              style={{ color: '#2c3e50', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                              title="Click to sort">
                              Job Title {jobsSortField === 'jobTitle' && (jobsSortOrder === 'asc' ? '▲' : '▼')}
                            </th>
                            <th style={{ color: '#2c3e50', fontWeight: '600', width: '150px' }}>
                              Description
                              <div style={{ fontSize: '0.7rem', fontWeight: 'normal', marginTop: '4px', color: '#888' }}>
                                (Click to expand)
                              </div>
                            </th>
                            <th onClick={() => sortJobs('expiryDate')}
                              style={{ color: '#2c3e50', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none', width: '100px' }}
                              title="Click to sort">
                              Expiry {jobsSortField === 'expiryDate' && (jobsSortOrder === 'asc' ? '▲' : '▼')}
                            </th>
                            <th style={{ color: '#2c3e50', fontWeight: '600', width: '80px' }}>View</th>
                            <th style={{ color: '#2c3e50', fontWeight: '600', width: '80px' }}>Apply</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedJobs.map((job, idx) => (
                            <tr key={idx} style={{ borderColor: '#bdc3c7' }}>
                              <td style={{ color: '#34495e', fontWeight: '500' }}>
                                {(jobsCurrentPage - 1) * itemsPerPage + idx + 1}
                              </td>
                              <td>
                                <span className="badge" style={{ backgroundColor: '#2c3e50', color: '#ecf0f1', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                  {job.company}
                                </span>
                              </td>
                              <td style={{ color: '#34495e', fontWeight: '500' }}>{job.jobTitle}</td>
                              <td style={{ color: '#555', fontSize: '0.85rem', cursor: 'help', maxWidth: '150px', position: 'relative' }}
                                title={job.description && job.description !== 'N/A' ? job.description : 'No full description available from search API'}
                                onClick={() => setExpandedDesc(expandedDesc === job.sno ? null : job.sno)}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: job.description && job.description !== 'N/A' ? 'underline' : 'none' }}>
                                  {job.description && job.description !== 'N/A' ? job.description.substring(0, 40) + '...' : 'ℹ️ No description'}
                                </div>
                                {expandedDesc === job.sno && job.description && job.description !== 'N/A' && (
                                  <div style={{ position: 'fixed', backgroundColor: '#fff', border: '2px solid #2c3e50', padding: '10px', borderRadius: '4px', zIndex: 1000, maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '5px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                    {job.description}
                                  </div>
                                )}
                              </td>
                              <td style={{ color: '#555', fontSize: '0.85rem' }}>{job.expiryDate}</td>
                              <td>
                                <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2c3e50', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '500' }}>
                                  View
                                </a>
                              </td>
                              <td>
                                <a href={job.applyLink} target="_blank" rel="noopener noreferrer" style={{ color: '#2c3e50', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '500' }}>
                                  Apply
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls currentPage={jobsCurrentPage} pageCount={jobsPageCount} onPageChange={setJobsCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} />
                  </div>
                </div>
              )}

              {/* Errors Table */}
              {errors.length > 0 && (
                <div className="card shadow-sm">
                  <div className="card-header" style={{ backgroundColor: '#c0392b', color: '#ecf0f1' }}>
                    <div className="row align-items-center">
                      <div className="col">
                        <h5 className="mb-0">Issues ({filteredAndSortedErrors.length})</h5>
                      </div>
                      <div className="col-auto">
                        <button onClick={downloadErrorsCSV} className="btn btn-sm" style={{ backgroundColor: '#a93226', color: '#ecf0f1' }}>
                          Download CSV
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <input type="text" className="form-control form-control-sm" placeholder="Filter issues..."
                        value={errorsSearchFilter}
                        onChange={(e) => {
                          setErrorsSearchFilter(e.target.value);
                          setErrorsCurrentPage(1);
                        }}
                        style={{ borderColor: '#bdc3c7' }} />
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover table-sm">
                        <thead style={{ backgroundColor: '#ecf0f1' }}>
                          <tr>
                            <th style={{ color: '#2c3e50', fontWeight: '600', width: '50px' }}>No.</th>
                            <th style={{ color: '#2c3e50', fontWeight: '600', width: '100px' }}>Company</th>
                            <th onClick={() => sortErrors('url')}
                              style={{ color: '#2c3e50', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                              title="Click to sort">
                              URL {errorsSortField === 'url' && (errorsSortOrder === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => sortErrors('errorCode')}
                              style={{ color: '#2c3e50', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                              title="Click to sort">
                              Error Code {errorsSortField === 'errorCode' && (errorsSortOrder === 'asc' ? '▲' : '▼')}
                            </th>
                            <th style={{ color: '#2c3e50', fontWeight: '600', width: '100px' }}>Status</th>
                            <th style={{ color: '#2c3e50', fontWeight: '600' }}>Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedErrors.map((error, idx) => (
                            <tr key={idx} style={{ borderColor: '#bdc3c7' }}>
                              <td style={{ color: '#34495e' }}>
                                {(errorsCurrentPage - 1) * itemsPerPage + idx + 1}
                              </td>
                              <td>
                                <span className="badge" style={{ backgroundColor: '#c0392b', color: '#ecf0f1', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                  {error.company}
                                </span>
                              </td>
                              <td>
                                <a href={error.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2c3e50', textDecoration: 'none', fontSize: '0.85rem' }}>
                                  {error.url.substring(0, 40)}...
                                </a>
                              </td>
                              <td style={{ color: '#555', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {error.errorCode}
                              </td>
                              <td style={{ color: '#555', fontSize: '0.85rem' }}>{error.httpStatus}</td>
                              <td style={{ color: '#555', fontSize: '0.85rem' }}>
                                {error.errorMessage.substring(0, 50)}...
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls currentPage={errorsCurrentPage} pageCount={errorsPageCount} onPageChange={setErrorsCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} />
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && jobs.length === 0 && errors.length === 0 && (
            <div className="card shadow-sm text-center">
              <div className="card-body py-5">
                <p style={{ color: '#555', fontSize: '1.1rem' }}>
                  Enter a search term and select companies to begin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#34495e', color: '#ecf0f1', padding: '2rem', marginTop: '2rem' }}>
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-0">
                <strong>JobSearchMCP</strong> - Multi-company job search aggregator
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-0">
                Developer: <strong>Saurabh</strong> | License: <strong>MIT</strong>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
