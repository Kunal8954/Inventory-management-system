import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=int(os.getenv("DB_PORT", 3306))
    )

def execute_transaction(queries, user_id=None):
    connection = get_connection()
    cursor = connection.cursor()
    try:
        connection.start_transaction()

        if user_id is not None:
            cursor.execute("SET @current_user_id = %s", (user_id,))

        for sql, params in queries:
            cursor.execute(sql, params)

        connection.commit()
        return {"success": True}
    except Error as e:
        connection.rollback()
        return {"success": False, "error": str(e)}
    finally:
        cursor.close()
        connection.close()