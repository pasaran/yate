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

In-memory компиляция
--------------------

Можно компилировать шаблоны in-memory. Для начала компилируем все модули, если они есть:
```javascript
var yate = require('yate');

var hello = fs.readFileSync('hello.yate', 'utf8');
var mod = yate.compile({ input: hello }); // {ast, obj, js}

// Ещё можно напрямую из файла.
var mod = yate.compile({ filename: 'hello.yate', saveObj: false });
```

В объектнике `obj` хранятся все глобальные определения переменных, функций и ключей модуля `hello` в свойстве `defs` и имя модуля в свойстве `name`.

Теперь компилируем основной шаблон:
```javascript
var main = fs.readFileSync('main.yate', 'utf8');

var js = yate.compile({ input: main, modules: { hello: mod.obj } }).js;
```

Для лучших сообщений об ошибках так же можно передавать `filename`.

Для in-memory инклюдов можно предоставить функцию `resolve(path: string) -> string`, принимающую путь (`include "path"`) и возвращающую содержимое. Кроме того, вместо `modules` можно передать `provide(name: string) -> Object`, принимающую имя модуля (`import "name"`) и возращающую объектник (`obj` выше).


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

