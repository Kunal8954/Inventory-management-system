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

import cloudinary
import cloudinary.uploader
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_auth_requests
import razorpay
import hmac
import hashlib

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

CORS(app, supports_credentials=True, resources={r"/*": {"origins": [
    r"http://localhost:\d+",
    r"https://.*\.vercel\.app",
]}})

limiter = Limiter(get_remote_address, app=app, default_limits=["200 per hour"])

resend.api_key = os.getenv("RESEND_API_KEY")

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

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

def send_password_reset_email(to_email, otp_code):
    resend.Emails.send({
        "from": "StockPilot <noreply@kunalsharm.me>",
        "to": [to_email],
        "subject": "StockPilot - Reset your password",
        "text": (
            f"Your StockPilot password reset code is: {otp_code}\n\n"
            f"This code expires in 10 minutes.\n\n"
            f"If you did not request this, you can safely ignore this email \u2014 your password will not be changed."
        ),
    })

def send_order_approved_email(to_email, order_id, total_amount):
    resend.Emails.send({
        "from": "StockPilot <noreply@kunalsharm.me>",
        "to": [to_email],
        "subject": f"StockPilot - Your order #{order_id} has been approved",
        "text": (
            f"Good news \u2014 your order #{order_id} (total: {total_amount}) has been approved and is being processed.\n\n"
            f"You can check its status anytime under My Orders."
        ),
    })


def send_payment_reminder_email(to_email, entity_name, order_id, total_amount, direction):
    """direction: 'customer' (they owe us) or 'vendor' (we owe them)."""
    if direction == 'customer':
        subject = f"StockPilot - Payment reminder for order #{order_id}"
        body = (
            f"Hi {entity_name},\n\n"
            f"This is a friendly reminder that payment for order #{order_id} "
            f"(total: {total_amount}) is still pending. Please arrange payment at your earliest convenience.\n\n"
            f"If you've already paid, please disregard this message."
        )
    else:
        subject = f"StockPilot - Payment reminder for purchase order #{order_id}"
        body = (
            f"Hi {entity_name},\n\n"
            f"This is a reminder regarding purchase order #{order_id} "
            f"(total: {total_amount}), which we show as still pending payment on our end. "
            f"We wanted to flag this so it doesn't get missed.\n\n"
            f"If this has already been settled, please disregard this message."
        )

    resend.Emails.send({
        "from": "StockPilot <noreply@kunalsharm.me>",
        "to": [to_email],
        "subject": subject,
        "text": body,
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

# ---------- Helper: required-field validation ----------
def require_fields(data, fields):
    """Check that all required fields are present and non-empty.
    Returns a (response, status_code) tuple to return immediately if invalid, else None."""
    missing = [f for f in fields if data.get(f) in (None, '', [])]
    if missing:
        return jsonify({"success": False, "error": f"Missing required field(s): {', '.join(missing)}"}), 400
    return None

# ---------- PRODUCTS ----------
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT p.*,
               (SELECT image_url FROM product_images pi
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1
                LIMIT 1) AS image_url
        FROM products p
    """)
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
    data = request.json or {}
    err = require_fields(data, ['sku', 'product_name', 'category_id', 'supplier_id', 'cost_price', 'selling_price'])
    if err:
        return err
    result = execute_transaction([
        ("""INSERT INTO products (sku, product_name, category_id, supplier_id, cost_price, selling_price, stock_quantity, description)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
         (data['sku'], data['product_name'], data['category_id'], data['supplier_id'],
          data['cost_price'], data['selling_price'], data.get('stock_quantity', 0), data.get('description', '')))
    ], user_id=g.user_id)

    if result['success']:
        return jsonify({"message": "Product created"}), 201
    return jsonify({"error": result['error']}), 400

@app.route('/api/products/<int:product_id>/image', methods=['POST'])
@require_permission('products.update')
def upload_product_image(product_id):
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image file provided"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"success": False, "error": "No image file selected"}), 400

    try:
        upload_result = cloudinary.uploader.upload(file, folder="stockpilot_products")
        image_url = upload_result.get('secure_url')
    except Exception as e:
        return jsonify({"success": False, "error": f"Upload failed: {str(e)}"}), 500

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SET @current_user_id = %s", (g.user_id,))
        conn.start_transaction()

        # Only auto-make this primary if the product has no photos at all yet.
        # Otherwise this is just an additional photo — primary stays whatever it was.
        cur.execute("SELECT COUNT(*) FROM product_images WHERE product_id = %s", (product_id,))
        has_existing = cur.fetchone()[0] > 0
        is_primary = 0 if has_existing else 1

        cur.execute(
            "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (%s, %s, %s)",
            (product_id, image_url, is_primary)
        )
        conn.commit()
        return jsonify({"success": True, "image_url": image_url}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        cur.close()
        conn.close()


@app.route('/api/products/<int:product_id>/images', methods=['GET'])
def get_product_images(product_id):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT image_id, image_url, is_primary FROM product_images WHERE product_id = %s ORDER BY is_primary DESC, image_id ASC",
        (product_id,)
    )
    data = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(data)


@app.route('/api/products/<int:product_id>/images/<int:image_id>', methods=['DELETE'])
@require_permission('products.update')
def delete_product_image(product_id, image_id):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM product_images WHERE image_id = %s AND product_id = %s", (image_id, product_id))
    image = cur.fetchone()
    cur.close()
    conn.close()

    if not image:
        return jsonify({"success": False, "error": "Image not found"}), 404

    result = execute_transaction([
        ("DELETE FROM product_images WHERE image_id = %s", (image_id,))
    ], user_id=g.user_id)
    if not result['success']:
        return jsonify({"success": False, "error": result['error']}), 400

    # If we just deleted the primary photo, promote whichever photo is left (if any)
    if image.get('is_primary'):
        conn2 = get_connection()
        cur2 = conn2.cursor(dictionary=True)
        cur2.execute("SELECT image_id FROM product_images WHERE product_id = %s ORDER BY image_id ASC LIMIT 1", (product_id,))
        remaining = cur2.fetchone()
        cur2.close()
        conn2.close()
        if remaining:
            execute_transaction([
                ("UPDATE product_images SET is_primary = 1 WHERE image_id = %s", (remaining['image_id'],))
            ], user_id=g.user_id)

    return jsonify({"success": True, "message": "Image deleted"})


@app.route('/api/products/<int:product_id>/images/<int:image_id>/primary', methods=['PUT'])
@require_permission('products.update')
def set_primary_product_image(product_id, image_id):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM product_images WHERE image_id = %s AND product_id = %s", (image_id, product_id))
    image = cur.fetchone()
    cur.close()
    conn.close()

    if not image:
        return jsonify({"success": False, "error": "Image not found"}), 404

    result = execute_transaction([
        ("UPDATE product_images SET is_primary = 0 WHERE product_id = %s", (product_id,)),
        ("UPDATE product_images SET is_primary = 1 WHERE image_id = %s", (image_id,)),
    ], user_id=g.user_id)
    if result['success']:
        return jsonify({"success": True, "message": "Primary photo updated"})
    return jsonify({"success": False, "error": result['error']}), 400


@app.route('/api/products/<int:product_id>', methods=['PUT'])
@require_permission('products.update')
def update_product(product_id):
    data = request.json or {}
    err = require_fields(data, ['product_name', 'sku', 'category_id', 'supplier_id', 'cost_price', 'selling_price'])
    if err:
        return err
    result = execute_transaction([
        ("""UPDATE products SET product_name = %s, sku = %s, category_id = %s, supplier_id = %s,
            cost_price = %s, selling_price = %s, description = %s
            WHERE product_id = %s""",
         (data['product_name'], data['sku'], data['category_id'], data['supplier_id'],
          data['cost_price'], data['selling_price'], data.get('description', ''), product_id))
    ], user_id=g.user_id)

    if result['success']:
        return jsonify({"message": "Product updated"})
    return jsonify({"error": result['error']}), 400

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@require_permission('products.delete')
def delete_product(product_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM order_items WHERE product_id = %s", (product_id,))
    has_sales = cur.fetchone()[0] > 0
    cur.execute("SELECT COUNT(*) FROM purchase_order_items WHERE product_id = %s", (product_id,))
    has_purchases = cur.fetchone()[0] > 0
    cur.execute("SELECT COUNT(*) FROM inventory_transactions WHERE product_id = %s", (product_id,))
    has_stock_history = cur.fetchone()[0] > 0
    cur.close()
    conn.close()

    if has_sales or has_purchases or has_stock_history:
        return jsonify({"error": "Can't delete this product \u2014 it has order or stock history tied to it."}), 400

    result = execute_transaction([
        ("DELETE FROM product_images WHERE product_id = %s", (product_id,)),
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

@app.route('/api/dashboard/financial-summary', methods=['GET'])
@require_permission('dashboard.financials')
def get_financial_summary():
    """Admin-only. Distinct from the existing Inventory Value stat (which values
    current stock at selling price) — this shows what's actually happening
    financially: cost basis of stock on hand, real revenue from completed sales,
    and real profit (revenue minus the cost of what was actually sold)."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM products")
    total_products = cur.fetchone()[0]

    cur.execute("SELECT COALESCE(SUM(cost_price * stock_quantity), 0) FROM products")
    total_cost_value = cur.fetchone()[0]

    cur.execute("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE order_status = 'Completed'")
    total_revenue = cur.fetchone()[0]

    cur.execute("""
        SELECT COALESCE(SUM(oi.quantity * (oi.unit_price - p.cost_price)), 0)
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE o.order_status = 'Completed'
    """)
    total_profit = cur.fetchone()[0]

    cur.close()
    conn.close()

    return jsonify({
        "total_products": int(total_products),
        "total_cost_value": float(total_cost_value),
        "total_revenue": float(total_revenue),
        "total_profit": float(total_profit)
    })


# ---------- PENDING PAYMENT REMINDERS ----------
@app.route('/api/payments/pending', methods=['GET'])
@require_permission('orders.view')
def get_pending_payments():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)

    cur.execute("""
        SELECT o.order_id, o.total_amount, o.order_date, o.last_reminder_sent_at,
               c.customer_id, c.customer_name, c.email,
               COALESCE(c.reminder_interval_days, 7) AS reminder_interval_days,
               DATEDIFF(NOW(), o.order_date) AS days_pending
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        WHERE o.payment_status = 'Pending'
        ORDER BY days_pending DESC
    """)
    customer_payments = cur.fetchall()
    for row in customer_payments:
        row['needs_reminder'] = row['days_pending'] >= row['reminder_interval_days']

    cur.execute("""
        SELECT po.purchase_order_id, po.total_amount, po.order_date, po.last_reminder_sent_at,
               s.supplier_id, s.supplier_name, s.email,
               COALESCE(s.reminder_interval_days, 7) AS reminder_interval_days,
               DATEDIFF(NOW(), po.order_date) AS days_pending
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.supplier_id
        WHERE po.payment_status = 'Pending'
        ORDER BY days_pending DESC
    """)
    vendor_payments = cur.fetchall()
    for row in vendor_payments:
        row['needs_reminder'] = row['days_pending'] >= row['reminder_interval_days']

    cur.close()
    conn.close()

    return jsonify({
        "customer_payments": customer_payments,
        "vendor_payments": vendor_payments
    })


@app.route('/api/customers/<int:customer_id>/reminder-interval', methods=['PUT'])
@require_permission('orders.create')
def set_customer_reminder_interval(customer_id):
    data = request.json or {}
    err = require_fields(data, ['reminder_interval_days'])
    if err:
        return err
    result = execute_transaction([
        ("UPDATE customers SET reminder_interval_days = %s WHERE customer_id = %s",
         (data['reminder_interval_days'], customer_id))
    ], user_id=g.user_id)
    if result['success']:
        return jsonify({"message": "Reminder interval updated"})
    return jsonify({"error": result['error']}), 400


@app.route('/api/suppliers/<int:supplier_id>/reminder-interval', methods=['PUT'])
@require_permission('orders.create')
def set_supplier_reminder_interval(supplier_id):
    data = request.json or {}
    err = require_fields(data, ['reminder_interval_days'])
    if err:
        return err
    result = execute_transaction([
        ("UPDATE suppliers SET reminder_interval_days = %s WHERE supplier_id = %s",
         (data['reminder_interval_days'], supplier_id))
    ], user_id=g.user_id)
    if result['success']:
        return jsonify({"message": "Reminder interval updated"})
    return jsonify({"error": result['error']}), 400


@app.route('/api/orders/<int:order_id>/send-payment-reminder', methods=['POST'])
@require_permission('orders.create')
def send_customer_payment_reminder(order_id):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT o.order_id, o.total_amount, c.customer_name, c.email
        FROM orders o JOIN customers c ON o.customer_id = c.customer_id
        WHERE o.order_id = %s AND o.payment_status = 'Pending'
    """, (order_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return jsonify({"error": "Order not found or not pending payment"}), 404
    if not row.get('email'):
        return jsonify({"error": "This customer has no email on file"}), 400

    try:
        send_payment_reminder_email(row['email'], row['customer_name'], order_id, row['total_amount'], 'customer')
    except Exception as e:
        return jsonify({"error": f"Failed to send reminder: {str(e)}"}), 500

    execute_transaction([
        ("UPDATE orders SET last_reminder_sent_at = NOW() WHERE order_id = %s", (order_id,))
    ], user_id=g.user_id)
    return jsonify({"message": "Reminder sent"})


@app.route('/api/purchase-orders/<int:purchase_order_id>/send-payment-reminder', methods=['POST'])
@require_permission('orders.create')
def send_vendor_payment_reminder(purchase_order_id):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT po.purchase_order_id, po.total_amount, s.supplier_name, s.email
        FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.supplier_id
        WHERE po.purchase_order_id = %s AND po.payment_status = 'Pending'
    """, (purchase_order_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return jsonify({"error": "Purchase order not found or not pending payment"}), 404
    if not row.get('email'):
        return jsonify({"error": "This supplier has no email on file"}), 400

    try:
        send_payment_reminder_email(row['email'], row['supplier_name'], purchase_order_id, row['total_amount'], 'vendor')
    except Exception as e:
        return jsonify({"error": f"Failed to send reminder: {str(e)}"}), 500

    execute_transaction([
        ("UPDATE purchase_orders SET last_reminder_sent_at = NOW() WHERE purchase_order_id = %s", (purchase_order_id,))
    ], user_id=g.user_id)
    return jsonify({"message": "Reminder sent"})


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

    err = require_fields(data, ['supplier_id', 'items'])
    if err:
        return err
    for item in data.get('items', []):
        item_err = require_fields(item, ['product_id', 'quantity', 'unit_cost'])
        if item_err:
            return item_err

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
    data = request.json or {}
    err = require_fields(data, ['customer_name'])
    if err:
        return err
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
    orders = cur.fetchall()

    for order in orders:
        cur.execute("""
            SELECT oi.quantity, oi.unit_price, oi.subtotal, p.product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = %s
        """, (order['order_id'],))
        order['items'] = cur.fetchall()

    cur.close()
    conn.close()
    return jsonify(orders)

@app.route('/api/orders', methods=['POST'])
@require_permission('orders.create')
def create_order():
    data = request.json or {}
    user_id = g.user_id

    err = require_fields(data, ['customer_id', 'total_amount', 'items'])
    if err:
        return err
    for item in data.get('items', []):
        item_err = require_fields(item, ['product_id', 'quantity', 'unit_price'])
        if item_err:
            return item_err

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


@app.route('/api/orders/<int:order_id>/approve', methods=['PUT'])
@require_permission('orders.create')
def approve_order(order_id):
    """Approve a Pending order request (typically customer-placed). This is the
    moment stock actually gets deducted — request-time never touches inventory."""
    user_id = g.user_id

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM orders WHERE order_id = %s", (order_id,))
    order = cur.fetchone()
    if not order:
        cur.close()
        conn.close()
        return jsonify({"error": "Order not found"}), 404
    if order.get('order_status') != 'Pending':
        cur.close()
        conn.close()
        return jsonify({"error": "Only pending orders can be approved"}), 400

    cur.execute("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
    items = cur.fetchall()
    cur.close()

    conn2 = get_connection()
    cur2 = conn2.cursor()
    try:
        cur2.execute("SET @current_user_id = %s", (user_id,))
        conn2.start_transaction()

        for item in items:
            cur2.execute(
                "UPDATE products SET stock_quantity = stock_quantity - %s WHERE product_id = %s AND stock_quantity >= %s",
                (item['quantity'], item['product_id'], item['quantity'])
            )
            if cur2.rowcount == 0:
                conn2.rollback()
                return jsonify({"error": f"Insufficient stock for product {item['product_id']}"}), 400

            cur2.execute(
                """INSERT INTO inventory_transactions (product_id, user_id, transaction_type, quantity, remarks)
                   VALUES (%s,%s,'Stock Out',%s,%s)""",
                (item['product_id'], user_id, item['quantity'], f"Approved order #{order_id}")
            )

        cur2.execute("UPDATE orders SET order_status = 'Processing' WHERE order_id = %s", (order_id,))

        conn2.commit()

        try:
            notif_cur2 = conn2.cursor()
            notif_cur2.execute("UPDATE notifications SET is_read = 1 WHERE order_id = %s", (order_id,))
            conn2.commit()
            notif_cur2.close()
        except Exception:
            pass  # Approval already succeeded — a failed notification cleanup shouldn't undo it.

        try:
            cur3 = conn2.cursor(dictionary=True)
            cur3.execute("SELECT email FROM customers WHERE customer_id = %s", (order['customer_id'],))
            customer = cur3.fetchone()
            cur3.close()
            if customer and customer.get('email'):
                send_order_approved_email(customer['email'], order_id, order.get('total_amount'))
        except Exception:
            pass  # Approval already succeeded — a failed notification shouldn't undo it.

        return jsonify({"message": "Order approved, stock updated, now processing"})
    except Exception as e:
        conn2.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cur2.close()
        conn2.close()
        conn.close()


@app.route('/api/orders/<int:order_id>/complete', methods=['PUT'])
@require_permission('orders.create')
def complete_order(order_id):
    """Mark a Processing order as fully Completed (delivered/picked up).
    Status-only change — stock was already deducted at approval time."""
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM orders WHERE order_id = %s", (order_id,))
    order = cur.fetchone()
    cur.close()
    conn.close()

    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order.get('order_status') != 'Processing':
        return jsonify({"error": "Only processing orders can be marked completed"}), 400

    result = execute_transaction([
        ("UPDATE orders SET order_status = 'Completed' WHERE order_id = %s", (order_id,))
    ], user_id=g.user_id)
    if result['success']:
        return jsonify({"message": "Order marked completed"})
    return jsonify({"error": result['error']}), 400

# ---------- USER MANAGEMENT (Admin only) ----------
@app.route('/api/users', methods=['GET'])
@require_permission('users.manage')
def get_users():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT user_id, first_name, last_name, email, role, status, created_at
        FROM users
        ORDER BY user_id DESC
    """)
    data = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(data)

@app.route('/api/users/<int:user_id>/role', methods=['PUT'])
@require_permission('users.manage')
def update_user_role(user_id):
    data = request.json or {}
    new_role = data.get('role')
    if new_role not in ('Admin', 'Manager', 'Staff'):
        return jsonify({"error": "Invalid role"}), 400

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT role FROM users WHERE user_id = %s", (user_id,))
    target = cur.fetchone()
    cur.close()
    conn.close()

    if not target:
        return jsonify({"error": "User not found"}), 404
    if target['role'] == 'Customer':
        # Customer accounts are tied to a customers record (orders, delivery info) and
        # were never vetted as employees — they can't be promoted into a staff role here.
        return jsonify({"error": "Customer accounts can't be changed to a staff role"}), 400

    conn2 = get_connection()
    cur2 = conn2.cursor()
    cur2.execute("SELECT role_id FROM roles WHERE role_name = %s LIMIT 1", (new_role,))
    row = cur2.fetchone()
    cur2.close()
    conn2.close()
    if not row:
        return jsonify({"error": "Role not found"}), 400
    new_role_id = row[0]

    result = execute_transaction([
        ("UPDATE users SET role = %s, role_id = %s WHERE user_id = %s", (new_role, new_role_id, user_id))
    ], user_id=g.user_id)

    if result['success']:
        return jsonify({"message": "Role updated"})
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
    data = request.json or {}
    err = require_fields(data, ['product_id', 'quantity'])
    if err:
        return err
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
    data = request.json or {}
    err = require_fields(data, ['product_id', 'quantity'])
    if err:
        return err
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
    phone = data.get('phone')
    password = data.get('password')

    if not password or (not email and not phone):
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    if email:
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    else:
        cur.execute("SELECT * FROM users WHERE phone = %s", (phone,))
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


@app.route('/api/auth/google', methods=['POST'])
def api_auth_google():
    """Google Sign-In for the customer shop. Verifies the ID token Google's own
    button hands back, then logs the matching account in — or creates a new
    Customer account on first sign-in, auto-verified since Google already
    confirmed the email."""
    data = request.json or {}
    credential = data.get('credential')
    if not credential:
        return jsonify({"success": False, "error": "Missing Google credential"}), 400

    try:
        idinfo = google_id_token.verify_oauth2_token(
            credential, google_auth_requests.Request(), GOOGLE_CLIENT_ID
        )
    except Exception:
        return jsonify({"success": False, "error": "Invalid Google credential"}), 401

    email = idinfo.get('email')
    name = (idinfo.get('name') or '').strip()
    if not email:
        return jsonify({"success": False, "error": "Google account has no email"}), 400

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cur.fetchone()

    if not user:
        parts = name.split() if name else ['Google', 'User']
        first_name = parts[0]
        last_name = ' '.join(parts[1:]) if len(parts) > 1 else ''

        base_username = email.split('@')[0]
        username = base_username
        cur2 = conn.cursor()
        suffix = 0
        while True:
            cur2.execute("SELECT COUNT(*) FROM users WHERE username = %s", (username,))
            if cur2.fetchone()[0] == 0:
                break
            suffix += 1
            username = f"{base_username}{suffix}"

        cur2.execute("SELECT role_id FROM roles WHERE role_name = 'Customer' LIMIT 1")
        row = cur2.fetchone()
        role_id = row[0] if row else None

        # Google-only accounts get an unusable random password hash — they can
        # only ever sign in via Google, never through the password login forms.
        random_pw_hash = bcrypt.hashpw(os.urandom(24), bcrypt.gensalt()).decode()

        try:
            cur2.execute(
                """INSERT INTO users
                   (first_name, last_name, username, email, password_hash, role, role_id, is_verified)
                   VALUES (%s,%s,%s,%s,%s,'Customer',%s,1)""",
                (first_name, last_name, username, email, random_pw_hash, role_id)
            )
            new_user_id = cur2.lastrowid
            cur2.execute(
                "INSERT INTO customers (customer_name, email, user_id) VALUES (%s,%s,%s)",
                (name or email, email, new_user_id)
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            cur.close()
            cur2.close()
            conn.close()
            return jsonify({"success": False, "error": str(e)}), 400
        cur2.close()

        cur.execute("SELECT * FROM users WHERE user_id = %s", (new_user_id,))
        user = cur.fetchone()

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


@app.route('/api/shop/register', methods=['POST'])
def api_shop_register():
    """Customer-facing registration. Creates a users row (role='Customer') AND a
    linked customers row in the same transaction, then sends the same OTP flow
    used for staff registration."""
    data = request.json or {}
    err = require_fields(data, ['name', 'email', 'password'])
    if err:
        return err

    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    phone = data.get('phone', '').strip()

    if len(password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters"}), 400

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

    cur.execute("SELECT role_id FROM roles WHERE role_name = 'Customer' LIMIT 1")
    row = cur.fetchone()
    role_id = row[0] if row else None

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    otp_code = f"{random.randint(0, 999999):06d}"

    try:
        cur.execute(
            """INSERT INTO users
               (first_name, last_name, username, email, phone, password_hash, role, role_id, is_verified, otp_code, otp_expires_at)
               VALUES (%s,%s,%s,%s,%s,%s,'Customer',%s,0,%s, DATE_ADD(NOW(), INTERVAL 10 MINUTE))""",
            (first_name, last_name, username, email, phone or None, pw_hash, role_id, otp_code)
        )
        new_user_id = cur.lastrowid

        cur.execute(
            "INSERT INTO customers (customer_name, email, phone, user_id) VALUES (%s,%s,%s,%s)",
            (name, email, phone or None, new_user_id)
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


@app.route('/api/auth/forgot-password', methods=['POST'])
@limiter.limit("3 per minute")
def api_auth_forgot_password():
    data = request.json or {}
    email = data.get('email', '').strip()
    if not email:
        return jsonify({"success": False, "error": "Email required"}), 400

    generic_response = jsonify({"success": True, "message": "If that email is registered, a reset code has been sent."})

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cur.fetchone()

    if not user:
        cur.close()
        conn.close()
        # Don't reveal whether the email is registered
        return generic_response

    otp_code = f"{random.randint(0, 999999):06d}"
    cur.execute(
        "UPDATE users SET otp_code = %s, otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = %s",
        (otp_code, email)
    )
    conn.commit()
    cur.close()
    conn.close()

    try:
        send_password_reset_email(email, otp_code)
    except Exception:
        # Still return the generic response so we don't leak whether the email exists
        pass

    return generic_response


@app.route('/api/auth/reset-password', methods=['POST'])
@limiter.limit("5 per minute")
def api_auth_reset_password():
    data = request.json or {}
    err = require_fields(data, ['email', 'otp', 'new_password'])
    if err:
        return err

    email = data.get('email', '').strip()
    otp = data.get('otp', '').strip()
    new_password = data.get('new_password', '')

    if len(new_password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters"}), 400

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cur.fetchone()

    if not user or not user.get('otp_code') or user.get('otp_code') != otp:
        cur.close()
        conn.close()
        return jsonify({"success": False, "error": "Invalid or expired code"}), 400

    expires_at = user.get('otp_expires_at')
    if not expires_at or datetime.now() > expires_at:
        cur.close()
        conn.close()
        return jsonify({"success": False, "error": "Invalid or expired code"}), 400

    pw_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    cur.execute(
        "UPDATE users SET password_hash = %s, otp_code = NULL, otp_expires_at = NULL WHERE email = %s",
        (pw_hash, email)
    )
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"success": True, "message": "Password reset successfully. You can now log in."})


@app.route('/api/auth/verify', methods=['GET'])
def api_auth_verify():
    user_id = get_user_id_from_bearer_token()
    if not user_id:
        return jsonify({"success": False}), 401
    return jsonify({"success": True})


@app.route('/api/auth/logout', methods=['POST'])
def api_auth_logout():
    return jsonify({"success": True})

# ---------- SHOP (Customer-facing ordering) ----------
def get_customer_id_for_user(user_id):
    """Look up the customers.customer_id linked to a given users.user_id, or None."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT customer_id FROM customers WHERE user_id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row[0] if row else None


@app.route('/api/shop/profile', methods=['GET'])
@require_permission('shop.order')
def get_my_profile():
    customer_id = get_customer_id_for_user(g.user_id)
    if not customer_id:
        return jsonify({"error": "No linked customer record for this account"}), 400

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT customer_id, customer_name, email, phone, address, city, state, country, postal_code FROM customers WHERE customer_id = %s",
        (customer_id,)
    )
    data = cur.fetchone()
    cur.close()
    conn.close()
    if not data:
        return jsonify({"error": "Profile not found"}), 404
    return jsonify(data)


@app.route('/api/shop/profile', methods=['PUT'])
@require_permission('shop.order')
def update_my_profile():
    customer_id = get_customer_id_for_user(g.user_id)
    if not customer_id:
        return jsonify({"error": "No linked customer record for this account"}), 400

    data = request.json or {}
    err = require_fields(data, ['customer_name'])
    if err:
        return err

    result = execute_transaction([
        ("""UPDATE customers SET customer_name = %s, phone = %s, address = %s, city = %s, state = %s, postal_code = %s
            WHERE customer_id = %s""",
         (data['customer_name'], data.get('phone', ''), data.get('address', ''),
          data.get('city', ''), data.get('state', ''), data.get('postal_code', ''), customer_id))
    ], user_id=g.user_id)
    if result['success']:
        return jsonify({"message": "Profile updated"})
    return jsonify({"error": result['error']}), 400


@app.route('/api/shop/orders', methods=['GET'])
@require_permission('shop.order')
def get_my_orders():
    customer_id = get_customer_id_for_user(g.user_id)
    if not customer_id:
        return jsonify({"error": "No linked customer record for this account"}), 400

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT o.* FROM orders o
        WHERE o.customer_id = %s
        ORDER BY o.order_id DESC
    """, (customer_id,))
    orders = cur.fetchall()

    for order in orders:
        cur.execute("""
            SELECT oi.quantity, oi.unit_price, oi.subtotal, p.product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = %s
        """, (order['order_id'],))
        order['items'] = cur.fetchall()

        cur.execute("""
            SELECT status, reason, staff_note FROM refund_requests
            WHERE order_id = %s ORDER BY request_id DESC LIMIT 1
        """, (order['order_id'],))
        order['refund_request'] = cur.fetchone()

    cur.close()
    conn.close()
    return jsonify(orders)


@app.route('/api/shop/orders/<int:order_id>/cancel', methods=['PUT'])
@require_permission('shop.order')
def cancel_my_order(order_id):
    customer_id = get_customer_id_for_user(g.user_id)
    if not customer_id:
        return jsonify({"error": "No linked customer record for this account"}), 400

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM orders WHERE order_id = %s AND customer_id = %s", (order_id, customer_id))
    order = cur.fetchone()
    cur.close()
    conn.close()

    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order.get('order_status') != 'Pending':
        return jsonify({"error": "Only pending orders can be cancelled"}), 400

    result = execute_transaction([
        ("UPDATE orders SET order_status = 'Cancelled' WHERE order_id = %s", (order_id,))
    ], user_id=g.user_id)
    if result['success']:
        return jsonify({"message": "Order cancelled"})
    return jsonify({"error": result['error']}), 400


@app.route('/api/shop/orders', methods=['POST'])
@require_permission('shop.order')
def create_my_order():
    data = request.json or {}
    err = require_fields(data, ['items'])
    if err:
        return err
    for item in data.get('items', []):
        item_err = require_fields(item, ['product_id', 'quantity', 'unit_price'])
        if item_err:
            return item_err

    payment_method = data.get('payment_method', 'COD')
    if payment_method not in ('COD', 'Online'):
        payment_method = 'COD'
    delivery_address = (data.get('delivery_address') or '').strip() or None
    delivery_city = (data.get('delivery_city') or '').strip() or None
    delivery_phone = (data.get('delivery_phone') or '').strip() or None

    customer_id = get_customer_id_for_user(g.user_id)
    if not customer_id:
        return jsonify({"error": "No linked customer record for this account"}), 400

    total_amount = sum(item['quantity'] * item['unit_price'] for item in data['items'])

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SET @current_user_id = %s", (g.user_id,))
        conn.start_transaction()

        # Customer-placed orders start as a Pending request. Stock is NOT touched here —
        # staff reviews and approves it separately, which is when stock actually moves.
        cur.execute(
            """INSERT INTO orders
               (customer_id, user_id, total_amount, order_status, payment_status, payment_method, delivery_address, delivery_city, delivery_phone)
               VALUES (%s,%s,%s,'Pending','Pending',%s,%s,%s,%s)""",
            (customer_id, g.user_id, total_amount, payment_method, delivery_address, delivery_city, delivery_phone)
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

        try:
            notif_cur = conn.cursor()
            notif_cur.execute(
                "INSERT INTO notifications (message, link, order_id) VALUES (%s, %s, %s)",
                (f"New order request #{order_id} \u2014 {total_amount}", "/sales", order_id)
            )
            conn.commit()
            notif_cur.close()
        except Exception:
            pass  # The order already succeeded — a failed notification shouldn't undo it.

        return jsonify({"message": "Order request submitted", "order_id": order_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()


@app.route('/api/shop/orders/<int:order_id>/create-payment', methods=['POST'])
@require_permission('shop.order')
def create_order_payment(order_id):
    """Step 1 of real payment: ask Razorpay for a payment session for this order's
    amount. Returns only the public key_id and session id — never the secret."""
    customer_id = get_customer_id_for_user(g.user_id)
    if not customer_id:
        return jsonify({"error": "No linked customer record for this account"}), 400

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM orders WHERE order_id = %s AND customer_id = %s", (order_id, customer_id))
    order = cur.fetchone()
    cur.close()
    conn.close()

    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order.get('payment_status') == 'Paid':
        return jsonify({"error": "This order is already paid"}), 400

    amount_paise = int(round(float(order['total_amount']) * 100))
    try:
        razorpay_order = razorpay_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"order_{order_id}",
        })
    except Exception as e:
        return jsonify({"error": f"Could not start payment: {str(e)}"}), 500

    return jsonify({
        "razorpay_order_id": razorpay_order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
    })


@app.route('/api/shop/orders/<int:order_id>/verify-payment', methods=['POST'])
@require_permission('shop.order')
def verify_order_payment(order_id):
    """Step 2: the frontend never gets to just say 'payment succeeded'. We
    independently recompute the signature Razorpay would have produced and
    only mark the order paid if it matches exactly."""
    customer_id = get_customer_id_for_user(g.user_id)
    if not customer_id:
        return jsonify({"error": "No linked customer record for this account"}), 400

    data = request.json or {}
    err = require_fields(data, ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'])
    if err:
        return err

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM orders WHERE order_id = %s AND customer_id = %s", (order_id, customer_id))
    order = cur.fetchone()
    cur.close()
    conn.close()

    if not order:
        return jsonify({"error": "Order not found"}), 404

    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        f"{data['razorpay_order_id']}|{data['razorpay_payment_id']}".encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, data['razorpay_signature']):
        return jsonify({"error": "Payment verification failed"}), 400

    # Signature is genuine — mark paid and remember which Razorpay payment this
    # was, so a refund later has something real to point at. This never touches
    # order_status or stock; staff still separately approves the order.
    result = execute_transaction([
        ("UPDATE orders SET payment_status = 'Paid', razorpay_payment_id = %s WHERE order_id = %s",
         (data['razorpay_payment_id'], order_id))
    ], user_id=g.user_id)
    if result['success']:
        return jsonify({"message": "Payment verified"})
    return jsonify({"error": result['error']}), 400


@app.route('/api/shop/orders/<int:order_id>/request-refund', methods=['POST'])
@require_permission('shop.order')
def request_refund(order_id):
    """Customer-initiated first step. No money moves here — this only creates
    a request for staff to review."""
    customer_id = get_customer_id_for_user(g.user_id)
    if not customer_id:
        return jsonify({"error": "No linked customer record for this account"}), 400

    data = request.json or {}
    err = require_fields(data, ['reason'])
    if err:
        return err

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM orders WHERE order_id = %s AND customer_id = %s", (order_id, customer_id))
    order = cur.fetchone()
    if not order:
        cur.close()
        conn.close()
        return jsonify({"error": "Order not found"}), 404
    if order.get('payment_status') != 'Paid':
        cur.close()
        conn.close()
        return jsonify({"error": "Only paid orders can have a refund requested"}), 400

    cur.execute("SELECT COUNT(*) AS c FROM refund_requests WHERE order_id = %s AND status = 'Pending'", (order_id,))
    existing = cur.fetchone()
    cur.close()
    conn.close()
    if existing['c'] > 0:
        return jsonify({"error": "A refund request for this order is already pending review"}), 400

    conn2 = get_connection()
    cur2 = conn2.cursor()
    try:
        cur2.execute("SET @current_user_id = %s", (g.user_id,))
        conn2.start_transaction()
        cur2.execute(
            "INSERT INTO refund_requests (order_id, customer_id, reason) VALUES (%s, %s, %s)",
            (order_id, customer_id, data['reason'])
        )
        cur2.execute(
            "INSERT INTO notifications (message, link, order_id) VALUES (%s, %s, %s)",
            (f"Refund requested for order #{order_id} — {data['reason'][:80]}", "/sales", order_id)
        )
        conn2.commit()
    except Exception as e:
        conn2.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cur2.close()
        conn2.close()

    return jsonify({"message": "Refund request submitted"}), 201


@app.route('/api/refund-requests', methods=['GET'])
@require_permission('orders.refund')
def get_refund_requests():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT rr.*, c.customer_name, o.total_amount
        FROM refund_requests rr
        JOIN customers c ON rr.customer_id = c.customer_id
        JOIN orders o ON rr.order_id = o.order_id
        ORDER BY rr.requested_at DESC
    """)
    data = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(data)


@app.route('/api/refund-requests/<int:request_id>/approve', methods=['PUT'])
@require_permission('orders.refund')
def approve_refund_request(request_id):
    """This is the only place a real Razorpay refund actually happens now —
    only reachable after a customer's request has been reviewed and approved.
    Same audited stock-restoration behavior as before."""
    user_id = g.user_id

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM refund_requests WHERE request_id = %s", (request_id,))
    req = cur.fetchone()
    if not req:
        cur.close()
        conn.close()
        return jsonify({"error": "Refund request not found"}), 404
    if req.get('status') != 'Pending':
        cur.close()
        conn.close()
        return jsonify({"error": "This request has already been resolved"}), 400

    cur.execute("SELECT * FROM orders WHERE order_id = %s", (req['order_id'],))
    order = cur.fetchone()
    if not order:
        cur.close()
        conn.close()
        return jsonify({"error": "Order not found"}), 404
    if order.get('payment_status') != 'Paid':
        cur.close()
        conn.close()
        return jsonify({"error": "Order is no longer in a paid state"}), 400
    if not order.get('razorpay_payment_id'):
        cur.close()
        conn.close()
        return jsonify({"error": "No payment record on file for this order — it may predate refund support"}), 400

    stock_was_deducted = order.get('order_status') in ('Processing', 'Completed')
    cur.execute("SELECT * FROM order_items WHERE order_id = %s", (req['order_id'],))
    items = cur.fetchall()
    cur.close()
    conn.close()

    amount_paise = int(round(float(order['total_amount']) * 100))
    try:
        refund = razorpay_client.payment.refund(order['razorpay_payment_id'], {"amount": amount_paise})
    except Exception as e:
        return jsonify({"error": f"Refund failed: {str(e)}"}), 500

    conn2 = get_connection()
    cur2 = conn2.cursor()
    try:
        cur2.execute("SET @current_user_id = %s", (user_id,))
        conn2.start_transaction()

        if stock_was_deducted:
            for item in items:
                cur2.execute(
                    "UPDATE products SET stock_quantity = stock_quantity + %s WHERE product_id = %s",
                    (item['quantity'], item['product_id'])
                )
                cur2.execute(
                    """INSERT INTO inventory_transactions (product_id, user_id, transaction_type, quantity, remarks)
                       VALUES (%s,%s,'Stock In',%s,%s)""",
                    (item['product_id'], user_id, item['quantity'], f"Refund for order #{req['order_id']}")
                )

        cur2.execute(
            "UPDATE orders SET payment_status = 'Refunded', order_status = 'Cancelled' WHERE order_id = %s",
            (req['order_id'],)
        )
        cur2.execute(
            "UPDATE refund_requests SET status = 'Approved', resolved_at = NOW(), resolved_by = %s WHERE request_id = %s",
            (user_id, request_id)
        )
        conn2.commit()
    except Exception as e:
        conn2.rollback()
        return jsonify({
            "error": f"Razorpay refund succeeded but updating our records failed: {str(e)}. "
                     f"Refund ID: {refund.get('id')} — contact support to reconcile manually."
        }), 500
    finally:
        cur2.close()
        conn2.close()

    return jsonify({"message": "Refund approved and processed", "refund_id": refund.get('id')})


@app.route('/api/refund-requests/<int:request_id>/reject', methods=['PUT'])
@require_permission('orders.refund')
def reject_refund_request(request_id):
    data = request.json or {}
    staff_note = data.get('staff_note', '')

    result = execute_transaction([
        ("""UPDATE refund_requests SET status = 'Rejected', staff_note = %s, resolved_at = NOW(), resolved_by = %s
            WHERE request_id = %s AND status = 'Pending'""",
         (staff_note, g.user_id, request_id))
    ], user_id=g.user_id)
    if result['success']:
        return jsonify({"message": "Refund request rejected"})
    return jsonify({"error": result['error']}), 400


# ---------- NOTIFICATIONS (shared feed for staff) ----------
@app.route('/api/notifications', methods=['GET'])
@require_permission('orders.view')
def get_notifications():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM notifications ORDER BY notification_id DESC LIMIT 50")
    data = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(data)


@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
@require_permission('orders.view')
def mark_notification_read(notification_id):
    result = execute_transaction([
        ("UPDATE notifications SET is_read = 1 WHERE notification_id = %s", (notification_id,))
    ])
    if result['success']:
        return jsonify({"message": "Marked as read"})
    return jsonify({"error": result['error']}), 400


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