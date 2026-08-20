'use client';

import { useState, useEffect } from 'react';

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

type SortField = 'jobTitle' | 'company' | 'expiryDate' | 'url';
type SortOrder = 'asc' | 'desc';

const COMPANIES = ['amgen', 'bayer', 'gsk', 'novartis', 'pfizer'];

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
  };

  const sortErrors = (field: 'url' | 'errorCode') => {
    if (errorsSortField === field) {
      setErrorsSortOrder(errorsSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setErrorsSortField(field);
      setErrorsSortOrder('asc');
    }
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    let aVal = a[jobsSortField];
    let bVal = b[jobsSortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }

    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return jobsSortOrder === 'asc' ? comparison : -comparison;
  });

  const sortedErrors = [...errors].sort((a, b) => {
    const aVal = a[errorsSortField];
    const bVal = b[errorsSortField];

    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return errorsSortOrder === 'asc' ? comparison : -comparison;
  });

  const downloadJobsCSV = () => {
    const headers = ['S.No', 'Company', 'Job Title', 'Description', 'Expiry Date', 'URL'];
    const rows = jobs.map((job) => [
      job.sno,
      job.company,
      `"${job.jobTitle.replace(/"/g, '""')}"`,
      `"${job.description.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      job.expiryDate,
      job.url,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    downloadCSV(csv, `jobs-${searchQuery}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadErrorsCSV = () => {
    const headers = ['S.No', 'Company', 'URL', 'Error Code', 'HTTP Status', 'Error Message'];
    const rows = errors.map((err) => [
      err.sno,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🔍 Job Search Portal
          </h1>
          <p className="text-gray-600">
            Search for jobs across Amgen, Bayer, GSK, Novartis, and Pfizer careers sites
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          {/* Search Box */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Job Search Query
            </label>
            <input
              type="text"
              placeholder="e.g., Manager, Engineer, Analyst..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Company Selection */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              Select Companies
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {COMPANIES.map((company) => (
                <label key={company} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(company)}
                    onChange={() => handleCompanyToggle(company)}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-gray-700 font-medium capitalize">{company}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            {loading ? '🔄 Searching...' : '🔍 Search Jobs'}
          </button>
        </div>

        {/* Results Section */}
        {(jobs.length > 0 || errors.length > 0) && (
          <>
            {/* Jobs Table */}
            {jobs.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    ✅ Found Jobs ({jobs.length})
                  </h2>
                  <button
                    onClick={downloadJobsCSV}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    📥 Download CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">S.No</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Company</th>
                        <th
                          onClick={() => sortJobs('jobTitle')}
                          className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                        >
                          Job Title{' '}
                          {jobsSortField === 'jobTitle' && (jobsSortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Description
                        </th>
                        <th
                          onClick={() => sortJobs('expiryDate')}
                          className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                        >
                          Expiry Date{' '}
                          {jobsSortField === 'expiryDate' && (jobsSortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedJobs.map((job, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-200 hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-3 text-gray-700">{job.sno}</td>
                          <td className="px-4 py-3">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium text-xs uppercase">
                              {job.company}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{job.jobTitle}</td>
                          <td className="px-4 py-3 text-gray-600">
                            <div className="max-w-xs truncate" title={job.description}>
                              {job.description.substring(0, 50)}...
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{job.expiryDate}</td>
                          <td className="px-4 py-3">
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 hover:underline text-xs"
                            >
                              View Job →
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Errors Table */}
            {errors.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    ⚠️ Extraction Errors ({errors.length})
                  </h2>
                  <button
                    onClick={downloadErrorsCSV}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    📥 Download CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">S.No</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Company</th>
                        <th
                          onClick={() => sortErrors('url')}
                          className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                        >
                          URL {errorsSortField === 'url' && (errorsSortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => sortErrors('errorCode')}
                          className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                        >
                          Error Code{' '}
                          {errorsSortField === 'errorCode' && (errorsSortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          HTTP Status
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Error Message
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedErrors.map((error, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-200 hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-3 text-gray-700">{error.sno}</td>
                          <td className="px-4 py-3">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium text-xs uppercase">
                              {error.company}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={error.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 hover:underline text-xs"
                            >
                              {error.url.substring(0, 50)}...
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-medium text-xs">
                              {error.errorCode}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-700">{error.httpStatus}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {error.errorMessage.substring(0, 50)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && jobs.length === 0 && errors.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">
              👆 Start by entering a search term and selecting companies
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
