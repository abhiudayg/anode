#!/bin/bash
# Keep only the orders footprint: anode-orders unit and its Postgres. Other units and store containers stop.
for u in $(systemctl list-units 'anode-*' --type=service --no-legend --all | awk '{print $1}' | sed 's/\.service$//'); do
  [ "$u" = anode-orders ] || systemctl stop "$u"
done
for c in $(docker ps --format '{{.Names}}'); do
  [ "$c" = anode-db-orders-postgres ] || docker stop "$c" >/dev/null
done
sleep 3
echo "active_units=$(systemctl list-units 'anode-*' --state=active --no-legend | wc -l)"
echo "running_containers=$(docker ps -q | wc -l)"
free -m | sed -n 2p
