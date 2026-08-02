from db_utils import execute_transaction

# Test 1: should succeed
result = execute_transaction([
    ("INSERT INTO categories (category_name) VALUES (%s)", ("Test Category",))
], user_id=1)
print("Test 1 (should succeed):", result)

# Test 2: should fail and roll back
result = execute_transaction([
    ("INSERT INTO categories (category_name) VALUES (%s)", ("Another Category",)),
    ("INSERT INTO products (sku, product_name, category_id, supplier_id, cost_price, selling_price) VALUES (%s,%s,%s,%s,%s,%s)",
     ("FAIL-TEST", "Should Not Exist", 99999, 99999, 10, 20))
], user_id=1)
print("Test 2 (should fail + rollback):", result)
