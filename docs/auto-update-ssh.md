# Auto update via Tailscale SSH

## Summary
Deploys run from GitHub Actions and connect to the homelab host via Tailscale SSH, then run docker compose pulls/ups.

## Why
The previous workflow used standard SSH with a private key, but the host has Tailscale SSH enabled and tailnet policy blocks that path. Using `tailscale ssh` aligns with tailnet policy and removes the need for host key setup.

## Required tailnet ACL (example)
Add a tag for GitHub Actions and allow it to SSH into the deploy host.

```
{
  "tagOwners": {
    "tag:github-actions": ["autogroup:admin"]
  },
  "ssh": [
    {
      "action": "accept",
      "src": ["tag:github-actions"],
      "dst": ["tag:homelab"],
      "users": ["carlos", "root"]
    }
  ]
}
```

## Notes
- The workflow uses the `tags: tag:github-actions` input on the Tailscale GitHub Action.
- Ensure the deploy host is tagged (e.g., `tag:homelab`) or update the ACL destination accordingly.
- If you prefer classic SSH with keys, disable Tailscale SSH on the host and revert the workflow to use `ssh -i`.
