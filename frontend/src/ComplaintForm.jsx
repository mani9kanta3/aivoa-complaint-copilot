import { Check, ClipboardCheck, ShieldCheck, Sparkles } from 'lucide-react'
import { useSelector } from 'react-redux'

const sections = [
  {
    title: 'Origin & customer details',
    fields: [
      ['complaint_source', 'Complaint source'],
      ['customer_name', 'Customer name'],
      ['customer_contact', 'Customer contact', true]
    ]
  },
  {
    title: 'Product & batch identification',
    fields: [
      ['product_name', 'Product name'],
      ['product_type', 'Product type'],
      ['product_strength', 'Strength / grade'],
      ['batch_number', 'Batch / lot number'],
      ['manufacturing_date', 'Manufacturing date'],
      ['expiry_date', 'Expiry / retest date'],
      ['quantity_affected', 'Quantity affected']
    ]
  },
  {
    title: 'Facility & material impact',
    fields: [
      ['site_block', 'Originating site / block'],
      ['impacted_materials', 'Impacted non-product materials']
    ]
  },
  {
    title: 'Complaint details',
    fields: [
      ['complaint_type', 'Complaint type'],
      ['complaint_date', 'Complaint date'],
      ['description', 'Detailed complaint description', true]
    ]
  }
]

export function RiskAssessment({ risk }) {
  if (!risk?.severity) {
    return (
      <div className="risk-empty">
        <ShieldCheck size={24} />
        <div>
          <strong>Risk assessment appears here</strong>
          <p>Copilot will assess the complaint after you share the details.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="risk-content">
      <div className="assessment-note">
        <ShieldCheck size={16} /> Preliminary assessment · QA review required
      </div>
      <div className="risk-badges">
        <div>
          <span className="eyebrow">Initial severity</span>
          <strong className={'severity ' + risk.severity.toLowerCase().replaceAll(' ', '-')}>
            {risk.severity}
          </strong>
        </div>
        <div>
          <span className="eyebrow">Priority</span>
          <strong>{risk.priority}</strong>
        </div>
      </div>
      <div className="risk-block">
        <h4>Complaint summary</h4>
        <p>{risk.summary}</p>
      </div>
      <div className="risk-block">
        <h4>Assessment rationale</h4>
        <p>{risk.rationale}</p>
      </div>
      <div className="next-action">
        <ClipboardCheck size={19} />
        <div>
          <h4>Recommended next action</h4>
          <p>{risk.next_action}</p>
        </div>
      </div>
      <div className="risk-block">
        <h4>Possible root causes</h4>
        <p className="muted">Suggestions to investigate, not confirmed findings.</p>
        <ul>
          {risk.potential_root_causes.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="risk-block">
        <h4>CAPA recommendations</h4>
        <ul>
          {risk.capa_recommendations.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function ComplaintForm({ tab, setTab }) {
  const { current, changedFields } = useSelector((state) => state.complaints)
  const data = current?.data || {}
  const missing = current?.missing_fields || []
  const completed = current ? 8 - missing.length : 0

  return (
    <>
      <div className="form-tabs" role="tablist" aria-label="Complaint sections">
        <button
          role="tab"
          aria-selected={tab === 'details'}
          onClick={() => setTab('details')}
          className={tab === 'details' ? 'active' : ''}
        >
          Complaint details
        </button>
        <button
          role="tab"
          aria-selected={tab === 'risk'}
          onClick={() => setTab('risk')}
          className={tab === 'risk' ? 'active' : ''}
        >
          AI risk assessment {current?.risk?.severity && <span className="tab-indicator" />}
        </button>
      </div>
      <div
        className="form-scroll"
        role="tabpanel"
        aria-label={tab === 'details' ? 'Complaint details' : 'AI risk assessment'}
      >
        {tab === 'details' ? (
          <>
            <div className="auto-fill-note">
              <Sparkles size={15} />
              <span>Filled by Copilot. Use chat to add or correct details.</span>
            </div>
            {sections.map((section, index) => (
              <section className="field-section" key={section.title}>
                <h3>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {section.title}
                </h3>
                <div className="field-grid">
                  {section.fields.map(([key, label, wide]) => (
                    <div
                      className={
                        'field ' +
                        (wide ? 'wide ' : '') +
                        (changedFields.includes(key) ? 'updated' : '')
                      }
                      key={key}
                    >
                      <label htmlFor={key}>
                        {label}
                        {changedFields.includes(key) && (
                          <Check size={13} aria-label="Updated by AI" />
                        )}
                      </label>
                      {key === 'description' ? (
                        <textarea
                          id={key}
                          readOnly
                          value={data[key] || ''}
                          placeholder="Awaiting complaint details…"
                          rows={4}
                        />
                      ) : (
                        <input
                          id={key}
                          readOnly
                          value={data[key] || ''}
                          placeholder="Not provided"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <section className="completeness">
              <div className="completeness-heading">
                <h3>
                  <ClipboardCheck size={17} /> Complaint completeness
                </h3>
                <span>{completed}/8 details</span>
              </div>
              <div className="completion-track">
                <div style={{ width: (completed / 8) * 100 + '%' }} />
              </div>
              {current ? (
                <p>
                  {missing.length
                    ? 'Still needed: ' + missing.join(', ') + '.'
                    : 'All key intake details are present. Review the AI assessment before saving.'}
                </p>
              ) : (
                <p>Share a complaint to check which details are still needed.</p>
              )}
            </section>
          </>
        ) : (
          <RiskAssessment risk={current?.risk} />
        )}
      </div>
    </>
  )
}
