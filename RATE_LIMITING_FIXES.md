# Rate Limiting and 429 Error Fixes

## Problem
The application was experiencing `429 Client Error: Too Many Requests` errors from the OpenRouter API. This occurs when the client makes too many requests within a short time period.

## Solutions Implemented

### 1. **Client-Side Rate Limiting**
- Added a `RateLimiter` class that tracks and throttles API requests
- Enforces a minimum interval between requests (default: 2 seconds)
- Limits requests to 30 per minute
- Uses a sliding window to track request timestamps
- Thread-safe implementation with locks

### 2. **Response Caching**
- Added a `ResponseCache` class that caches API responses
- Cache TTL: 1 hour (configurable)
- Avoids duplicate API calls for identical prompts
- Thread-safe with lock-based synchronization

### 3. **Enhanced Retry Logic with Exponential Backoff**
- Increased retry attempts from 4 to 5
- Exponential backoff with jitter (1s, 2s, 4s, 8s, 16s with max 30s)
- Respects `Retry-After` header from API responses
- Handles additional error codes: 503 (Service Unavailable), 408 (Request Timeout), 504 (Gateway Timeout)
- Better logging for debugging

### 4. **Configuration Management**
- Created `app/rate_limit_config.py` for centralized configuration
- Easily tunable parameters without code changes
- Settings include:
  - `MAX_REQUESTS_PER_MINUTE`: 30
  - `MIN_REQUEST_INTERVAL`: 2.0 seconds
  - `MAX_RETRY_ATTEMPTS`: 5
  - `RESPONSE_CACHE_TTL`: 3600 seconds (1 hour)
  - `LLM_MAX_TOKENS`: 1024
  - `LLM_TEMPERATURE`: 0.7

### 5. **Improved Error Handling**
- Backend now distinguishes between different types of errors
- Returns appropriate HTTP status codes to frontend:
  - 429: Rate limit exceeded
  - 504: API timeout
  - 503: Service unavailable
  - 500: General errors
- Clear user-facing error messages instead of internal tracebacks

### 6. **Request Concurrency Control**
- Added semaphore to limit concurrent API requests to 3
- Prevents thundering herd problem

## Configuration Files Modified/Created

### New Files:
- `app/rate_limit_config.py` - Centralized rate limiting configuration

### Modified Files:
- `services/rag_service.py`:
  - Added `RateLimiter` class
  - Added `ResponseCache` class
  - Enhanced `_call_openrouter()` with caching and rate limiting
  - Imported and used configuration values

- `app/main.py`:
  - Improved error handling in `/ask` endpoint
  - Better HTTP status codes for different error types
  - Added imports for error handling

## How It Works

```
User Request
    ↓
[Rate Limiter Check] - Ensures minimum interval between requests
    ↓
[Cache Check] - Returns cached response if available
    ↓
[API Call] - Makes request to OpenRouter
    ↓
[Retry Loop] - If 429, waits with exponential backoff and retries
    ↓
[Cache Store] - Caches the response for future identical requests
    ↓
User Response
```

## Debugging

The implementation includes detailed logging:
- `[CACHE HIT]` - Response found in cache
- `[API CALL]` - Making API request
- `[RATE LIMITED]` - Hit rate limit, retrying
- `[SERVICE UNAVAILABLE]` - API service down, retrying
- `[TIMEOUT]` - Request timeout, retrying
- `[NETWORK ERROR]` - Network issue, retrying

Check your application logs to see these messages.

## Tuning for Your Use Case

If you still experience 429 errors, you can adjust in `app/rate_limit_config.py`:

1. **Reduce request frequency:**
   ```python
   MIN_REQUEST_INTERVAL = 3.0  # Increase from 2.0
   MAX_REQUESTS_PER_MINUTE = 20  # Decrease from 30
   ```

2. **Increase retry attempts:**
   ```python
   MAX_RETRY_ATTEMPTS = 7  # Increase from 5
   MAX_WAIT_TIME = 60  # Increase from 30
   ```

3. **Increase cache TTL to avoid duplicate requests:**
   ```python
   RESPONSE_CACHE_TTL = 7200  # 2 hours instead of 1 hour
   ```

## Best Practices

1. **Cache Similar Questions**: Users asking similar questions will benefit from cached responses
2. **Batch Operations**: If uploading multiple documents, do it sequentially
3. **Monitor API Usage**: Check OpenRouter dashboard for your actual usage patterns
4. **Use Free Models**: Free models have lower rate limits, ensure you're using an appropriate model
5. **Graceful Degradation**: Frontend will receive clear error messages if rate limits are exceeded

## Next Steps

1. Test with the updated code
2. Monitor logs for `[CACHE HIT]` and `[RATE LIMITED]` messages
3. Adjust configuration if needed based on your usage patterns
4. Consider upgrading OpenRouter plan if you need higher limits
