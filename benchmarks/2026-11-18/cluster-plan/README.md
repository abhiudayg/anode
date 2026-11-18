# Cluster planning, marketplace example (2026-11-18)

What this is: `anode cluster` output for the 32-service marketplace example on a three-node inventory (`anode.cluster.yaml`: one 4 GB edge node, two 16 GB workers). The inventory is the template from `anode cluster init`, unedited.

What this shows: the planner places all 32 services, assigns edge services to the edge node, and emits nftables rules per node (`plan-output.txt`, `firewall-output.txt`).

What this does not show:
- It does not deploy to nodes. `anode cluster` plans placement and prints firewall rules; it does not run `anode deploy` on a node.
- It does not reschedule after a node fails. There is no failover, so there is no failure test to run.
- Placement was not checked on real nodes. Memory figures are the inventory's declared numbers, not measured usage.
- Utilization is a share of effective capacity (declared memory times the 0.85 overcommit ratio), not of physical RAM. The edge node is at 95.6% of that effective capacity.

Reproduce:
```
anode cluster init <dir>      # writes anode.cluster.yaml
anode cluster <dir>           # placement plan
anode cluster --firewall <dir>
```
