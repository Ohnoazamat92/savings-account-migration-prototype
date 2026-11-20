const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const events={},elements={};
function element(id){return elements[id]||={value:({balance:'normal',settings:'mixed',outcome:'success'})[id]||'',innerHTML:'',textContent:'',children:[],querySelector:()=>({focus(){},disabled:false}),addEventListener(){}};}
const context=vm.createContext({Intl,URLSearchParams,location:{search:''},setTimeout:()=>1,clearTimeout(){},document:{getElementById:element,addEventListener:(name,fn)=>events[name]=fn}});
vm.runInContext(fs.readFileSync(__dirname+'/conversation.js','utf8')+'\n'+html.match(/<script>\s*([\s\S]*?)<\/script>/)[1],context);
const run=code=>vm.runInContext(code,context);
const click=action=>events.click({target:{closest:selector=>selector==='[data-action]'?{dataset:{action},disabled:false}:null}});
function start({balance='normal',settings='mixed',outcome='success'}={}){element('balance').value=balance;element('settings').value=settings;element('outcome').value=outcome;run("v='F';reset()");click('start');}
function answer(key,value){run(`conversationAnswer('${key}','${value}')`);click('flowNext');}
function confirm(){run('consent=true');click('submit');run('resolveOperation()');}
start();assert.equal(run('step'),'flowMoney');click('flowNext');assert.equal(run('step'),'flowMoney');
answer('money','yes');answer('close','yes');answer('settings','yes');assert.equal(run('step'),'flowReview');click('submit');assert.equal(run('step'),'flowReview');confirm();assert.equal(run('step'),'success');assert.match(element('phone').innerHTML,/Закрыт/);assert.equal(run('done.size'),1);click('newDetail');click('start');assert.equal(run('step'),'detail');
start();answer('money','no');assert.equal(run('step'),'flowSettings');answer('settings','no');confirm();assert.match(element('phone').innerHTML,/Оставлен открытым/);assert.match(element('phone').innerHTML,/На новом ·· 6401: 0 ₽/);assert.match(element('phone').innerHTML,/Осталось на старом/);
start();answer('money','yes');answer('close','no');answer('settings','yes');run('consent=true');click('flowMoney');run("conversationAnswer('money','no')");assert.equal(run('consent'),false);assert.equal(run('conversationAnswers().close'),'');click('flowNext');assert.equal(run('step'),'flowSettings');
start({balance:'zero',settings:'none'});assert.equal(run('step'),'flowClose');answer('close','yes');assert.equal(run('step'),'flowReview');confirm();assert.match(element('phone').innerHTML,/Не настроено/);
start({outcome:'settings'});answer('money','yes');answer('close','yes');answer('settings','yes');confirm();assert.match(element('phone').innerHTML,/Пока открыт/);click('retrySettings');assert.match(element('phone').innerHTML,/Закрыт/);assert.equal(run('done.size'),1);
start({outcome:'settings'});answer('money','yes');answer('close','yes');answer('settings','no');confirm();assert.equal(run('settingsFailed.size'),0);assert.match(element('phone').innerHTML,/Отключено при закрытии/);
start({outcome:'unknown'});answer('money','yes');answer('close','no');answer('settings','yes');confirm();assert.equal(run('step'),'unknown');assert.equal(run('done.size'),0);click('pendingAccounts');click('unknown');click('checkStatus');assert.equal(run('done.size'),1);click('accounts');click('account:reserve');click('start');assert.equal(run('conversationAnswers().money'),'');
for(const variant of ['A','B','C','D','E']){element('outcome').value='success';run(`v='${variant}';reset()`);click('start');if(variant==='E')click('offer');click('consent');run('consent=true');click('submit');run('resolveOperation()');if(variant==='C'){assert.equal(run('step'),'opened');click('transferSubmit');run('resolveOperation()');}assert.equal(run('step'),'success');assert.equal(run('done.size'),1);}
console.log('Проверены: F — перенос и отказ, закрытие и сохранение счёта, настройки и отказ, пустой счёт, изменение согласия, ошибка настройки, неизвестный результат, другой счёт; A–E — успешный путь.');
