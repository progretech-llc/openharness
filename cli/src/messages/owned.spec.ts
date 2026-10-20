import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ownedFollowups } from './owned.js'
import { Ledger } from '../agentClient/ledger.js'
import { fakeCore } from '../testing/fakeCore.js'
import type { RegisteredSession } from '../lib/registry.js'
let root:string
beforeEach(()=>{root=mkdtempSync(join(tmpdir(),'owned-followups-'))})
afterEach(()=>rmSync(root,{recursive:true,force:true}))
function setup() {
 const ledger=new Ledger(join(root,'started.jsonl'))
 ledger.append({at:1,depth:1,by:{machineId:'m',agentId:'outside',name:'Caller',engine:'mesh'},child:{machineId:'m',agentId:'kid',name:'Worker'}})
 const deliver=vi.fn();let allowed=true;let time=10
 const core=fakeCore({dataDir:root,daemon:{machineId:()=> 'm',port:1},agents:{live:()=>[{agentId:'kid'} as RegisteredSession]},turns:{deliver}})
 const file=join(root,'receipts.json')
 return {core,ledger,file,deliver,helper:ownedFollowups(core,ledger,file,()=>allowed,()=>time),off:()=>{allowed=false},advance:()=>{time+=61000}}
}
const payload={action:'owned_send',caller:'outside',target:'kid',key:'intent-1',text:'Do the bounded follow-up'}
it('delivers once through native turns, persists no prompt and observes actual receipt',()=>{
 const s=setup();expect(s.helper.request(payload).state).toBe('queued');expect(s.deliver).toHaveBeenCalledOnce()
 expect(s.helper.canWrite('team:owned:intent-1')).toBe(true)
 expect(s.helper.request(payload).state).toBe('queued');expect(s.deliver).toHaveBeenCalledOnce()
 expect(readFileSync(s.file,'utf8')).not.toContain(payload.text)
 s.helper.observe({deliveryId:'team:owned:intent-1',sessionId:'kid',state:'delivered'})
 expect(s.helper.request({...payload,action:'owned_status'}).state).toBe('delivered')
 expect(s.helper.canWrite('team:owned:intent-1')).toBe(false)
})
it('never turns another agents worker into an owned worker and honors the native switch',()=>{
 const s=setup();expect(()=>s.helper.request({...payload,caller:'other'})).toThrow(/has not been granted/)
 expect(s.deliver).not.toHaveBeenCalled();s.off();expect(()=>s.helper.request(payload)).toThrow(/is off/)
})
it('does not replay uncertain work after service restart and rejects key reuse',()=>{
 const s=setup();s.helper.request(payload)
 const restarted=ownedFollowups(s.core,s.ledger,s.file,()=>true)
 expect(restarted.request(payload).state).toBe('unknown');expect(s.deliver).toHaveBeenCalledOnce()
 expect(()=>restarted.request({...payload,text:'different'})).toThrow(/another request/)
 expect(()=>restarted.request({...payload,key:'missing',action:'owned_status'})).toThrow(/No matching/)
})
it('withdraws permission when authority expires, and ignores other delivery namespaces',()=>{
 const s=setup();s.helper.request(payload);s.advance();expect(s.helper.canWrite('team:owned:intent-1')).toBe(false)
 expect(s.helper.canWrite('team:other')).toBe(false);expect(s.helper.canWrite('team:owned:missing')).toBe(false)
 s.helper.observe({deliveryId:'other',sessionId:'kid',state:'started'})
 s.helper.observe({deliveryId:'team:owned:intent-1',sessionId:'someone-else',state:'started'})
 expect(s.helper.request({...payload,action:'owned_status'}).state).toBe('unknown')
})
it('rejects malformed inputs and inactive targets before dispatch',()=>{
 const s=setup()
 for(const change of [{key:'../x'},{text:''},{caller:''},{target:'missing'}])expect(()=>s.helper.request({...payload,...change})).toThrow()
 expect(s.deliver).not.toHaveBeenCalled()
})

it('isolates corrupt receipt storage from the existing messaging capability',()=>{
 const s=setup();writeFileSync(s.file,'broken')
 const helper=ownedFollowups(s.core,s.ledger,s.file,()=>true)
 expect(()=>helper.request(payload)).toThrow(/need repair/);expect(helper.canWrite('team:owned:intent-1')).toBe(false)
})

it('a live session grants only follow-ups, and can revoke without changing its creation owner',()=>{
 const s=setup();const controller='agent:mesh:controller'
 expect(()=>s.helper.request({action:'owned_grant',caller:'other',target:'kid',controller,enabled:true})).toThrow(/Only a live/)
 expect(s.helper.request({action:'owned_grant',caller:'kid',target:'kid',controller,enabled:true})).toMatchObject({allowed:true})
 expect(s.ledger.parentOf({machineId:'m',agentId:'kid'})?.by.agentId).toBe('outside')
 expect(s.ledger.canFollowup({machineId:'m',agentId:controller},{machineId:'m',agentId:'kid'})).toBe(true)
 s.helper.request({...payload,caller:controller});expect(s.deliver).toHaveBeenCalledOnce()
 s.helper.request({action:'owned_grant',caller:'kid',target:'kid',controller,enabled:false})
 expect(s.helper.canWrite('team:owned:intent-1')).toBe(false)
 expect(()=>s.helper.request({...payload,caller:controller,action:'owned_status'})).toThrow(/has not been granted/)
 const reread=new Ledger(s.ledger.path)
 expect(reread.canFollowup({machineId:'m',agentId:controller},{machineId:'m',agentId:'kid'})).toBe(false)
})
