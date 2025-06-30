---
title: Talos
sidebar:
    order: 10
---

## Traefik NodePort exposure

```yaml
machine:
  kubelet:
    extraArgs:
      allowed-unsafe-sysctls: net.ipv4.ip_forward
```
