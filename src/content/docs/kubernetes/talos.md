---
title: Talos
sidebar:
    order: 10
---

## Install

```bash
choco install talosctl
```

We generate secrets that must be kept safe.

```bash
talosctl gen secrets
talosctl gen config <cluster-name> https://<kube.endpoint.ip>:6443 --with-secrets ./secrets.yaml
```

Talos will generate two config files `controlplane.yaml` and `worker.yaml` that could be used to setup nodes in cluster.

```bash
talosctl -e <entrypoint.node.ip> -n <entrypoint.node.ip>,<other.nodes.ip> apply-config --insecure --file [controlplane|worker].yaml
```

We still need to bootstrap etcd on only one node so it can be replicated

```bash
talosctl -e <entrypoint.node.ip> -n <only.one.node.ip> bootstrap --talosconfig ./talosconfig
```

And now let's get your `kubeconfig` to get access to our cluster

```bash
talosctl -e <entrypoint.node.ip> -n <only.one.node.ip> kubeconfig --talosconfig ./talosconfig
```

## Traefik NodePort exposure

Add the following key to your `controlplane.yaml` and your `worker.yaml`

```yaml
machine:
  kubelet:
    extraArgs:
      allowed-unsafe-sysctls: net.ipv4.ip_forward
```
