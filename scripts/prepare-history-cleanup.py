"""Prepare reviewed attribution changes in an isolated clone; never update GitHub."""
import argparse
import json
import os
import re
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', default='origin/main')
parser.add_argument('--author-name', required=True)
parser.add_argument('--author-email', required=True)
parser.add_argument('--report', required=True)
args = parser.parse_args()


def git(*values, **kwargs):
    return subprocess.check_output(['git', *values], **kwargs).decode().strip()


source = git('rev-parse', args.source)
commits = git('rev-list', '--reverse', source).splitlines()
parent = None
changes = []
for commit in commits:
    tree, author, email, date, committer, committer_email, committer_date, message = git(
        'show', '-s', '--format=%T%x00%an%x00%ae%x00%aI%x00%cn%x00%ce%x00%cI%x00%B', commit
    ).split('\0', 7)
    if len(git('rev-list', '--parents', '-n', '1', commit).split()) > 2:
        raise SystemExit('Merge history requires a separate reviewed cleanup.')
    if author not in {'Thomas Budin', 'Tom B'}:
        raise SystemExit(f'Unexpected author on {commit}; review before reattributing.')
    message = '\n'.join(line for line in message.splitlines() if not re.match(
        r'(?i)\s*(?:co-authored-by|generated-by|(?:claude|codex|agent)-session):', line
    )).strip() + '\n'
    env = dict(os.environ, GIT_AUTHOR_NAME=args.author_name, GIT_AUTHOR_EMAIL=args.author_email,
               GIT_AUTHOR_DATE=date, GIT_COMMITTER_NAME=args.author_name,
               GIT_COMMITTER_EMAIL=args.author_email, GIT_COMMITTER_DATE=committer_date)
    command = ['commit-tree', tree]
    if parent:
        command += ['-p', parent]
    parent = git(*command, input=message.encode(), env=env)
    assert tree == git('rev-parse', parent + '^{tree}')
    changes.append({'old': commit, 'new': parent, 'subject': message.splitlines()[0],
                    'before': f'{author} <{email}>', 'after': f'{args.author_name} <{args.author_email}>'})

git('update-ref', 'refs/heads/personal-attribution', parent)
report = {'source': source, 'candidate': parent, 'unchanged_source_trees': True, 'changes': changes}
Path(args.report).write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'source': source, 'candidate': parent, 'commits': len(changes), 'unchanged_source_trees': True}))
print('No remote branches were changed. Confirm before publishing rewritten history.')
