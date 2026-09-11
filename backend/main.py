import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy import select, text, update
from sqlalchemy.exc import SQLAlchemyError

from backend.ai import AIError, complaint_graph
from backend.config import MAX_FILE_SIZE, ROOT
from backend.database import Base, Complaint, SessionLocal, engine, now, serialize
from backend.documents import extract_document
from backend.schemas import ChatRequest, ComplaintData, SaveRequest


@asynccontextmanager
async def lifespan(app):
    upload_temp = ROOT / '.cache' / 'uploads'
    upload_temp.mkdir(parents=True, exist_ok=True)
    tempfile.tempdir = str(upload_temp)
    Base.metadata.create_all(engine)
    yield
    engine.dispose()


app = FastAPI(title='AIVOA Customer Complaints', lifespan=lifespan)


@app.exception_handler(SQLAlchemyError)
async def database_error(request, error):
    return JSONResponse(status_code=503, content={'detail': 'The database is unavailable. Check Docker Desktop and try again.'})


@app.exception_handler(AIError)
async def ai_error(request, error):
    return JSONResponse(status_code=502, content={'detail': str(error)})


@app.get('/api/health')
def health():
    with SessionLocal() as db:
        db.execute(text('SELECT 1'))
    return {'status': 'ok', 'database': 'connected'}


@app.get('/api/complaints')
def list_complaints():
    with SessionLocal() as db:
        rows = db.scalars(select(Complaint).order_by(Complaint.updated_at.desc()).limit(100)).all()
        return [
            {
                'id': row.id,
                'reference': 'CC-' + row.id[:8].upper(),
                'product_name': row.data.get('product_name', ''),
                'customer_name': row.data.get('customer_name', ''),
                'batch_number': row.data.get('batch_number', ''),
                'status': row.status,
                'severity': row.risk.get('severity', ''),
                'updated_at': row.updated_at.isoformat(),
            }
            for row in rows
        ]


@app.get('/api/complaints/{complaint_id}')
def get_complaint(complaint_id: str):
    with SessionLocal() as db:
        row = db.get(Complaint, complaint_id)
        if row is None:
            raise HTTPException(404, 'Complaint not found.')
        return serialize(row)


def process_complaint(message, complaint_id=None, version=None, document_text='', source='Chat', filename=''):
    with SessionLocal() as db:
        row = db.get(Complaint, complaint_id) if complaint_id else None
        if complaint_id and row is None:
            raise HTTPException(404, 'Complaint not found. Start a new complaint.')
        if row and version != row.version:
            raise HTTPException(409, 'This complaint changed in another window. Reopen it from Records before editing.')
        old_data = row.data if row else ComplaintData().model_dump()
        old_messages = row.messages if row else []
        old_history = row.history if row else []
        old_risk = row.risk if row else {}

    result = complaint_graph.invoke({
        'message': message,
        'document_text': document_text,
        'source': source,
        'data': old_data,
        'is_edit': bool(row),
        'reply': '',
        'risk': old_risk,
        'missing_fields': [],
        'changed_fields': [],
        'steps': [],
    })
    if not row and not result['changed_fields']:
        return {'complaint': None, 'reply': result['reply'], 'steps': result['steps'], 'changed_fields': []}

    timestamp = now()
    user_text = message
    if filename:
        user_text = f'Uploaded {filename}' + (f'\n{message}' if message else '')
    messages = old_messages + [
        {'role': 'user', 'content': user_text, 'time': timestamp.isoformat()},
        {'role': 'assistant', 'content': result['reply'], 'time': timestamp.isoformat(), 'steps': result['steps']},
    ]
    changes = [
        {'field': key, 'before': old_data.get(key, ''), 'after': result['data'][key]}
        for key in result['changed_fields']
    ]
    history = old_history
    if changes:
        history = old_history + [{'time': timestamp.isoformat(), 'action': 'Updated' if row else 'Created', 'changes': changes}]

    values = {
        'data': result['data'],
        'risk': result['risk'],
        'missing_fields': result['missing_fields'],
        'messages': messages,
        'history': history,
        'updated_at': timestamp,
        'status': 'Draft' if changes or not row else row.status,
    }
    with SessionLocal() as db:
        if row:
            values['version'] = version + 1
            query = update(Complaint).where(Complaint.id == complaint_id, Complaint.version == version).values(**values)
            if db.execute(query).rowcount != 1:
                db.rollback()
                raise HTTPException(409, 'This complaint changed while AI was working. Reopen it from Records and try again.')
            db.commit()
            saved = db.get(Complaint, complaint_id)
        else:
            saved = Complaint(**values)
            db.add(saved)
            db.commit()
            db.refresh(saved)
        return {
            'complaint': serialize(saved),
            'reply': result['reply'],
            'steps': result['steps'],
            'changed_fields': result['changed_fields'],
        }


@app.post('/api/assistant')
def assistant(body: ChatRequest):
    return process_complaint(body.message, body.complaint_id, body.version)


@app.post('/api/extract')
def extract(
    file: UploadFile = File(...),
    message: str = Form(''),
    complaint_id: str | None = Form(None),
    version: int | None = Form(None),
):
    if len(message) > 24000:
        raise HTTPException(422, 'Keep your message under 24,000 characters.')
    try:
        content = file.file.read(MAX_FILE_SIZE + 1)
        document_text = extract_document(file.filename or '', content)
    except ValueError as error:
        raise HTTPException(400, str(error)) from error
    finally:
        file.file.close()
    extension = Path(file.filename or '').suffix.lower()
    source = 'Email' if extension == '.eml' else extension.lstrip('.').upper() + ' upload'
    return process_complaint(message.strip(), complaint_id, version, document_text, source, Path(file.filename or '').name)


@app.post('/api/complaints/{complaint_id}/save')
def save_complaint(complaint_id: str, body: SaveRequest):
    with SessionLocal() as db:
        row = db.get(Complaint, complaint_id)
        if not row:
            raise HTTPException(404, 'Complaint not found.')
        if body.version != row.version:
            raise HTTPException(409, 'This complaint changed. Reopen it from Records before saving.')
        if not all(row.data.get(key) for key in ['product_name', 'batch_number', 'description']):
            raise HTTPException(400, 'Add the product name, batch number, and complaint description through Copilot before saving.')
        if row.status == 'Logged':
            return serialize(row)
        timestamp = now()
        history = row.history + [{'time': timestamp.isoformat(), 'action': 'Logged for QA review', 'changes': []}]
        query = update(Complaint).where(Complaint.id == complaint_id, Complaint.version == body.version).values(
            status='Logged', version=body.version + 1, updated_at=timestamp, history=history,
        )
        if db.execute(query).rowcount != 1:
            db.rollback()
            raise HTTPException(409, 'This complaint changed. Reopen it from Records before saving.')
        db.commit()
        db.refresh(row)
        return serialize(row)
