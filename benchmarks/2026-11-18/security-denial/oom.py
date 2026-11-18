#!/usr/bin/python3
# Allocates and touches 1.5 GiB inside a unit with MemoryMax=1G.
import time
chunks = []
for i in range(150):
    chunks.append(bytearray(10 * 1024 * 1024))  # 10 MiB, touched by bytearray init
    time.sleep(0.01)
time.sleep(100000)
