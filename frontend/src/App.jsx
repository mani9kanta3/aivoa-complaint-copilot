import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  History,
  LoaderCircle,
  Plus,
  Save,
  ShieldCheck
} from 'lucide-react'
import ComplaintForm from './ComplaintForm'
import Copilot from './Copilot'
import Records from './Records'
import Activity from './Activity'
import { loadRecords, newComplaint, openComplaint, saveComplaint } from './store'

export default function App() {
  const dispatch = useDispatch()
  const { current, records, busy, saving, loading, notice, error } = useSelector(
    (state) => state.complaints
  )
  const [page, setPage] = useState('intake')
  const [tab, setTab] = useState('details')
  const [showHistory, setShowHistory] = useState(false)
  const [conversationKey, setConversationKey] = useState(0)
  const disabled = busy || saving || loading

  useEffect(() => {
    dispatch(loadRecords())
    const id = localStorage.getItem('aivoa-complaint-id')
    if (id) dispatch(openComplaint(id))
  }, [dispatch])

  useEffect(() => {
    if (current) localStorage.setItem('aivoa-complaint-id', current.id)
  }, [current])

  function startNew() {
    localStorage.removeItem('aivoa-complaint-id')
    dispatch(newComplaint())
    setConversationKey((value) => value + 1)
    setTab('details')
    setPage('intake')
    setShowHistory(false)
  }

  function openRecord() {
    setPage('intake')
    setTab('details')
    setConversationKey((value) => value + 1)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-symbol">
            <FlaskConical size={23} />
          </span>
          <span>
            AIVOA<span className="brand-dot">.</span>
          </span>
          <span className="brand-divider" />
          <span className="workspace-name">Quality Workspace</span>
        </div>
        <div className="workspace-label">
          <ShieldCheck size={16} />
          <span>API & FDF Quality Assurance</span>
        </div>
      </header>
      <div className="app-body">
        <nav className="sidebar" aria-label="Main navigation">
          <span className="nav-label">WORKSPACE</span>
          <button
            disabled={disabled}
            className={page === 'intake' ? 'active' : ''}
            onClick={() => setPage('intake')}
          >
            <FlaskConical size={19} />
            <span>Complaint intake</span>
          </button>
          <button
            disabled={disabled}
            className={page === 'records' ? 'active' : ''}
            onClick={() => {
              setPage('records')
              dispatch(loadRecords())
            }}
          >
            <ClipboardList size={19} />
            <span>Records</span>
            <small>{records.length}</small>
          </button>
          <div className="sidebar-bottom">
            <ShieldCheck size={21} />
            <strong>Complaint intake</strong>
            <p>
              Drafts and logged records
              <br />
              are saved in this workspace.
            </p>
          </div>
        </nav>
        <main>
          <div className="breadcrumb">
            Quality management
            <ChevronRight size={13} />
            <span>Customer complaints</span>
          </div>
          <div className="page-heading">
            <div>
              <div className="eyebrow">CUSTOMER COMPLAINTS</div>
              <h1>{page === 'intake' ? 'Customer complaint intake' : 'Complaint records'}</h1>
              <p>
                {page === 'intake'
                  ? 'Turn customer feedback into a clear, actionable complaint.'
                  : 'Reopen drafts, review assessments, and continue the conversation.'}
              </p>
            </div>
            <button
              className="secondary-button new-button"
              disabled={disabled}
              onClick={startNew}
            >
              <Plus size={17} />
              New complaint
            </button>
          </div>
          {notice && (
            <div role="status" className="success-message">
              <CheckCircle2 size={17} />
              {notice}
            </div>
          )}
          {page === 'intake' ? (
            <div className="intake-layout">
              <section className="complaint-panel panel" aria-busy={loading}>
                <header className="form-header">
                  <div>
                    <h2>Log Customer Complaint</h2>
                    <p>
                      {current ? current.reference : 'New complaint'}
                      <span>·</span>
                      {current?.status === 'Logged' ? 'Awaiting QA review' : 'Pending triage'}
                    </p>
                  </div>
                  <span
                    className={'status ' + (current?.status === 'Logged' ? 'logged' : 'draft')}
                  >
                    {current?.status || 'Draft'}
                  </span>
                </header>
                {loading ? (
                  <div className="loading-form">
                    <LoaderCircle className="spin" />
                    Loading complaint…
                  </div>
                ) : (
                  <ComplaintForm tab={tab} setTab={setTab} />
                )}
                <footer className="form-footer">
                  <div>
                    <button
                      className="history-button"
                      disabled={!current || disabled}
                      onClick={() => setShowHistory(true)}
                    >
                      <History size={16} />
                      Activity
                    </button>
                    <span>
                      {current ? 'Changes stored automatically' : 'No complaint created yet'}
                    </span>
                  </div>
                  <button
                    className="primary-button"
                    disabled={!current || disabled || current.status === 'Logged'}
                    onClick={() => dispatch(saveComplaint())}
                  >
                    {saving ? (
                      <LoaderCircle size={17} className="spin" />
                    ) : current?.status === 'Logged' ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      <Save size={17} />
                    )}
                    {saving
                      ? 'Saving…'
                      : current?.status === 'Logged'
                        ? 'Logged'
                        : 'Save complaint'}
                  </button>
                </footer>
              </section>
              <Copilot key={conversationKey} />
            </div>
          ) : (
            <Records onOpen={openRecord} />
          )}
          {error && page === 'intake' && loading && (
            <div role="alert" className="error-message">
              {error}
            </div>
          )}
          <footer className="page-footer">
            <span>AIVOA · Customer Complaint Management</span>
            <span>Powered by LangGraph</span>
          </footer>
        </main>
      </div>
      {showHistory && <Activity complaint={current} onClose={() => setShowHistory(false)} />}
    </div>
  )
}
