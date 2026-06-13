import httpx

headers = {
    "Origin": "http://localhost:8081",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type"
}

try:
    response = httpx.options("http://127.0.0.1:8000/api/v1/startups", headers=headers, timeout=5.0)
    print("127.0.0.1 Status:", response.status_code)
    print("127.0.0.1 Headers:", dict(response.headers))
except Exception as e:
    print("127.0.0.1 Error:", e)

try:
    response_lh = httpx.options("http://localhost:8000/api/v1/startups", headers=headers, timeout=5.0)
    print("localhost Status:", response_lh.status_code)
    print("localhost Headers:", dict(response_lh.headers))
except Exception as e:
    print("localhost Error:", e)
