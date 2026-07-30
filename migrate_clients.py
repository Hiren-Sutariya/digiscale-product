import sqlite3
import uuid
from datetime import datetime

# Connect to the database
conn = sqlite3.connect('backend/digiscale.db')
cursor = conn.cursor()

# Get all unique clients from quotations
cursor.execute("""
    SELECT user_id, client_name, client_company, client_address 
    FROM quotations 
    WHERE client_name IS NOT NULL AND client_name != ''
""")
quotations = cursor.fetchall()

# Group by user_id and client_name to avoid duplicates
unique_clients = {}
for user_id, name, company, address in quotations:
    key = (user_id, name.strip().lower() if name else "")
    if key not in unique_clients:
        unique_clients[key] = {
            'user_id': user_id,
            'name': name.strip() if name else "",
            'company': company.strip() if company else "",
            'address': address.strip() if address else ""
        }
    else:
        # If we already have it, maybe prefer the one with more details
        existing = unique_clients[key]
        if not existing['company'] and company:
            existing['company'] = company.strip()
        if not existing['address'] and address:
            existing['address'] = address.strip()

# Check existing clients
cursor.execute("SELECT user_id, LOWER(TRIM(name)) FROM clients")
existing_db_clients = set(cursor.fetchall())

added_count = 0
for key, data in unique_clients.items():
    if (data['user_id'], data['name'].lower()) not in existing_db_clients:
        cursor.execute("""
            INSERT INTO clients (name, company, address, contact, user_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (data['name'], data['company'] or None, data['address'] or None, None, data['user_id'], datetime.utcnow()))
        added_count += 1

conn.commit()
conn.close()

print(f"Successfully migrated {added_count} clients from past quotations.")
