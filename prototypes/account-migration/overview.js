'use strict';
// H: один счёт, единое подтверждение. Детали ничего не запускают.
function overviewNav(back) {
  if(step==='success'||step==='detail')return '<div class="nav"></div>';
  return `<div class="nav"><button type="button" data-action="${step==='overviewIntro'?'detail':back}" aria-label="${step==='overviewIntro'?'Закрыть':'Назад'}">${step==='overviewIntro'?'×':'‹'}</button></div>`;
}
function overviewAccountCard(isNew=false) {
  const a=account();
  return `<div class="overview-account"><b>${money(a.amount)}</b><span>${isNew?'Новый накопительный счёт':'Накопительный счёт'} ·· ${isNew?a.newTail:a.tail}</span></div>`;
}
function overviewRow(label,value,action) {
  const content=`<span>${label}</span><span class="overview-value">${value}${action?'<span class="overview-chevron" aria-hidden="true">›</span>':''}</span>`;
  return action?`<button class="overview-row" data-action="${action}">${content}</button>`:`<div class="overview-row">${content}</div>`;
}
function overviewView() {
  const a=account();let content='',footer='';
  if(step==='overviewIntro'){
    content=`<h1 tabindex="-1">Новый счёт<br>со ставкой 12%</h1><p class="secondary">Сейчас на вашем счёте — 9% годовых.</p><div class="card"><h2>Что изменится</h2><p>Откроем новый счёт и переведём ${money(a.amount)}.</p><p>${a.autopay?'Перенесём автопополнение с прежними параметрами.':'Автопополнение не подключаем: сейчас оно не настроено.'}</p><p>После переноса закроем старый счёт.</p></div>`;
    footer=button('Дальше','overviewPlan')+button('Не сейчас','detail',true);
  }
  if(step==='overviewPlan'){
    content=`<h1 tabindex="-1">Что делаем</h1><div class="card"><h2>Какой счёт обновляем</h2>${overviewAccountCard()}</div><div class="card"><h2>Что произойдёт</h2>${overviewRow('Откроем новый счёт','12% годовых')}${overviewRow(a.amount?'Переведём деньги':'Остаток на счёте',money(a.amount),'overviewTransfer')}${overviewRow('Автопополнение',a.autopay?'Перенесём':'Не настроено','overviewSettings')}${overviewRow('Старый счёт','Закроем','overviewClose')}</div><button class="small-link" data-action="documents">Условия и документы</button><label class="check"><input id="consent" type="checkbox" ${consent?'checked':''}><span>Согласен с условиями открытия нового счёта и действиями выше</span></label>`;
    footer=button('Обновить счёт','submit',false,!consent);
  }
  if(step==='overviewTransfer'){
    content=`<h1 tabindex="-1">Перевод</h1><div class="card"><h2>Откуда</h2><p>Накопительный счёт ·· ${a.tail}</p><p class="secondary">9% годовых</p></div><div class="card"><h2>Куда</h2><p>Новый накопительный счёт</p><p class="secondary">12% годовых · откроем при обновлении</p></div><div class="card"><h2>Сумма</h2><p class="balance">${money(a.amount)}</p><p class="fine">${a.amount?'Весь остаток выбранного счёта.':'Перевод денег не нужен: счёт пустой.'}</p></div><p class="fine">${a.amount?'Деньги переведём после подтверждения на экране «Что делаем».':'Новый счёт откроем после подтверждения на экране «Что делаем».'}</p>`;
    footer=button('Понятно','overviewPlan');
  }
  if(step==='overviewSettings'){
    content=`<h1 tabindex="-1">Автопополнение</h1>${a.autopay?`<div class="card">${overviewRow('Сумма',money(a.autopay.amount))}${overviewRow('Когда',a.autopay.schedule)}${overviewRow('Откуда',a.autopay.source)}</div><p>Перенесём на новый счёт без изменений.</p><p class="secondary">Для старого счёта отключим — двух автопополнений не будет.</p>`:`<div class="card"><p>На этом счёте автопополнение не настроено.</p></div><p class="secondary">На новом тоже не подключаем.</p>`}`;
    footer=button('Понятно','overviewPlan');
  }
  if(step==='overviewClose'){
    content=`<h1 tabindex="-1">Старый счёт</h1><div class="card"><h2>Накопительный счёт ·· ${a.tail}</h2><p>Закроем после ${a.amount?'перевода всего остатка':'открытия нового счёта'}${a.autopay?' и переноса автопополнения':''}.</p></div><p>Вместо него останется новый счёт под 12% годовых.</p><p class="secondary">Другие ваши счета не изменятся.</p>`;
    footer=button('Понятно','overviewPlan');
  }
  return `<div class="scroll">${content}</div><div class="footer">${footer}</div>`;
}
function overviewResult() {
  const a=account(),failed=settingsFailed.has(current);
  return `<div class="scroll"><h1 tabindex="-1">${failed?(a.amount?'Деньги перенесли.<br>Настройку — пока нет':'Счёт открыли.<br>Настройку — пока нет'):'Счёт обновлён'}</h1><div class="card">${overviewAccountCard(true)}<p>12% годовых</p></div><div class="card"><h2>Результат</h2>${overviewRow('Деньги',a.amount?'На новом счёте':'Перевод не требовался')}${overviewRow('Автопополнение',!a.autopay?'Не подключали':failed?'Пока на старом':'Перенесено')}${overviewRow('Старый счёт',failed?'Пока открыт':'Закрыт')}</div>${failed?`<p class="secondary">${a.amount?'Перенос денег завершён.':'Новый счёт открыт.'} Повторим только перенос настройки, затем закроем старый счёт.</p>`:''}</div><div class="footer">${failed?button('Повторить перенос настройки','retrySettings'):''}${button('К новому счёту','newDetail',failed)}</div>`;
}
function overviewDetail() {
  const a=account(),isNew=done.has(current),failed=settingsFailed.has(current);
  return `<div class="scroll"><h1 tabindex="-1">Накопительный счёт</h1><div class="card">${overviewAccountCard(isNew)}<p>${isNew?'12':'9'}% годовых</p></div>${isNew?`<div class="card"><h2>Автопополнение</h2><p>${!a.autopay?'Не настроено':failed?'Пока действует на старом счёте':autopaySummary(a)}</p></div>`:''}</div><div class="footer">${!isNew?button('Перейти на 12%','start'):failed?button('Повторить перенос настройки','retrySettingsCurrent'):button('Посмотреть результат','success',true)}</div>`;
}
function overviewReview() {
  return `<div class="review-main"><div class="eyebrow">Вариант H</div><h3>Один счёт — одно подтверждение</h3><p>«Что делаем» — общий экран. Строки открывают подробности и возвращают сюда.</p><p>Перевод, настройки и закрытие не требуют трёх отдельных подтверждений. Действие запускается кнопкой «Обновить счёт».</p><details open><summary>Путь</summary><p>Предложение → Что делаем → Обработка → Результат → Новый счёт.</p><p>Перевод, автопополнение и старый счёт — необязательные ответвления для проверки деталей.</p></details><details><summary>Нужно подтвердить с продуктом</summary><ul><li>Можно ли закрывать старый счёт в рамках одной операции?</li><li>Когда и куда выплачиваются уже начисленные проценты?</li><li>Какие настройки действительно переносим? В прототипе показано только автопополнение.</li></ul></details><div class="demo">Сценарий по приложенному макету: весь остаток 52 326 ₽, старый счёт закрываем. Сумма и параметры автопополнения — демонстрационные. Банковских операций нет.</div></div>`;
}
