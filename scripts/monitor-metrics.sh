#!/bin/bash

# Monitor Metrics Script for Canary Deployment
# Usage: ./monitor-metrics.sh <deployment_url> <canary_percentage>

set -e

DEPLOYMENT_URL=$1
CANARY_PERCENTAGE=$2

if [ -z "$DEPLOYMENT_URL" ] || [ -z "$CANARY_PERCENTAGE" ]; then
  echo "❌ Usage: $0 <deployment_url> <canary_percentage>"
  exit 1
fi

echo "📊 Monitoring metrics at ${CANARY_PERCENTAGE}% canary traffic"
echo "🔗 Deployment: $DEPLOYMENT_URL"
echo "⏰ Duration: 10 minutes"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Thresholds
ERROR_RATE_THRESHOLD=1.0
P95_THRESHOLD=200
P99_THRESHOLD=500
CPU_THRESHOLD=80
MEMORY_THRESHOLD=90

# Monitoring duration (seconds)
DURATION=600
INTERVAL=30
ITERATIONS=$((DURATION / INTERVAL))

# Initialize metrics
total_errors=0
total_requests=0
response_times=()
cpu_samples=()
memory_samples=()

# Function to collect metrics
collect_metrics() {
  local iteration=$1
  
  echo -e "\n[$iteration/$ITERATIONS] Collecting metrics at $(date '+%Y-%m-%d %H:%M:%S')"
  
  # Get metrics from monitoring endpoint
  metrics_response=$(curl -s "${DEPLOYMENT_URL}/api/v2/metrics" || echo "{}")
  
  # Parse metrics
  current_errors=$(echo "$metrics_response" | jq -r '.errors // 0' 2>/dev/null || echo "0")
  current_requests=$(echo "$metrics_response" | jq -r '.requests // 0' 2>/dev/null || echo "0")
  current_p95=$(echo "$metrics_response" | jq -r '.response_time.p95 // 0' 2>/dev/null || echo "0")
  current_p99=$(echo "$metrics_response" | jq -r '.response_time.p99 // 0' 2>/dev/null || echo "0")
  current_cpu=$(echo "$metrics_response" | jq -r '.system.cpu_percent // 0' 2>/dev/null || echo "0")
  current_memory=$(echo "$metrics_response" | jq -r '.system.memory_percent // 0' 2>/dev/null || echo "0")
  
  # Update totals
  total_errors=$((total_errors + current_errors))
  total_requests=$((total_requests + current_requests))
  
  # Store samples
  response_times+=("$current_p95")
  cpu_samples+=("$current_cpu")
  memory_samples+=("$current_memory")
  
  # Calculate error rate
  if [ "$total_requests" -gt 0 ]; then
    error_rate=$(echo "scale=2; $total_errors * 100 / $total_requests" | bc)
  else
    error_rate=0
  fi
  
  # Display current metrics
  echo "  📈 Requests: $current_requests"
  echo -n "  ❌ Error rate: ${error_rate}% "
  if (( $(echo "$error_rate > $ERROR_RATE_THRESHOLD" | bc -l) )); then
    echo -e "${RED}(ALERT: > ${ERROR_RATE_THRESHOLD}%)${NC}"
  else
    echo -e "${GREEN}(OK)${NC}"
  fi
  
  echo -n "  ⏱️  P95: ${current_p95}ms "
  if [ "$current_p95" -gt "$P95_THRESHOLD" ]; then
    echo -e "${RED}(ALERT: > ${P95_THRESHOLD}ms)${NC}"
  else
    echo -e "${GREEN}(OK)${NC}"
  fi
  
  echo -n "  ⏱️  P99: ${current_p99}ms "
  if [ "$current_p99" -gt "$P99_THRESHOLD" ]; then
    echo -e "${YELLOW}(WARNING: > ${P99_THRESHOLD}ms)${NC}"
  else
    echo -e "${GREEN}(OK)${NC}"
  fi
  
  echo -n "  💻 CPU: ${current_cpu}% "
  if (( $(echo "$current_cpu > $CPU_THRESHOLD" | bc -l) )); then
    echo -e "${YELLOW}(WARNING: > ${CPU_THRESHOLD}%)${NC}"
  else
    echo -e "${GREEN}(OK)${NC}"
  fi
  
  echo -n "  🧠 Memory: ${current_memory}% "
  if (( $(echo "$current_memory > $MEMORY_THRESHOLD" | bc -l) )); then
    echo -e "${RED}(ALERT: > ${MEMORY_THRESHOLD}%)${NC}"
  else
    echo -e "${GREEN}(OK)${NC}"
  fi
  
  # Check for anomalies
  check_anomalies "$error_rate" "$current_p95" "$current_cpu" "$current_memory"
}

# Function to check for anomalies
check_anomalies() {
  local error_rate=$1
  local p95=$2
  local cpu=$3
  local memory=$4
  
  local has_anomaly=false
  
  # Check critical thresholds
  if (( $(echo "$error_rate > 5" | bc -l) )); then
    echo -e "\n  ${RED}🚨 CRITICAL: Error rate exceeded 5%!${NC}"
    has_anomaly=true
  fi
  
  if [ "$p95" -gt 1000 ]; then
    echo -e "\n  ${RED}🚨 CRITICAL: P95 response time exceeded 1 second!${NC}"
    has_anomaly=true
  fi
  
  if (( $(echo "$memory > 95" | bc -l) )); then
    echo -e "\n  ${RED}🚨 CRITICAL: Memory usage exceeded 95%!${NC}"
    has_anomaly=true
  fi
  
  if [ "$has_anomaly" = true ]; then
    echo -e "  ${YELLOW}⚠️  Consider pausing or rolling back the deployment${NC}"
    
    # Send alert (placeholder for actual alerting)
    send_alert "Critical anomaly detected at ${CANARY_PERCENTAGE}% canary traffic"
  fi
}

# Function to send alerts
send_alert() {
  local message=$1
  
  # Log alert
  echo "[ALERT] $message" >> /tmp/canary-alerts.log
  
  # Send to monitoring system (placeholder)
  # curl -X POST "$MONITORING_WEBHOOK" -d "{\"text\":\"$message\"}"
}

# Function to calculate statistics
calculate_stats() {
  local arr=("$@")
  local n=${#arr[@]}
  
  if [ "$n" -eq 0 ]; then
    echo "0"
    return
  fi
  
  # Calculate average
  local sum=0
  for val in "${arr[@]}"; do
    sum=$(echo "$sum + $val" | bc)
  done
  
  echo "scale=2; $sum / $n" | bc
}

# Function to generate summary report
generate_summary() {
  echo -e "\n\n📊 Monitoring Summary Report"
  echo "════════════════════════════════════"
  echo "🕐 Duration: $DURATION seconds"
  echo "🔄 Canary Traffic: ${CANARY_PERCENTAGE}%"
  echo ""
  
  # Calculate final error rate
  if [ "$total_requests" -gt 0 ]; then
    final_error_rate=$(echo "scale=2; $total_errors * 100 / $total_requests" | bc)
  else
    final_error_rate=0
  fi
  
  echo "📈 Traffic Statistics:"
  echo "  • Total Requests: $total_requests"
  echo "  • Total Errors: $total_errors"
  echo -n "  • Error Rate: ${final_error_rate}% "
  
  if (( $(echo "$final_error_rate > $ERROR_RATE_THRESHOLD" | bc -l) )); then
    echo -e "${RED}❌ FAILED${NC}"
    exit_code=1
  else
    echo -e "${GREEN}✅ PASSED${NC}"
  fi
  
  # Response time statistics
  avg_p95=$(calculate_stats "${response_times[@]}")
  echo ""
  echo "⏱️  Response Time Statistics:"
  echo -n "  • Average P95: ${avg_p95}ms "
  
  if (( $(echo "$avg_p95 > $P95_THRESHOLD" | bc -l) )); then
    echo -e "${RED}❌ FAILED${NC}"
    exit_code=1
  else
    echo -e "${GREEN}✅ PASSED${NC}"
  fi
  
  # Resource usage statistics
  avg_cpu=$(calculate_stats "${cpu_samples[@]}")
  avg_memory=$(calculate_stats "${memory_samples[@]}")
  
  echo ""
  echo "💻 Resource Usage:"
  echo "  • Average CPU: ${avg_cpu}%"
  echo "  • Average Memory: ${avg_memory}%"
  
  # Recommendation
  echo ""
  echo "🎯 Recommendation:"
  if [ "${exit_code:-0}" -eq 0 ]; then
    echo -e "  ${GREEN}✅ Safe to proceed with higher canary percentage${NC}"
  else
    echo -e "  ${RED}❌ Issues detected. Review metrics before proceeding${NC}"
  fi
  
  # Save report
  report_file="/tmp/canary-report-${CANARY_PERCENTAGE}pct-$(date +%Y%m%d-%H%M%S).json"
  cat > "$report_file" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployment_url": "$DEPLOYMENT_URL",
  "canary_percentage": $CANARY_PERCENTAGE,
  "duration_seconds": $DURATION,
  "metrics": {
    "total_requests": $total_requests,
    "total_errors": $total_errors,
    "error_rate_percent": $final_error_rate,
    "avg_p95_ms": $avg_p95,
    "avg_cpu_percent": $avg_cpu,
    "avg_memory_percent": $avg_memory
  },
  "thresholds": {
    "error_rate": $ERROR_RATE_THRESHOLD,
    "p95_ms": $P95_THRESHOLD,
    "cpu_percent": $CPU_THRESHOLD,
    "memory_percent": $MEMORY_THRESHOLD
  },
  "passed": $([ "${exit_code:-0}" -eq 0 ] && echo "true" || echo "false")
}
EOF
  
  echo ""
  echo "📄 Report saved to: $report_file"
}

# Main monitoring loop
echo "🚀 Starting monitoring..."

for i in $(seq 1 $ITERATIONS); do
  collect_metrics "$i"
  
  # Sleep between iterations (except for the last one)
  if [ "$i" -lt "$ITERATIONS" ]; then
    echo "  💤 Waiting $INTERVAL seconds..."
    sleep "$INTERVAL"
  fi
done

# Generate final report
generate_summary

# Exit with appropriate code
exit "${exit_code:-0}"