#!/usr/bin/env python3
"""Print what changed in each source since its docs tree was last synced.

usage: changes.py [--fetch] [docs-tree ...]    (default: all trees in sources.json)
       changes.py --mark <docs-tree> <sha>      record a new synced commit
"""
import json, subprocess, sys
from pathlib import Path

STATE = Path(__file__).with_name("sources.json")

def git(repo, *args, check=True):
    r = subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True)
    if check and r.returncode:
        raise SystemExit(f"git {' '.join(args)} failed in {repo}: {r.stderr.strip()}")
    return r.stdout.strip(), r.returncode

def resolve(repo, branch):
    # prefer the remote-tracking ref so we see pushed work without touching the user's checkout
    for ref in (f"origin/{branch}", branch):
        sha, rc = git(repo, "rev-parse", "--verify", "-q", ref, check=False)
        if rc == 0:
            return ref, sha
    raise SystemExit(f"{repo}: no ref {branch}")

def main(argv):
    state = json.loads(STATE.read_text())
    if argv[:1] == ["--mark"]:
        tree, sha = argv[1], argv[2]
        state[tree]["synced"] = sha[:12]
        STATE.write_text(json.dumps(state, indent=2) + "\n")
        print(f"{tree} synced -> {sha[:12]}")
        return
    fetch = "--fetch" in argv
    trees = [a for a in argv if not a.startswith("--")] or list(state)
    fetched = set()
    for tree in trees:
        s = state[tree]
        if fetch and s["repo"] not in fetched:
            git(s["repo"], "fetch", "--quiet", "origin", check=False)
            fetched.add(s["repo"])
        ref, head = resolve(s["repo"], s["branch"])
        print(f"\n=== {tree}  ({s['branch']} via {ref})  synced {s['synced']} -> head {head[:12]}")
        if head.startswith(s["synced"]):
            print("up to date")
            continue
        log, _ = git(s["repo"], "log", "--oneline", "--no-merges", f"{s['synced']}..{ref}")
        stat, _ = git(s["repo"], "diff", "--stat=120", f"{s['synced']}..{ref}")
        print(log or "(no non-merge commits)")
        print(stat)

if __name__ == "__main__":
    main(sys.argv[1:])
