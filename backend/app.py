from flask import Flask, jsonify, request, g
from flask_cors import CORS
from functools import wraps
import bcrypt
import os
import random
import resend
from datetime import datetime
from dotenv import load_dotenv
from db_utils import get_connection, execute_transaction
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from itsdangerous import URLSafeTimedSerializer

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

CORS(app, supports_credentials=True, resources={r"/*": {"origins": [
    "http://localhost:5173",
    r"https://.*\.vercel\.app",
]}})

limiter = Limiter(get_remote_address, app=app, default_limits=["200 per hour"])

resend.api_key = os.getenv("RESEND_API_KEY")

# ----------------------
# Token helpers (moved up so require_permission can use them)
# ----------------------
serializer = URLSafeTimedSerializer(app.secret_key)

def get_user_id_from_bearer_token():
    auth = request.headers.get('Authorization', '')
    if not auth or not auth.startswith('Bearer '):
        return None
    token = auth.split(' ', 1)[1].strip()
    try:
        payload = serializer.loads(token, max_age=86400)
        return payload.get('user_id')
    except Exception:
        return None

# ----------------------
# Email helper (Resend API, used for OTP verification)
# ----------------------
def send_otp_email(to_email, otp_code):
    resend.Emails.send({
        "from": "StockPilot <noreply@kunalsharm.me>",
        "to": [to_email],
        "subject": "StockPilot - Verify your email",
        "text": (
            f"Your StockPilot verification code is: {otp_code}\n\n"
            f"This code expires in 10 minutes.\n\n"
            f"If you did not request this, you can safely ignore this email."
        ),
    })

# ---------- Helper: permission-check decorator (Bearer-token based) ----------
def require_permission(permission_name):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            user_id = get_user_id_from_bearer_token()
            if not user_id:
                return jsonify({"error": "Not logged in"}), 401
            conn = get_connection()
            cur = conn.cursor()
            cur.execute("""
                SELECT p.permission_name FROM users u
                JOIN role_permissions rp ON u.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.permission_id
                WHERE u.user_id = %s
            """, (user_id,))
            perms = [row[0] for row in cur.fetchall()]
            cur.close()
            conn.close()
            if permission_name not in perms:
                return jsonify({"error": f"Forbidden - missing permission: {permission_name}"}), 403
            g.user_id = user_id
            return f(*args, **kwargs)
        return wrapped
    return decorator

# ---------- PRODUCTS ----------
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM products")
    products = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(products)

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM products WHERE product_id = %s", (product_id,))
    product = cur.fetchone()
    cur.close()
    conn.close()
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(product)

@app.route('/api/products', methods=['POST'])
@require_permission('products.create')
def create_product():
    data = request.json
    result = execute_transaction([
        ("""INSERT INTO products (sku, product_name, category_id, supplier_id, cost_price, selling_price, stock_quantity)
            VALUES (%s,%s,%s,%s,%s,%s,%s)""",
         (data['sku'], data['product_name'], data['category_id'], data['supplier_id'],
          data['cost_price'], data['selling_price'], data.get('stock_quantity', 0)))
    ], user_id=g.user_id)

    if result['success']:
        return jsonify({"message": "Product created"}), 201
    return jsonify({"error": result['error']}), 400

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@require_permission('products.update')
def update_product(product_id):
    data = request.json
    result = execute_transaction([
        ("""UPDATE products SET stock_quantity = %s, selling_price = %s WHERE product_id = %s""",
         (data['stock_quantity'], data['selling_price'], product_id))
    ], user_id=g.user_id)

    if result['success']:
        return jsonify({"message": "Product updated"})
    return jsonify({"error": result['error']}), 400

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@require_permission('products.delete')
def delete_product(product_id):
    result = execute_transaction([
        ("DELETE FROM products WHERE product_id = %s", (product_id,))
    ], user_id=g.user_id)

    if result['success']:
        return jsonify({"message": "Product deleted"})
    return jsonify({"error": result['error']}), 400

# ---------- HEALTH CHECK ----------
@app.route('/health', methods=['GET'])
def health():
    try:
        conn = get_connection()
        conn.close()
        return jsonify({"status": "ok"}), 200
    except Exception:
        return jsonify({"status": "db_unreachable"}), 500

# ---------- CATEGORIES ----------
@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM categories")
    data = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(data)

# ---------- SUPPLIERS ----------
@app.route('/api/suppliers', methods=['GET'])
def get_suppliers():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM suppliers")
    data = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(data)

@app.route('/api/categories', methods=['POST'])
@require_permission('products.create')
def create_category():
    data = request.json or {}
    name = (data.get('category_name') or data.get('name') or '').strip()
    if not name:
        return jsonify({"error": "category_name is required"}), 400
    result = execute_transaction([
        ("INSERT INTO categories (category_name, description) VALUES (%s,%s)",
         (name, data.get('description', '')))
    ], user_id=g.user_id)
    if result['success']:
        return jsonify({"message": "Category created"}), 201
    return jsonify({"error": result['error']}), 400


@app.route('/api/suppliers', methods=['POST'])
@require_permission('products.create')
def create_supplier():
    data = request.json or {}
    name = (data.get('supplier_name') or data.get('name') or '').strip()
    if not name:
        return jsonify({"error": "supplier_name is required"}), 400
    result = execute_transaction([
        ("""INSERT INTO suppliers
            (supplier_name, contact_person, email, phone, city, state, country, gst_number, status)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
         (name, data.get('contact_person', ''), data.get('email', ''), data.get('phone', ''),
          data.get('city', ''), data.get('state', ''), data.get('country', 'India'),
          data.get('gst_number', ''), data.get('status', 'Active')))
    ], user_id=g.user_id)
    if result['success']:
        return jsonify({"message": "Supplier created"}), 201
    return jsonify({"error": result['error']}), 400

# ---------- PURCHASE ORDERS ----------
@app.route('/api/purchase-orders', methods=['GET'])
@require_permission('orders.view')
def get_purchase_orders():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT po.*, s.supplier_name FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.supplier_id
        ORDER BY po.purchase_order_id DESC
    """)
    data = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(data)

@app.route('/api/purchase-orders', methods=['POST'])
@require_permission('orders.create')
def create_purchase_order():
    data = request.json or {}
    user_id = g.user_id

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SET @current_user_id = %s", (user_id,))
        conn.start_transaction()

        cur.execute(
            "INSERT INTO purchase_orders (supplier_id, user_id, total_amount, payment_status, purchase_status) VALUES (%s,%s,%s,%s,%s)",
            (data['supplier_id'], user_id, data.get('total_amount', 0),
             data.get('payment_status', 'Pending'), data.get('purchase_status', 'Pending'))
        )
        po_id = cur.lastrowid

        for item in data.get('items', []):
            cur.execute(
                """INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, subtotal)
                   VALUES (%s,%s,%s,%s,%s)""",
                (po_id, item['product_id'], item['quantity'], item['unit_cost'],
                 item['quantity'] * item['unit_cost'])
            )

        conn.commit()
        return jsonify({"message": "Purchase order created", "purchase_order_id": po_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

# ---------- CUSTOMERS ----------
@app.route('/api/customers', methods=['GET'])
def get_customers():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM customers")
    data = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(data)

@app.route('/api/customers', methods=['POST'])
@require_permission('orders.create')
def create_customer():
    data = request.json
    result = execute_transaction([
        ("""INSERT INTO customers (customer_name, email, phone, customer_type)
            VALUES (%s,%s,%s,%s)""",
         (data['customer_name'], data.get('email'), data.get('phone'), data.get('customer_type', 'Individual')))
    ], user_id=g.user_id)
    if result['success']:
        return jsonify({"message": "Customer created"}), 201
    return jsonify({"error": result['error']}), 400

# ---------- ORDERS ----------
@app.route('/api/orders', methods=['GET'])
@require_permission('orders.view')
def get_orders():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT o.*, c.customer_name FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        ORDER BY o.order_id DESC
    """)
    data = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(data)

@app.route('/api/orders', methods=['POST'])
@require_permission('orders.create')
def create_order():
    data = request.json
    user_id = g.user_id

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SET @current_user_id = %s", (user_id,))
        conn.start_transaction()

        cur.execute(
            "INSERT INTO orders (customer_id, user_id, total_amount, order_status) VALUES (%s,%s,%s,%s)",
            (data['customer_id'], user_id, data['total_amount'], data.get('order_status', 'Completed'))
        )
        order_id = cur.lastrowid

        for item in data['items']:
            cur.execute(
                """INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
                   VALUES (%s,%s,%s,%s,%s)""",
                (order_id, item['product_id'], item['quantity'], item['unit_price'],
                 item['quantity'] * item['unit_price'])
            )

            cur.execute(
                "UPDATE products SET stock_quantity = stock_quantity - %s WHERE product_id = %s AND stock_quantity >= %s",
                (item['quantity'], item['product_id'], item['quantity'])
            )
            if cur.rowcount == 0:
                conn.rollback()
                return jsonify({"error": f"Insufficient stock for product {item['product_id']}"}), 400

            cur.execute(
                """INSERT INTO inventory_transactions (product_id, user_id, transaction_type, quantity, remarks)
                   VALUES (%s,%s,'Stock Out',%s,%s)""",
                (item['product_id'], user_id, item['quantity'], f"Sale - Order #{order_id}")
            )

        conn.commit()
        return jsonify({"message": "Order created", "order_id": order_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

@app.route('/api/orders/<int:order_id>/payment', methods=['PUT'])
@require_permission('orders.create')
def update_order_payment(order_id):
    data = request.json or {}
    payment_status = data.get('payment_status', 'Paid')
    result = execute_transaction([
        ("UPDATE orders SET payment_status = %s WHERE order_id = %s", (payment_status, order_id))
    ], user_id=g.user_id)
    if result['success']:
        return jsonify({"message": "Payment status updated"})
    return jsonify({"error": result['error']}), 400

# ---------- INVENTORY TRANSACTIONS (Stock In/Out log) ----------
@app.route('/api/inventory/transactions', methods=['GET'])
def get_inventory_transactions():
    user_id = get_user_id_from_bearer_token()
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    q_type = request.args.get('type')
    q_product = request.args.get('productId')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    base_sql = "SELECT it.transaction_id, it.product_id, p.product_name, it.transaction_type, it.quantity, it.transaction_date, u.username, it.remarks FROM inventory_transactions it JOIN products p ON it.product_id = p.product_id LEFT JOIN users u ON it.user_id = u.user_id"
    filters = []
    params = []
    if q_type:
        filters.append("it.transaction_type = %s")
        params.append(q_type)
    if q_product:
        filters.append("it.product_id = %s")
        params.append(q_product)
    if start_date:
        filters.append("it.transaction_date >= %s")
        params.append(start_date)
    if end_date:
        filters.append("it.transaction_date <= %s")
        params.append(end_date)
    if filters:
        base_sql += " WHERE " + " AND ".join(filters)
    base_sql += " ORDER BY it.transaction_id DESC"

    cur.execute(base_sql, tuple(params))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    out = []
    for r in rows:
        td = r.get('transaction_date')
        date_str = td.strftime('%Y-%m-%d') if hasattr(td, 'strftime') else str(td)
        time_str = td.strftime('%H:%M:%S') if hasattr(td, 'strftime') else ''
        ttype = (r.get('transaction_type') or '').upper().replace(' ', '_')
        out.append({
            "id": r.get('transaction_id'),
            "productId": r.get('product_id'),
            "productName": r.get('product_name'),
            "type": ttype,
            "quantity": r.get('quantity'),
            "date": date_str,
            "time": time_str,
            "createdBy": r.get('username'),
            "notes": r.get('remarks')
        })
    return jsonify(out)

@app.route('/api/inventory/stock-in', methods=['POST'])
@require_permission('products.update')
def stock_in():
    data = request.json
    user_id = g.user_id
    result = execute_transaction([
        ("""INSERT INTO inventory_transactions (product_id, user_id, transaction_type, quantity, remarks)
            VALUES (%s,%s,'Stock In',%s,%s)""",
         (data['product_id'], user_id, data['quantity'], data.get('remarks', ''))),
        ("UPDATE products SET stock_quantity = stock_quantity + %s WHERE product_id = %s",
         (data['quantity'], data['product_id']))
    ], user_id=user_id)
    if result['success']:
        return jsonify({"message": "Stock in recorded"}), 201
    return jsonify({"error": result['error']}), 400

@app.route('/api/inventory/stock-out', methods=['POST'])
@require_permission('products.update')
def stock_out():
    data = request.json
    user_id = g.user_id
    result = execute_transaction([
        ("""INSERT INTO inventory_transactions (product_id, user_id, transaction_type, quantity, remarks)
            VALUES (%s,%s,'Stock Out',%s,%s)""",
         (data['product_id'], user_id, data['quantity'], data.get('remarks', ''))),
        ("UPDATE products SET stock_quantity = stock_quantity - %s WHERE product_id = %s AND stock_quantity >= %s",
         (data['quantity'], data['product_id'], data['quantity']))
    ], user_id=user_id)
    if result['success']:
        return jsonify({"message": "Stock out recorded"}), 201
    return jsonify({"error": result['error']}), 400

# ----------------------
# AUTH endpoints for React frontend (Bearer token) — the ONLY auth system now
# ----------------------
@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def api_auth_login():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    stored = user.get('password_hash')
    password_ok = False
    try:
        password_ok = bcrypt.checkpw(password.encode(), stored.encode())
    except Exception:
        password_ok = (password == stored)

    if not password_ok:
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    if not user.get('is_verified'):
        return jsonify({
            "success": False,
            "error": "Email not verified. Please check your inbox for the OTP.",
            "needsVerification": True,
            "email": email
        }), 403

    user_id = user.get('user_id')
    token = serializer.dumps({"user_id": user_id})
    user_obj = {
        "id": str(user_id),
        "name": f"{user.get('first_name','').strip()} {user.get('last_name','').strip()}".strip(),
        "email": user.get('email'),
        "role": (user.get('role') or '').lower()
    }
    return jsonify({"success": True, "user": user_obj, "token": token})


@app.route('/api/auth/register', methods=['POST'])
def api_auth_register():
    data = request.json or {}
    name = data.get('name','').strip()
    email = data.get('email','').strip()
    password = data.get('password','')
    role_name = data.get('role', 'Staff')
    if role_name not in ('Admin', 'Manager', 'Staff'):
        role_name = 'Staff'

    if not name or not email or not password:
        return jsonify({"success": False, "error": "Missing fields"}), 400

    parts = name.split()
    first_name = parts[0]
    last_name = ' '.join(parts[1:]) if len(parts) > 1 else ''

    base_username = email.split('@')[0]
    username = base_username
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM users WHERE email = %s", (email,))
    if cur.fetchone()[0] > 0:
        cur.close()
        conn.close()
        return jsonify({"success": False, "error": "Email already registered"}), 409

    suffix = 0
    while True:
        cur.execute("SELECT COUNT(*) FROM users WHERE username = %s", (username,))
        if cur.fetchone()[0] == 0:
            break
        suffix += 1
        username = f"{base_username}{suffix}"

    cur.execute("SELECT role_id FROM roles WHERE role_name = %s LIMIT 1", (role_name,))
    row = cur.fetchone()
    role_id = row[0] if row else None

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    otp_code = f"{random.randint(0, 999999):06d}"

    try:
        cur.execute(
            """INSERT INTO users
               (first_name, last_name, username, email, password_hash, role, role_id, is_verified, otp_code, otp_expires_at)
               VALUES (%s,%s,%s,%s,%s,%s,%s,0,%s, DATE_ADD(NOW(), INTERVAL 10 MINUTE))""",
            (first_name, last_name, username, email, pw_hash, role_name, role_id, otp_code)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({"success": False, "error": str(e)}), 400

    cur.close()
    conn.close()

    try:
        send_otp_email(email, otp_code)
    except Exception as e:
        return jsonify({"success": False, "error": f"Account created but failed to send OTP email: {str(e)}"}), 500

    return jsonify({"success": True, "message": "OTP sent to your email", "email": email}), 201


@app.route('/api/auth/verify-otp', methods=['POST'])
@limiter.limit("10 per minute")
def api_auth_verify_otp():
    data = request.json or {}
    email = data.get('email', '').strip()
    otp = data.get('otp', '').strip()

    if not email or not otp:
        return jsonify({"success": False, "error": "Email and OTP required"}), 400

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cur.fetchone()

    if not user:
        cur.close()
        conn.close()
        return jsonify({"success": False, "error": "User not found"}), 404

    if user.get('is_verified'):
        cur.close()
        conn.close()
        return jsonify({"success": False, "error": "Already verified"}), 400

    if not user.get('otp_code') or user.get('otp_code') != otp:
        cur.close()
        conn.close()
        return jsonify({"success": False, "error": "Invalid OTP"}), 400

    expires_at = user.get('otp_expires_at')
    if not expires_at or datetime.now() > expires_at:
        cur.close()
        conn.close()
        return jsonify({"success": False, "error": "OTP expired, please request a new one"}), 400

    cur.execute("UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE email = %s", (email,))
    conn.commit()
    cur.close()
    conn.close()

    user_id = user.get('user_id')
    token = serializer.dumps({"user_id": user_id})
    user_obj = {
        "id": str(user_id),
        "name": f"{user.get('first_name','').strip()} {user.get('last_name','').strip()}".strip(),
        "email": user.get('email'),
        "role": (user.get('role') or '').lower()
    }
    return jsonify({"success": True, "user": user_obj, "token": token})


@app.route('/api/auth/resend-otp', methods=['POST'])
@limiter.limit("3 per minute")
def api_auth_resend_otp():
    data = request.json or {}
    email = data.get('email', '').strip()
    if not email:
        return jsonify({"success": False, "error": "Email required"}), 400

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cur.fetchone()

    if not user:
        cur.close()
        conn.close()
        return jsonify({"success": False, "error": "User not found"}), 404

    if user.get('is_verified'):
        cur.close()
        conn.close()
        return jsonify({"success": False, "error": "Already verified"}), 400

    otp_code = f"{random.randint(0, 999999):06d}"
    cur.execute(
        "UPDATE users SET otp_code = %s, otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = %s",
        (otp_code, email)
    )
    conn.commit()
    cur.close()
    conn.close()

    try:
        send_otp_email(email, otp_code)
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to send OTP: {str(e)}"}), 500

    return jsonify({"success": True, "message": "OTP resent"})


@app.route('/api/auth/verify', methods=['GET'])
def api_auth_verify():
    user_id = get_user_id_from_bearer_token()
    if not user_id:
        return jsonify({"success": False}), 401
    return jsonify({"success": True})


@app.route('/api/auth/logout', methods=['POST'])
def api_auth_logout():
    return jsonify({"success": True})

# INVENTORY endpoints for React frontend (token-based)
@app.route('/api/inventory', methods=['GET'])
def api_inventory_list():
    user_id = get_user_id_from_bearer_token()
    if not user_id:
        return jsonify({"success": False}), 401

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT p.product_id, p.product_name, p.sku, c.category_name, p.stock_quantity, p.reorder_level, p.selling_price, p.updated_at "
        "FROM products p LEFT JOIN categories c ON p.category_id = c.category_id"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    out = []
    for r in rows:
        stock = r.get('stock_quantity') or 0
        reorder = r.get('reorder_level') or 0
        if stock > reorder:
            status = "Active"
        elif stock > 0:
            status = "Low Stock"
        else:
            status = "Out of Stock"
        updated = r.get('updated_at')
        last_updated = updated.isoformat() if hasattr(updated, 'isoformat') else (str(updated) if updated is not None else None)
        out.append({
            "id": r.get('product_id'),
            "productName": r.get('product_name'),
            "sku": r.get('sku'),
            "category": r.get('category_name'),
            "quantity": stock,
            "reservedQuantity": 0,
            "availableQuantity": stock,
            "status": status,
            "price": float(r.get('selling_price') or 0),
            "lastUpdated": last_updated
        })
    return jsonify(out)


@app.route('/api/inventory/low-stock', methods=['GET'])
def api_inventory_low_stock():
    user_id = get_user_id_from_bearer_token()
    if not user_id:
        return jsonify({"success": False}), 401

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT p.product_id, p.product_name, p.sku, c.category_name, p.stock_quantity, p.reorder_level, p.selling_price, p.updated_at "
        "FROM products p LEFT JOIN categories c ON p.category_id = c.category_id WHERE p.stock_quantity <= p.reorder_level"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    out = []
    for r in rows:
        stock = r.get('stock_quantity') or 0
        reorder = r.get('reorder_level') or 0
        shortage = reorder - stock
        updated = r.get('updated_at')
        last_updated = updated.isoformat() if hasattr(updated, 'isoformat') else (str(updated) if updated is not None else None)
        out.append({
            "id": r.get('product_id'),
            "productName": r.get('product_name'),
            "sku": r.get('sku'),
            "category": r.get('category_name'),
            "quantity": stock,
            "reservedQuantity": 0,
            "availableQuantity": stock,
            "status": "Low Stock" if stock > 0 else "Out of Stock",
            "price": float(r.get('selling_price') or 0),
            "lastUpdated": last_updated,
            "shortage": shortage
        })
    return jsonify(out)


@app.route('/api/inventory/stats', methods=['GET'])
def api_inventory_stats():
    user_id = get_user_id_from_bearer_token()
    if not user_id:
        return jsonify({"success": False}), 401

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM products")
    total_items = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM products WHERE stock_quantity <= reorder_level AND stock_quantity > 0")
    low_stock_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM products WHERE stock_quantity = 0")
    out_of_stock = cur.fetchone()[0]

    cur.execute("SELECT SUM(stock_quantity * selling_price) FROM products")
    total_value = cur.fetchone()[0] or 0

    cur.close()
    conn.close()

    return jsonify({
        "totalItems": int(total_items),
        "lowStockCount": int(low_stock_count),
        "outOfStockCount": int(out_of_stock),
        "totalValue": float(total_value)
    })


@app.route('/api/inventory/in', methods=['POST'])
def api_inventory_in():
    user_id = get_user_id_from_bearer_token()
    if not user_id:
        return jsonify({"success": False}), 401

    data = request.json or {}
    product_id = data.get('productId')
    quantity = data.get('quantity')
    notes = data.get('notes','')

    if not product_id or not isinstance(quantity, (int, float)) or quantity <= 0:
        return jsonify({"success": False, "error": "Invalid quantity"}), 400

    conn = get_connection()
    cur = conn.cursor()
    try:
        conn.start_transaction()
        cur.execute("SET @current_user_id = %s", (user_id,))
        cur.execute("INSERT INTO inventory_transactions (product_id, user_id, transaction_type, quantity, remarks) VALUES (%s,%s,'Stock In',%s,%s)", (product_id, user_id, quantity, notes))
        trans_id = cur.lastrowid
        cur.execute("UPDATE products SET stock_quantity = stock_quantity + %s WHERE product_id = %s", (quantity, product_id))
        conn.commit()
        return jsonify({"success": True, "id": trans_id, "type": "STOCK_IN", "date": __import__('datetime').date.today().strftime('%Y-%m-%d')}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        cur.close()
        conn.close()


@app.route('/api/inventory/out', methods=['POST'])
def api_inventory_out():
    user_id = get_user_id_from_bearer_token()
    if not user_id:
        return jsonify({"success": False}), 401

    data = request.json or {}
    product_id = data.get('productId')
    quantity = data.get('quantity')
    notes = data.get('notes','')

    if not product_id or not isinstance(quantity, (int, float)) or quantity <= 0:
        return jsonify({"success": False, "error": "Invalid quantity"}), 400

    conn = get_connection()
    cur = conn.cursor()
    try:
        conn.start_transaction()
        cur.execute("SET @current_user_id = %s", (user_id,))
        cur.execute("INSERT INTO inventory_transactions (product_id, user_id, transaction_type, quantity, remarks) VALUES (%s,%s,'Stock Out',%s,%s)", (product_id, user_id, quantity, notes))
        trans_id = cur.lastrowid
        cur.execute("UPDATE products SET stock_quantity = stock_quantity - %s WHERE product_id = %s AND stock_quantity >= %s", (quantity, product_id, quantity))
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"success": False, "error": "Insufficient stock"}), 400
        conn.commit()
        return jsonify({"success": True, "id": trans_id, "type": "STOCK_OUT", "date": __import__('datetime').date.today().strftime('%Y-%m-%d')}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        cur.close()
        conn.close()


@app.route('/api/inventory/adjust', methods=['POST'])
def api_inventory_adjust():
    user_id = get_user_id_from_bearer_token()
    if not user_id:
        return jsonify({"success": False}), 401

    data = request.json or {}
    product_id = data.get('productId')
    delta = data.get('quantity')
    reason = data.get('reason','')

    if not product_id or not isinstance(delta, (int, float)):
        return jsonify({"success": False, "error": "Invalid quantity"}), 400

    conn = get_connection()
    cur = conn.cursor()
    try:
        conn.start_transaction()
        cur.execute("SET @current_user_id = %s", (user_id,))
        cur.execute("INSERT INTO inventory_transactions (product_id, user_id, transaction_type, quantity, remarks) VALUES (%s,%s,'Adjustment',%s,%s)", (product_id, user_id, abs(delta), reason))
        trans_id = cur.lastrowid
        cur.execute("UPDATE products SET stock_quantity = stock_quantity + %s WHERE product_id = %s AND (stock_quantity + %s) >= 0", (delta, product_id, delta))
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"success": False, "error": "Resulting stock would be negative"}), 400
        conn.commit()
        return jsonify({"success": True, "id": trans_id, "type": "ADJUSTMENT", "date": __import__('datetime').date.today().strftime('%Y-%m-%d')}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        cur.close()
        conn.close()


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)