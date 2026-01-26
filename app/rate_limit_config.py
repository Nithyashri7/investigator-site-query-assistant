"""
Rate limiting and API configuration settings.

These settings help prevent 429 errors from OpenRouter API.
"""

# Maximum requests per minute to OpenRouter API
MAX_REQUESTS_PER_MINUTE = 30

# Minimum interval (in seconds) between API requests
MIN_REQUEST_INTERVAL = 2.0

# Maximum number of retry attempts for a single request
MAX_RETRY_ATTEMPTS = 5

# Base wait time in seconds (exponential backoff multiplier)
BASE_WAIT_TIME = 1

# Maximum wait time for retry (in seconds)
MAX_WAIT_TIME = 30

# Response cache TTL (time to live) in seconds
# Caches responses for 1 hour to avoid duplicate API calls
RESPONSE_CACHE_TTL = 3600

# Temperature for LLM responses (0.0 = deterministic, 1.0 = creative)
LLM_TEMPERATURE = 0.7

# Maximum tokens for LLM responses
LLM_MAX_TOKENS = 1024

# Request timeout in seconds
REQUEST_TIMEOUT = 60

# Maximum concurrent API requests
MAX_CONCURRENT_REQUESTS = 3
