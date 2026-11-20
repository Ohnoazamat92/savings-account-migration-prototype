'use strict';
// Вариант F. Только демонстрационное состояние, банковских запросов нет.
let conversationDrafts = {}, conversationResults = {};
function conversationAnswers() {
  return conversationDrafts[current] ||= {money:'', close:'', settings:''};
}
function conversationPath() {
  const a=account(), answer=conversationAnswers();
  return [a.amount>0?'flowMoney':null,
    a.amount===0||answer.money==='yes'?'flowClose':null,
    a.autopay?'flowSettings':null, 'flowReview'].filter(Boolean);
}
function conversationReady() {
  const a=account(), d=conversationAnswers();
  return (a.amount===0||['yes','no'].includes(d.money)) &&
    (!(a.amount===0||d.money==='yes')||['yes','no'].includes(d.close)) &&
    (!a.autopay||['yes','no'].includes(d.settings));
}
function conversationAnswer(key,value) {
  if(v!=='F'||key!=={flowMoney:'money',flowClose:'close',flowSettings:'settings'}[step]||!['yes','no'].includes(value))return;
  const d=conversationAnswers();d[key]=value;
  if(key==='money'&&value!=='yes')d.close='';
  consent=false;
  const path=conversationPath();
  move(path[path.indexOf(step)+1]);
}
function conversationBack() {
  const path=conversationPath();return path[path.indexOf(step)-1]||'detail';
}
function conversationChoices() {
  const [key,yes,no]={
    flowMoney:['money','Да, хочу','Нет, пока не буду'],
    flowClose:['close','Да, закроем','Нет, оставим открытым'],
    flowSettings:['settings','Да, оставим как есть','Нет, не переносим']
  }[step];
  return button(yes,`answer:${key}:yes`)+button(no,`answer:${key}:no`,true);
}
function conversationSummary(a,d,result=false) {
  const moved=d.money==='yes'?a.amount:0;
  const failed=result&&settingsFailed.has(a.id);
  const close=d.close==='yes'&&(a.amount===0||d.money==='yes');
  const settings=!a.autopay?'Не настроено. Новое не подключаем.':
    failed?'Не удалось перенести. Пока действует на старом счёте.':
    d.settings==='yes'?`${result?'Перенесено':'Перенесём'} без изменений: ${autopaySummary(a)}.`:
    close?`${result?'Отключено при закрытии':'Не перенесём. Отключится при закрытии'} старого счёта.`:
    `${result?'Осталось':'Останется'} на старом счёте. На новом не подключаем.`;
  return `<div class="card conversation-summary"><h2>${result?'Новый счёт':'Деньги'} · 12% годовых</h2><p>${result?`На новом ·· ${a.newTail}: ${money(moved)}`:moved?`Перенесём весь остаток — ${money(moved)}`:`Откроем пустой счёт — 0 ₽`}</p>${result?'':`<button class="small-link" data-action="${a.amount>0?'flowMoney':'flowClose'}">Изменить</button>`}</div>
  <div class="card conversation-summary"><h2>Старый счёт ·· ${a.tail}</h2><p>${close?(failed?'Пока открыт: дождёмся переноса автопополнения.':result?'Закрыт':'Закроем после переноса'):`${result?'Оставлен':'Оставим'} открытым · ${money(a.amount-moved)} · 9% годовых`}</p>${result||!conversationPath().includes('flowClose')?'':`<button class="small-link" data-action="flowClose">Изменить</button>`}</div>
  <div class="card conversation-summary"><h2>Автопополнение</h2><p>${settings}</p>${result||!a.autopay?'':`<button class="small-link" data-action="flowSettings">Изменить</button>`}</div>`;
}
function conversationView() {
  const a=account(),d=conversationAnswers(),path=conversationPath();
  let content='';
  if(step==='flowMoney') content=`<h1 tabindex="-1">Перенесём деньги<br>на новый счёт?</h1><p class="secondary">На новом счёте ставка выше: 12% вместо 9% годовых.</p><div class="card"><div class="account-chip"><strong>${a.name} ·· ${a.tail}</strong></div><p class="balance">${money(a.amount)}</p><p class="fine">Весь остаток со старого счёта</p></div><p class="fine">Если пока не хотите, откроем пустой счёт. Деньги останутся на старом.</p>`;
  if(step==='flowClose') content=`<h1 tabindex="-1">Старый счёт<br>закроем?</h1><p class="secondary">${a.amount===0?'На старом счёте сейчас 0 ₽. Переводить деньги не нужно.':'После переноса денег на старом счёте останется 0 ₽.'}</p><div class="card"><h2>${a.name} ·· ${a.tail}</h2><p class="fine">Старый накопительный счёт · 9% годовых</p></div><p class="fine">Если оставите открытым, сможете пользоваться обоими счетами.</p>`;
  if(step==='flowSettings') content=`<h1 tabindex="-1">Автопополнение<br>оставим как есть?</h1><p class="secondary">Перенесём на новый счёт сумму, расписание и карту списания.</p><div class="card"><h2>Сейчас настроено</h2><div class="row"><span>Сумма</span><b>${money(a.autopay.amount)}</b></div><div class="row"><span>Когда</span><b>${a.autopay.schedule}</b></div><div class="row"><span>Откуда</span><b>${a.autopay.source}</b></div></div><p class="fine">${d.close==='yes'?'Если не переносить, автопополнение отключится при закрытии старого счёта.':'Если не переносить, автопополнение останется на старом счёте.'}</p>`;
  if(step==='flowReview') content=`<h1 tabindex="-1">Всё верно?</h1><p class="secondary">Откроем новый счёт «${a.name}». Остальное — по вашим ответам.</p>${conversationSummary(a,d)}<button class="small-link" data-action="documents">Тариф и документы →</button><label class="check"><input id="consent" type="checkbox" ${consent?'checked':''}><span>Согласен с условиями открытия нового счёта и выбранными выше действиями</span></label><p class="fine">Это прототип: правила выплаты процентов и закрытия счёта требуют подтверждения банка.</p>`;
  return `<div class="scroll conversation"><div class="conversation-step">${a.name} · ${step==='flowReview'?'проверка ответов':'шаг '+(path.indexOf(step)+1)}</div>${content}</div><div class="footer">${step==='flowReview'?button('Всё верно, продолжить','submit',false,!consent||!conversationReady())+button('Не сейчас','detail',true):conversationChoices()}</div>`;
}
function conversationResult(detail=false) {
  const a=account(),d=conversationResults[current],failed=settingsFailed.has(current);
  return `<div class="scroll conversation">${detail?`<div class="account-chip">${a.name} · новый ·· ${a.newTail}</div>`:`<div class="done-icon ${failed?'pending-icon':''}">${failed?'!':'✓'}</div>`}<h1 tabindex="-1">${failed?'Осталось перенести автопополнение':detail?a.name:'Готово, как вы выбрали'}</h1>${conversationSummary(a,d,true)}<p class="fine">Другие накопительные счета не изменились.</p></div><div class="footer">${failed?button('Повторить перенос настройки',detail?'retrySettingsCurrent':'retrySettings'):''}${button('Все накопительные счета','accounts')}${!detail?button('К новому счёту','newDetail',true):''}</div>`;
}
function conversationAccounts() {
  return `<div class="scroll"><h1 tabindex="-1">Накопительные счета</h1>${seed.map(seedAccount=>{
    const a=account(seedAccount.id),d=conversationResults[a.id];
    const moved=d?.money==='yes'?a.amount:0;
    const closed=d?.close==='yes'&&!settingsFailed.has(a.id)&&(a.amount===0||d.money==='yes');
    return `<button class="account-choice quiet" data-action="account:${a.id}" style="width:100%;text-align:left"><div><strong>${a.name}</strong><small>${d?`Новый ·· ${a.newTail} · 12%`:`Старый ·· ${a.tail} · 9%`}</small></div><b>${money(d?moved:a.amount)}</b></button>${d?`<p class="fine">Старый ·· ${a.tail}: ${closed?'закрыт':`открыт · ${money(a.amount-moved)}`}</p>`:''}`;
  }).join('')}</div>`;
}
