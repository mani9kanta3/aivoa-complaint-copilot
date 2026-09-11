import os
from pathlib import Path

from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / '.env', encoding='utf-8-sig')
DATABASE_URL = os.getenv('DATABASE_URL', '')
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
GROQ_MODEL = os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')
MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_TEXT_LENGTH = 24000
