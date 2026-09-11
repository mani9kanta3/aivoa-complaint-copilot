import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowRight, ClipboardList, LoaderCircle, RefreshCw, Search } from 'lucide-react'
import { loadRecords, openComplaint } from './store'

export default function Records({ onOpen }) {
  const dispatch = useDispatch()
  const { records, recordsLoading, recordsError, loading, error } = useSelector(
    (state) => state.complaints
  )
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const visible = records.filter((record) => {
    const text = [
      record.reference,
      record.product_name,
      record.customer_name,
      record.batch_number
    ]
      .join(' ')
      .toLowerCase()
    return (
      text.includes(search.toLowerCase()) && (status === 'All' || record.status === status)
    )
  })

  async function open(id) {
    try {
      await dispatch(openComplaint(id)).unwrap()
      onOpen()
    } catch {
      return
    }
  }

  return (
    <section className="records-panel panel">
      <div className="records-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            aria-label="Search complaints"
            placeholder="Search product, customer, or batch…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          aria-label="Filter status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option>All</option>
          <option>Draft</option>
          <option>Logged</option>
        </select>
        <button
          className="secondary-button"
          disabled={recordsLoading || loading}
          onClick={() => dispatch(loadRecords())}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>
      {(recordsError || error) && (
        <div role="alert" className="error-message">
          {recordsError || error}
        </div>
      )}
      {recordsLoading ? (
        <div className="records-empty">
          <LoaderCircle size={24} className="spin" />
          <p>Loading complaints…</p>
        </div>
      ) : visible.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Complaint</th>
                <th>Customer</th>
                <th>Batch / lot</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Updated</th>
                <th>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((record) => (
                <tr key={record.id}>
                  <td>
                    <strong>{record.product_name || 'Untitled complaint'}</strong>
                    <small>{record.reference}</small>
                  </td>
                  <td>{record.customer_name || 'Not provided'}</td>
                  <td>{record.batch_number || 'Not provided'}</td>
                  <td>
                    <span
                      className={
                        'severity ' + record.severity.toLowerCase().replaceAll(' ', '-')
                      }
                    >
                      {record.severity || 'Not assessed'}
                    </span>
                  </td>
                  <td>
                    <span className={'status ' + record.status.toLowerCase()}>
                      {record.status}
                    </span>
                  </td>
                  <td>{new Date(record.updated_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="open-record"
                      disabled={loading}
                      onClick={() => open(record.id)}
                      aria-label={'Open ' + record.reference}
                    >
                      <ArrowRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="records-empty">
          <ClipboardList size={30} />
          <h2>
            {search || status !== 'All'
              ? 'No matching complaints'
              : 'Your complaints will appear here'}
          </h2>
          <p>
            {search || status !== 'All'
              ? 'Try a different search or status.'
              : 'Start with a message or document in Complaint intake.'}
          </p>
        </div>
      )}
      <div className="records-footer">
        {visible.length} record{visible.length === 1 ? '' : 's'} · Showing up to 100 recent
        complaints
      </div>
    </section>
  )
}
