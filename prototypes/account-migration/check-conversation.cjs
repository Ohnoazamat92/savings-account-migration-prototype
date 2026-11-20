const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const events={},elements={};
function element(id){return elements[id]||={value:({balance:'normal',settings:'mixed',outcome:'success'})[id]||'',innerHTML:'',textContent:'',children:[],classList:{toggle(){}},querySelector:()=>({focus(){},disabled:false}),addEventListener(){}};}
const context=vm.createContext({Intl,URLSearchParams,location:{search:''},setTimeout:()=>1,clearTimeout(){},document:{getElementById:element,addEventListener:(name,fn)=>events[name]=fn}});
vm.runInContext(fs.readFileSync(__dirname+'/conversation.js','utf8')+'\n'+fs.readFileSync(__dirname+'/overview.js','utf8')+'\n'+html.match(/<script>\s*([\s\S]*?)<\/script>/)[1],context);
const run=code=>vm.runInContext(code,context);
const click=action=>events.click({target:{closest:selector=>selector==='[data-action]'?{dataset:{action},disabled:false}:null}});
function start({balance='normal',settings='mixed',outcome='success'}={}){element('balance').value=balance;element('settings').value=settings;element('outcome').value=outcome;run("v='F';reset()");click('start');}
function answer(key,value){click(`answer:${key}:${value}`);}
function confirm(){run('consent=true');click('submit');run('resolveOperation()');}
start();assert.equal(run('step'),'flowMoney');assert.doesNotMatch(element('phone').innerHTML,/<select/);assert.match(element('phone').innerHTML, /class="footer">[\s\S]*answer:money:yes[\s\S]*answer:money:no/);answer('close','yes');assert.equal(run('step'),'flowMoney');
answer('money','yes');answer('close','yes');answer('settings','yes');assert.equal(run('step'),'flowReview');click('submit');assert.equal(run('step'),'flowReview');confirm();assert.equal(run('step'),'success');assert.match(element('phone').innerHTML,/Закрыт/);assert.equal(run('done.size'),1);click('newDetail');click('start');assert.equal(run('step'),'detail');
start();answer('money','no');assert.equal(run('step'),'flowSettings');answer('settings','no');confirm();assert.match(element('phone').innerHTML,/Оставлен открытым/);assert.match(element('phone').innerHTML,/На новом ·· 6401: 0 ₽/);assert.match(element('phone').innerHTML,/Осталось на старом/);
start();answer('money','yes');answer('close','no');answer('settings','yes');run('consent=true');click('flowMoney');answer('money','no');assert.equal(run('consent'),false);assert.equal(run('conversationAnswers().close'),'');assert.equal(run('step'),'flowSettings');
start({balance:'zero',settings:'none'});assert.equal(run('step'),'flowClose');answer('close','yes');assert.equal(run('step'),'flowReview');confirm();assert.match(element('phone').innerHTML,/Не настроено/);
start({outcome:'settings'});answer('money','yes');answer('close','yes');answer('settings','yes');confirm();assert.match(element('phone').innerHTML,/Пока открыт/);click('retrySettings');assert.match(element('phone').innerHTML,/Закрыт/);assert.equal(run('done.size'),1);
start({outcome:'settings'});answer('money','yes');answer('close','yes');answer('settings','no');confirm();assert.equal(run('settingsFailed.size'),0);assert.match(element('phone').innerHTML,/Отключено при закрытии/);
start({outcome:'unknown'});answer('money','yes');answer('close','no');answer('settings','yes');confirm();assert.equal(run('step'),'unknown');assert.equal(run('done.size'),0);click('pendingAccounts');click('unknown');click('checkStatus');assert.equal(run('done.size'),1);click('accounts');click('account:reserve');click('start');assert.equal(run('conversationAnswers().money'),'');
for(const variant of ['A','B','C','D','E']){element('outcome').value='success';run(`v='${variant}';reset()`);click('start');if(variant==='E')click('offer');click('consent');run('consent=true');click('submit');run('resolveOperation()');if(variant==='C'){assert.equal(run('step'),'opened');click('transferSubmit');run('resolveOperation()');}assert.equal(run('step'),'success');assert.equal(run('done.size'),1);}
console.log('Проверены: F — перенос и отказ, закрытие и сохранение счёта, настройки и отказ, пустой счёт, изменение согласия, ошибка настройки, неизвестный результат, другой счёт; A–E — успешный путь.');

// G использует ту же логику, но без сквозного названия и счётчика шагов.
start();run("v='G';reset()");assert.equal(run('step'),'flowMoney');assert.doesNotMatch(element('phone').innerHTML,/class="status"|conversation-step|Переход на новый счёт/);answer('money','yes');answer('close','no');answer('settings','yes');assert.equal(run('step'),'flowReview');confirm();assert.equal(run('step'),'success');assert.match(element('phone').innerHTML,/Оставлен открытым/);
start({balance:'zero',settings:'none'});run("v='G';reset()");assert.equal(run('step'),'flowClose');answer('close','yes');confirm();assert.match(element('phone').innerHTML,/Закрыт/);
start();run("v='G';reset()");answer('money','no');assert.equal(run('step'),'flowSettings');answer('settings','no');confirm();assert.match(element('phone').innerHTML,/На новом ·· 6401: 0 ₽/);console.log('G: перенос, отказ, сохранение и закрытие счёта, нулевой остаток — пройдены.');

// H: просмотр деталей не запускает операцию; согласие единое.
start();run("v='H';reset()");assert.equal(run('step'),'overviewPlan');assert.equal(run('account().amount'),52326);
for(const action of ['overviewTransfer','overviewSettings','overviewClose']){click(action);assert.equal(run('done.size'),0);click('overviewPlan');}
click('submit');assert.equal(run('step'),'overviewPlan');confirm();assert.equal(run('done.size'),1);assert.match(element('phone').innerHTML,/Закрыт/);click('newDetail');click('start');assert.equal(run('step'),'detail');
start({outcome:'settings'});run("v='H';reset()");confirm();assert.match(element('phone').innerHTML,/Пока открыт/);click('retrySettings');assert.match(element('phone').innerHTML,/Закрыт/);assert.equal(run('done.size'),1);
start({outcome:'unknown'});run("v='H';reset()");confirm();assert.equal(run('step'),'unknown');assert.equal(run('done.size'),0);click('checkStatus');assert.equal(run('done.size'),1);
start({balance:'zero',settings:'none'});run("v='H';reset()");assert.equal(run('account().amount'),0);confirm();assert.match(element('phone').innerHTML,/Перевод не требовался/);assert.match(element('phone').innerHTML,/Не подключали/);
console.log('H: детали без операции, согласие, успех, ошибка настройки, неизвестный результат и пустой счёт — пройдены.');
