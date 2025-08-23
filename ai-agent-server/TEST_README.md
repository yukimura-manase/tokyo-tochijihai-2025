# FastAPI Docker Integration Tests

This directory contains a comprehensive pytest test suite for the FastAPI AI Agent Server running in Docker containers.

## 🚀 Quick Start

### Prerequisites
1. Start the services with Docker Compose:
   ```bash
   docker-compose up
   ```

2. Install test dependencies:
   ```bash
   pip install -r requirements-test.txt
   ```

### Running Tests

#### Option 1: Using the Test Runner (Recommended)
```bash
# Run all tests
python run_tests.py

# Run specific test categories
python run_tests.py health
python run_tests.py chat
python run_tests.py rag
python run_tests.py streaming

# Run quick tests only (excludes slow tests)
python run_tests.py quick

# Run in quiet mode
python run_tests.py -q
```

#### Option 2: Using pytest directly
```bash
# Run all tests
pytest tests/

# Run with verbose output
pytest -v tests/

# Run specific test files
pytest tests/test_health.py
pytest tests/test_chat.py

# Run tests by markers
pytest -m health
pytest -m "not slow"
```

## 📂 Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Pytest fixtures and configuration
├── test_health.py           # Health check and service availability tests
├── test_chat.py            # Chat endpoint tests
├── test_rag.py             # RAG (evacuation, PDF, WiFi) endpoint tests  
├── test_streaming.py       # Streaming endpoint tests
└── test_error_handling.py  # Error handling and edge case tests
```

## 🏷️ Test Categories (Markers)

- `health` - Health check and service availability tests
- `chat` - Chat endpoint functionality tests
- `rag` - RAG (Retrieval Augmented Generation) tests
- `streaming` - Streaming response tests
- `integration` - Full integration tests (requires Docker services)
- `slow` - Tests that take longer to run

## 🧪 Test Coverage

### Health Tests (`test_health.py`)
- ✅ Root endpoint (`/`) functionality
- ✅ Health endpoint (`/health`) with Ollama connection check
- ✅ Response time validation
- ✅ HTTP headers verification
- ✅ Multiple consecutive health checks
- ✅ Invalid endpoint handling (404 responses)

### Chat Tests (`test_chat.py`)
- ✅ Basic chat endpoint (`/chat`)
- ✅ OpenAI-compatible completions (`/chat/completions`)
- ✅ Temperature variation handling
- ✅ Max tokens limitation
- ✅ Japanese text input support
- ✅ Parameter validation (empty prompts, invalid temperature)
- ✅ Response structure validation
- ✅ Performance testing (response time limits)

### RAG Tests (`test_rag.py`)
- ✅ Evacuation area search (`/rag/search`)
- ✅ PDF document search (`/pdf/search`)
- ✅ WiFi spot search (`/wifi/search`)
- ✅ Status endpoints for all RAG systems
- ✅ Location-based filtering
- ✅ Search without location coordinates
- ✅ Filter combinations (barrier-free, 24h, free-only)
- ✅ Index rebuild operations
- ✅ Error handling for missing datasets

### Streaming Tests (`test_streaming.py`)
- ✅ Chat streaming endpoint (`/chat/stream`)
- ✅ OpenAI-compatible streaming completions
- ✅ Stream validation (proper event-stream format)
- ✅ Stream flag requirement validation
- ✅ Timeout handling for streaming responses
- ✅ Japanese text streaming support
- ✅ Concurrent streaming requests
- ✅ Error propagation through streams

### Error Handling Tests (`test_error_handling.py`)
- ✅ Invalid JSON request handling
- ✅ Empty request body validation
- ✅ Parameter validation (temperature, max_tokens)
- ✅ Extremely long prompts
- ✅ Special characters and Unicode support
- ✅ HTTP method validation (405 errors)
- ✅ Large payload handling
- ✅ Boundary coordinate values
- ✅ CORS headers verification

## ⚙️ Configuration

### Pytest Configuration (`pytest.ini`)
- Test discovery patterns
- Default markers
- Async test support
- Timeout settings
- Output formatting

### Test Fixtures (`conftest.py`)
- Service availability checking
- HTTP client setup with retry logic
- Async client for streaming tests
- Sample payload fixtures
- Test environment configuration

## 🐳 Docker Integration

The tests are designed to work seamlessly with the Docker Compose setup:

- **FastAPI Service**: Tests connect to `http://localhost:8000`
- **Ollama Service**: Health checks verify connection to `http://localhost:11434`
- **Startup Handling**: Tests wait for services to be ready before running
- **Service Dependencies**: Tests skip gracefully if required services are unavailable

## 🎯 Test Scenarios Covered

### 🟢 Happy Path Tests
- All endpoints respond correctly with valid inputs
- Streaming works properly with expected data formats
- RAG systems return structured responses
- Health checks confirm system status

### 🟡 Edge Case Tests
- Boundary values (coordinates, temperature ranges)
- Large inputs (long prompts, big payloads)
- Special characters and Unicode text
- Empty or minimal inputs

### 🔴 Error Handling Tests
- Invalid parameters and malformed requests
- Missing required fields
- Service unavailability scenarios
- Network timeout situations

## 📊 Running Specific Test Subsets

```bash
# Test only the core functionality (fast)
pytest -m "health or chat" tests/

# Test RAG systems only
pytest -m rag tests/

# Test everything except slow tests  
pytest -m "not slow" tests/

# Test error handling
pytest tests/test_error_handling.py

# Test with coverage reporting (if coverage installed)
pytest --cov=app tests/
```

## 🔧 Troubleshooting

### Services Not Available
If tests fail with connection errors:
1. Ensure Docker Compose is running: `docker-compose up`
2. Check service logs: `docker-compose logs fastapi` or `docker-compose logs ollama`
3. Wait for services to fully initialize (may take a few minutes)

### RAG Tests Failing
RAG tests may fail if datasets are missing:
- Evacuation data: `../dataset/001_避難所位置情報/130001_evacuation_area.csv`
- PDF data: `../dataset/003_防災計画/2023_1.pdf`
- WiFi data: `../dataset/002_wifiスポット/130001_public_wireless_lan_20240901.xlsx`

The tests will skip gracefully with appropriate messages if datasets are unavailable.

### Slow Performance
If tests run slowly:
- Use `pytest -m "not slow"` to skip time-intensive tests
- Check Docker resource allocation
- Verify Ollama model is downloaded and cached

## 📈 Extending the Tests

To add new tests:

1. **Create test functions** following the naming convention `test_*`
2. **Use appropriate markers** (`@pytest.mark.health`, etc.)
3. **Add fixtures** to `conftest.py` for reusable test data
4. **Update this README** with new test descriptions

Example new test:
```python
@pytest.mark.chat
def test_new_feature(http_client, api_base_url, sample_payload):
    response = http_client.post(f"{api_base_url}/new-endpoint", json=sample_payload)
    assert response.status_code == 200
```

## 🤝 Contributing

When adding tests:
- Follow existing patterns and conventions
- Include both positive and negative test cases
- Add appropriate pytest markers
- Ensure tests can handle service unavailability gracefully
- Update documentation for new test categories