---
title: Argo CD
sidebar:
    order: 20
---

Install `ArgoCD` with `Argo Vault Plugin` by `helm`

```bash
helm update argocd argo/argo-cd -i --namespace argocd --version 8.1.1 -f .\manuals\argocd\avp-values.yaml
```

```yaml .\manuals\argocd\avp-values.yaml
repoServer:
  serviceAccount:
    name: argocd-repo-server
  volumes:
    - configMap:
        name: cmp-plugin
      name: cmp-plugin
    - name: custom-tools
      emptyDir: {}
  initContainers:
    - name: download-tools
      image: registry.access.redhat.com/ubi8
      env:
        - name: AVP_VERSION
          value: 1.16.1
      command: [sh, -c]
      args:
        - >-
          curl -L https://github.com/argoproj-labs/argocd-vault-plugin/releases/download/v$(AVP_VERSION)/argocd-vault-plugin_$(AVP_VERSION)_linux_amd64 -o argocd-vault-plugin &&
          chmod +x argocd-vault-plugin &&
          mv argocd-vault-plugin /custom-tools/
      volumeMounts:
        - mountPath: /custom-tools
          name: custom-tools
  extraContainers:
    - name: avp
      command: [/var/run/argocd/argocd-cmp-server]
      image: registry.access.redhat.com/ubi8
      env:
        - name: ARGOCD_ENV_AVP_TYPE
          value: kubernetessecret
      securityContext:
        runAsNonRoot: true
        runAsUser: 999
      volumeMounts:
        - mountPath: /var/run/argocd
          name: var-files
        - mountPath: /home/argocd/cmp-server/plugins
          name: plugins
        - mountPath: /tmp
          name: tmp
        # Register plugins into sidecar
        - mountPath: /home/argocd/cmp-server/config/plugin.yaml
          subPath: avp.yaml
          name: cmp-plugin
        # Important: Mount tools into $PATH
        - name: custom-tools
          subPath: argocd-vault-plugin
          mountPath: /usr/local/bin/argocd-vault-plugin
    - name: avp-helm
      command: [/var/run/argocd/argocd-cmp-server]
      image: quay.io/argoproj/argocd:v2.7.9
      env:
        - name: ARGOCD_ENV_AVP_TYPE
          value: kubernetessecret
      securityContext:
        runAsNonRoot: true
        runAsUser: 999
      volumeMounts:
        - mountPath: /var/run/argocd
          name: var-files
        - mountPath: /home/argocd/cmp-server/plugins
          name: plugins
        - mountPath: /tmp
          name: tmp

        # Register plugins into sidecar
        - mountPath: /home/argocd/cmp-server/config/plugin.yaml
          subPath: avp-helm.yaml
          name: cmp-plugin

        # Important: Mount tools into $PATH
        - name: custom-tools
          subPath: argocd-vault-plugin
          mountPath: /usr/local/bin/argocd-vault-plugin

extraObjects:
  - apiVersion: v1
    kind: Secret
    metadata:
      name: "argocd-repo-server-secret"
      namespace: argocd
      annotations:
        kubernetes.io/service-account.name: argocd-repo-server
    type: kubernetes.io/service-account-token

  - apiVersion: rbac.authorization.k8s.io/v1
    kind: Role
    metadata:
      name: avp-k8s-secret-reader
      namespace: argocd
    rules:
      - apiGroups: [""]
        resources: ["secrets"]
        verbs: ["get", "list"]

  - apiVersion: rbac.authorization.k8s.io/v1
    kind: RoleBinding
    metadata:
      name: avp-k8s-secret-reader-binding
      namespace: argocd
    subjects:
      - kind: ServiceAccount
        name: argocd-repo-server
        namespace: argocd
    roleRef:
      kind: Role
      name: avp-k8s-secret-reader
      apiGroup: rbac.authorization.k8s.io

  - apiVersion: rbac.authorization.k8s.io/v1
    kind: ClusterRoleBinding
    metadata:
      name: "crb-auth-delegator"
    subjects:
      - kind: ServiceAccount
        name: argocd-repo-server
        namespace: argocd
    roleRef:
      apiGroup: rbac.authorization.k8s.io
      kind: ClusterRole
      name: system:auth-delegator

  - apiVersion: v1
    kind: ConfigMap
    metadata:
      name: cmp-plugin
      namespace: argocd
    data:
      avp.yaml: |
        apiVersion: argoproj.io/v1alpha1
        kind: ConfigManagementPlugin
        metadata:
          name: argocd-vault-plugin
          namespace: argocd
        spec:
          allowConcurrency: true
          discover:
            find:
              command:
                - sh
                - "-c"
                - "find . -name '*.yaml' ! -name '*values.yaml' | xargs -I {} grep \"<path\\|avp\\.kubernetes\\.io\" {} | grep ."
          generate:
            command:
              - sh
              - "-c"
              - "for file in $(find . -type f -name '*.yaml'! -name '*values.yaml'  ! -path '*/statics/*'); do argocd-vault-plugin generate --verbose-sensitive-output \"$file\"; done"
          lockRepo: false
      avp-helm.yaml: |
        apiVersion: argoproj.io/v1alpha1
        kind: ConfigManagementPlugin
        metadata:
          name: argocd-vault-plugin-helm
        spec:
          allowConcurrency: true
          discover:
            find:
              command:
                - sh
                - "-c"
                - "find . -name 'Chart.yaml' | grep -qz . && find . -name '*values.yaml'"
          generate:
            command:
              - sh
              - "-c"
              - |
                helm template $ARGOCD_APP_NAME --include-crds . |
                argocd-vault-plugin generate -
          lockRepo: false
```
