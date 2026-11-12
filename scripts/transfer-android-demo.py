#!/usr/bin/env python3
"""Temporary transfer bridge; creates no commits or branches containing binaries."""
import base64
import hashlib
import json
import os
import sys
import urllib.request
from pathlib import Path

root = Path(sys.argv[1])
repository = os.environ["GITHUB_REPOSITORY"]
token = os.environ["GH_TOKEN"]
chunk_size = 16 * 1024 * 1024


def create_blob(data):
    body = json.dumps({"encoding": "base64", "content": base64.b64encode(data).decode("ascii")}).encode("utf-8")
    request = urllib.request.Request(
        f"https://api.github.com/repos/{repository}/git/blobs",
        data=body,
        method="POST",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        result = json.load(response)
    expected = hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()
    if result["sha"] != expected:
        raise RuntimeError("Git blob SHA mismatch")
    return expected


manifest = {"target_run": os.environ["TARGET_RUN"], "files": []}
for file in sorted(root.iterdir()):
    if not file.is_file():
        continue
    digest = hashlib.sha256()
    pieces = []
    with file.open("rb") as stream:
        while True:
            data = stream.read(chunk_size)
            if not data:
                break
            digest.update(data)
            pieces.append(create_blob(data))
    manifest["files"].append({
        "name": file.name, "size": file.stat().st_size,
        "sha256": digest.hexdigest(), "blobs": pieces,
    })
    print(f"Staged {file.name}: {file.stat().st_size} bytes in {len(pieces)} parts", flush=True)

pointer = create_blob(json.dumps(manifest, separators=(",", ":")).encode("utf-8"))
with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as out:
    out.write(f"manifest={pointer}\n")
Path("transfer-pointer.txt").write_text(pointer + "\n", encoding="utf-8")
print("Transfer manifest created. No artifacts were added to a Git branch.", flush=True)
