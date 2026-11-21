/* 离线战斗记录。保存失败时保留本页数据，仍可手动导出。 */
(() => {
  const storageKey = 'iron-corridor.combat-records.v1';
  const limit = 30;
  const number = new Intl.NumberFormat('zh-CN',{ maximumFractionDigits: 2 });
  const date = new Intl.DateTimeFormat('zh-CN',{ dateStyle: 'short', timeStyle: 'short' });
  const modes = { test: '单波演练', campaign: '战役', endless: '无尽' };
  const phases = { ready: '布防中', active: '战斗中', won: '通关', lost: '失守', cleared: '波次结束', inProgress: '未结算' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g,ch=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);
  const fmt = value => Number.isFinite(value) ? number.format(value) : '—';
  const timestamp = value => Number.isFinite(Date.parse(value)) ? date.format(new Date(value)) : '时间未知';
  const towerName = type => Object.hasOwn(IronData.towers,type) ? IronData.towers[type].name : type;
  const enemyName = type => Object.hasOwn(IronData.enemies,type) ? IronData.enemies[type].name : type === 'sweeper' ? '排雷工程车' : type;
  const stat = (name,value) => `<div class="ops-stat"><b>${value}</b>${name}</div>`;

  function table(head, rows) {
    if (!rows.length) return '<p class="manual">暂无记录。</p>';
    return `<div class="record-table"><table><thead><tr>${head.map(s=>'<th>'+s+'</th>').join('')}</tr></thead>
      <tbody>${rows.map(row=>'<tr>'+row.map(s=>'<td>'+s+'</td>').join('')+'</tr>').join('')}</tbody></table></div>`;
  }

  class CombatLog {
    constructor(dialog) {
      this.dialog = dialog;
      this.list = dialog.querySelector('select');
      this.body = dialog.querySelector('#records-body');
      this.exportButton = dialog.querySelector('#records-export');
      this.entries = [];
      this.persistent = true;
      this.reset();
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
        if (Array.isArray(stored)) this.entries = stored.filter(entry=>entry && typeof entry.id === 'string'
          && Array.isArray(entry.towers) && Array.isArray(entry.waves) && Array.isArray(entry.enemyTypes)).slice(0,limit);
      } catch {
        this.persistent = false;
      }
      this.list.addEventListener('change',()=>this.render());
      this.exportButton.addEventListener('click',()=>this.exportAll());
    }

    reset() { this.id = null; this.startedAt = null; }

    save(game) {
      if (!game.waveReport) return;
      const now = new Date().toISOString();
      if (!this.id) {
        this.id = globalThis.crypto?.randomUUID?.() ?? Date.now()+'-'+Math.random().toString(36).slice(2);
        this.startedAt = now;
      }
      const entry = { id: this.id, version: '0.12', startedAt: this.startedAt, capturedAt: now, ...game.battleStats() };
      this.entries = [entry,...this.entries.filter(item=>item.id !== this.id)].slice(0,limit);
      try {
        localStorage.setItem(storageKey,JSON.stringify(this.entries));
        this.persistent = true;
      } catch {
        this.persistent = false;
      }
    }

    open(game) {
      this.save(game);
      this.list.replaceChildren(...this.entries.map(entry=>new Option(
        timestamp(entry.startedAt)+' · '+(modes[entry.mode] ?? '演习')+' · 第 '+fmt(entry.wave)+' 波'+(entry.version ? ' · v'+entry.version : ''),entry.id
      )));
      this.list.disabled = this.exportButton.disabled = !this.entries.length;
      this.render();
      this.dialog.showModal();
    }

    render() {
      const r = this.entries.find(entry=>entry.id === this.list.value);
      const hint = this.dialog.querySelector('#records-storage');
      hint.textContent = this.persistent ? '本浏览器保存最近 '+limit+' 场，可导出 JSON。' : '本地保存暂不可用，可导出本页的记录。';
      if (!r) {
        this.body.innerHTML = '<p class="manual">开始一波后即可查看战斗数据。</p>';
        return;
      }
      const guns = r.towers.filter(Boolean).sort((a,b)=>b.damage-a.damage);
      this.body.innerHTML = `<p class="manual">${esc(modes[r.mode])} · ${esc(phases[r.phase])} · 第 ${fmt(r.wave)} 波 · 战斗 ${fmt(r.combatSeconds)} 秒 · 敌军血量 ×${fmt(r.healthMultiplier)}</p>
        <div class="ops-grid">${stat('实际伤害',fmt(r.damage))}${stat('敌军平均存活（秒）',fmt(r.averageEnemySeconds))}${stat('赚取军费 CR',fmt(r.earnedCredits))}${stat('在场炮塔价值 CR',fmt(r.towerValue))}
        ${stat('击毁 / 突破',fmt(r.kills)+' / '+fmt(r.escaped))}${stat('击毁 / 补给收入',fmt(r.killCredits)+' / '+fmt(r.waveCredits))}</div>
        <p class="manual">平均存活统计已击毁或突破的敌军。未结算 ${fmt(r.unresolvedEnemies)} 个。支援伤害 ${fmt(r.supportDamage)}，地雷伤害 ${fmt(r.mineDamage)}，拆除退款 ${fmt(r.refunds)} CR。</p>
        <h3>逐炮塔贡献</h3>${table(['阵位','炮塔','等级','状态','投入 CR','实际伤害','击毁'],guns.map(gun=>[
          esc(gun.cell),esc(towerName(gun.type)),fmt(gun.level),gun.deployed?'在场':'已拆除',fmt(gun.invested),fmt(gun.damage),fmt(gun.kills)
        ]))}
        <h3>逐波记录</h3>${table(['波次','状态','实际伤害','平均存活秒数','赚取军费','炮塔价值','基地'],r.waves.filter(Boolean).map(w=>[
          fmt(w.wave),esc(phases[w.outcome]),fmt(w.damage),fmt(w.averageEnemySeconds),fmt(w.earnedCredits),fmt(w.towerValue),fmt(w.integrity)
        ]))}
        <h3>分敌军类型</h3>${table(['单位','击毁','突破','平均存活秒数'],r.enemyTypes.filter(Boolean).map(unit=>[
          esc(enemyName(unit.type)),fmt(unit.killed),fmt(unit.escaped),fmt(unit.averageSeconds)
        ]))}`;
    }

    exportAll() {
      const blob = new Blob([JSON.stringify({ schemaVersion: 1, battles: this.entries },null,2)],{ type:'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '铁线防区-战斗记录.json';
      link.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
  }

  globalThis.IronCombatLog = CombatLog;
})();
