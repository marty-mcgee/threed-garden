# ThreeD Model Runtime API

This document defines the v0.19.3d JSON boundary for reusable ThreeD Models and read-only runtime inspection. These routes provide Model data and structural evidence; they do not place Project Markers or create physics.

## Authority boundary

- `threed_models` and `threed_model_files` own reusable Model identity, transforms, storage references, attachments, and metadata.
- `GET /api/threed/models` exposes authenticated Model management or reduced public-Library data.
- `GET /api/threed/models/runtime-inspection` measures an authorized stored Model without changing it.
- `project_threed_markers` remains authoritative for a placed Project instance.
- `ModelMarker3D`, the persistent R3F Canvas, and the Rapier world remain authoritative for runtime rendering and physics.
- A registered source-controlled Runtime Adapter is supportive visual construction only.

Both routes require an authenticated session. Neither route accepts a caller-supplied Model URL.

## Model collection

```http
GET /api/threed/models
```

The default scope returns only Models owned by the authenticated user. Each entry may include the complete owner-management record, related `files`, and assigned `categories`. The response is paginated.

Supported list parameters are `modelType`, `status`, `isActive`, `category`, `search`, `limit`, and `offset`. `scope=library` changes the authorization and serialization boundary to active, public, non-Character Library Models. `id=<positive integer>` requests one authorized Model.

Sanitized collection shape:

```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "modelName": "Example Farm Environment",
      "modelType": "fbx",
      "scale": 0.02,
      "rotationY": 0,
      "offsetX": 0,
      "offsetY": 0,
      "offsetZ": 0,
      "isActive": true,
      "status": "active",
      "metadata": {
        "runtimeAdapterKey": null
      },
      "files": [],
      "categories": []
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

Owner responses can contain account-scoped IDs, storage locations, uploader audit fields, and file metadata. Treat them as authenticated management data. Do not paste unredacted responses into public documentation, issues, or logs.

## Runtime structure inspection

```http
GET /api/threed/models/runtime-inspection?id=15&componentSearch=fence&componentLimit=200
```

The route authorizes the Model when it is owned by the current user or is an active, public Library item. It supports `glb`, `gltf`, and `fbx`. Unsupported formats return `422` with the supported type list.

Parameters:

| Parameter | Required | Boundary |
|---|---:|---|
| `id` | Yes | Positive safe integer |
| `componentOffset` | No | Integer from 0 through 100,000; default 0 |
| `componentLimit` | No | Integer from 1 through 200; default 100 |
| `componentSearch` | No | At most 120 characters; control characters rejected |

The response separates summary measurements from two bounded inventories:

- `meshInventory` contains the 64 highest-triangle meshes and an omitted count.
- `sourceComponents` contains an exact-path-sorted, optionally filtered page for adapter review.

Sanitized successful shape:

```json
{
  "success": true,
  "data": {
    "model": {
      "id": 15,
      "modelName": "Example Farm Environment",
      "modelType": "fbx",
      "runtimeAdapterKey": null
    },
    "inspection": {
      "meshCount": 5411,
      "triangleCount": 2185617,
      "skinnedMeshCount": 0,
      "invalidMeshCount": 0,
      "hasFiniteBounds": true,
      "status": "too_complex",
      "colliderEligible": false,
      "reasons": [
        "mesh count exceeds 256",
        "triangle count exceeds 250000"
      ],
      "meshInventory": {
        "entries": [],
        "omittedEntryCount": 5347
      },
      "sourceComponents": {
        "entries": [],
        "total": 768,
        "offset": 0,
        "limit": 200
      }
    }
  }
}
```

The empty arrays above intentionally replace the large captured inventories. Live responses contain exact source node paths, mesh types, and triangle counts for the requested bounded page.

## Interpreting the response

`status: "too_complex"` means the whole asset is not eligible for the initial automatic collider ceiling. It does not mean the Model is invalid or cannot render. `colliderEligible: false` must never be bypassed merely because bounds are finite.

Source paths are diagnostic evidence, not semantics. A substring such as `fence`, `tree`, `building`, or a vendor name must not become a database field, TypeScript type, Runtime Adapter key, or automatic collision instruction. A later reviewed mapping may associate exact selectors with App-generic roles such as `terrain`, `structure`, `barrier`, `vehicle`, `vegetation`, `decoration`, `interaction`, or `unclassified`.

## Resource and safety limits

- GLTF JSON is limited to 16 MiB.
- GLB inspection reads its header and declared JSON chunk rather than its complete binary geometry payload.
- FBX is limited to 256 MiB and a 60-second fetch window.
- FBX texture resolution is inert during server inspection, preventing browser-DOM use and supporting-file requests.
- Component pages are bounded to 200 entries.
- Inspection performs no database writes, Project placement, Runtime Marker mutation, adapter registration, or collider activation.

## v0.19.3d release gate

1. Request the owned Model collection and confirm `success`, `data`, and `pagination` without sharing its unredacted owner fields.
2. Request Model 15 with `componentSearch=fence&componentLimit=200` and confirm the recorded 5,411 meshes, 2,185,617 triangles, `too_complex` classification, and filtered total of 768.
3. Confirm an invalid Model ID returns `400`, an unauthorized request returns `401`, a missing Model returns `404`, and an unsupported format returns `422`.
4. Confirm the requests do not alter Model metadata, Project Markers, Scene Layers, or Physics Debug state.
5. Load the Project environment and verify Model rendering, Character placement/control, procedural-ground policy, and the persistent Canvas/Rapier world remain stable.
6. Run `npm run validate:threed-runtime-markers`, `npm run typecheck`, `git diff --check`, and `npm run build`.

Only after deployment and production verification should a v0.19.3d entry be added to `docs/releases`.
