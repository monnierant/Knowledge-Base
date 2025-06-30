---
title: External Secrets Operator
sidebar:
    order: 30
---

Secret manager with `External Secrets Operator`

## GCP Secret Store

On `Google Cloud Platform` we need to create a `Secret Manager`.

And provide a `Service account` with `secretmanager.secretAccessor` role.

Create a `Service Account Key` for this account.

Create a first secret called `infra` for exemple with the following value

!!! exemple

  ```json
  {
    "email":"admin@test.com",
    "traefik-node-name":"node-name01"
  }
  ```

  node-name01: node with ip used for traefik single entrypoint

## Kubrnetes

Create a namespace `external-secrets`

```bash
kubectl create namespace external-secrets
```

Create a secret with the `Service Account Key` it will be used to authenticate the operator to `GCP`

```json gcp-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: gcp-sa-secret
  namespace: external-secrets
type: Opaque
stringData:
  secret-access-credentials: |-
    {
      "type": "service_account",
      "project_id": "external-secrets-operator",
      "private_key_id": "",
      "private_key": "-----BEGIN PRIVATE KEY-----\nA key\n-----END PRIVATE KEY-----\n",
      "client_email": "test-service-account@external-secrets-operator.iam.gserviceaccount.com",
      "client_id": "client ID",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/test-service-account%40external-secrets-operator.iam.gserviceaccount.com"
    }
```

```bash
kubectl apply -f gcp-secret.yaml
```
