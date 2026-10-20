/** Native follow-ups for an agent's own workers, including callers outside a pane.
 * Ed authorized this factory collaboration scope on 2026-10-20. It does not extend
 * shared-tab messaging or permit taking over a person's or another agent's harness.
 * Only receipt metadata is persisted; queued prompts remain the core's business. */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import type { CoreApi, TurnDelivery } from '../core/api.js'
import { dirname } from 'node:path'
import { Ledger } from '../agentClient/ledger.js'
import { MessageError } from './model.js'

type Receipt = { key: string; caller: string; target: string; digest: string; at: number; state: string; reason?: string }
export function ownedFollowups(core: CoreApi, ledger: Ledger, file: string, allowed: () => boolean, now = Date.now) {
  const rows = new Map<string, Receipt>()
  let loadError=false
  try {
  if (existsSync(file)) {
    const text = readFileSync(file, 'utf8')
    if (text.length > 1024 * 1024) throw new Error('Owned follow-up receipts exceed their bound')
    const stored = JSON.parse(text)
    if (!Array.isArray(stored) || stored.length > 256) throw new Error('Invalid owned follow-up receipts')
    for (const r of stored) {
      if (!r || typeof r.key !== 'string' || typeof r.caller !== 'string' || typeof r.target !== 'string' || typeof r.digest !== 'string' || typeof r.at !== 'number' || typeof r.state !== 'string') throw new Error('Invalid owned follow-up receipt')
      rows.set(r.key, {...r, state: ['queued','delivered','started'].includes(r.state) ? 'unknown' : r.state})
    }
  }
  } catch {loadError=true} // A bad receipt file disables only this capability, not team messaging.
  const save = () => {
    mkdirSync(dirname(file),{recursive:true,mode:0o700})
    const tmp = file + '.tmp'
    writeFileSync(tmp, JSON.stringify([...rows.values()]), { mode: 0o600 })
    renameSync(tmp, file)
  }
  const owns = (caller: string, target: string) => {
    return ledger.canFollowup({machineId:core.daemon.machineId(),agentId:caller},{machineId:core.daemon.machineId(),agentId:target})
  }
  const validate = (p: Record<string, unknown>) => {
    if (loadError) throw new MessageError('UNAVAILABLE','Owned follow-up receipts need repair; existing team messages remain available.')
    if (!allowed()) throw new MessageError('TURNED_OFF', 'Agents starting agents is off; no owned follow-up was sent.')
    if (typeof p.caller !== 'string' || !p.caller || p.caller.length > 200 || typeof p.target !== 'string' || !p.target || typeof p.key !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(p.key)) throw new MessageError('INVALID_REQUEST', 'Name an owned worker and an idempotency key.')
    if (!owns(p.caller,p.target)) throw new MessageError('NOT_YOURS', 'Native follow-up control has not been granted for this worker.')
    const target=core.agents.live().find(s=>s.agentId===p.target)
    if (!target) throw new MessageError('AGENT_NOT_FOUND', 'The owned worker is no longer live.')
    return {caller:p.caller,target:p.target,key:p.key}
  }
  return {
    request(p: Record<string,unknown>): Record<string,unknown> {
      if(p.action==='owned_grant') {
        if(loadError || !allowed())throw new MessageError('UNAVAILABLE','Native follow-up control is unavailable.')
        if(typeof p.caller!=='string' || p.caller!==p.target || typeof p.controller!=='string' || !/^(?:agent|claude-code|codex):[A-Za-z0-9:_-]+$/.test(p.controller) || p.controller.length>200 || typeof p.enabled!=='boolean' || !core.agents.live().some(s=>s.agentId===p.target))throw new MessageError('NOT_YOURS','Only a live harness may grant or revoke follow-ups for itself.')
        const machineId=core.daemon.machineId()
        ledger.append({kind:'followup-delegation',at:now(),target:{machineId,agentId:p.target as string},controller:{machineId,agentId:p.controller},enabled:p.enabled})
        return {allowed:p.enabled,target:p.target,controller:p.controller}
      }
      const {caller,target,key}=validate(p)
      const old=rows.get(key)
      if(old?.state==='queued' && now()-old.at>=60000){old.state='unknown';save()}
      if (p.action==='owned_status') {
        if (!old || old.caller!==caller || old.target!==target) throw new MessageError('RECEIPT_NOT_FOUND','No matching owned follow-up receipt.')
        return {...old}
      }
      if (typeof p.text!=='string' || !p.text.trim() || p.text.length>24000) throw new MessageError('INVALID_REQUEST','Provide a bounded follow-up.')
      const digest=createHash('sha256').update(p.text).digest('hex')
      if (old) {
        if (old.caller!==caller || old.target!==target || old.digest!==digest) throw new MessageError('IDEMPOTENCY_CONFLICT','That receipt belongs to another request.')
        return {...old}
      }
      for (const [id,r] of rows) if (rows.size>=256 && !['queued','delivered','started'].includes(r.state)) rows.delete(id)
      if (rows.size>=256) throw new MessageError('BUSY','Owned follow-up receipts are full; no task was sent.')
      const r:Receipt={key,caller,target,digest,at:now(),state:'queued'}
      rows.set(key,r);save() // Persist admission before handing text to the native core.
      core.turns.deliver(target,`[Owned follow-up from ${caller}]\n\n${p.text}`,'team:owned:'+key)
      return {...r}
    },
    canWrite(id:string) {
      if (!id.startsWith('team:owned:')) return false
      const r=rows.get(id.slice('team:owned:'.length))
      return !loadError && !!r && allowed() && r.state==='queued' && now()-r.at<60000 && owns(r.caller,r.target)
    },
    observe(e:TurnDelivery) {
      if (!e.deliveryId.startsWith('team:owned:')) return
      const r=rows.get(e.deliveryId.slice('team:owned:'.length))
      if (r && r.target===e.sessionId) {r.state=e.state;if(e.reason)r.reason=e.reason;save()}
    },
  }
}
