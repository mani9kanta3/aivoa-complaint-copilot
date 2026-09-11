import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  ArrowUp,
  Check,
  FileText,
  LoaderCircle,
  Paperclip,
  Sparkles,
  UploadCloud,
  X
} from 'lucide-react'
import { sendMessage } from './store'

const sample =
  'Apollo Pharmacy reported discolored Amoxicillin capsules 500 mg, batch AMX260701, manufactured 2026-07-01, expiry 2028-06-30. 24 capsules are affected. Complaint received on 2026-09-10. Contact: quality@apollo.example. The capsules have brown spots inside intact blister packs. Product type: FDF. Site: Hyderabad, Block B. No patient outcome information is available.'

export default function Copilot() {
  const dispatch = useDispatch()
  const { current, messages, busy, saving, loading, error } = useSelector(
    (state) => state.complaints
  )
  const [message, setMessage] = useState('')
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [dragging, setDragging] = useState(false)
  const input = useRef(null)
  const end = useRef(null)
  const disabled = busy || saving || loading

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, busy])

  function selectFile(selected) {
    setFileError('')
    if (!selected) return
    if (!/\.(pdf|docx|txt|eml)$/i.test(selected.name)) {
      setFileError('Choose a PDF, DOCX, TXT, or EML file.')
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFileError('The file is too large. The limit is 10 MB.')
      return
    }
    if (!selected.size) {
      setFileError('The selected file is empty.')
      return
    }
    setFile(selected)
  }

  async function submit(event) {
    event.preventDefault()
    if (disabled || (!message.trim() && !file)) return
    try {
      await dispatch(sendMessage({ message: message.trim(), file })).unwrap()
      setMessage('')
      setFile(null)
    } catch {
      return
    }
  }

  return (
    <aside className="copilot panel">
      <header className="copilot-header">
        <div className="copilot-icon">
          <Sparkles size={21} />
        </div>
        <div>
          <h2>AIVOA Copilot</h2>
          <p>Your complaint intake assistant</p>
        </div>
        <span className="ai-badge">AI</span>
      </header>
      <div className="upload-area">
        <button
          className={'dropzone ' + (dragging ? 'dragging' : '')}
          disabled={disabled}
          onClick={() => input.current.click()}
          onDragOver={(event) => {
            event.preventDefault()
            if (!disabled) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            if (!disabled) selectFile(event.dataTransfer.files[0])
          }}
        >
          <UploadCloud size={22} />
          <span>
            <strong>Upload a complaint</strong>
            <span>
              Drop a file here or <b>browse files</b>
            </span>
          </span>
        </button>
        <input
          type="file"
          ref={input}
          className="file-input"
          accept=".pdf,.docx,.txt,.eml"
          aria-label="Upload complaint document"
          onChange={(event) => {
            selectFile(event.target.files[0])
            event.target.value = ''
          }}
        />
        <p className="file-help">PDF, DOCX, TXT, EML · Up to 10 MB · Text-based files</p>
      </div>
      <div
        className="chat-messages"
        role="log"
        aria-label="Copilot conversation"
        aria-live="polite"
        aria-busy={busy}
      >
        <div className="chat-divider">
          <span>{current ? current.reference : 'New conversation'}</span>
        </div>
        <div className="chat-row assistant">
          <div className="message-avatar">
            <Sparkles size={14} />
          </div>
          <div className="bubble">
            <p>
              Ready when you are. Paste a customer complaint or upload a document. I’ll fill
              the form and prepare an initial risk assessment.
            </p>
            <p>You can ask me to correct the details at any time.</p>
          </div>
        </div>
        {!messages.length && (
          <div className="sample-prompt">
            <span>TRY A SAMPLE</span>
            <button disabled={disabled} onClick={() => setMessage(sample)}>
              <FileText size={16} />
              <span>Discolored Amoxicillin capsules</span>
              <span>↗</span>
            </button>
          </div>
        )}
        {messages.map((item, index) => (
          <div key={index} className={'chat-row ' + item.role}>
            {item.role === 'assistant' && (
              <div className="message-avatar">
                <Sparkles size={14} />
              </div>
            )}
            <div className="bubble">
              <p>{item.content}</p>
              {item.steps && (
                <div className="tool-steps">
                  {item.steps.map((step) => (
                    <span key={step}>
                      <Check size={11} />
                      {step}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="chat-row assistant">
            <div className="message-avatar">
              <Sparkles size={14} />
            </div>
            <div className="bubble processing">
              <LoaderCircle className="spin" size={16} />
              <span>Reading details and assessing risk…</span>
            </div>
          </div>
        )}
        <div ref={end} />
      </div>
      <div className="composer-area">
        {(error || fileError) && (
          <div className="error-message" role="alert">
            {fileError || error}
          </div>
        )}
        {file && (
          <div className="selected-file">
            <FileText size={16} />
            <span>{file.name}</span>
            <button
              aria-label="Remove attachment"
              disabled={disabled}
              onClick={() => setFile(null)}
            >
              <X size={15} />
            </button>
          </div>
        )}
        <form className="composer" onSubmit={submit}>
          <textarea
            aria-label="Message Copilot"
            placeholder={
              current
                ? 'Tell Copilot what to update…'
                : 'Paste a complaint or write a message…'
            }
            value={message}
            maxLength={24000}
            disabled={disabled}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing)
                submit(event)
            }}
            rows={3}
          />
          <div className="composer-actions">
            <button
              type="button"
              className="attach-button"
              aria-label="Attach complaint document"
              disabled={disabled}
              onClick={() => input.current.click()}
            >
              <Paperclip size={18} />
            </button>
            <span>Enter to send · Shift + Enter for a new line</span>
            <button
              className="send-button"
              type="submit"
              aria-label="Send message"
              disabled={disabled || (!message.trim() && !file)}
            >
              {busy ? <LoaderCircle size={18} className="spin" /> : <ArrowUp size={19} />}
            </button>
          </div>
        </form>
        <p className="copilot-footnote">
          AI can make mistakes. Review the details before saving.
        </p>
      </div>
    </aside>
  )
}
