#!/bin/bash

echo "Testing Supabase Integration System"
echo "==================================="
echo ""

# Test database connection
echo "1. Testing Database Connection..."
curl -s http://localhost:3000/api/test-db | python3 -m json.tool

echo ""
echo "2. Testing Payment Flow..."
curl -s http://localhost:3000/api/test-payment-flow | python3 -m json.tool

echo ""
echo "3. Testing User Credits Balance..."
curl -s http://localhost:3000/api/user-credits-balance | python3 -m json.tool

echo ""
echo "Test complete. Check the browser for the test system page."