import assert from 'node:assert/strict'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Provider } from 'react-redux'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true } })
try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx')
  const { store, openComplaint } = await server.ssrLoadModule('/src/store.js')
  const { RiskAssessment } = await server.ssrLoadModule('/src/ComplaintForm.jsx')
  const empty = renderToString(
    React.createElement(Provider, { store }, React.createElement(App))
  )
  assert.ok(empty.includes('Log Customer Complaint'))
  assert.ok(empty.includes('AIVOA Copilot'))
  assert.ok(empty.includes('readOnly'))
  const records = await (await fetch('http://127.0.0.1:8000/api/complaints')).json()
  const record = await (
    await fetch('http://127.0.0.1:8000/api/complaints/' + records[0].id)
  ).json()
  store.dispatch(openComplaint.fulfilled(record, 'render-check', record.id))
  const filled = renderToString(
    React.createElement(Provider, { store }, React.createElement(App))
  )
  assert.ok(filled.includes(record.data.batch_number))
  assert.ok(filled.includes(record.reference))
  const assessment = renderToString(React.createElement(RiskAssessment, { risk: record.risk }))
  assert.ok(assessment.includes(record.risk.severity))
  assert.ok(assessment.includes('Recommended next action'))
  console.log(
    'PASS: Empty intake, populated complaint, and risk assessment render successfully.'
  )
} finally {
  await server.close()
}
