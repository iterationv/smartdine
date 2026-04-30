import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { AiConfigDiff } from '../services/aiConfigService.js'

export type AdminEventAction = 'ai-config.update' | 'ai-config.reset'

export interface AdminEvent {
  requestId: string
  timestamp: string
  actor: 'admin'
  action: AdminEventAction
  diff: AiConfigDiff
  duration: number
}

const LOG_DIR = path.resolve(process.cwd(), 'logs')

function padNumber(value: number): string {
  return String(value).padStart(2, '0')
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

function getAdminEventLogFilePath(timestamp: string): string {
  const date = new Date(timestamp)
  const dateKey = Number.isNaN(date.getTime())
    ? timestamp.slice(0, 10)
    : formatDateKey(date)

  return path.join(LOG_DIR, `admin-events-${dateKey}.jsonl`)
}

export function logAdminEvent(event: AdminEvent): void {
  const line = `${JSON.stringify(event)}\n`

  void (async () => {
    try {
      await mkdir(LOG_DIR, { recursive: true })
      await appendFile(getAdminEventLogFilePath(event.timestamp), line, 'utf8')
    } catch (error) {
      console.error('Failed to write admin event log:', error)
    }
  })()
}
