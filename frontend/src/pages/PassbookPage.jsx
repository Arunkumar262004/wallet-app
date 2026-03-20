import React, { useEffect, useState, useCallback } from 'react';
import { getPassbook } from '../common_api/api';

// Format number as Indian Rupee
const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

// Format date to readable string
const formatDate = (d) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const FILTERS = [
  { label: 'All',     value: ''       },
  { label: 'Credits', value: 'credit' },
  { label: 'Debits',  value: 'debit'  },
];

export default function PassbookPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [pagination,   setPagination]   = useState(null);
  const [filter,       setFilter]       = useState('');
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);

  // Fetch transactions whenever page or filter changes
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getPassbook({ page, limit: 10, type: filter || undefined });
      setTransactions(data.transactions);
      setSummary(data.summary);
      setPagination(data.pagination);
    } catch {
      // Errors handled by axios interceptor
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
     document.title = 'Passbook';
    loadTransactions();
  }, [loadTransactions]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1);
  };

  return (
    <div>

      {/* ── Summary Stats ── */}
      {summary && (
        <div className="grid-3 mb-20">

          <div className="stat-card">
            <div className="stat-icon green"><i className="bi bi-graph-up-arrow" /></div>
            <div>
              <div className="stat-label">Total Credited</div>
              <div className="stat-value">{formatCurrency(summary.total_credited)}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red"><i className="bi bi-graph-down-arrow" /></div>
            <div>
              <div className="stat-label">Total Debited</div>
              <div className="stat-value">{formatCurrency(summary.total_debited)}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple"><i className="bi bi-arrow-left-right" /></div>
            <div>
              <div className="stat-label">Total Transactions</div>
              <div className="stat-value">{summary.total_transactions}</div>
            </div>
          </div>

        </div>
      )}

      {/* ── Transaction History Card ── */}
      <div className="card">

        {/* Header + Filter Tabs */}
        <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>
            <i className="bi bi-journal-text" /> Transaction History
          </div>
          <div className="filter-tabs" style={{ margin: 0 }}>
            {FILTERS.map(f => (
              <button
                key={f.value}
                className={`filter-tab${filter === f.value ? ' active' : ''}`}
                onClick={() => handleFilterChange(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="page-loader">
            <div className="spinner" />
          </div>
        )}

        {/* Empty State */}
        {!loading && transactions.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><i className="bi bi-inbox" /></div>
            <div className="empty-title">No transactions found</div>
            <div className="empty-desc">
              {filter ? 'No transactions match this filter.' : 'Add money to your wallet to get started.'}
            </div>
          </div>
        )}

        {/* Transaction List */}
        {!loading && transactions.length > 0 && (
          <>
            <div className="tx-list">
              {transactions.map(tx => {
                const isCredit = tx.type === 'credit';
                return (
                  <div key={tx.id} className="tx-item">

                    {/* Credit = down arrow (green), Debit = up arrow (red) */}
                    <div className={`tx-icon ${tx.type}`}>
                      <i className={`bi ${isCredit ? 'bi-arrow-down-circle-fill' : 'bi-arrow-up-circle-fill'}`} />
                    </div>

                    <div className="tx-info">
                      <div className="tx-desc">{tx.description}</div>
                      <div className="tx-date">{formatDate(tx.created_at)}</div>
                      {tx.reference_id && (
                        <div className="tx-ref">Ref: {tx.reference_id}</div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className={`tx-amount ${tx.type}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                      <div className="text-sm text-muted" style={{ marginTop: 2 }}>
                        Bal: {formatCurrency(tx.balance_after)}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* ── Pagination ── */}
            {pagination && pagination.total_pages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>
                  <i className="bi bi-chevron-double-left" />
                </button>
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <i className="bi bi-chevron-left" />
                </button>

                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - page) <= 2)
                  .map(p => (
                    <button
                      key={p}
                      className={`page-btn${p === page ? ' active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}

                <button className="page-btn" disabled={page === pagination.total_pages} onClick={() => setPage(p => p + 1)}>
                  <i className="bi bi-chevron-right" />
                </button>
                <button className="page-btn" disabled={page === pagination.total_pages} onClick={() => setPage(pagination.total_pages)}>
                  <i className="bi bi-chevron-double-right" />
                </button>
              </div>
            )}

            {/* Showing X–Y of Z */}
            {pagination && (
              <div className="text-center text-sm text-muted mt-12">
                Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, pagination.total_records)} of {pagination.total_records} transactions
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}