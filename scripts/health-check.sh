#!/bin/bash

# Health Check Script for v2 API
# Usage: ./health-check.sh <deployment_url>

set -e

DEPLOYMENT_URL=$1
if [ -z "$DEPLOYMENT_URL" ]; then
  echo "❌ Usage: $0 <deployment_url>"
  exit 1
fi

echo "🏥 Starting health checks for: $DEPLOYMENT_URL"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Health check endpoints
HEALTH_ENDPOINT="${DEPLOYMENT_URL}/api/v2/health"
READY_ENDPOINT="${DEPLOYMENT_URL}/api/v2/ready"

# Function to check endpoint
check_endpoint() {
  local url=$1
  local name=$2
  local expected_status=${3:-200}
  
  echo -n "Checking $name... "
  
  response=$(curl -s -w "\n%{http_code}" "$url" || echo "000")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓${NC} ($http_code)"
    return 0
  else
    echo -e "${RED}✗${NC} (Expected: $expected_status, Got: $http_code)"
    echo "Response: $body"
    return 1
  fi
}

# Function to check response time
check_response_time() {
  local url=$1
  local name=$2
  local max_time=$3
  
  echo -n "Checking $name response time... "
  
  response_time=$(curl -s -o /dev/null -w "%{time_total}" "$url")
  response_time_ms=$(echo "$response_time * 1000" | bc | cut -d. -f1)
  
  if [ "$response_time_ms" -lt "$max_time" ]; then
    echo -e "${GREEN}✓${NC} (${response_time_ms}ms)"
    return 0
  else
    echo -e "${RED}✗${NC} (${response_time_ms}ms > ${max_time}ms)"
    return 1
  fi
}

# Function to check API functionality
check_api_functionality() {
  echo -e "\n📋 Checking API functionality..."
  
  # Test GET reservations
  echo -n "  GET /api/v2/reservations... "
  response=$(curl -s -w "\n%{http_code}" "${DEPLOYMENT_URL}/api/v2/reservations?limit=1" \
    -H "Accept: application/json" || echo "000")
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${RED}✗${NC} ($http_code)"
    errors=$((errors + 1))
  fi
  
  # Test OPTIONS (CORS)
  echo -n "  OPTIONS /api/v2/reservations (CORS)... "
  response=$(curl -s -I -X OPTIONS "${DEPLOYMENT_URL}/api/v2/reservations" \
    -H "Origin: https://gameplaza.vercel.app" \
    -H "Access-Control-Request-Method: GET" || echo "")
  
  if echo "$response" | grep -q "access-control-allow-origin"; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${RED}✗${NC} (No CORS headers)"
    errors=$((errors + 1))
  fi
}

# Function to check database connectivity
check_database() {
  echo -e "\n🗄️  Checking database connectivity..."
  
  echo -n "  Database health... "
  response=$(curl -s "${DEPLOYMENT_URL}/api/v2/health/db" || echo "{\"status\":\"error\"}")
  status=$(echo "$response" | jq -r '.status' 2>/dev/null || echo "error")
  
  if [ "$status" = "healthy" ]; then
    echo -e "${GREEN}✓${NC}"
    
    # Check connection pool
    connections=$(echo "$response" | jq -r '.connections // 0' 2>/dev/null || echo "0")
    echo "  Active connections: $connections"
  else
    echo -e "${RED}✗${NC}"
    errors=$((errors + 1))
  fi
}

# Function to check dependencies
check_dependencies() {
  echo -e "\n🔗 Checking external dependencies..."
  
  # Supabase
  echo -n "  Supabase API... "
  supabase_status=$(curl -s "${DEPLOYMENT_URL}/api/v2/health/dependencies" | \
    jq -r '.supabase.status' 2>/dev/null || echo "error")
  
  if [ "$supabase_status" = "operational" ]; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${RED}✗${NC} ($supabase_status)"
    errors=$((errors + 1))
  fi
}

# Main health check execution
errors=0

echo -e "\n🔍 Basic Health Checks"
echo "━━━━━━━━━━━━━━━━━━━━━"

# Basic health checks
check_endpoint "$HEALTH_ENDPOINT" "Health endpoint" 200 || errors=$((errors + 1))
check_endpoint "$READY_ENDPOINT" "Readiness endpoint" 200 || errors=$((errors + 1))

# Response time checks
echo -e "\n⏱️  Performance Checks"
echo "━━━━━━━━━━━━━━━━━━━━━"
check_response_time "$HEALTH_ENDPOINT" "Health endpoint" 100 || errors=$((errors + 1))
check_response_time "${DEPLOYMENT_URL}/api/v2/reservations?limit=1" "API endpoint" 200 || errors=$((errors + 1))

# Functionality checks
check_api_functionality

# Database checks
check_database

# Dependencies checks
check_dependencies

# Memory usage check
echo -e "\n💾 Resource Usage"
echo "━━━━━━━━━━━━━━━━━━━━━"
echo -n "  Memory usage... "
memory_response=$(curl -s "${DEPLOYMENT_URL}/api/v2/health/memory" || echo "{}")
memory_used=$(echo "$memory_response" | jq -r '.used_mb // 0' 2>/dev/null || echo "0")
memory_limit=$(echo "$memory_response" | jq -r '.limit_mb // 0' 2>/dev/null || echo "0")

if [ "$memory_limit" -gt 0 ]; then
  memory_percent=$((memory_used * 100 / memory_limit))
  if [ "$memory_percent" -lt 80 ]; then
    echo -e "${GREEN}✓${NC} (${memory_used}MB / ${memory_limit}MB - ${memory_percent}%)"
  elif [ "$memory_percent" -lt 90 ]; then
    echo -e "${YELLOW}⚠${NC} (${memory_used}MB / ${memory_limit}MB - ${memory_percent}%)"
  else
    echo -e "${RED}✗${NC} (${memory_used}MB / ${memory_limit}MB - ${memory_percent}%)"
    errors=$((errors + 1))
  fi
else
  echo -e "${YELLOW}⚠${NC} (Unable to determine)"
fi

# Summary
echo -e "\n📊 Health Check Summary"
echo "━━━━━━━━━━━━━━━━━━━━━"

if [ "$errors" -eq 0 ]; then
  echo -e "${GREEN}✅ All health checks passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ $errors health check(s) failed!${NC}"
  exit 1
fi