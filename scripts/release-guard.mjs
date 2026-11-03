import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const authorName = 'Thomas Budin'
const copyrightOwner = 'Plain Matter Pte Ltd'
const authorEmail = '31727129+tbudin@users.noreply.github.com'
if (pkg.author?.name !== authorName || pkg.author?.email !== authorEmail || pkg.contributors?.length) throw Error('Release attribution must name only Thomas Budin and his personal GitHub email.')
if (execFileSync('git', ['rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim() === 'true') throw Error('Fetch the complete release history before checking attribution.')
const identities = execFileSync('git', ['log', 'HEAD', '--format=%h%x09%an%x09%ae%x09%cn%x09%ce'], { encoding: 'utf8' }).trim().split('\n')
for (const identity of identities) {
  const [commit, author, email, committer, committerEmail] = identity.split('\t')
  if (author !== authorName || email !== authorEmail || committer !== authorName || committerEmail !== authorEmail) throw Error(`Commit ${commit} uses an unapproved author or committer identity. Resolve attribution before publishing.`)
}
const messages = execFileSync('git', ['log', 'HEAD', '--format=%B'], { encoding: 'utf8' })
if (/^\s*(?:co-authored-by|generated-by|(?:claude|codex|agent)-session):/im.test(messages)) throw Error('Release history contains a prohibited attribution or session trailer.')
if (!readFileSync(new URL('../LICENSE', import.meta.url), 'utf8').includes(`Copyright (c) 2026 ${copyrightOwner}`)) throw Error('The code licence must name Plain Matter Pte Ltd as copyright holder.')
const site = (await import('../site/site.config.js')).default
if (site.owner !== copyrightOwner || site.author?.name !== authorName) throw Error('Website author must be Thomas Budin and owner must be Plain Matter Pte Ltd.')
if (pkg.private) throw Error('Complete release review and remove private before publishing.')
if (!pkg.license || !pkg.version || !pkg.repository) throw Error('Release metadata is incomplete.')
const status = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()
if (status) throw Error('Publish from a clean checkout of the reviewed release.')
console.info(`Release guard passed for ${pkg.name}@${pkg.version}.`)
