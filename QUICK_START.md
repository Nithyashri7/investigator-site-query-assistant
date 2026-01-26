# Quick Start: Rate Limiting Setup

## What Was Fixed

Your application was hitting OpenRouter API's rate limit (429 errors). The backend now includes:

1. ✅ **Client-side rate limiting** - Throttles requests to 30/minute
2. ✅ **Response caching** - Caches responses for 1 hour
3. ✅ **Exponential backoff retries** - Automatically retries on errors
4. ✅ **Better error messages** - Clear feedback to users
5. ✅ **Configurable settings** - Easy to adjust

## No Action Required For Basic Use

The fixes are automatic and transparent. Just run your application as normal:

```bash
# Backend
uvicorn app.main:app --reload

# Frontend (in separate terminal)
npm run dev
```

## Monitoring

Check your console logs for these messages:

| Message | Meaning |
|---------|---------|
| `[CACHE HIT]` | Response from cache (no API call) |
| `[API CALL]` | Making API request |
| `[RATE LIMITED]` | Hit rate limit, retrying |
| `[RETRY]` | Retrying after error |

## If Issues Persist

Edit `app/rate_limit_config.py`:

```python
# Option 1: Lower request frequency
MIN_REQUEST_INTERVAL = 3.0  # Increase from 2.0

# Option 2: More aggressive retries
MAX_RETRY_ATTEMPTS = 7  # Increase from 5
MAX_WAIT_TIME = 60     # Increase from 30

# Option 3: Better caching
RESPONSE_CACHE_TTL = 7200  # 2 hours instead of 1
```

## Files Changed

- `services/rag_service.py` - Rate limiting & caching
- `app/main.py` - Error handling
- `app/rate_limit_config.py` - NEW: Configuration

## Documentation

- `RATE_LIMITING_FIXES.md` - Full explanation of fixes
- `IMPLEMENTATION_DETAILS.md` - Technical implementation details

## Support

If you still see 429 errors:
1. Check application logs for detailed messages
2. Verify your OpenRouter API key is valid
3. Consider upgrading your OpenRouter subscription for higher limits
4. Adjust rate limiting configuration as needed
