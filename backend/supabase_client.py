# supabase.py
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()  # so .env variables are available

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")  # or service role key if backend only

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
