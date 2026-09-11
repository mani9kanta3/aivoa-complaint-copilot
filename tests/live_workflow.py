import json
import time
from pathlib import Path

import httpx


base = 'http://127.0.0.1:5173/api'
client = httpx.Client(timeout=180)
results = []


def check(name, condition):
    if not condition:
        raise AssertionError(name)
    results.append(name)
    print('PASS:', name, flush=True)


def post(path, **kwargs):
    for attempt in range(4):
        response = client.post(base + path, **kwargs)
        if response.status_code == 502 and 'usage limit' in response.text and attempt < 3:
            print('Groq usage limit reached. Retrying this step in 30 seconds.', flush=True)
            time.sleep(30)
            continue
        break
    if response.status_code != 200:
        raise RuntimeError(f'{path}: {response.status_code} {response.text}')
    return response.json()


check('Database health through frontend proxy', client.get(base + '/health').status_code == 200)
created = post('/assistant', json={'message': 'Apollo Pharmacy reports brown spots on Amoxicillin capsules 500 mg. Batch AMX260701. 24 capsules affected. Manufactured 2026-07-01, expiry 2028-06-30. Complaint date 2026-09-10. Contact quality@apollo.example. Product type FDF. Site Hyderabad Block B. Patient exposure is unknown.'})
record = created['complaint']
check('Real Groq extraction creates complaint', record['data']['batch_number'] == 'AMX260701' and 'Amoxicillin' in record['data']['product_name'])
check('Risk assessment returned', bool(record['risk']['severity'] and record['risk']['rationale']))
before = record['data'].copy()
edited = post('/assistant', json={'complaint_id': record['id'], 'version': record['version'], 'message': 'Sorry, the batch number is BMX24602 and the affected quantity is 48 capsules.'})
record = edited['complaint']
check('Natural-language batch and quantity correction', record['data']['batch_number'] == 'BMX24602' and '48' in record['data']['quantity_affected'])
check('Unrelated fields preserved exactly', all(record['data'][key] == value for key, value in before.items() if key not in ['batch_number', 'quantity_affected']))
check('Updated batch included in new risk summary', 'BMX24602' in record['risk']['summary'])
saved = post('/complaints/' + record['id'] + '/save', json={'version': record['version']})
check('Complaint saved for QA', saved['status'] == 'Logged')
loaded = client.get(base + '/complaints/' + saved['id']).json()
check('Saved complaint and conversation persist', loaded['data'] == record['data'] and len(loaded['messages']) == 4)
stale = client.post(base + '/complaints/' + record['id'] + '/save', json={'version': 1})
check('Stale edits rejected', stale.status_code == 409)
check('Blank message rejected', client.post(base + '/assistant', json={'message': '   '}).status_code == 422)
check('Unsupported upload rejected', client.post(base + '/extract', files={'file': ('bad.exe', b'invalid data')}).status_code == 400)
pdf = Path('samples/metformin-complaint.pdf')
uploaded = post('/extract', files={'file': (pdf.name, pdf.read_bytes(), 'application/pdf')})
record = uploaded['complaint']
check('PDF extracts product, batch and grade', record['data']['batch_number'] == 'MFH260712A' and 'Metformin' in record['data']['product_name'] and 'IP' in record['data']['product_strength'])
check('Document extraction node executed', uploaded['steps'][0] == 'Document extraction')
before = record['data'].copy()
edited = post('/assistant', json={'complaint_id': record['id'], 'version': record['version'], 'message': 'Sorry, the batch number is CHG260712A and affected quantity is 50 kg in 2 HDPE drums.'})
record = edited['complaint']
check('Extracted PDF complaint can be corrected', record['data']['batch_number'] == 'CHG260712A' and '50' in record['data']['quantity_affected'])
check('PDF correction preserves other fields', all(record['data'][key] == value for key, value in before.items() if key not in ['batch_number', 'quantity_affected']))
check('Risk refreshed after PDF correction', 'CHG260712A' in record['risk']['summary'])
post('/complaints/' + record['id'] + '/save', json={'version': record['version']})
eml = Path('samples/amoxicillin-complaint.eml')
email_result = post('/extract', files={'file': (eml.name, eml.read_bytes(), 'message/rfc822')})
check('EML extraction works with real AI', email_result['complaint']['data']['batch_number'] == 'AMX260701')
check('History contains field changes', len(record['history']) == 2 and bool(record['history'][1]['changes']))
Path('tests/live-results.json').write_text(json.dumps({'passed': len(results), 'checks': results}, indent=2), encoding='utf-8')
print(f'All {len(results)} live checks passed.', flush=True)
