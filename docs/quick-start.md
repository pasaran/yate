С чего начать
=============

Установка
---------

```sh
npm install -g yate
```

Пишем шаблон
------------

Файл `hello.yate`:

```
module "hello"

match / {
    "Hello, { .username }"
}
```

Строчка `module "hello"`, если она есть, должна быть первой строчкой в файле.
Если название модуля не указано, то будет использовано дефолтное: `'main'`.


Компилируем шаблон
------------------

```sh
yate hello.yate > hello.js
```


Выполняем шаблон
----------------

### В браузере

```html
<!-- Подключаем рантайм. -->
<script src="node_modules/yate/lib/runtime.js"></script>

<!-- Подключаем шаблон. -->
<script src="hello.js"></script>

<script>
//  Данные для наложения шаблона.
var data = { username: 'nop' };

//  Запускаем шаблонизатор:
var result = yr.run('hello', data);

console.log(result); // 'Hello, nop'
</script>
```

Что такое `'hello'` в вызове `yr.run(...)` — это название модуля.
Если в шаблоне не указать явно название модуля, то будет использоваться дефолтное: `'main'`.
В этом случае, запускать шаблонизатор нужно так:

```js
var result = yr.run('main', data);
```


### В node.js

```js
//  Подгружаем рантайм.
var yr = require('yate/lib/runtime.js');

//  Подгружаем шаблон.
require('./hello.js');

var data = { username: 'nop' };
var result = yr.run('hello', data);

console.log(result); // 'Hello, nop'
```

