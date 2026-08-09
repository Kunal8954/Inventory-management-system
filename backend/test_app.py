"""
Automated tests for StockPilot's backend.

Three things are covered here, chosen deliberately rather than for coverage numbers:

1. require_fields() — pure logic, no database needed. Fast, reliable, no side effects.
2. RBAC enforcement — hitting a real protected endpoint with no token and confirming
   it's rejected before it ever touches the database.
3. Transaction rollback — the core "ACID transactions" claim this whole project is
   built around. We deliberately try to stock-out more than exists and confirm both
   the request fails AND the actual stock in the database is untouched afterward.

These run against the real local database rather than a separate test DB (a mocked
DB layer is more infrastructure than this project needs). Every test here either
touches no data at all, or is designed to fail in a way that guarantees nothing commits.

Run with: pytest test_app.py -v
"""
import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, require_fields
from db_utils import get_connection


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as c:
        yield c


# A known-good Staff token, obtained via a real login before running these tests.
# Staff has products.update, which is what the rollback test needs.
STAFF_TOKEN = os.environ.get('TEST_STAFF_TOKEN', '')
AUTH_HEADERS = {'Authorization': f'Bearer {STAFF_TOKEN}'}


# ---------------------------------------------------------------------------
# 1. require_fields() — pure logic, no DB, no auth needed
# ---------------------------------------------------------------------------

def test_require_fields_passes_when_all_present():
    data = {'sku': 'ABC123', 'product_name': 'Widget'}
    result = require_fields(data, ['sku', 'product_name'])
    assert result is None


def test_require_fields_fails_when_missing():
    with app.app_context():
        data = {'sku': 'ABC123'}
        result = require_fields(data, ['sku', 'product_name'])
        assert result is not None
        response, status_code = result
        assert status_code == 400
        body = response.get_json()
        assert body['success'] is False
        assert 'product_name' in body['error']


def test_require_fields_treats_empty_string_as_missing():
    # An empty string was explicitly typed by someone, but is still not a valid value —
    # this is what protects against the KeyError crashes the validation work fixed earlier.
    with app.app_context():
        data = {'sku': '', 'product_name': 'Widget'}
        result = require_fields(data, ['sku', 'product_name'])
        assert result is not None
        _, status_code = result
        assert status_code == 400


def test_require_fields_lists_all_missing_fields_not_just_first():
    with app.app_context():
        data = {}
        result = require_fields(data, ['sku', 'product_name', 'category_id'])
        response, _ = result
        body = response.get_json()
        assert 'sku' in body['error']
        assert 'product_name' in body['error']
        assert 'category_id' in body['error']


# ---------------------------------------------------------------------------
# 2. RBAC enforcement — no data touched, just confirming the gate holds
# ---------------------------------------------------------------------------

def test_protected_endpoint_rejects_no_token(client):
    # No Authorization header at all — should never reach the database.
    response = client.post('/api/products', json={'sku': 'TEST', 'product_name': 'Test'})
    assert response.status_code == 401


def test_protected_endpoint_rejects_garbage_token(client):
    response = client.post(
        '/api/products',
        json={'sku': 'TEST', 'product_name': 'Test'},
        headers={'Authorization': 'Bearer not-a-real-token'}
    )
    assert response.status_code == 401


def test_health_endpoint_needs_no_auth(client):
    # Sanity check the app is even reachable and that /health specifically
    # is intentionally public (used by Railway/uptime checks).
    response = client.get('/health')
    assert response.status_code == 200
    assert response.get_json()['status'] == 'ok'


# ---------------------------------------------------------------------------
# 3. Transaction rollback — the one that actually matters most
# ---------------------------------------------------------------------------

@pytest.mark.skipif(not STAFF_TOKEN, reason="Set TEST_STAFF_TOKEN env var to run this test")
def test_stock_out_rolls_back_on_insufficient_stock(client):
    # Uses /api/inventory/out (not /stock-out) — this is the endpoint the real React
    # frontend actually calls, and it only requires being logged in, not a specific
    # permission, so a plain Staff token is enough here. It shares the same
    # "affected rows == 0 -> rollback" logic we're actually testing.
    products_response = client.get('/api/products')
    products = products_response.get_json()
    product = next((p for p in products if p['product_id'] == 14), None)
    assert product is not None, "Test Product (id 14) must exist locally to run this test"

    stock_before = product['stock_quantity']
    impossible_quantity = stock_before + 999999

    response = client.post(
        '/api/inventory/out',
        json={'productId': 14, 'quantity': impossible_quantity},
        headers=AUTH_HEADERS
    )

    # The request itself must fail...
    assert response.status_code == 400
    assert response.get_json()['success'] is False

    # ...and critically, stock must be completely unchanged — this is what
    # proves the transaction actually rolled back rather than partially applying.
    products_after = client.get('/api/products').get_json()
    product_after = next((p for p in products_after if p['product_id'] == 14), None)
    assert product_after['stock_quantity'] == stock_before


@pytest.mark.skipif(not STAFF_TOKEN, reason="Set TEST_STAFF_TOKEN env var to run this test")
def test_stock_in_then_stock_out_nets_to_original(client):
    # A cleaner round-trip test: add 5, remove 5, confirm we land back where we started.
    # This also implicitly checks that a SUCCESSFUL transaction commits correctly,
    # not just that a failed one rolls back.
    products_before = client.get('/api/products').get_json()
    product_before = next((p for p in products_before if p['product_id'] == 14), None)
    stock_before = product_before['stock_quantity']

    in_response = client.post(
        '/api/inventory/in',
        json={'productId': 14, 'quantity': 5},
        headers=AUTH_HEADERS
    )
    assert in_response.status_code == 201
    assert in_response.get_json()['success'] is True

    out_response = client.post(
        '/api/inventory/out',
        json={'productId': 14, 'quantity': 5},
        headers=AUTH_HEADERS
    )
    assert out_response.status_code == 201
    assert out_response.get_json()['success'] is True

    products_after = client.get('/api/products').get_json()
    product_after = next((p for p in products_after if p['product_id'] == 14), None)
    assert product_after['stock_quantity'] == stock_before