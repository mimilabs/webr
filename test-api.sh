#!/bin/bash

# WebR API Authentication Test Script
# Usage: bash test-api.sh

API_KEY="webr_969f2797540bfb185a83ec1bbeb170bfad85674d3249fe62c07c8201b7a78525"
BASE_URL="https://webr.mimilabs.org"

echo "=========================================="
echo "WebR API Authentication Tests"
echo "=========================================="
echo ""

# Test 1: Without API Key (should fail)
echo "Test 1: Health check WITHOUT API key (should fail)"
echo "---"
curl -s $BASE_URL/api/health | jq '.'
echo ""
echo ""

# Test 2: With Invalid API Key (should fail)
echo "Test 2: Health check with INVALID API key (should fail)"
echo "---"
curl -s $BASE_URL/api/health \
  -H "Authorization: Bearer invalid_key_123" | jq '.'
echo ""
echo ""

# Test 3: With Valid API Key (should succeed)
echo "Test 3: Health check with VALID API key (should succeed)"
echo "---"
curl -s $BASE_URL/api/health \
  -H "Authorization: Bearer $API_KEY" | jq '.'
echo ""
echo ""

# Test 4: Execute endpoint without auth (should fail)
echo "Test 4: Execute WITHOUT API key (should fail)"
echo "---"
curl -s -X POST $BASE_URL/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(1 + 1)"}' | jq '.'
echo ""
echo ""

# Test 5: Execute simple R code with auth (should succeed)
echo "Test 5: Execute simple R code with VALID API key (should succeed)"
echo "---"
curl -s -X POST $BASE_URL/api/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"code": "print(1 + 1)"}' | jq '.'
echo ""
echo ""

# Test 6: Execute ggplot2 with auth (should succeed)
echo "Test 6: Generate ggplot2 chart with VALID API key (should succeed)"
echo "---"
curl -s -X POST $BASE_URL/api/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"code": "library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()"}' \
  | jq '{success, output, plot_count: (.plots | length), executionTime}'
echo ""
echo ""

echo "=========================================="
echo "Tests Complete!"
echo "=========================================="
