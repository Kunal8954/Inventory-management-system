from flask import Flask, jsonify, request, session
from flask_cors import CORS
from functools import wraps
import bcrypt
from db_utils import get_connection, execute_transaction
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
app.secret_key = "change_this_secret_key_later"
CORS(app, supports_credentials=True)
limiter = Limiter(get_remote_address, app=app, default_limits=["200 per hour"])

# ---------- Helper: permission-check decorator ----------
def require_permission(permission_name):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({"error": "Not logged in"}), 401
            conn = get_connection()
            cur = conn.cursor()
            cur.execute("""
                SELECT p.permission_name FROM users u
                JOIN role_permissions rp ON u.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.permission_id
                WHERE u.user_id = %s
            """, (session['user_id'],))
            perms = [row[0] for row in cur.fetchall()]
            cur.close()
            conn.close()
            if permission_name not in perms:
                return jsonify({"error": f"Forbidden - missing permission: {permission_name}"}), 403
            return f(*args, **kwargs)
        return wrapped
    return decorator

# ---------- AUTH ----------
@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    stored = user['password_hash']
    password_ok = False
    try:
        password_ok = bcrypt.checkpw(password.encode(), stored.encode())
    except Exception:
        # fallback for old test rows saved as plain text (e.g. 'placeholder_hash')
        password_ok = (password == stored)

    if not password_ok:
        return jsonify({"error": "Invalid credentials"}), 401

    session['user_id'] = user['user_id']
    session['role_id'] = user['role_id']
    return jsonify({"message": "Logged in", "username": user['username'], "role": user['role']})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})

@app.route('/api/me', methods=['GET'])
def me():
    if 'user_id' not in session:
        return jsonify({"error": "Not logged in"}), 401
    return jsonify({"user_id": session['user_id'], "role_id": session['role_id']})

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
    ], user_id=session.get('user_id'))

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
    ], user_id=session.get('user_id'))

    if result['success']:
        return jsonify({"message": "Product updated"})
    return jsonify({"error": result['error']}), 400

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@require_permission('products.delete')
def delete_product(product_id):
    result = execute_transaction([
        ("DELETE FROM products WHERE product_id = %s", (product_id,))
    ], user_id=session.get('user_id'))

    if result['success']:
        return jsonify({"message": "Product deleted"})
    return jsonify({"error": result['error']}), 400

# ---------- HEALTH CHECK (small preview of Phase 5) ----------
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
    ])
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
    user_id = session.get('user_id')

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SET @current_user_id = %s", (user_id,))
        conn.start_transaction()

        cur.execute(
            "INSERT INTO orders (customer_id, user_id, total_amount, order_status) VALUES (%s,%s,%s,%s)",
            (data['customer_id'], user_id, data['total_amount'], data.get('order_status', 'Pending'))
        )
        order_id = cur.lastrowid

        for item in data['items']:
            cur.execute(
                """INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
                   VALUES (%s,%s,%s,%s,%s)""",
                (order_id, item['product_id'], item['quantity'], item['unit_price'],
                 item['quantity'] * item['unit_price'])
            )

        conn.commit()
        return jsonify({"message": "Order created", "order_id": order_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

# ---------- INVENTORY TRANSACTIONS (Stock In/Out) ----------
@app.route('/api/inventory/transactions', methods=['GET'])
@require_permission('orders.view')
def get_inventory_transactions():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT it.*, p.product_name FROM inventory_transactions it
        JOIN products p ON it.product_id = p.product_id
        ORDER BY it.transaction_id DESC
    """)
    data = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(data)

@app.route('/api/inventory/stock-in', methods=['POST'])
@require_permission('products.update')
def stock_in():
    data = request.json
    user_id = session.get('user_id')
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
    user_id = session.get('user_id')
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
if __name__ == '__main__':
    app.run(debug=True, port=5000)