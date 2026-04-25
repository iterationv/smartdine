import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const CONFIDENCE_VALUES = ['high', 'low', 'ambiguous', 'unknown_entity']
const LOG_DIR = path.resolve(process.cwd(), 'logs')
const RECENT_LIMIT = 10

async function readQaEvents() {
  let fileNames = []

  try {
    fileNames = await readdir(LOG_DIR)
  } catch {
    return []
  }

  const events = []

  for (const fileName of fileNames.sort()) {
    if (!/^qa-events-\d{4}-\d{2}-\d{2}\.jsonl$/.test(fileName)) {
      continue
    }

    const content = await readFile(path.join(LOG_DIR, fileName), 'utf8')

    for (const line of content.split(/\r?\n/)) {
      if (!line.trim()) {
        continue
      }

      try {
        events.push(JSON.parse(line))
      } catch {
        // Ignore malformed historical lines so one bad row does not block summary.
      }
    }
  }

  return events.sort((left, right) => right.timestamp - left.timestamp)
}

const events = await readQaEvents()
const distribution = Object.fromEntries(
  CONFIDENCE_VALUES.map((confidence) => [
    confidence,
    events.filter((event) => event.confidence === confidence).length,
  ]),
)

console.log(`total: ${events.length}`)

for (const confidence of CONFIDENCE_VALUES) {
  console.log(`${confidence}: ${distribution[confidence]}`)
}

console.log('recent:')
console.log(JSON.stringify(events.slice(0, RECENT_LIMIT), null, 2))
