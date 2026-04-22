import os
from dotenv import load_dotenv

load_dotenv()

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_API_BASE = os.getenv("MINIMAX_API_BASE", "https://api.minimax.io/v1")
