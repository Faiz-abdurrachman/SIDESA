#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "=== LOGIN ADMIN ==="
ADMIN_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@sidesa.id","password":"admin123"}')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -oP '(?<="token":")[^"]+')
echo "Admin token acquired"

echo "=== LOGIN RT ==="
RT_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"rt1@sidesa.id","password":"rt123456"}')

RT_TOKEN=$(echo $RT_LOGIN | grep -oP '(?<="token":")[^"]+')
echo "RT token acquired"

echo "=== GET PENDUDUK ==="
PENDUDUK=$(curl -s -X GET $BASE_URL/penduduk \
-H "Authorization: Bearer $ADMIN_TOKEN")

PENDUDUK_ID=$(echo $PENDUDUK | grep -oP '(?<="id":")[^"]+' | head -n 1)
echo "Using pendudukId: $PENDUDUK_ID"

echo "=== RT CREATE SURAT ==="
CREATE_SURAT=$(curl -s -X POST $BASE_URL/surat \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $RT_TOKEN" \
-d "{\"jenis\":\"DOMISILI\",\"pendudukId\":\"$PENDUDUK_ID\"}")

SURAT_ID=$(echo $CREATE_SURAT | grep -oP '(?<="id":")[^"]+' | head -n 1)
echo "Created suratId: $SURAT_ID"

echo "=== RT TRY APPROVE (SHOULD FAIL) ==="
curl -s -X PUT $BASE_URL/surat/$SURAT_ID/approve \
-H "Authorization: Bearer $RT_TOKEN"

echo ""
echo "=== ADMIN APPROVE (SHOULD SUCCESS) ==="
curl -s -X PUT $BASE_URL/surat/$SURAT_ID/approve \
-H "Authorization: Bearer $ADMIN_TOKEN"

echo ""
echo "=== TEST COMPLETE ==="
